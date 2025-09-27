const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get all users
router.get("/", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query;
    const offset = (page - 1) * limit;

    let query = {};

    if (search) {
      query.$or = [
        { email: new RegExp(search, "i") },
        { firstName: new RegExp(search, "i") },
        { lastName: new RegExp(search, "i") },
      ];
    }

    if (role && role !== "all") {
      query.role = role;
    }

    if (status && status !== "all") {
      query.status = status;
    }

    const users = await User.find(query)
      .select("email firstName lastName role status createdAt lastLoginAt")
      .skip(offset)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const count = await User.countDocuments(query);

    res.json({
      users: users || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Create user
router.post(
  "/",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { email, firstName, lastName, role, sendInvite = true } = req.body;

      if (!email || !firstName || !lastName || !role) {
        return res.status(400).json({ error: "All fields are required" });
      }

      if (!["admin", "editor", "viewer"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res
          .status(409)
          .json({ error: "User with this email already exists" });
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      const user = new User({
        email: email.toLowerCase(),
        firstName,
        lastName,
        password: passwordHash,
        role,
        status: "pending",
      });

      await user.save();

      // TODO: Send invitation email if sendInvite is true
      // This would integrate with your email sending service

      // Log audit event
      await AuditLog.create({
        userId: req.user.id,
        action: "user_created",
        targetType: "user",
        targetId: user._id,
        details: { email, firstName, lastName, role, sendInvite },
      });

      res.status(201).json({
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
        tempPassword: sendInvite ? undefined : tempPassword, // Only return password if not sending invite
      });
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  }
);

// Update user
router.put(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, role, status } = req.body;

      // Prevent admin from changing their own role or status
      if (
        id === req.user.id &&
        (role !== req.user.role || status !== req.user.status)
      ) {
        return res
          .status(400)
          .json({ error: "Cannot change your own role or status" });
      }

      const updateData = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (role !== undefined) updateData.role = role;
      if (status !== undefined) updateData.status = status;

      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const user = await User.findByIdAndUpdate(id, updateData, {
        new: true,
      }).select("id email firstName lastName role status createdAt updatedAt");

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Log audit event
      await AuditLog.create({
        userId: req.user.id,
        action: "user_updated",
        targetType: "user",
        targetId: id,
        details: updateData,
      });

      res.json(user);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

// Delete user
router.delete(
  "/:id",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Prevent admin from deleting themselves
      if (id === req.user.id) {
        return res
          .status(400)
          .json({ error: "Cannot delete your own account" });
      }

      // Check if user has created campaigns
      const campaignCount = await require("../models/Campaign").countDocuments({
        createdBy: id,
      });
      if (campaignCount > 0) {
        return res.status(400).json({
          error:
            "Cannot delete user who has created campaigns. Deactivate instead.",
        });
      }

      await User.findByIdAndDelete(id);

      // Log audit event
      await AuditLog.create({
        userId: req.user.id,
        action: "user_deleted",
        targetType: "user",
        targetId: id,
      });

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);

// Reset user password
router.post(
  "/:id/reset-password",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { id } = req.params;

      // Generate new temporary password
      const tempPassword = Math.random().toString(36).slice(-8);
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      await User.findByIdAndUpdate(id, {
        password: passwordHash,
        status: "pending",
      });

      // TODO: Send password reset email
      // This would integrate with your email sending service

      // Log audit event
      await AuditLog.create({
        userId: req.user.id,
        action: "user_password_reset",
        targetType: "user",
        targetId: id,
      });

      res.json({
        message: "Password reset successfully",
        tempPassword, // In production, this would be sent via email
      });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  }
);

// Get user statistics
router.get(
  "/stats",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      // Get user counts by role and status
      const users = await User.find({}).select("role status");

      const stats = {
        total: users.length,
        byRole: {
          admin: users.filter((u) => u.role === "admin").length,
          editor: users.filter((u) => u.role === "editor").length,
          viewer: users.filter((u) => u.role === "viewer").length,
        },
        byStatus: {
          active: users.filter((u) => u.status === "active").length,
          inactive: users.filter((u) => u.status === "inactive").length,
          pending: users.filter((u) => u.status === "pending").length,
        },
      };

      // Get recent activity
      const recentActivity = await AuditLog.find({
        action: {
          $in: ["user_login", "user_logout", "user_created", "user_updated"],
        },
      })
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .limit(10);

      res.json({
        stats,
        recentActivity: recentActivity || [],
      });
    } catch (error) {
      console.error("Get user stats error:", error);
      res.status(500).json({ error: "Failed to fetch user statistics" });
    }
  }
);

module.exports = router;
