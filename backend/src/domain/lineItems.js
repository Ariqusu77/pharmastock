const { ValidationError } = require('./errors');

// Normalizes and validates a `[{ drugId, quantity }]` payload shared by
// order placement, order editing and stock receiving. Duplicate drug
// lines are merged by summing their quantities.
function validateLineItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new ValidationError('At least one drug line is required');
  }
  const byDrug = new Map();
  for (const item of items) {
    const drugId = Number(item?.drugId);
    const quantity = item?.quantity;
    if (!Number.isInteger(drugId) || drugId < 1 || !Number.isInteger(quantity) || quantity < 1) {
      throw new ValidationError('Each item needs a drugId and a quantity of at least 1');
    }
    byDrug.set(drugId, (byDrug.get(drugId) || 0) + quantity);
  }
  return [...byDrug.entries()].map(([drugId, quantity]) => ({ drugId, quantity }));
}

module.exports = { validateLineItems };
