const express = require("express");
const AuditLog = require("../models/AuditLog");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get recent activity
router.get(
  "/recent",
  authenticateToken,
  requireRole(["admin", "editor", "viewer"]),
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      // Get recent activity from audit logs
      const recentActivity = await AuditLog.find({})
        .populate("userId", "firstName lastName email")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      // Map audit logs to activity format
      const activities = recentActivity.map((log) => {
        let title = "Unknown activity";
        let description = log.details?.description || "";
        let type = "report_generated"; // default type

        // Map audit log actions to activity types and descriptions
        switch (log.action) {
          case "campaign_sent":
            title = `Campaign "${log.details?.campaignName || "Unknown"}" sent`;
            description = `Delivered to ${
              log.details?.recipientCount || 0
            } recipients`;
            type = "campaign_sent";
            break;
          case "contact_imported":
            title = "Contacts imported from CSV";
            description = `${log.details?.count || 0} new contacts added to "${
              log.details?.listName || "Unknown"
            }" list`;
            type = "contact_imported";
            break;
          case "template_created":
            title = "New template created";
            description = `"${
              log.details?.templateName || "Unknown"
            }" template saved`;
            type = "template_created";
            break;
          case "user_login":
            title = "User logged in";
            description = `Login from ${log.details?.ip || "unknown IP"}`;
            type = "report_generated";
            break;
          case "user_created":
            title = "New user created";
            description = `User ${
              log.details?.email || "unknown"
            } added to system`;
            type = "report_generated";
            break;
          case "smtp_test_performed":
            title = "SMTP connection tested";
            description = `Test ${
              log.details?.success ? "successful" : "failed"
            }`;
            type = "report_generated";
            break;
          default:
            title = `${log.action.replace(/_/g, " ")} performed`;
            description =
              log.details?.description ||
              `Action performed on ${log.targetType}`;
            type = "report_generated";
        }

        // Format timestamp as relative time
        const timestamp = formatRelativeTime(log.createdAt);

        // Get user name
        const user = log.userId
          ? `${log.userId.firstName || ""} ${
              log.userId.lastName || ""
            }`.trim() || log.userId.email
          : "System";

        return {
          id: log._id.toString(),
          type,
          title,
          description,
          timestamp,
          user,
          userId: log.userId,
        };
      });

      res.json({
        activities,
        total: activities.length,
      });
    } catch (error) {
      console.error("Get recent activity error:", error);
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  }
);

// Helper function to format relative time
function formatRelativeTime(date) {
  const now = new Date();
  const diff = now - new Date(date);

  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;

  return new Date(date).toLocaleDateString();
}

module.exports = router;
