const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    content: { type: String }, // Make optional since we might use templates
    htmlContent: { type: String }, // Support both content and htmlContent

    // Email sender information
    fromName: { type: String, required: true },
    fromEmail: { type: String, required: true },
    replyToEmail: { type: String },
    preheader: { type: String },

    // Template support
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },
    variables: { type: mongoose.Schema.Types.Mixed, default: {} }, // Template variables

    // Campaign status and scheduling
    status: {
      type: String,
      enum: [
        "draft",
        "scheduled",
        "sending",
        "sent",
        "paused",
        "cancelled",
        "failed",
      ],
      default: "draft",
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },

    // Recipient and delivery tracking
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    deliveredCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    bouncedCount: { type: Number, default: 0 },
    unsubscribedCount: { type: Number, default: 0 },

    // Legacy fields (for backward compatibility)
    recipientCount: { type: Number, default: 0 },
    template: { type: mongoose.Schema.Types.ObjectId, ref: "Template" },

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lists: [{ type: mongoose.Schema.Types.ObjectId, ref: "ContactList" }],
  },
  { timestamps: true }
);

const Campaign = mongoose.model("Campaign", campaignSchema);
module.exports = Campaign;
