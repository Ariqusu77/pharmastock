function createUserRepository({ User }) {
  return {
    findById(id) {
      return User.findByPk(id);
    },

    findByEmail(email) {
      return User.findOne({ where: { email } });
    },

    // Includes the password hash for credential checks; never expose the result.
    findByEmailWithPassword(email) {
      return User.scope('withPassword').findOne({ where: { email } });
    },

    create(fields) {
      return User.create(fields);
    },
  };
}

module.exports = createUserRepository;
