// Migration script to update existing users with missing fields
const mongoose = require("mongoose");
const User = require("./models/User");

async function migrateUsers() {
  await mongoose.connect(
    process.env.MONGO_URI || "mongodb://localhost:27017/csemail"
  );

  const users = await User.find({});
  for (const user of users) {
    let updated = false;
    if (user.firstName === undefined) {
      user.firstName = "";
      updated = true;
    }
    if (user.lastName === undefined) {
      user.lastName = "";
      updated = true;
    }
    if (user.status === undefined) {
      user.status = "active";
      updated = true;
    }
    if (updated) {
      await user.save();
      console.log(`Updated user: ${user.email}`);
    }
  }
  console.log("Migration complete.");
  mongoose.disconnect();
}

migrateUsers().catch(console.error);
