from collections import Counter, defaultdict
from itertools import combinations, product

def deck_sets(sample_deck):
    sample_deck = sample_deck or {}
    core = set(sample_deck.get("mainDeck") or []) | set(sample_deck.get("extraDeck") or [])
    side = set(sample_deck.get("sideDeck") or [])
    return core, side

def count_cards(core_sets):
    card_counts = Counter()
    pair_counts = Counter()

    for cards in core_sets:            # one set of card ids per deck
        card_counts.update(cards)        # +1 for every card in this deck
        pair_counts.update(combinations(sorted(cards), 2))   # +1 for every pair

    return card_counts, pair_counts

def score_pair(together, count_a, count_b, total_decks):
    percent = together / count_a * 100
    lift = together * total_decks / (count_a * count_b)
    return percent, lift

def index_pairs(pair_counts, both_ways=True):      # edit 1: new parameter
    index = defaultdict(Counter)

    for (a, b), together in pair_counts.items():
        index[a][b] = together
        if both_ways:                                    # edit 2: only sometimes
            index[b][a] = together

    return index


def top_companions(card, index, card_counts, total_decks, min_together, top_n,
                   partner_counts=None, min_lift=0):
    if partner_counts is None:
        partner_counts = card_counts
    results = []
    for partner, together in index.get(card, {}).items():
        if together < min_together:
            continue
        percent, lift = score_pair(together, card_counts[card], partner_counts[partner], total_decks)
        if lift < min_lift:                      # NEW: drop "both are just popular" pairs
            continue
        results.append({"cardId": partner, "together": together,
                        "percent": round(percent, 1), "lift": round(lift, 2)})
    results.sort(key=lambda r: (r["together"], r["lift"]), reverse=True)   # CHANGED
    return results[:top_n]                  # 7

def count_side_pairs(deck_pairs):
    side_pair_counts = Counter()              # 1. start an empty counter

    for core, side in deck_pairs:             # 2. for each deck
        side_pair_counts.update(product(core, side))   # 3. +1 per combination

    return side_pair_counts                   # 4. give the counts back

def build_records(core_index, side_index, card_counts, side_counts, total_decks, min_together, top_n,
                  min_lift=0):
    records = []
    for card in card_counts:
        records.append({
            "cardId": card,
            "deckCount": card_counts[card],
            "companions": top_companions(card, core_index, card_counts, total_decks, min_together, top_n,
                                         min_lift=min_lift),
            "sideCompanions": top_companions(card, side_index, card_counts, total_decks, min_together, top_n,
                                             partner_counts=side_counts, min_lift=min_lift),
        })
    return records

def build_documents(records, now):
    docs = []
    for r in records:
        docs.append({
            "_id": r["cardId"],
            "deckCount": r["deckCount"],
            "companions": r["companions"],
            "sideCompanions": r["sideCompanions"],
            "updatedAt": now,
        })
    return docs

