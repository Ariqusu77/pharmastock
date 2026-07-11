const { ValidationError, NotFoundError } = require('../domain/errors');

function createDrugService({ drugRepository }) {
  return {
    list({ search } = {}) {
      return drugRepository.search(search);
    },

    create({ code, name, category, unit, stock, minStock, description }) {
      if (!code || !name) throw new ValidationError('Code and name are required');
      return drugRepository.create({ code, name, category, unit, stock, minStock, description });
    },

    async update(id, { code, name, category, unit, stock, minStock, description }) {
      const drug = await drugRepository.findById(id);
      if (!drug) throw new NotFoundError('Drug not found');
      return drugRepository.update(drug, { code, name, category, unit, stock, minStock, description });
    },

    async remove(id) {
      const drug = await drugRepository.findById(id);
      if (!drug) throw new NotFoundError('Drug not found');
      await drugRepository.remove(drug);
    },
  };
}

module.exports = createDrugService;
