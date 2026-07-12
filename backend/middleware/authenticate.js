const { validateSessionFromRequest } = require('../utils/session-manager');

function authenticate(req, res, next) {
  const session = validateSessionFromRequest(req);
  if (!session) {
    req.auth = null;
    req.user = null;
    return next();
  }
  req.auth = {
    user: {
      id: session.payload.sub,
      role: session.payload.role,
      username: session.session.user ? session.session.user.email : (session.payload.role === 'admin' ? 'admin' : '')
    },
    session: session.session
  };
  req.user = req.auth.user;
  next();
}

module.exports = authenticate;
