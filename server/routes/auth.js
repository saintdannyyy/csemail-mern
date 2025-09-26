const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
// const { v4: uuidv4 } = require('uuid');
// const supabase = require('../config/database');
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
        { expiresIn: "24h" }
      );
      res.json({
        token,
        user: {
          id: user._id,
          email: user.email,
          // firstName: user.first_name,
          // lastName: user.last_name,
          role: user.role,
          // status: user.status,
          // createdAt: user.createdAt,
          // lastLoginAt: new Date().toISOString(),
        },
        
      });
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
      // firstName: req.user.first_name,
      // lastName: req.user.last_name,
      role: req.user.role,
      // status: req.user.status,
      createdAt: req.user.createdAt,
      // lastLoginAt: req.user.last_login_at,
    },
  });
});

// Logout (client-side token removal, but log the event)
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Log audit event
    await supabase.from("audit_logs").insert({
      user_id: req.user.id,
      action: "user_logout",
      target_type: "user",
      target_id: req.user.id,
      ip_address: req.ip,
      user_agent: req.get("User-Agent"),
    });

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
