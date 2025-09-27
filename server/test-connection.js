// Test MongoDB connection using Mongoose
const mongoose = require("mongoose");
require("dotenv").config();

async function testConnection() {
  try {
    console.log("🔍 Testing MongoDB connection...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected successfully!");

    // Test if we can access the database
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log(`📊 Found ${collections.length} collections in database`);

    // Check for required collections
    const requiredCollections = ["users", "contacts", "campaigns", "templates"];
    const existingCollections = collections.map((c) => c.name);

    console.log("\n📋 Collection Status:");
    requiredCollections.forEach((collection) => {
      const exists = existingCollections.includes(collection);
      console.log(`${exists ? "✅" : "❌"} ${collection}`);
    });

    // Test user collection
    const User = require("./models/User");
    const userCount = await User.countDocuments();
    console.log(`👥 Users in database: ${userCount}`);

    if (userCount === 0) {
      console.log("⚠️  No users found - you may need to create an admin user");
    }

    console.log("\n✅ Database connection successful!");
    console.log("🎉 Your MongoDB setup is working correctly!");

    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.log("\n🔧 Troubleshooting:");
    console.log("1. Check your .env file has MONGO_URI set correctly");
    console.log(
      "2. Ensure MongoDB is running locally or your connection string is valid"
    );
    console.log("3. Verify network connectivity to your MongoDB instance");
    return false;
  } finally {
    await mongoose.connection.close();
  }
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("❌ Test failed:", err.message);
    process.exit(1);
  });
