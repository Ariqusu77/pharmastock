const { ValidationError, UnauthorizedError, ConflictError } = require('../domain/errors');

function publicUser(user) {
  const { id, name, email, role, departmentName } = user;
  return { id, name, email, role, departmentName };
}

function createAuthService({ userRepository, passwordHasher, tokenService }) {
  return {
    async register({ name, email, password, role, departmentName }) {
      if (!name || !email || !password) {
        throw new ValidationError('Name, email and password are required');
      }
      if (role === 'department' && !departmentName) {
        throw new ValidationError('Department users must set a department name');
      }
      const existing = await userRepository.findByEmail(email);
      if (existing) throw new ConflictError('Email is already registered');

      const user = await userRepository.create({
        name,
        email,
        password: await passwordHasher.hash(password),
        role: role === 'pharmacy' ? 'pharmacy' : 'department',
        departmentName: role === 'pharmacy' ? null : departmentName,
      });
      return { token: tokenService.sign(user), user: publicUser(user) };
    },

    async login({ email, password }) {
      const user = await userRepository.findByEmailWithPassword(email);
      if (!user || !(await passwordHasher.compare(password, user.password))) {
        throw new UnauthorizedError('Wrong email or password');
      }
      return { token: tokenService.sign(user), user: publicUser(user) };
    },

    me(user) {
      return { user: publicUser(user) };
    },
  };
}

module.exports = createAuthService;
