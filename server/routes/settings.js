const express = require("express");
const Settings = require("../models/Settings");
const AuditLog = require("../models/AuditLog");
const { authenticateToken, requireRole } = require("../middleware/auth");
const path = require("path");

// Ensure environment variables are loaded
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const router = express.Router();

/**
 * Get or create default settings
 * @returns {Object} Settings document
 */
async function getOrCreateSettings() {
  try {
    let settings = await Settings.findOne({ isDefault: true });

    if (!settings) {
      // Create default settings with environment variables
      settings = new Settings({
        smtpHost: process.env.SMTP_HOST || "",
        smtpPort: parseInt(process.env.SMTP_PORT) || 465,
        smtpUser: process.env.SMTP_USER || "",
        smtpPassword: process.env.SMTP_PASS || "",
        smtpSecure: process.env.SMTP_SECURE === "true",
        fromEmail: process.env.DEFAULT_FROM_EMAIL || "",
        fromName: process.env.DEFAULT_FROM_NAME || "Emmisor",
        replyToEmail: process.env.SUPPORT_EMAIL || "",
        systemName: "Emmisor",
        timezone: "UTC",
        emailRateLimit: 5,
        batchSize: 1,
        batchDelay: 2000,
        requireAuth: true,
        maxLoginAttempts: 5,
        suppressionEnabled: true,
        isDefault: true,
      });
      await settings.save();
    }

    return settings;
  } catch (error) {
    console.error("Error in getOrCreateSettings:", error);
    throw error;
  }
}

// Get all system settings grouped by category
router.get(
  "/",
  authenticateToken,
  requireRole(["admin", "editor", "user"]),
  async (req, res) => {
    try {
      const settings = await getOrCreateSettings();

      // Group settings by category for the frontend
      const groupedSettings = {
        email: [
          {
            key: "fromName",
            value: settings.fromName || "",
            description: "Default sender name",
          },
          {
            key: "fromEmail",
            value: settings.fromEmail || "",
            description: "Default sender email",
          },
          {
            key: "replyToEmail",
            value: settings.replyToEmail || "",
            description: "Default reply-to email",
          },
          {
            key: "emailRateLimit",
            value: (settings.emailRateLimit || 5).toString(),
            description: "Emails per minute limit",
          },
          {
            key: "batchSize",
            value: (settings.batchSize || 1).toString(),
            description: "Emails per batch",
          },
          {
            key: "batchDelay",
            value: (settings.batchDelay || 2000).toString(),
            description: "Delay between batches (ms)",
          },
        ],
        queue: [
          {
            key: "batchSize",
            value: (settings.batchSize || 1).toString(),
            description: "Emails per batch",
          },
          {
            key: "batchDelay",
            value: (settings.batchDelay || 2000).toString(),
            description: "Delay between batches (ms)",
          },
          {
            key: "emailRateLimit",
            value: (settings.emailRateLimit || 5).toString(),
            description: "Emails per minute limit",
          },
        ],
        security: [
          {
            key: "requireAuth",
            value: (settings.requireAuth || true).toString(),
            description: "Require authentication",
          },
          {
            key: "maxLoginAttempts",
            value: (settings.maxLoginAttempts || 5).toString(),
            description: "Max login attempts",
          },
          {
            key: "suppressionEnabled",
            value: (settings.suppressionEnabled || true).toString(),
            description: "Enable suppression list",
          },
        ],
        general: [
          {
            key: "systemName",
            value: settings.systemName || "Emmisor",
            description: "System name",
          },
          {
            key: "timezone",
            value: settings.timezone || "UTC",
            description: "System timezone",
          },
        ],
      };

      res.json(groupedSettings);
    } catch (error) {
      console.error("Get settings error:", error);
      res
        .status(500)
        .json({ error: "Failed to fetch settings", details: error.message });
    }
  }
);

// Update system settings
router.put("/", authenticateToken, requireRole(["admin"]), async (req, res) => {
  try {
    const { settings: settingsArray } = req.body;

    if (!settingsArray || !Array.isArray(settingsArray)) {
      return res.status(400).json({ error: "Settings array is required" });
    }

    const settings = await getOrCreateSettings();

    // Update settings based on key-value pairs
    settingsArray.forEach(({ key, value }) => {
      switch (key) {
        case "fromName":
          settings.fromName = value;
          break;
        case "fromEmail":
          settings.fromEmail = value;
          break;
        case "replyToEmail":
          settings.replyToEmail = value;
          break;
        case "emailRateLimit":
          settings.emailRateLimit = parseInt(value) || 5;
          break;
        case "batchSize":
          settings.batchSize = parseInt(value) || 1;
          break;
        case "batchDelay":
          settings.batchDelay = parseInt(value) || 2000;
          break;
        case "requireAuth":
          settings.requireAuth = value === "true";
          break;
        case "maxLoginAttempts":
          settings.maxLoginAttempts = parseInt(value) || 5;
          break;
        case "suppressionEnabled":
          settings.suppressionEnabled = value === "true";
          break;
        case "systemName":
          settings.systemName = value;
          break;
        case "timezone":
          settings.timezone = value;
          break;
      }
    });

    settings.updatedBy = req.user.userId;
    await settings.save();

    // Log audit event
    await AuditLog.create({
      userId: req.user.userId,
      action: "settings_updated",
      targetType: "system",
      details: { updatedKeys: settingsArray.map((s) => s.key) },
    });

    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    console.error("Update settings error:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

// Get email defaults for campaign creation
router.get(
  "/email-defaults",
  authenticateToken,
  requireRole(["admin", "editor"]),
  async (req, res) => {
    try {
      const settings = await getOrCreateSettings();

      const defaults = {
        fromName: settings.fromName || "CSE Mail",
        fromEmail: settings.fromEmail || "noreply@example.com",
        replyToEmail:
          settings.replyToEmail || settings.fromEmail || "noreply@example.com",
      };

      res.json(defaults);
    } catch (error) {
      console.error("Get email defaults error:", error);
      res.status(500).json({ error: "Failed to fetch email defaults" });
    }
  }
);

// Get SMTP configuration
router.get(
  "/smtp",
  authenticateToken,
  requireRole(["admin"]),
  async (req, res) => {
    try {
      const settings = await getOrCreateSettings();

      const config = {
        smtp_host: settings.smtpHost,
        smtp_port: settings.smtpPort,
        smtp_username: settings.smtpUser,
        smtp_password: "***", // Don't return actual password
        smtp_secure: settings.smtpSecure,
        smtp_from_name: settings.fromName,
        smtp_from_email: settings.fromEmail,
      };

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

      const settings = await getOrCreateSettings();

      // Update SMTP settings
      if (host !== undefined) settings.smtpHost = host;
      if (port !== undefined) settings.smtpPort = parseInt(port);
      if (username !== undefined) settings.smtpUser = username;
      if (password !== undefined && password !== "***")
        settings.smtpPassword = password;
      if (secure !== undefined) settings.smtpSecure = Boolean(secure);
      if (fromName !== undefined) settings.fromName = fromName;
      if (fromEmail !== undefined) settings.fromEmail = fromEmail;

      settings.updatedBy = req.user.userId;
      await settings.save();

      // Refresh email service transporter with new settings
      try {
        const emailService = require("../services/emailService");
        await emailService.refreshTransporter();
      } catch (refreshError) {
        console.warn(
          "Could not refresh email service transporter:",
          refreshError.message
        );
      }

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

      // Get current SMTP settings
      const settings = await getOrCreateSettings();

      // Use email service to test SMTP
      const emailService = require("../services/emailService");

      try {
        // Refresh transporter with current settings
        await emailService.refreshTransporter();

        // Verify SMTP connection
        await emailService.verifyConnection();

        // Send a test email
        const testResult = await emailService.sendTemplateEmail({
          to: testEmail,
          customTemplate: {
            subject: "SMTP Test Email from {{company_name}}",
            content: `
              <h2>SMTP Configuration Test</h2>
              <p>This is a test email to verify your SMTP configuration is working correctly.</p>
              <p><strong>Sent from:</strong> {{company_name}}</p>
              <p><strong>Date:</strong> {{current_date}}</p>
              <p><strong>SMTP Host:</strong> ${settings.smtpHost}</p>
              <p><strong>SMTP Port:</strong> ${settings.smtpPort}</p>
              <p><strong>Secure:</strong> ${
                settings.smtpSecure ? "Yes" : "No"
              }</p>
              <hr>
              <p style="color: #666; font-size: 12px;">If you received this email, your SMTP configuration is working correctly!</p>
            `,
          },
          fromName: settings.fromName,
          fromEmail: settings.fromEmail,
          userId: req.user.userId,
        });

        // Log audit event
        await AuditLog.create({
          userId: req.user._id,
          action: "smtp_test_performed",
          targetType: "system",
          details: {
            testEmail,
            success: true,
            messageId: testResult.messageId,
          },
        });

        res.json({
          success: true,
          message: "SMTP test email sent successfully",
          details: {
            host: settings.smtpHost,
            port: settings.smtpPort,
            secure: settings.smtpSecure,
            testEmailSent: true,
            messageId: testResult.messageId,
          },
        });
      } catch (smtpError) {
        console.error("SMTP test failed:", smtpError);

        // Log failed test
        await AuditLog.create({
          userId: req.user._id,
          action: "smtp_test_failed",
          targetType: "system",
          details: { testEmail, error: smtpError.message },
        });

        res.status(400).json({
          success: false,
          message: "SMTP test failed",
          error: smtpError.message,
          details: {
            host: settings.smtpHost,
            port: settings.smtpPort,
            secure: settings.smtpSecure,
            suggestion:
              smtpError.code === "ETIMEDOUT"
                ? "Connection timeout - your hosting provider may block SMTP. Consider using a transactional email service like SendGrid or Mailgun."
                : "Check your SMTP credentials and network connectivity.",
          },
        });
      }
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
      const settings = await getOrCreateSettings();

      const config = {
        suppressionEnabled: settings.suppressionEnabled,
        suppressionList: settings.suppressionList || [],
      };

      // TODO: Get suppression list statistics when SuppressionList model is implemented
      const stats = {
        total: settings.suppressionList?.length || 0,
        byReason: {
          bounced: 0,
          unsubscribed: 0,
          complained: 0,
          manual: settings.suppressionList?.length || 0,
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
      const settings = await getOrCreateSettings();

      // Create export object without sensitive data
      const exportData = {
        smtpHost: settings.smtpHost,
        smtpPort: settings.smtpPort,
        smtpUser: settings.smtpUser,
        smtpSecure: settings.smtpSecure,
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
        replyToEmail: settings.replyToEmail,
        suppressionEnabled: settings.suppressionEnabled,
        emailRateLimit: settings.emailRateLimit,
        batchSize: settings.batchSize,
        batchDelay: settings.batchDelay,
        requireAuth: settings.requireAuth,
        maxLoginAttempts: settings.maxLoginAttempts,
        systemName: settings.systemName,
        timezone: settings.timezone,
        // Don't export password and suppression list for security
      };

      // Log audit event
      await AuditLog.create({
        userId: req.user.userId,
        action: "settings_exported",
        targetType: "system",
        details: { settingsCount: Object.keys(exportData).length },
      });

      res.json({
        exportedAt: new Date().toISOString(),
        settingsCount: Object.keys(exportData).length,
        settings: exportData,
      });
    } catch (error) {
      console.error("Export settings error:", error);
      res.status(500).json({ error: "Failed to export settings" });
    }
  }
);

module.exports = router;
