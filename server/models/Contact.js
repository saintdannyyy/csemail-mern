const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "bounced", "unsubscribed"],
      default: "active",
    },
    tags: [{ type: String }],
    customFields: { type: Map, of: String },
    lists: [{ type: mongoose.Schema.Types.ObjectId, ref: "ContactList" }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Contact = mongoose.model("Contact", contactSchema);
module.exports = Contact;
