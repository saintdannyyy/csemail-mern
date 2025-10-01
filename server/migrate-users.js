// Migration script to update existing users with missing fields
const mongoose = require("mongoose");
const User = require("./models/User");
require("dotenv").config({ path: "../.env" });

async function migrateUsers() {
  try {
    console.log("Starting user migration...");

    await mongoose.connect(
      process.env.MONGO_URI || "mongodb://localhost:27017/emmisor"
    );
    console.log("Connected to MongoDB");

    const users = await User.find({});
    console.log(`Found ${users.length} users to potentially migrate`);

    let updatedCount = 0;

    for (const user of users) {
      let updated = false;

      // For admin user with empty names, set proper names
      if (
        user.role === "admin" &&
        (!user.firstName || user.firstName.trim() === "")
      ) {
        user.firstName = "System";
        updated = true;
      }

      if (
        user.role === "admin" &&
        (!user.lastName || user.lastName.trim() === "")
      ) {
        user.lastName = "Administrator";
        updated = true;
      }

      // Ensure firstName exists
      if (user.firstName === undefined || user.firstName === null) {
        user.firstName = "";
        updated = true;
      }

      // Ensure lastName exists
      if (user.lastName === undefined || user.lastName === null) {
        user.lastName = "";
        updated = true;
      }

      // Ensure status exists and is valid
      if (user.status === undefined || user.status === null) {
        user.status = "active";
        updated = true;
      } else if (!["active", "inactive", "pending"].includes(user.status)) {
        user.status = "active";
        updated = true;
      }

      // Ensure role exists and is valid
      if (user.role === undefined || user.role === null) {
        user.role = "viewer"; // Default to viewer role
        updated = true;
      } else if (!["admin", "editor", "viewer"].includes(user.role)) {
        user.role = "viewer";
        updated = true;
      }

      // Save if any updates were made
      if (updated) {
        await user.save();
        updatedCount++;
        console.log(
          `Updated user: ${user.email} (${user.firstName} ${user.lastName})`
        );
      }
    }

    console.log(`Migration complete. Updated ${updatedCount} users.`);
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

migrateUsers().catch(console.error);
