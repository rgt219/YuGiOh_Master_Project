from datetime import datetime, timezone
import os
import time
from collections import Counter
from pymongo import MongoClient, ReplaceOne
from companions import (deck_sets, count_cards, count_side_pairs,
                        index_pairs, build_records, build_documents)

MIN_TOGETHER = 20  # a pair must appear in at least 20 decks
MIN_LIFT = 1.2     # and be 20% more common together than chance
TOP_N = 10
BATCH_SIZE = 100


def load_decks(db):
    # Ask Mongo for only the sampleDeck field (cheaper than whole documents)
    cursor = db["MetaDecks"].find({}, {"sampleDeck": 1})
    pairs = [deck_sets(doc.get("sampleDeck")) for doc in cursor]
    return [(core, side) for core, side in pairs if core]   # skip empty decks

def save_documents(db, docs):
    collection = db["CardCompanions"]
    for start in range(0, len(docs), BATCH_SIZE):
        batch = docs[start:start + BATCH_SIZE]
        ops = [ReplaceOne({"_id": d["_id"]}, d, upsert=True) for d in batch]
        collection.bulk_write(ops, ordered=False)
        time.sleep(0.2)   # be gentle with serverless Cosmos
    print(f"Saved {len(docs)} documents to CardCompanions")


def main():
    uri = os.environ["MONGO_URI"]                 # never hard-code the secret
    client = MongoClient(uri, retryWrites=False)  # Cosmos doesn't support retryable writes
    db = client["Decklists"]

    deck_pairs = load_decks(db)
    total_decks = len(deck_pairs)

    card_counts, pair_counts = count_cards(core for core, side in deck_pairs)
    side_counts = Counter()
    for core, side in deck_pairs:
        side_counts.update(side)

    core_index = index_pairs(pair_counts)
    side_index = index_pairs(count_side_pairs(deck_pairs), both_ways=False)

    records = build_records(core_index, side_index, card_counts, side_counts,
                            total_decks, MIN_TOGETHER, TOP_N, min_lift=MIN_LIFT)

    print(f"{total_decks} decks, {len(records)} card records")
    now = datetime.now(timezone.utc)
    docs = build_documents(records, now)
    save_documents(db, docs)    # FIRST RUN: only 20, so we can inspect them


if __name__ == "__main__":
    main()