const mongoose = require("mongoose");

const systemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: String, required: true },
    description: { type: String },
  },
  { timestamps: true }
);

const SystemConfig = mongoose.model("SystemConfig", systemConfigSchema);
module.exports = SystemConfig;
