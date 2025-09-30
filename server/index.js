const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "/.env") });


// Add validation for required environment variables
if (!process.env.MONGO_URI) {
  console.error("Error: MONGO_URI environment variable is not defined");
  console.log("Please check your .env file in the root directory");
  process.exit(1);
}


mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    // Create admin user if it doesn't exist
    // await createAdminUser();
  })
  .catch((error) => console.log("MongoDB Error", error));

const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contacts");
const campaignRoutes = require("./routes/campaigns");
const templateRoutes = require("./routes/templates");
const reportRoutes = require("./routes/reports");
const queueRoutes = require("./routes/queue");
const userRoutes = require("./routes/users");
const settingsRoutes = require("./routes/settings");
const auditRoutes = require("./routes/audit");
const createAdminUser = require("./create-admin");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
app.use(express.json({ limit: "50mb" }));

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/templates", templateRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/queue", queueRoutes);
app.use("/api/users", userRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/audit", auditRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(PORT, () => {
  console.log(`CSEMail server running on port ${PORT}`);
});

module.exports = app;
