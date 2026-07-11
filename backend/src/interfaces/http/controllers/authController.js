function createAuthController({ authService }) {
  return {
    async register(req, res) {
      const result = await authService.register(req.body);
      res.status(201).json(result);
    },

    async login(req, res) {
      const result = await authService.login(req.body);
      res.json(result);
    },

    me(req, res) {
      res.json(authService.me(req.user));
    },
  };
}

module.exports = createAuthController;
