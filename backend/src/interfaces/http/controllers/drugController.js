function createDrugController({ drugService }) {
  return {
    async list(req, res) {
      res.json(await drugService.list({ search: req.query.search }));
    },

    async create(req, res) {
      res.status(201).json(await drugService.create(req.body));
    },

    async update(req, res) {
      res.json(await drugService.update(req.params.id, req.body));
    },

    async remove(req, res) {
      await drugService.remove(req.params.id);
      res.json({ message: 'Drug deleted' });
    },
  };
}

module.exports = createDrugController;
