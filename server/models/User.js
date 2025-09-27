// mongoose = require("mongoose");

// const UserSchema = new mongoose.Schema({
//   email: String,
//   passwordHash: String,
//   role: { type: String },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//     updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// module.exports = mongoose.model("User", UserSchema);

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    firstName: { type: String, default: "" },
    lastName: { type: String, default: "" },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
  },
  { timestamps: true }
); // adds createdAt and updatedAt automatically

const User = mongoose.model("User", userSchema);
module.exports = User;
