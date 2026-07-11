function createStockController({ stockService }) {
  return {
    async receive(req, res) {
      res.status(201).json(await stockService.receiveStock(req.user, req.body));
    },

    async movements(req, res) {
      const { drugId, type } = req.query;
      res.json(await stockService.listMovements({ drugId, type }));
    },
  };
}

module.exports = createStockController;
