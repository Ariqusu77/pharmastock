const { Router } = require('express');
const wrap = require('../middleware/asyncHandler');

function drugRoutes({ drugController, auth }) {
  const router = Router();
  router.use(auth.authenticate);

  // GET /api/drugs?search=para — both roles can browse the catalog
  router.get('/', wrap(drugController.list));

  // Catalog management is pharmacy-only
  router.post('/', auth.requireRole('pharmacy'), wrap(drugController.create));
  router.put('/:id', auth.requireRole('pharmacy'), wrap(drugController.update));
  router.delete('/:id', auth.requireRole('pharmacy'), wrap(drugController.remove));

  return router;
}

module.exports = drugRoutes;
