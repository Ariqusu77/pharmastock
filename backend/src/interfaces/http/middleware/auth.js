function createAuthMiddleware({ userRepository, tokenService }) {
  // Verifies the Bearer token and attaches the user to req.user
  async function authenticate(req, res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    try {
      const payload = tokenService.verify(token);
      const user = await userRepository.findById(payload.id);
      if (!user) return res.status(401).json({ message: 'User no longer exists' });
      req.user = user;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
  }

  // Restricts a route to one role, e.g. requireRole('pharmacy')
  function requireRole(role) {
    return (req, res, next) => {
      if (!req.user || req.user.role !== role) {
        return res.status(403).json({ message: `Only ${role} users can do this` });
      }
      next();
    };
  }

  return { authenticate, requireRole };
}

module.exports = createAuthMiddleware;
