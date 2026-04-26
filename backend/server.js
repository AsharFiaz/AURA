const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const session = require("express-session");
const passport = require("passport");
const cron = require("node-cron");
const connectDB = require("./config/db");
require("./config/passport");

dotenv.config();

const app = express();
connectDB();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      process.env.FRONTEND_URL,
      /http:\/\/192\.168\.\d+\.\d+:\d+/
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"]
  })
);

app.options(/\/.*/, cors());

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

// sendBeacon sends with content-type "text/plain;charset=UTF-8".
// Accept that as JSON too so the unload-flush path works.
app.use(express.json({ type: ['application/json', 'text/plain'] }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "aura_session_secret_random_key_2024",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/memories", require("./routes/memories"));
app.use("/api/memories", require("./routes/nft"));
app.use("/api/users", require("./routes/users"));
app.use("/api/follow", require("./routes/follow"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/interactions", require("./routes/interactions"));

app.get("/api/test", (req, res) => {
  res.json({ message: "AURA Backend is running", success: true });
});

// ── Daily vector update cron ────────────────────────────────────────────────
// Runs every day at 03:00 server time. Recomputes personality vectors for
// every user with pending (unapplied) interactions.
const { updateAllPendingUsers } = require('./services/vectorUpdate');
cron.schedule('0 3 * * *', async () => {
  console.log('[cron] Starting daily vector update at', new Date().toISOString());
  try {
    await updateAllPendingUsers();
  } catch (err) {
    console.error('[cron] daily update failed:', err.message);
  }
}, { timezone: process.env.CRON_TIMEZONE || 'UTC' });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('[cron] Daily vector update scheduled for 03:00');
});