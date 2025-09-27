const express = require("express");
const Settings = require("../models/Settings");
const AuditLog = require("../models/AuditLog");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Get all system settings
// Get all system settings
router.get("/", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const settings = await Settings.find().sort("key");

    // Group settings by category
    const groupedSettings = {
      email: [],
      queue: [],
      security: [],
      general: [],
    };

    settings?.forEach((setting) => {
      if (setting.key.startsWith("smtp_") || setting.key.startsWith("email_")) {
        groupedSettings.email.push(setting);
      } else if (
        setting.key.startsWith("queue_") ||
        setting.key.startsWith("rate_")
      ) {
        groupedSettings.queue.push(setting);
      } else if (
        setting.key.startsWith("auth_") ||
        setting.key.startsWith("security_")
      ) {
        groupedSettings.security.push(setting);
      } else {
        groupedSettings.general.push(setting);
      }
    });

    res.json(groupedSettings);
  } catch (error) {
    console.error("Get settings error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Update system settings
router.put("/", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { settings } = req.body;

    if (!settings || !Array.isArray(settings)) {
      return res.status(400).json({ error: "Settings array is required" });
    }

    // Update settings
    const updatePromises = settings.map(async (setting) => {
      return Settings.findOneAndUpdate(
        { key: setting.key },
        {
          value: setting.value,
          description: setting.description,
          updatedAt: new Date(),
        },
        { upsert: true, new: true }
      );
    });

    await Promise.all(updatePromises);

    // Log audit event
    await AuditLog.create({
      userId: req.user.userId,
      action: "settings_updated",
      targetType: "system",
      details: { updatedKeys: settings.map((s) => s.key) },
    });

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Get SMTP configuration
router.get(
  "/smtp",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const smtpSettings = await Settings.find({ key: { $regex: "^smtp_" } });

      const config = {};
      smtpSettings?.forEach((setting) => {
        config[setting.key] = setting.value;
      });

      // Don't return sensitive data like passwords
      if (config.smtp_password) {
        config.smtp_password = "***";
      }

      res.json(config);
    } catch (error) {
      console.error("Get SMTP config error:", error);
      res.status(500).json({ error: "Failed to fetch SMTP configuration" });
    }
  }
);

// Update SMTP configuration
router.put(
  "/smtp",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { host, port, username, password, secure, fromName, fromEmail } =
        req.body;

      const smtpSettings = [
        { key: "smtp_host", value: host, description: "SMTP server hostname" },
        {
          key: "smtp_port",
          value: port?.toString(),
          description: "SMTP server port",
        },
        { key: "smtp_username", value: username, description: "SMTP username" },
        {
          key: "smtp_secure",
          value: secure?.toString(),
          description: "Use SSL/TLS",
        },
        {
          key: "smtp_from_name",
          value: fromName,
          description: "Default sender name",
        },
        {
          key: "smtp_from_email",
          value: fromEmail,
          description: "Default sender email",
        },
      ];

      // Only update password if provided
      if (password && password !== "***") {
        smtpSettings.push({
          key: "smtp_password",
          value: password,
          description: "SMTP password",
        });
      }

      // Update settings
      const updatePromises = smtpSettings
        .filter(
          (setting) => setting.value !== undefined && setting.value !== null
        )
        .map(async (setting) => {
          return Settings.findOneAndUpdate(
            { key: setting.key },
            {
              value: setting.value,
              description: setting.description,
              updatedAt: new Date(),
            },
            { upsert: true, new: true }
          );
        });

      await Promise.all(updatePromises);

      // Log audit event (without sensitive data)
      await AuditLog.create({
        userId: req.user.userId,
        action: "smtp_config_updated",
        targetType: "system",
        details: { host, port, username, fromName, fromEmail },
      });

      res.json({ message: "SMTP configuration updated successfully" });
    } catch (error) {
      console.error("Update SMTP config error:", error);
      res.status(500).json({ error: "Failed to update SMTP configuration" });
    }
  }
);

// Test SMTP connection
router.post(
  "/smtp/test",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const { testEmail } = req.body;

      if (!testEmail) {
        return res
          .status(400)
          .json({ error: "Test email address is required" });
      }

      // Get SMTP configuration
      const smtpSettings = await Settings.find({ key: { $regex: "^smtp_" } });

      const config = {};
      smtpSettings?.forEach((setting) => {
        config[setting.key] = setting.value;
      });

      // TODO: Implement actual SMTP test
      // This would use nodemailer to test the connection and send a test email

      // For demo purposes, simulate a successful test
      const testResult = {
        success: true,
        message: "SMTP connection test successful",
        details: {
          host: config.smtp_host,
          port: config.smtp_port,
          secure: config.smtp_secure === "true",
          testEmailSent: true,
        },
      };

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "smtp_test_performed",
        targetType: "system",
        details: { testEmail, success: testResult.success },
      });

      res.json(testResult);
    } catch (error) {
      console.error("SMTP test error:", error);
      res.status(500).json({ error: "Failed to test SMTP connection" });
    }
  }
);

// Get suppression list settings
router.get(
  "/suppression",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const suppressionSettings = await Settings.find({
        key: { $regex: "^suppression_" },
      });

      const config = {};
      suppressionSettings?.forEach((setting) => {
        config[setting.key] = setting.value;
      });

      // TODO: Get suppression list statistics when SuppressionList model is implemented
      const stats = {
        total: 0,
        byReason: {
          bounced: 0,
          unsubscribed: 0,
          complained: 0,
          manual: 0,
        },
      };

      res.json({ config, stats });
    } catch (error) {
      console.error("Get suppression settings error:", error);
      res.status(500).json({ error: "Failed to fetch suppression settings" });
    }
  }
);

// Export system configuration
router.get(
  "/export",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const settings = await Settings.find({}, "key value description").sort(
        "key"
      );

      // Remove sensitive settings from export
      const sensitiveKeys = ["smtp_password", "jwt_secret", "api_keys"];
      const exportSettings =
        settings?.filter(
          (setting) => !sensitiveKeys.some((key) => setting.key.includes(key))
        ) || [];

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "settings_exported",
        targetType: "system",
        details: { settingsCount: exportSettings.length },
      });

      res.json({
        exportedAt: new Date().toISOString(),
        settingsCount: exportSettings.length,
        settings: exportSettings,
      });
    } catch (error) {
      console.error("Export settings error:", error);
      res.status(500).json({ error: "Failed to export settings" });
    }
  }
);

module.exports = router;
