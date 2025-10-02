const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Get user from database
    const user = await User.findOne({ email: email });

    if (user && (await bcrypt.compare(password, user.password))) {
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || "your-secret-key",
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
      );
      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt || null,
        },
      });
    } else {
      return res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (email) {
      const user = await User.findOne({ email: email });
      if (user) {
        return res.status(400).json({ error: "Email already exists" });
      }
    }

    // Create user in database
    const newUser = await User.insertOne({
      email: email,
      password: await bcrypt.hash(password, 10),
      role: role,
    });
    const savedUser = await newUser.save();

    res.json({
      data: {
        id: savedUser._id,
        email: savedUser.email,
        role: savedUser.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get current user
router.get("/me", authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      status: req.user.status,
      createdAt: req.user.createdAt,
      lastLoginAt: req.user.lastLoginAt || null,
    },
  });
});

// Logout (client-side token removal, but log the event)
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Log audit event
    await AuditLog.create({
      userId: req.user.userId,
      action: "user_logout",
      targetType: "user",
      targetId: req.user.userId,
      ipAddress: req.ip,
      user_agent: req.get("User-Agent"),
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
