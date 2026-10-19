import pytest
from companions import deck_sets, count_cards, score_pair, index_pairs, top_companions, count_side_pairs, build_records, build_documents
from collections import Counter
from datetime import datetime, timezone

def test_deck_sets_collapses_copies_and_splits_zones():
    # Arrange: a tiny fake deck
    deck = {
        "mainDeck": ["111", "111", "111", "222"],
        "extraDeck": ["333", "333"],
        "sideDeck": ["444", "444", "111"],
    }

    # Act: call the function, unpack the two answers
    core, side = deck_sets(deck)

    # Assert: what should each set contain?
    assert core == {"111", "222", "333"}
    assert side == {"111", "444"}
    
    
def test_deck_sets_handles_missing_zones():
    deck = {"mainDeck": ["111"]}   # no extraDeck, no sideDeck

    core, side = deck_sets(deck)

    assert core == {"111"}
    assert side == set()


def test_deck_sets_handles_a_missing_deck():
    core, side = deck_sets(None)

    assert core == set()
    assert side == set()
    
def test_deck_sets_handles_a_deck_with_only_a_side_deck():
    deck = {"sideDeck": ["444", "444"]}

    core, side = deck_sets(deck)

    assert core == set()
    assert side == {"444"}
    
def test_count_cards_counts_decks_and_pairs():
    decks = [
        {"a", "b", "c"},
        {"a", "b"},
        {"a", "c"},
    ]

    card_counts, pair_counts = count_cards(decks)

    assert card_counts["a"] == 3
    assert card_counts["b"] == 2
    assert pair_counts[("a", "b")] == 2
    assert pair_counts[("b", "c")] == 1
    assert pair_counts[("a", "d")] == 0   # a pair that never happens
    

def test_score_pair_percent_and_lift():
    percent, lift = score_pair(together=30, count_a=40, count_b=50, total_decks=100)

    assert percent == pytest.approx(75)
    assert lift == pytest.approx(1.5)


def test_score_pair_a_staple_has_no_special_pull():
    # card B is in every one of the 100 decks
    percent, lift = score_pair(together=40, count_a=40, count_b=100, total_decks=100)

    assert percent == pytest.approx(100)
    assert lift == pytest.approx(1)
    
def test_index_pairs_lists_partners_in_both_directions():
    pair_counts = Counter({("a", "b"): 2, ("a", "c"): 1})

    index = index_pairs(pair_counts)

    assert index["a"]["b"] == 2
    assert index["a"]["c"] == 1
    assert index["b"]["a"] == 2
    assert index["c"]["a"] == 1
    
def test_top_companions_filters_ranks_and_limits():
    card_counts = Counter({"a": 40, "b": 50, "c": 10, "d": 100})
    index = {"a": Counter({"b": 30, "c": 2, "d": 40})}

    result = top_companions("a", index, card_counts,
                            total_decks=100, min_together=5, top_n=2)

    assert [r["cardId"] for r in result] == ["d", "b"]
    assert result[1]["together"] == 30
    assert result[1]["percent"] == 75
    assert result[1]["lift"] == 1.5

def test_count_side_pairs_counts_core_and_side_combinations():
    deck_pairs = [
        ({"a", "b"}, {"x"}),
        ({"a"}, {"x", "y"}),
        ({"b"}, {"y"}),
    ]

    side_pair_counts = count_side_pairs(deck_pairs)

    assert side_pair_counts[("a", "x")] == 2
    assert side_pair_counts[("b", "x")] == 1
    assert side_pair_counts[("a", "y")] == 1
    assert side_pair_counts[("x", "a")] == 0   # direction matters
    
def test_index_pairs_can_go_one_way_only():
    pair_counts = Counter({("a", "x"): 2})

    index = index_pairs(pair_counts, both_ways=False)

    assert index["a"]["x"] == 2
    assert "x" not in index      # no reverse entry was created
    
def test_top_companions_uses_partner_counts():
    card_counts = Counter({"a": 4})        # card a is in 4 decks
    partner_counts = Counter({"x": 2})     # card x is sided in 2 decks
    index = {"a": Counter({"x": 2})}       # a and x together in 2 decks
    result = top_companions("a", index, card_counts, 10, 1, 5,
                            partner_counts=partner_counts)
    assert result == [{"cardId": "x", "together": 2, "percent": 50.0, "lift": 2.5}]
    
def test_build_records():
    card_counts = Counter({"a": 4, "b": 4})
    core_index = index_pairs(Counter({("a", "b"): 3}))                 # a and b together in 3 decks
    side_counts = Counter({"x": 2})                                    # x is sided in 2 decks
    side_index = index_pairs(Counter({("a", "x"): 2}), both_ways=False)  # a's decks side x twice

    records = build_records(core_index, side_index, card_counts, side_counts, 10, 1, 5)

    by_id = {r["cardId"]: r for r in records}
    assert by_id["a"]["deckCount"] == 4
    assert by_id["a"]["companions"][0]["cardId"] == "b"
    assert by_id["a"]["sideCompanions"][0]["cardId"] == "x"
    assert by_id["b"]["sideCompanions"] == []
    
def test_deck_sets_null_zones():
    deck = {"mainDeck": ["1"], "extraDeck": None, "sideDeck": None}
    core, side = deck_sets(deck)
    assert core == {"1"}
    assert side == set()
    
def test_top_companions_ranks_by_together_and_filters_low_lift():
    card_counts = Counter({"a": 100, "x": 90, "y": 3, "z": 50})
    index = {"a": Counter({"x": 80, "y": 3, "z": 25})}
    result = top_companions("a", index, card_counts, 200, 1, 5, min_lift=1.2)
    assert [r["cardId"] for r in result] == ["x", "y"]
    
def test_build_records_passes_min_lift():
    card_counts = Counter({"a": 4, "b": 4})
    core_index = index_pairs(Counter({("a", "b"): 3}))                   # lift 3*10/(4*4) = 1.875
    side_counts = Counter({"x": 2})
    side_index = index_pairs(Counter({("a", "x"): 2}), both_ways=False)  # lift 2*10/(4*2) = 2.5

    records = build_records(core_index, side_index, card_counts, side_counts, 10, 1, 5, min_lift=2)

    by_id = {r["cardId"]: r for r in records}
    assert by_id["a"]["companions"] == []                 # 1.875 < 2, so it's filtered out
    assert by_id["a"]["sideCompanions"][0]["cardId"] == "x"   # 2.5 >= 2, so it's kept
    
def test_build_documents():
    now = datetime(2026, 10, 19, tzinfo=timezone.utc)
    records = [{"cardId": "a", "deckCount": 4, "companions": [], "sideCompanions": []}]

    docs = build_documents(records, now)

    assert docs == [{"_id": "a", "deckCount": 4, "companions": [],
                     "sideCompanions": [], "updatedAt": now}]