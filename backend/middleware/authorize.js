function authorize(roles = []) {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  
  return function(req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        status: 401,
        message: 'Unauthorized access.',
        error: 'Unauthorized access.',
        errors: 'Unauthorized access.',
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }
    
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        status: 403,
        message: 'Forbidden access.',
        error: 'Forbidden access.',
        errors: 'Forbidden access.',
        timestamp: new Date().toISOString(),
        requestId: req.id
      });
    }
    
    next();
  };
}

module.exports = authorize;
