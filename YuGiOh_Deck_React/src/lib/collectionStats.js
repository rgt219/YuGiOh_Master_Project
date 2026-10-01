/**
 * Numbers for the top of the collection page.
 * @param owned     { "46986414": 3, ... }  card id -> copies owned
 * @param cardsById { "46986414": { price: 1.25 }, ... }  card details (price may be null)
 * Value only counts cards whose details have loaded and that have a price.
 */
export function summarizeCollection(owned, cardsById) {
    let uniqueCards = 0;
    let totalCopies = 0;
    let value = 0;

    Object.entries(owned).forEach(([id, quantity]) => {
        if (!(quantity > 0)) return;
        uniqueCards += 1;
        totalCopies += quantity;
        value += quantity * (cardsById[id]?.price || 0);
    });

    return { uniqueCards, totalCopies, value };
}