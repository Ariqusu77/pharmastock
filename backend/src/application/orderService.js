const { ValidationError, NotFoundError } = require('../domain/errors');
const { validateLineItems } = require('../domain/lineItems');
const {
  ORDER_STATUS,
  assertTransition,
  assertEditable,
  assertCancellable,
  assertOwnedBy,
  generateOrderNumber,
} = require('../domain/orderPolicy');
const { MOVEMENT_TYPE, assertSufficientStock } = require('../domain/stockPolicy');

function createOrderService({ orderRepository, drugRepository, stockMovementRepository, unitOfWork }) {
  async function assertDrugsExist(lines, transaction) {
    const drugs = await drugRepository.findByIds(lines.map((l) => l.drugId), { transaction });
    if (drugs.length !== lines.length) {
      throw new ValidationError('One or more drugs do not exist');
    }
  }

  return {
    // Department sends a new request to the pharmacy.
    async placeOrder(user, { note, items }) {
      const lines = validateLineItems(items);
      const order = await unitOfWork.run(async (t) => {
        await assertDrugsExist(lines, t);
        const created = await orderRepository.create(
          { orderNumber: generateOrderNumber(), note: note || null, userId: user.id },
          { transaction: t }
        );
        await orderRepository.createDetails(created.id, lines, { transaction: t });
        return created;
      });
      return orderRepository.findFullById(order.id);
    },

    // Pharmacy sees every order, a department only its own.
    listOrders(user) {
      return orderRepository.findAll(user.role === 'pharmacy' ? {} : { userId: user.id });
    },

    async getOrder(user, id) {
      const order = await orderRepository.findFullById(id);
      if (!order) throw new NotFoundError('Order not found');
      if (user.role !== 'pharmacy') assertOwnedBy(order, user);
      return order;
    },

    // Department reshapes its own order while the pharmacy has not
    // processed it yet: replaces the lines and the note.
    async updateOrder(user, id, { note, items }) {
      const lines = validateLineItems(items);
      await unitOfWork.run(async (t) => {
        const order = await orderRepository.findByIdForUpdate(id, { transaction: t });
        if (!order) throw new NotFoundError('Order not found');
        assertOwnedBy(order, user);
        assertEditable(order);
        await assertDrugsExist(lines, t);
        await orderRepository.replaceDetails(order.id, lines, { transaction: t });
        await orderRepository.update(order, { note: note || null }, { transaction: t });
      });
      return orderRepository.findFullById(id);
    },

    // Department withdraws its own order while the pharmacy has not
    // processed it yet. No stock was deducted for a pending order, so
    // nothing to restore.
    async cancelOrder(user, id) {
      await unitOfWork.run(async (t) => {
        const order = await orderRepository.findByIdForUpdate(id, { transaction: t });
        if (!order) throw new NotFoundError('Order not found');
        assertOwnedBy(order, user);
        assertCancellable(order);
        await orderRepository.update(order, { status: ORDER_STATUS.CANCELLED }, { transaction: t });
      });
      return orderRepository.findFullById(id);
    },

    // Pharmacy approves / rejects / fulfills. Approving deducts stock and
    // writes 'out' movements to the ledger, all in one transaction.
    async processOrder(user, id, { status, rejectionReason }) {
      await unitOfWork.run(async (t) => {
        const order = await orderRepository.findByIdForUpdate(id, { transaction: t });
        if (!order) throw new NotFoundError('Order not found');
        assertTransition(order, status, { rejectionReason });

        if (status === ORDER_STATUS.APPROVED) {
          const details = await orderRepository.findDetails(order.id, { transaction: t });
          const drugs = await drugRepository.findByIdsForUpdate(
            details.map((d) => d.drugId),
            { transaction: t }
          );
          const drugById = new Map(drugs.map((d) => [d.id, d]));

          // Verify every line before deducting anything
          for (const detail of details) {
            assertSufficientStock(drugById.get(detail.drugId), detail.quantity);
          }
          const movements = [];
          for (const detail of details) {
            const drug = drugById.get(detail.drugId);
            // adjustStock syncs the instance to the new value, so compute
            // the resulting balance from the pre-adjustment stock.
            const balanceAfter = drug.stock - detail.quantity;
            await drugRepository.adjustStock(drug, -detail.quantity, { transaction: t });
            movements.push({
              drugId: drug.id,
              userId: user.id,
              type: MOVEMENT_TYPE.OUT,
              quantity: detail.quantity,
              balanceAfter,
              reference: order.orderNumber,
              note: null,
            });
          }
          await stockMovementRepository.bulkCreate(movements, { transaction: t });
        }

        await orderRepository.update(
          order,
          {
            status,
            rejectionReason: status === ORDER_STATUS.REJECTED ? rejectionReason : null,
            processedById: user.id,
            processedAt: new Date(),
          },
          { transaction: t }
        );
      });
      return orderRepository.findFullById(id);
    },
  };
}

module.exports = createOrderService;
