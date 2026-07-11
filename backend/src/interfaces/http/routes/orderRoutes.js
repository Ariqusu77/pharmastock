const { Router } = require('express');
const wrap = require('../middleware/asyncHandler');

function orderRoutes({ orderController, auth }) {
  const router = Router();
  router.use(auth.authenticate);

  // POST /api/orders — department places an order { note, items }
  router.post('/', auth.requireRole('department'), wrap(orderController.place));

  // GET /api/orders — pharmacy sees every order, a department only its own
  router.get('/', wrap(orderController.list));
  router.get('/:id', wrap(orderController.get));

  // PUT /api/orders/:id — department edits its own order while still pending
  router.put('/:id', auth.requireRole('department'), wrap(orderController.update));

  // POST /api/orders/:id/cancel — department withdraws its own pending order
  router.post('/:id/cancel', auth.requireRole('department'), wrap(orderController.cancel));

  // PATCH /api/orders/:id/status — pharmacy approves / rejects / fulfills
  router.patch('/:id/status', auth.requireRole('pharmacy'), wrap(orderController.setStatus));

  return router;
}

module.exports = orderRoutes;
