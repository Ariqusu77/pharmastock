const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const drugRoutes = require('./routes/drugRoutes');
const orderRoutes = require('./routes/orderRoutes');
const stockRoutes = require('./routes/stockRoutes');
const errorHandler = require('./middleware/errorHandler');

// Assembles the Express app from the wired controllers and middleware.
function createApp({ authController, drugController, orderController, stockController, auth }) {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/auth', authRoutes({ authController, auth }));
  app.use('/api/drugs', drugRoutes({ drugController, auth }));
  app.use('/api/orders', orderRoutes({ orderController, auth }));
  app.use('/api/stock', stockRoutes({ stockController, auth }));

  app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

  app.use(errorHandler);
  return app;
}

module.exports = createApp;
