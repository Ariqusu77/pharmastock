const { Router } = require('express');
const wrap = require('../middleware/asyncHandler');

function stockRoutes({ stockController, auth }) {
  const router = Router();
  router.use(auth.authenticate, auth.requireRole('pharmacy'));

  // POST /api/stock/in — record incoming drugs { items, reference?, note? }
  router.post('/in', wrap(stockController.receive));

  // GET /api/stock/movements?drugId=&type= — the stock ledger, newest first
  router.get('/movements', wrap(stockController.movements));

  return router;
}

module.exports = stockRoutes;
