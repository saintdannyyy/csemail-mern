const express = require("express");
const AuditLog = require("../models/AuditLog");
const User = require("../models/User");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get audit logs
router.get("/", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      targetType,
      startDate,
      endDate,
    } = req.query;

    const offset = (page - 1) * limit;

    let query = AuditLog.find()
      .populate("userId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(parseInt(limit));

    // Apply filters
    if (userId) {
      query = query.where("userId").equals(userId);
    }

    if (action) {
      query = query.where("action").equals(action);
    }

    if (targetType) {
      query = query.where("targetType").equals(targetType);
    }

    if (startDate) {
      query = query.where("createdAt").gte(new Date(startDate));
    }

    if (endDate) {
      query = query.where("createdAt").lte(new Date(endDate));
    }

    const logs = await query;

    // Get total count with same filters
    let countQuery = AuditLog.find();

    if (userId) countQuery = countQuery.where("userId").equals(userId);
    if (action) countQuery = countQuery.where("action").equals(action);
    if (targetType)
      countQuery = countQuery.where("targetType").equals(targetType);
    if (startDate)
      countQuery = countQuery.where("createdAt").gte(new Date(startDate));
    if (endDate)
      countQuery = countQuery.where("createdAt").lte(new Date(endDate));

    const count = await countQuery.countDocuments();

    res.json({
      logs: logs || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// Get audit log statistics
router.get(
  "/stats",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { period = "30" } = req.query;
      const days = parseInt(period);
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      // Get logs for the period
      const logs = await AuditLog.find({
        createdAt: { $gte: startDate },
      }).select("action targetType createdAt userId");

      // Calculate statistics
      const stats = {
        totalActions: logs?.length || 0,
        uniqueUsers: new Set(logs?.map((log) => log.userId.toString())).size,
        byAction: {},
        byTargetType: {},
        dailyActivity: {},
      };

      // Group by action
      logs?.forEach((log) => {
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      });

      // Group by target type
      logs?.forEach((log) => {
        stats.byTargetType[log.targetType] =
          (stats.byTargetType[log.targetType] || 0) + 1;
      });

      // Group by day
      logs?.forEach((log) => {
        const date = new Date(log.createdAt).toISOString().split("T")[0];
        stats.dailyActivity[date] = (stats.dailyActivity[date] || 0) + 1;
      });

      // Get most active users
      const userActivity = {};
      logs?.forEach((log) => {
        const userIdStr = log.userId.toString();
        userActivity[userIdStr] = (userActivity[userIdStr] || 0) + 1;
      });

      const topUserIds = Object.entries(userActivity)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([userId]) => userId);

      // Get user details for top users
      const topUsers = await User.find({
        _id: { $in: topUserIds },
      }).select("firstName lastName email");

      const topUsersWithActivity =
        topUsers?.map((user) => ({
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          activityCount: userActivity[user._id.toString()],
        })) || [];

      res.json({
        ...stats,
        topUsers: topUsersWithActivity,
        period: {
          days,
          startDate: startDate.toISOString(),
        },
      });
    } catch (error) {
      console.error("Get audit stats error:", error);
      res.status(500).json({ error: "Failed to fetch audit statistics" });
    }
  }
);

// Get available actions and target types for filtering
router.get(
  "/filters",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      // Get distinct actions
      const actions = await AuditLog.distinct("action");

      // Get distinct target types
      const targetTypes = await AuditLog.distinct("targetType");

      // Get users who have audit logs
      const logsWithUsers = await AuditLog.find()
        .populate("userId", "firstName lastName email")
        .select("userId")
        .sort("userId.firstName");

      const uniqueUsers = [];
      const seenUserIds = new Set();

      logsWithUsers.forEach((log) => {
        if (log.userId && !seenUserIds.has(log.userId._id.toString())) {
          seenUserIds.add(log.userId._id.toString());
          uniqueUsers.push({
            id: log.userId._id,
            name: `${log.userId.firstName} ${log.userId.lastName}`,
            email: log.userId.email,
          });
        }
      });

      res.json({
        actions: actions.sort(),
        targetTypes: targetTypes.sort(),
        users: uniqueUsers,
      });
    } catch (error) {
      console.error("Get audit filters error:", error);
      res.status(500).json({ error: "Failed to fetch audit filters" });
    }
  }
);

// Export audit logs
router.get(
  "/export",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const {
        userId,
        action,
        targetType,
        startDate,
        endDate,
        format = "json",
      } = req.query;

      let query = AuditLog.find().populate(
        "userId",
        "firstName lastName email"
      );

      // Apply filters
      if (userId) query = query.where("userId").equals(userId);
      if (action) query = query.where("action").equals(action);
      if (targetType) query = query.where("targetType").equals(targetType);
      if (startDate) query = query.where("createdAt").gte(new Date(startDate));
      if (endDate) query = query.where("createdAt").lte(new Date(endDate));

      const logs = await query.sort({ createdAt: -1 }).limit(10000); // Limit to prevent memory issues

      // Format logs for export
      const exportLogs =
        logs?.map((log) => ({
          id: log._id,
          timestamp: log.createdAt,
          user: `${log.userId.firstName} ${log.userId.lastName}`,
          userEmail: log.userId.email,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          details: JSON.stringify(log.details),
          ipAddress: log.ipAddress,
          userAgent: log.userAgent,
        })) || [];

      // Log the export action
      await AuditLog.create({
        userId: req.user.id,
        action: "audit_logs_exported",
        targetType: "system",
        details: {
          recordCount: exportLogs.length,
          filters: { userId, action, targetType, startDate, endDate },
        },
      });

      res.json({
        exportedAt: new Date().toISOString(),
        recordCount: exportLogs.length,
        filters: { userId, action, targetType, startDate, endDate },
        logs: exportLogs,
      });
    } catch (error) {
      console.error("Export audit logs error:", error);
      res.status(500).json({ error: "Failed to export audit logs" });
    }
  }
);

module.exports = router;
