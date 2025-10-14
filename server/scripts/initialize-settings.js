const mongoose = require("mongoose");
const Settings = require("../models/Settings");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

async function initializeSettings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if settings already exist
    let settings = await Settings.findOne({ isDefault: true });

    if (settings) {
      console.log(
        "Settings already exist, updating with environment variables..."
      );

      // Update existing settings with environment variables if they're empty
      if (!settings.smtpHost && process.env.SMTP_HOST) {
        settings.smtpHost = process.env.SMTP_HOST;
      }
      if (!settings.smtpPort && process.env.SMTP_PORT) {
        settings.smtpPort = parseInt(process.env.SMTP_PORT);
      }
      if (!settings.smtpUser && process.env.SMTP_USER) {
        settings.smtpUser = process.env.SMTP_USER;
      }
      if (!settings.smtpPassword && process.env.SMTP_PASS) {
        settings.smtpPassword = process.env.SMTP_PASS;
      }
      if (settings.smtpSecure === undefined && process.env.SMTP_SECURE) {
        settings.smtpSecure = process.env.SMTP_SECURE === "true";
      }
      if (!settings.fromEmail && process.env.DEFAULT_FROM_EMAIL) {
        settings.fromEmail = process.env.DEFAULT_FROM_EMAIL;
      }
      if (!settings.fromName && process.env.DEFAULT_FROM_NAME) {
        settings.fromName = process.env.DEFAULT_FROM_NAME;
      }
      if (!settings.replyToEmail && process.env.SUPPORT_EMAIL) {
        settings.replyToEmail = process.env.SUPPORT_EMAIL;
      }

      await settings.save();
      console.log("✅ Settings updated successfully");
    } else {
      console.log("Creating new settings from environment variables...");

      // Create new settings
      settings = new Settings({
        smtpHost: process.env.SMTP_HOST || "",
        smtpPort: parseInt(process.env.SMTP_PORT) || 465,
        smtpUser: process.env.SMTP_USER || "",
        smtpPassword: process.env.SMTP_PASS || "",
        smtpSecure: process.env.SMTP_SECURE === "true",
        fromEmail: process.env.DEFAULT_FROM_EMAIL || "",
        fromName: process.env.DEFAULT_FROM_NAME || "CSE Mail",
        replyToEmail: process.env.SUPPORT_EMAIL || "",
        systemName: "CSE Mail",
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
      console.log("✅ Settings created successfully");
    }

    console.log("📧 SMTP Configuration:");
    console.log(`   Host: ${settings.smtpHost}`);
    console.log(`   Port: ${settings.smtpPort}`);
    console.log(`   User: ${settings.smtpUser}`);
    console.log(`   Secure: ${settings.smtpSecure}`);
    console.log(`   From: ${settings.fromName} <${settings.fromEmail}>`);
  } catch (error) {
    console.error("❌ Error initializing settings:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

// Run if called directly
if (require.main === module) {
  initializeSettings();
}

module.exports = initializeSettings;
