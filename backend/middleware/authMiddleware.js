const jwt = require("jsonwebtoken");

// 1. Verify if the user is logged in (Authentication)
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Adds {id, user_id, role} to the request object
    next(); // Move to the next function (controller)
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired token." });
  }
};

// 2. Verify if the user has the right Role (Authorization)
exports.authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user comes from verifyToken above
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Role '${req.user.role}' is not authorized.` 
      });
    }
    next();
  };
};