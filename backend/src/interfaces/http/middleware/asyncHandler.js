// Express 4 does not forward rejected promises to the error middleware,
// so every async handler is wrapped with this.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
