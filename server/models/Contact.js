const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive", "bounced", "unsubscribed"],
      default: "active",
    },
    tags: {
      type: [String],
      enum: ["order", "confirmation", "receipt", "newsletter", "promotion", "ecommerce"],
      default: ["order", "confirmation", "receipt", "newsletter", "promotion", "ecommerce"]
    },
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
