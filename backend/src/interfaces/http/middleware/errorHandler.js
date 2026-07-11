const { AppError } = require('../../../domain/errors');

// Maps domain errors to their HTTP status; anything else is a 500.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({ message: err.message });
  }
  console.error(err);
  return res.status(500).json({ message: 'Internal server error' });
}

module.exports = errorHandler;
