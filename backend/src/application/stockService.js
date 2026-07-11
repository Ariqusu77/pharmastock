const { ValidationError } = require('../domain/errors');
const { validateLineItems } = require('../domain/lineItems');
const { MOVEMENT_TYPE } = require('../domain/stockPolicy');

function createStockService({ drugRepository, stockMovementRepository, unitOfWork }) {
  return {
    // Pharmacy records incoming drugs (supplier delivery). Increments the
    // stock of each drug and writes 'in' movements, atomically.
    async receiveStock(user, { items, reference, note }) {
      const lines = validateLineItems(items);
      await unitOfWork.run(async (t) => {
        const drugs = await drugRepository.findByIdsForUpdate(
          lines.map((l) => l.drugId),
          { transaction: t }
        );
        if (drugs.length !== lines.length) {
          throw new ValidationError('One or more drugs do not exist');
        }
        const drugById = new Map(drugs.map((d) => [d.id, d]));

        const movements = [];
        for (const line of lines) {
          const drug = drugById.get(line.drugId);
          // adjustStock syncs the instance to the new value, so compute
          // the resulting balance from the pre-adjustment stock.
          const balanceAfter = drug.stock + line.quantity;
          await drugRepository.adjustStock(drug, line.quantity, { transaction: t });
          movements.push({
            drugId: drug.id,
            userId: user.id,
            type: MOVEMENT_TYPE.IN,
            quantity: line.quantity,
            balanceAfter,
            reference: reference || null,
            note: note || null,
          });
        }
        await stockMovementRepository.bulkCreate(movements, { transaction: t });
      });
      return stockMovementRepository.findRecent({ limit: lines.length });
    },

    // Ledger of stock changes, newest first.
    listMovements({ drugId, type } = {}) {
      if (type && ![MOVEMENT_TYPE.IN, MOVEMENT_TYPE.OUT].includes(type)) {
        throw new ValidationError("type must be 'in' or 'out'");
      }
      return stockMovementRepository.findRecent({ drugId, type });
    },
  };
}

module.exports = createStockService;
