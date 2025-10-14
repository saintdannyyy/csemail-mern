const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    // SMTP Configuration
    smtpHost: { type: String, default: "" },
    smtpPort: { type: Number, default: 465 },
    smtpUser: { type: String, default: "" },
    smtpPassword: { type: String, default: "" },
    smtpSecure: { type: Boolean, default: true },

    // Email Defaults
    fromEmail: { type: String, default: "" },
    fromName: { type: String, default: "" },
    replyToEmail: { type: String, default: "" },

    // System Settings
    suppressionEnabled: { type: Boolean, default: true },
    suppressionList: [{ type: String }],

    // Rate Limiting
    emailRateLimit: { type: Number, default: 5 }, // emails per minute
    batchSize: { type: Number, default: 1 }, // emails per batch
    batchDelay: { type: Number, default: 2000 }, // delay between batches (ms)

    // Security
    requireAuth: { type: Boolean, default: true },
    maxLoginAttempts: { type: Number, default: 5 },

    // General
    systemName: { type: String, default: "CSE Mail" },
    timezone: { type: String, default: "UTC" },

    // Metadata
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isDefault: { type: Boolean, default: true }, // Only one default settings doc
  },
  { timestamps: true }
);

// Ensure only one default settings document exists
settingsSchema.index(
  { isDefault: 1 },
  { unique: true, partialFilterExpression: { isDefault: true } }
);

const Settings = mongoose.model("Settings", settingsSchema);
module.exports = Settings;
