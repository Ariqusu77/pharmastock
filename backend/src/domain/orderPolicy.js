const { ValidationError, ConflictError, ForbiddenError } = require('./errors');

const ORDER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
};

// Which statuses the pharmacy may move an order to from its current one.
// Cancellation is not listed here: it is a department action with its own
// rule below, so the pharmacy status endpoint can never cancel.
const TRANSITIONS = {
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.APPROVED, ORDER_STATUS.REJECTED],
  [ORDER_STATUS.APPROVED]: [ORDER_STATUS.FULFILLED],
  [ORDER_STATUS.REJECTED]: [],
  [ORDER_STATUS.FULFILLED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

function assertTransition(order, nextStatus, { rejectionReason } = {}) {
  const allowed = TRANSITIONS[order.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ValidationError(`Cannot change a ${order.status} order to ${nextStatus}`);
  }
  if (nextStatus === ORDER_STATUS.REJECTED && !rejectionReason) {
    throw new ValidationError('A rejection needs a reason');
  }
}

// A department may only reshape an order while the pharmacy has not
// processed it yet.
function assertEditable(order) {
  if (order.status !== ORDER_STATUS.PENDING) {
    throw new ConflictError(
      `Only pending orders can be edited — this one is already ${order.status}`
    );
  }
}

// Same window as editing: once the pharmacy has processed the order,
// the department can no longer withdraw it.
function assertCancellable(order) {
  if (order.status !== ORDER_STATUS.PENDING) {
    throw new ConflictError(
      `Only pending orders can be cancelled — this one is already ${order.status}`
    );
  }
}

function assertOwnedBy(order, user) {
  if (order.userId !== user.id) {
    throw new ForbiddenError('This order belongs to another department');
  }
}

function generateOrderNumber(now = new Date()) {
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `RX-${stamp}-${rand}`;
}

module.exports = {
  ORDER_STATUS,
  assertTransition,
  assertEditable,
  assertCancellable,
  assertOwnedBy,
  generateOrderNumber,
};
