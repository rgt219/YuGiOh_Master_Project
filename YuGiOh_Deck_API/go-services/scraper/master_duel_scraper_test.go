package scraper

import (
	"encoding/json"
	"testing"
)

func TestCardIdsMayBeStringsOrNumbers(t *testing.T) {
	input := `[
		{"name":"A","konamiID":"123","gameId":"9"},
		{"name":"B","konamiID":456,"gameId":789},
		{"name":"C","konamiID":null}
	]`

	var cards []MDMCardEntity
	if err := json.Unmarshal([]byte(input), &cards); err != nil {
		t.Fatalf("should accept ids as strings, numbers or null: %v", err)
	}

	want := []string{"123", "456", ""}
	for i, c := range cards {
		if string(c.KonamiID) != want[i] {
			t.Errorf("card %s: KonamiID = %q, want %q", c.Name, c.KonamiID, want[i])
		}
	}
}

func TestIdsStillSerializeAsStrings(t *testing.T) {
	out, err := json.Marshal(MDMCardEntity{KonamiID: "456"})
	if err != nil {
		t.Fatal(err)
	}
	var back map[string]any
	_ = json.Unmarshal(out, &back)
	if _, ok := back["konamiID"].(string); !ok {
		t.Errorf("konamiID should stay a JSON string for the C# API, got %T", back["konamiID"])
	}
}

func TestNormalizeStatus(t *testing.T) {
	cases := map[string]string{"Forbidden": "Forbidden", "Limited": "Limited", "Semi-Limited": "Semi-Limited", "Unlimited": "Unlimited", "": "Unlimited"}
	for in, want := range cases {
		if got := normalizeStatus(in); got != want {
			t.Errorf("normalizeStatus(%q) = %q, want %q", in, got, want)
		}
	}
}
