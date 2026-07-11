const jwt = require('jsonwebtoken');

function createTokenService({ secret, expiresIn }) {
  return {
    sign(user) {
      return jwt.sign({ id: user.id, role: user.role }, secret, { expiresIn });
    },
    // Returns the payload or throws (invalid/expired token).
    verify(token) {
      return jwt.verify(token, secret);
    },
  };
}

module.exports = createTokenService;
