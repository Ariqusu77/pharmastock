function createStockMovementRepository({ StockMovement, Drug, User }) {
  return {
    bulkCreate(movements, { transaction }) {
      return StockMovement.bulkCreate(movements, { transaction });
    },

    findRecent({ drugId, type, limit = 200 } = {}) {
      const where = {};
      if (drugId) where.drugId = drugId;
      if (type) where.type = type;
      return StockMovement.findAll({
        where,
        include: [
          { model: Drug, as: 'drug', attributes: ['id', 'code', 'name', 'unit'] },
          { model: User, as: 'recordedBy', attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
        limit,
      });
    },
  };
}

module.exports = createStockMovementRepository;
