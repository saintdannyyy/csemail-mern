const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    contactId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
    },
    email: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "sending", "sent", "failed", "bounced"],
      default: "pending",
    },
    sentAt: { type: Date },
    errorMessage: { type: String },
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
  },
  { timestamps: true }
);

const Queue = mongoose.model("Queue", queueSchema);
module.exports = Queue;
