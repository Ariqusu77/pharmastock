const { Router } = require('express');
const wrap = require('../middleware/asyncHandler');

function authRoutes({ authController, auth }) {
  const router = Router();
  router.post('/register', wrap(authController.register));
  router.post('/login', wrap(authController.login));
  router.get('/me', auth.authenticate, wrap(authController.me));
  return router;
}

module.exports = authRoutes;
