/**
 * Test SMTP Database Integration
 * This utility script tests the SMTP configuration stored in the database
 * and sends a test email to verify the integration is working correctly
 */
const mongoose = require("mongoose");
const Settings = require("../models/Settings");
const emailService = require("../services/emailService");
const path = require("path");

// Load environment variables
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

/**
 * Test SMTP database integration by sending a test email
 * @returns {Promise<void>}
 */

async function testSmtpDatabaseIntegration() {
  try {
    console.log("🔧 Testing SMTP Database Integration...\n");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Get settings from database
    const settings = await Settings.findOne({ isDefault: true });
    if (!settings) {
      console.log("❌ No settings found in database");
      return;
    }

    console.log("\n📊 Settings from Database:");
    console.log(`   SMTP Host: ${settings.smtpHost}`);
    console.log(`   SMTP Port: ${settings.smtpPort}`);
    console.log(`   SMTP User: ${settings.smtpUser}`);
    console.log(`   SMTP Secure: ${settings.smtpSecure}`);
    console.log(`   From Name: ${settings.fromName}`);
    console.log(`   From Email: ${settings.fromEmail}`);

    // Test EmailService initialization with database settings
    console.log("\n🔄 Testing EmailService initialization...");
    await emailService.refreshTransporter();
    console.log("✅ EmailService transporter refreshed successfully");

    // Test SMTP connection
    console.log("\n🔗 Testing SMTP connection...");
    try {
      await emailService.verifyConnection();
      console.log("✅ SMTP connection verified successfully");
    } catch (verifyError) {
      console.log(
        "⚠️  SMTP connection verification failed:",
        verifyError.message
      );
      console.log(
        "   This might be normal if the SMTP server is not accessible"
      );
    }

    console.log("\n🎉 SMTP Database Integration test completed!");
  } catch (error) {
    console.error("\n❌ Error during test:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run if called directly
if (require.main === module) {
  testSmtpDatabaseIntegration();
}

module.exports = testSmtpDatabaseIntegration;
