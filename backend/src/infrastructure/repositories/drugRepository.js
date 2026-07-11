const { Op } = require('sequelize');
const { ConflictError } = require('../../domain/errors');

function createDrugRepository({ Drug }) {
  return {
    search(term) {
      const where = term
        ? {
            [Op.or]: [
              { name: { [Op.iLike]: `%${term}%` } },
              { code: { [Op.iLike]: `%${term}%` } },
              { category: { [Op.iLike]: `%${term}%` } },
            ],
          }
        : {};
      return Drug.findAll({ where, order: [['name', 'ASC']] });
    },

    findById(id) {
      return Drug.findByPk(id);
    },

    findByIds(ids, { transaction } = {}) {
      return Drug.findAll({ where: { id: ids }, transaction });
    },

    // Locks the rows so concurrent stock changes serialize.
    findByIdsForUpdate(ids, { transaction }) {
      return Drug.findAll({ where: { id: ids }, transaction, lock: transaction.LOCK.UPDATE });
    },

    async create(fields) {
      try {
        return await Drug.create(fields);
      } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
          throw new ConflictError('A drug with this code already exists');
        }
        throw err;
      }
    },

    async update(drug, fields) {
      try {
        return await drug.update(fields);
      } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') {
          throw new ConflictError('A drug with this code already exists');
        }
        throw err;
      }
    },

    async remove(drug) {
      try {
        await drug.destroy();
      } catch (err) {
        if (err.name === 'SequelizeForeignKeyConstraintError') {
          throw new ConflictError('Drug is referenced by existing orders and cannot be deleted');
        }
        throw err;
      }
    },

    adjustStock(drug, delta, { transaction }) {
      return delta >= 0
        ? drug.increment('stock', { by: delta, transaction })
        : drug.decrement('stock', { by: -delta, transaction });
    },
  };
}

module.exports = createDrugRepository;
