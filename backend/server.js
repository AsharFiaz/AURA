const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const connectDB = require("./config/db");
require("./config/passport"); // Initialize passport configuration

// Load env variables
dotenv.config();

// Initialize express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL,
      // Regex to allow local network IP addresses for mobile testing
      /http:\/\/192\.168\.\d+\.\d+:\d+/
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
  })
);

// Explicitly handle preflight requests for all routes
app.options(/\/.*/, cors());

// Add explicit headers to every response as a fallback
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && (
    origin === "http://localhost:3000" ||
    origin === "http://127.0.0.1:3000" ||
    origin === process.env.FRONTEND_URL ||
    /^http:\/\/192\.168\.\d+\.\d+:\d+$/.test(origin)
  )) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  next();
});
app.use(express.json());

// Session middleware (must be before passport)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "aura_session_secret_random_key_2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/memories", require("./routes/memories"));
app.use("/api/users", require("./routes/users"));
app.use("/api/follow", require("./routes/follow"));
app.use("/api/admin", require("./routes/admin"));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "AURA Backend is running", success: true });
});


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
