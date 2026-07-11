// Composition root: wires infrastructure → application → interface.
// Everything below this file receives its dependencies as arguments,
// so layers stay swappable and testable in isolation.
const models = require('./infrastructure/database/models');

const createUnitOfWork = require('./infrastructure/repositories/unitOfWork');
const createUserRepository = require('./infrastructure/repositories/userRepository');
const createDrugRepository = require('./infrastructure/repositories/drugRepository');
const createOrderRepository = require('./infrastructure/repositories/orderRepository');
const createStockMovementRepository = require('./infrastructure/repositories/stockMovementRepository');

const passwordHasher = require('./infrastructure/security/passwordHasher');
const createTokenService = require('./infrastructure/security/tokenService');

const createAuthService = require('./application/authService');
const createDrugService = require('./application/drugService');
const createOrderService = require('./application/orderService');
const createStockService = require('./application/stockService');

const createAuthMiddleware = require('./interfaces/http/middleware/auth');
const createAuthController = require('./interfaces/http/controllers/authController');
const createDrugController = require('./interfaces/http/controllers/drugController');
const createOrderController = require('./interfaces/http/controllers/orderController');
const createStockController = require('./interfaces/http/controllers/stockController');

function createContainer() {
  const { sequelize } = models;

  // Infrastructure
  const unitOfWork = createUnitOfWork({ sequelize });
  const userRepository = createUserRepository(models);
  const drugRepository = createDrugRepository(models);
  const orderRepository = createOrderRepository(models);
  const stockMovementRepository = createStockMovementRepository(models);
  const tokenService = createTokenService({
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  // Application
  const authService = createAuthService({ userRepository, passwordHasher, tokenService });
  const drugService = createDrugService({ drugRepository });
  const orderService = createOrderService({
    orderRepository,
    drugRepository,
    stockMovementRepository,
    unitOfWork,
  });
  const stockService = createStockService({ drugRepository, stockMovementRepository, unitOfWork });

  // Interface
  const auth = createAuthMiddleware({ userRepository, tokenService });

  return {
    sequelize,
    auth,
    authController: createAuthController({ authService }),
    drugController: createDrugController({ drugService }),
    orderController: createOrderController({ orderService }),
    stockController: createStockController({ stockService }),
  };
}

module.exports = createContainer;
