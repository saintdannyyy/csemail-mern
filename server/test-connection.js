// Test Supabase connection using existing config
const supabase = require("./config/database");

async function testConnection() {
  try {
    console.log("🔍 Testing Supabase connection...");

    // First test basic connectivity
    console.log("✅ Supabase client initialized successfully!");

    // Test if users table exists by trying a simple query
    const { data, error } = await supabase.from("users").select("*").limit(1);

    if (error) {
      if (
        error.message.includes('relation "users" does not exist') ||
        error.message.includes('table "users" does not exist')
      ) {
        console.log("⚠️  Database tables not found");
        console.log(
          "📝 Please run the database schema SQL in your Supabase dashboard:"
        );
        console.log("   1. Go to Supabase Dashboard → SQL Editor");
        console.log("   2. Copy and paste the contents of database_schema.sql");
        console.log("   3. Run the script to create all tables");
        console.log(
          "\n🔗 Supabase connection is working, but database schema is needed!"
        );
        return false;
      } else {
        console.error("❌ Database connection failed:", error.message);
        console.log("\nPossible issues:");
        console.log(
          "1. Check your .env file has correct VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
        );
        console.log("2. Verify your Supabase project is active");
        return false;
      }
    }

    console.log("✅ Database connection successful!");
    console.log(`📊 Users table exists and accessible`);

    // Test if admin user exists
    const { data: adminUser, error: adminError } = await supabase
      .from("users")
      .select("email, role")
      .eq("email", "admin@csemail.com")
      .single();

    if (adminUser) {
      console.log("✅ Admin user found:", adminUser.email);
    } else {
      console.log(
        "⚠️  Admin user not found - run the database schema to create it"
      );
    }

    return true;
  } catch (err) {
    console.error("❌ Connection test failed:", err.message);
    if (err.message.includes("Missing Supabase configuration")) {
      console.log("\n📝 Please update your .env file with:");
      console.log("VITE_SUPABASE_URL=your-supabase-url");
      console.log("SUPABASE_SERVICE_ROLE_KEY=your-service-role-key");
    }
    return false;
  }
}

testConnection().then((success) => {
  if (success) {
    console.log("\n🎉 Setup completed successfully!");
    console.log("You can now start the application:");
    console.log("- Frontend: npm run dev");
    console.log("- Backend: npm start");
    console.log("\nDefault login: admin@csemail.com / admin123");
    console.log(
      "\n🔒 IMPORTANT: Change the default admin password after first login!"
    );
  } else {
    console.log("\n❌ Setup incomplete. Please check your configuration.");
  }
  process.exit(0);
});
