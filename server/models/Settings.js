const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema(
  {
    smtpHost: { type: String },
    smtpPort: { type: Number },
    smtpUser: { type: String },
    smtpPassword: { type: String },
    smtpSecure: { type: Boolean, default: true },
    fromEmail: { type: String },
    fromName: { type: String },
    suppressionEnabled: { type: Boolean, default: true },
    suppressionList: [{ type: String }],
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);
module.exports = Settings;
