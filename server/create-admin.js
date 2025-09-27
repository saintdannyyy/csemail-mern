const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");
require("dotenv").config();

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: "admin" });
    if (existingAdmin) {
      console.log("Admin user already exists:", existingAdmin.email);
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);

    const adminUser = new User({
      email: "admin@csemail.com",
      password: hashedPassword,
      firstName: "System",
      lastName: "Administrator",
      role: "admin",
      status: "active",
    });

    await adminUser.save();

    console.log("Admin user created successfully!");
    console.log("Email: admin@csemail.com");
    console.log("Password: admin123");
    console.log("Please change the password after first login.");
  } catch (error) {
    console.error("Error creating admin user:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createAdminUser();
