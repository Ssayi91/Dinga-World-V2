const jwt = require("jsonwebtoken");

// Middleware to check required roles or permissions
const checkAccess = (requiredAccess) => {
  return (req, res, next) => {
    const token = req.cookies["admin-token"];
    if (!token) {
      console.log("No token found. Redirecting to login.");
      return res.redirect("/admin-login.html");
    }

    try {
      // Verify the JWT token
      const decoded = jwt.verify(token, "your_secret_key");
      console.log("Decoded Token:", decoded);

      // Check roles or permissions
      const { roles, permissions } = decoded;

      // Debug roles and requiredAccess
      console.log("User Roles:", roles);
      console.log("Required Access:", requiredAccess);

      // Allow access if user has the required role or permission
      const hasAccess =
        (roles && roles.includes(requiredAccess)) ||
        (permissions && permissions.includes(requiredAccess));

      if (!hasAccess) {
        console.log(`Access denied. User roles: ${roles} Required: ${requiredAccess}`);
        return res.status(403).send("Access denied");
      }

      // Attach user information to the request for further use
      req.user = decoded;
      next();
    } catch (err) {
      console.error("Token verification failed:", err.message);
      return res.redirect("/admin-login.html");
    }
  };
};

module.exports = { checkAccess };
