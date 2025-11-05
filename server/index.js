const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

// Load environment variables - Vercel handles this automatically
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config({ path: path.join(__dirname, "../.env") });
}

// mongoose.set("debug", true);

// Configure mongoose for serverless
mongoose.set("bufferCommands", false); // Disable buffering in serverless
mongoose.set("bufferTimeoutMS", 10000); // Set buffer timeout

// Connect to MongoDB with optimized settings for serverless
let cachedDb = null;

const connectDB = async () => {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000, // Increased to 10 seconds
      socketTimeoutMS: 45000,
      maxPoolSize: 10, // Connection pooling for serverless
      minPoolSize: 1,
    });
    cachedDb = db;
    console.log("✓ MongoDB connected successfully");
    return db;
  } catch (error) {
    console.error("✗ MongoDB connection error:", error.message);
    throw error; // Throw error so routes know DB is not available
  }
};

// Initialize connection (but don't block app startup)
connectDB().catch((err) => console.error("Initial DB connection failed:", err));

const authRoutes = require("./routes/auth");
const contactRoutes = require("./routes/contacts");
const campaignRoutes = require("./routes/campaigns");
const templateRoutes = require("./routes/templates");
const reportRoutes = require("./routes/reports");
const queueRoutes = require("./routes/queue");
const userRoutes = require("./routes/users");
const settingsRoutes = require("./routes/settings");
const auditRoutes = require("./routes/audit");
const activityRoutes = require("./routes/activity");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "https://csemail.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
    ],
    exposedHeaders: ["Access-Control-Allow-Origin"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  })
);
app.use(morgan("combined"));
app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
app.use(express.json({ limit: "50mb" }));

// Static files
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Handle preflight requests explicitly for all routes
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  next();
});

// Middleware to ensure DB connection before processing requests
app.use(async (req, res, next) => {
  // Skip health check and root route from DB check
  if (req.path === "/api/health" || req.path === "/") {
    return next();
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(503).json({
      error: "Service temporarily unavailable",
      message: "Database connection failed. Please try again.",
    });
  }
});

// Root route for testing
app.get("/", (req, res) => {
  res.json({
    message: "CSEMail API Server",
    status: "running",
    mongoStatus:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

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
app.use("/api/activity", activityRoutes);

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

// Only start server if not in serverless environment
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Emmisor server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
