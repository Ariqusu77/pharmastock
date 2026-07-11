const bcrypt = require('bcryptjs');

const passwordHasher = {
  hash(plain) {
    return bcrypt.hash(plain, 10);
  },
  compare(plain, hash) {
    return bcrypt.compare(plain || '', hash);
  },
};

module.exports = passwordHasher;
