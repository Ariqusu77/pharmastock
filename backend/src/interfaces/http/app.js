const path = require('path');
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const drugRoutes = require('./routes/drugRoutes');
const orderRoutes = require('./routes/orderRoutes');
const stockRoutes = require('./routes/stockRoutes');
const errorHandler = require('./middleware/errorHandler');

// Assembles the Express app from the wired controllers and middleware.
// When frontendDist is set (FRONTEND_DIST env), the API also serves the
// built SPA with a client-route fallback — single-port deployments
// without a separate web server.
function createApp({
  authController,
  drugController,
  orderController,
  stockController,
  auth,
  frontendDist,
}) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes({ authController, auth }));
  app.use('/api/drugs', drugRoutes({ drugController, auth }));
  app.use('/api/orders', orderRoutes({ orderController, auth }));
  app.use('/api/stock', stockRoutes({ stockController, auth }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  if (frontendDist) {
    app.use(express.static(frontendDist));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next(); // unknown API routes stay 404
      res.sendFile(path.join(frontendDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}

module.exports = createApp;
