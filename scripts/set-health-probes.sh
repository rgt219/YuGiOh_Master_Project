#!/usr/bin/env bash
# One-time setup: point Azure's liveness and readiness probes at the health endpoints
# (/health/live and /health/ready, see Shared/YuGiOh.ServiceDefaults/ServiceHealth.cs and go-services/health.go).
#
#   ./scripts/set-health-probes.sh            shows what would change, modifies nothing
#   ./scripts/set-health-probes.sh --apply    makes the change
#
# Run it only AFTER the code that has those endpoints is deployed. Probes aimed at endpoints that don't exist would
# fail, and Azure would keep restarting the apps. The script checks this and refuses if the new code isn't live.
#
# Cost: nothing. Probes run inside the Container Apps environment and the endpoints never touch the database.
# Normal deploys keep the probes (an image update copies them), so this only needs to run once.
#
# Today the apps use Azure's default probes, which only check that port 8080 accepts a connection. A process that
# is hung but still holding the port passes those. The new ones ask the app itself.
set -euo pipefail

RG=${RG:-ErreGeTe}
APPS=(go-worker identity forum-api market-api analytics api)   # api last: it needs a traffic switch (blue/green)
APPLY=false
[ "${1:-}" = "--apply" ] && APPLY=true

# Holds each app's definition while it is updated, which includes secret values. Deleted on exit.
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

az_() { az "$@" 2>/dev/null | tr -d '\r'; }

# --- 1. Refuse unless the new code is live --------------------------------------------------------------------
# Public apps: ask them directly. Internal apps (go-worker, analytics) can't be reached from here, so they must be
# running the same image tag as the Deck API, which was deployed by the same pipeline run.
API_TAG=$(az_ containerapp show -n api -g "$RG" --query "properties.template.containers[0].image" -o tsv | sed 's/.*://')
for app in "${APPS[@]}"; do
  fqdn=$(az_ containerapp show -n "$app" -g "$RG" --query "properties.configuration.ingress.external && properties.configuration.ingress.fqdn" -o tsv)
  if [ -n "$fqdn" ] && [ "$fqdn" != "false" ]; then
    if ! curl -fsS --max-time 60 "https://$fqdn/health/live" > /dev/null; then
      echo "STOP: https://$fqdn/health/live does not answer. Deploy the code with the health endpoints first." >&2
      exit 1
    fi
  else
    tag=$(az_ containerapp show -n "$app" -g "$RG" --query "properties.template.containers[0].image" -o tsv | sed 's/.*://')
    if [ "$tag" != "$API_TAG" ]; then
      echo "STOP: $app runs image $tag, not $API_TAG like the Deck API. Deploy the code with the health endpoints first." >&2
      exit 1
    fi
  fi
done
echo "All apps are running code with health endpoints."

# --- 2. Show or apply the probe change --------------------------------------------------------------------------
for app in "${APPS[@]}"; do
  az_ containerapp show -n "$app" -g "$RG" -o json > "$TMP/$app.json"

  echo
  echo "== $app"
  python - "$TMP/$app.json" <<'EOF'
import json, sys
app = json.load(open(sys.argv[1]))
for p in app["properties"]["template"]["containers"][0].get("probes") or []:
    target = p.get("httpGet") or p.get("tcpSocket")
    print(f"  now:  {p['type']:<9} {'HTTP ' + target.get('path', '') if 'httpGet' in p else 'TCP'} port {target.get('port')}")
EOF
  echo "  new:  Liveness  HTTP /health/live port 8080 (every 10s, restart after 3 failures)"
  echo "  new:  Readiness HTTP /health/ready port 8080 (every 5s, out of rotation after 3 failures)"
  echo "        Startup   unchanged"

  $APPLY || continue

  # The definition must carry the secret values, or the update would remove them.
  az_ containerapp secret list -n "$app" -g "$RG" --show-values -o json > "$TMP/$app.secrets.json"

  python - "$TMP/$app.json" "$TMP/$app.secrets.json" "$TMP/$app.yaml" <<'EOF'
import json, sys
app = json.load(open(sys.argv[1]))
secrets = json.load(open(sys.argv[2]))
props = app["properties"]
props["configuration"]["secrets"] = [{k: v for k, v in s.items() if v is not None} for s in secrets]

container = props["template"]["containers"][0]
kept = [p for p in (container.get("probes") or []) if p["type"] not in ("Liveness", "Readiness")]
container["probes"] = kept + [
    {"type": "Liveness", "httpGet": {"path": "/health/live", "port": 8080},
     "periodSeconds": 10, "timeoutSeconds": 5, "failureThreshold": 3},
    {"type": "Readiness", "httpGet": {"path": "/health/ready", "port": 8080},
     "periodSeconds": 5, "timeoutSeconds": 5, "failureThreshold": 3},
]
json.dump(app, open(sys.argv[3], "w"), indent=2)   # JSON is valid YAML, which is what --yaml takes
EOF

  az containerapp update -n "$app" -g "$RG" --yaml "$TMP/$app.yaml" -o none
  rm -f "$TMP/$app.secrets.json" "$TMP/$app.yaml"

  # Check nothing else moved: same image, same env var names, same secret names, same scale rules.
  az_ containerapp show -n "$app" -g "$RG" -o json > "$TMP/$app.after.json"
  python - "$TMP/$app.json" "$TMP/$app.after.json" <<'EOF'
import json, sys
before, after = (json.load(open(f))["properties"] for f in sys.argv[1:3])
def facts(p):
    c = p["template"]["containers"][0]
    return {
        "image": c["image"],
        "env": sorted(e["name"] for e in c.get("env") or []),
        "secrets": sorted(s["name"] for s in p["configuration"].get("secrets") or []),
        "scale": json.dumps(p["template"].get("scale"), sort_keys=True),
        "ingress": json.dumps({k: (p["configuration"].get("ingress") or {}).get(k) for k in ("external", "targetPort")}),
    }
b, a = facts(before), facts(after)
changed = [k for k in b if b[k] != a[k]]
probes = {p["type"]: (p.get("httpGet") or {}).get("path") for p in after["template"]["containers"][0].get("probes") or []}
if changed or probes.get("Liveness") != "/health/live" or probes.get("Readiness") != "/health/ready":
    print(f"  PROBLEM: changed {changed or 'nothing'}, probes now {probes}. Check this app in the portal.")
    sys.exit(1)
print("  done: probes set, image, env, secrets, scale and ingress unchanged")
EOF
done

# --- 3. The Deck API runs blue/green ----------------------------------------------------------------------------
# In that mode the update above made a new revision with 0% traffic. Move traffic to it once it is healthy,
# the same way the deploy pipeline does.
if $APPLY; then
  echo
  echo "== api: moving traffic to the revision with the new probes"
  NEW=$(az_ containerapp show -n api -g "$RG" --query properties.latestRevisionName -o tsv)
  for _ in $(seq 1 30); do
    health=$(az_ containerapp revision show -n api -g "$RG" --revision "$NEW" --query properties.healthState -o tsv)
    [ "$health" = "Healthy" ] && break
    sleep 10
  done
  if [ "$health" != "Healthy" ]; then
    echo "  PROBLEM: $NEW is $health. Traffic stays on the old revision, so the site is unaffected." >&2
    exit 1
  fi
  az containerapp ingress traffic set -n api -g "$RG" --revision-weight "$NEW=100" -o none
  echo "  done: 100% of traffic on $NEW"
fi

$APPLY || { echo; echo "Nothing was changed. Run with --apply to make the change."; }
