function createOrderRepository({ Order, OrderDetail, Drug, User }) {
  const FULL_INCLUDE = [
    { model: OrderDetail, as: 'details', include: [{ model: Drug, as: 'drug' }] },
    { model: User, as: 'requester', attributes: ['id', 'name', 'departmentName'] },
    { model: User, as: 'processedBy', attributes: ['id', 'name'] },
  ];

  return {
    create(fields, { transaction } = {}) {
      return Order.create(fields, { transaction });
    },

    // Loaded with details, requester and processor — the shape the API returns.
    findFullById(id) {
      return Order.findByPk(id, { include: FULL_INCLUDE });
    },

    // Postgres cannot FOR UPDATE across the outer joins the full include
    // produces, so lock the bare order row and load lines separately.
    findByIdForUpdate(id, { transaction }) {
      return Order.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
    },

    findAll({ userId } = {}) {
      return Order.findAll({
        where: userId ? { userId } : {},
        include: FULL_INCLUDE,
        order: [['createdAt', 'DESC']],
      });
    },

    findDetails(orderId, { transaction } = {}) {
      return OrderDetail.findAll({ where: { orderId }, transaction });
    },

    async replaceDetails(orderId, lines, { transaction }) {
      await OrderDetail.destroy({ where: { orderId }, transaction });
      await OrderDetail.bulkCreate(
        lines.map((line) => ({ orderId, drugId: line.drugId, quantity: line.quantity })),
        { transaction }
      );
    },

    createDetails(orderId, lines, { transaction }) {
      return OrderDetail.bulkCreate(
        lines.map((line) => ({ orderId, drugId: line.drugId, quantity: line.quantity })),
        { transaction }
      );
    },

    update(order, fields, { transaction } = {}) {
      return order.update(fields, { transaction });
    },
  };
}

module.exports = createOrderRepository;
