const { ConflictError } = require('./errors');

// Every change to a drug's stock is recorded as a movement:
// 'in'  — pharmacy receives stock (supplier delivery, return, correction)
// 'out' — stock leaves when an order is approved
const MOVEMENT_TYPE = { IN: 'in', OUT: 'out' };

function assertSufficientStock(drug, quantity) {
  if (drug.stock < quantity) {
    throw new ConflictError(
      `Not enough stock for ${drug.name}: ${drug.stock} ${drug.unit} left, ${quantity} requested`
    );
  }
}

module.exports = { MOVEMENT_TYPE, assertSufficientStock };
