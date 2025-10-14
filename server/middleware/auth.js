const jwt = require("jsonwebtoken");
const User = require("../models/User");
const path = require("path");

// Ensure environment variables are loaded
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key";
    console.log("Auth middleware using JWT secret:", jwtSecret ? "SET" : "NOT SET");
    
    const decoded = jwt.verify(token, jwtSecret);

    // Get user from database
    const user = await User.findOne({ _id: decoded.userId });
    if (!user) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification error:", error.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.log(`Access denied for user ${req.user?.email} with role ${req.user?.role}. Required roles: ${roles.join(', ')}`);
      return res.status(403).json({ error: "Insufficient permissions", requiredRoles: roles, userRole: req.user?.role });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRole };
