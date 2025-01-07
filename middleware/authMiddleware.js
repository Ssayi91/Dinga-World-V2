// authMiddleware.js

// Middleware to check if the user is authenticated
const adminAuthMiddleware = (req, res, next) => {
    if (!req.isAuthenticated || !req.isAuthenticated()) {
      return res.status(401).send('Unauthorized');
    }
    next();
  };
  
  // Middleware to check user rights
  const checkUserRights = (requiredRights) => {
    return (req, res, next) => {
      if (!req.user || !req.user.rights || !req.user.rights.some(right => requiredRights.includes(right))) {
        return res.status(403).send('Access Denied');
      }
      next();
    };
  };
  
  module.exports = { adminAuthMiddleware, checkUserRights };
  