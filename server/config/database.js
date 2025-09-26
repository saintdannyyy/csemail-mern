// const { createClient } = require("@supabase/supabase-js");
// const path = require("path");
// require("dotenv").config({ path: path.join(__dirname, "../.env") });

// const supabaseUrl = process.env.VITE_SUPABASE_URL;
// const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// if (!supabaseUrl || !supabaseServiceKey) {
//   console.error(
//     "Missing Supabase configuration. Please check your .env file has:"
//   );
//   console.error("- VITE_SUPABASE_URL");
//   console.error("- SUPABASE_SERVICE_ROLE_KEY");
//   console.error("Looking for .env file at:", path.join(__dirname, "../.env"));
//   throw new Error("Missing Supabase configuration");
// }

// const supabase = createClient(supabaseUrl, supabaseServiceKey);

// module.exports = supabase;
