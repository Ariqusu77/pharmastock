function createOrderController({ orderService }) {
  return {
    async place(req, res) {
      res.status(201).json(await orderService.placeOrder(req.user, req.body));
    },

    async list(req, res) {
      res.json(await orderService.listOrders(req.user));
    },

    async get(req, res) {
      res.json(await orderService.getOrder(req.user, req.params.id));
    },

    async update(req, res) {
      res.json(await orderService.updateOrder(req.user, req.params.id, req.body));
    },

    async cancel(req, res) {
      res.json(await orderService.cancelOrder(req.user, req.params.id));
    },

    async setStatus(req, res) {
      res.json(await orderService.processOrder(req.user, req.params.id, req.body));
    },
  };
}

module.exports = createOrderController;
