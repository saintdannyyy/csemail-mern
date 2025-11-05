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

// Connect to MongoDB with error handling
let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = db.connections[0].readyState === 1;
    if (isConnected) {
      console.log("✓ MongoDB connected successfully");
    }
  } catch (error) {
    console.error("✗ MongoDB connection error:", error.message);
    // Don't throw - allow the app to start even if DB is not connected
  }
};

connectDB();

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
