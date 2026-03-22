require("dotenv").config();
const express = require("express");
const cors    = require("cors");

const authRoutes     = require("./routes/auth");
const profileRoutes  = require("./routes/profile");
const generateRoutes = require("./routes/generate");

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── CORS ────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. curl, Postman) and any
    // chrome-extension:// origin, plus localhost for local dev.
    if (
      !origin ||
      origin.startsWith("chrome-extension://") ||
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1")
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());

// ─── Health check ─────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth",     authRoutes);
app.use("/profile",  profileRoutes);
app.use("/generate", generateRoutes);

// ─── Global error handler ────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Liken server running on port ${PORT}`);
});
