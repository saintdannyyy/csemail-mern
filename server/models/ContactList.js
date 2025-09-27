const mongoose = require("mongoose");

const contactListSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    contactCount: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const ContactList = mongoose.model("ContactList", contactListSchema);
module.exports = ContactList;
