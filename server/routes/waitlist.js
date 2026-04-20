const express = require("express");
const nodemailer = require("nodemailer");
const { query } = require("../db");

const router = express.Router();

console.log("[waitlist] module loaded — GMAIL_APP_PASSWORD defined:", !!process.env.GMAIL_APP_PASSWORD);

function makeTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "justindrodriguez01@gmail.com",
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  });
}

router.post("/", async (req, res) => {
  console.log("[waitlist] POST /waitlist hit — body:", req.body);

  const { email } = req.body;
  if (!email || !email.includes("@")) {
    console.log("[waitlist] invalid email rejected:", email);
    return res.status(400).json({ error: "valid email required" });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const timestamp = new Date().toISOString();

  try {
    const result = await query(
      `INSERT INTO waitlist (email, created_at)
       VALUES ($1, NOW())
       ON CONFLICT (email) DO NOTHING
       RETURNING email`,
      [normalizedEmail]
    );
    console.log("[waitlist] DB insert result rows:", result.rows.length, "(0 = duplicate)");

    if (result.rows.length === 0) {
      console.log("[waitlist] duplicate signup, skipping emails");
      return res.json({ ok: true });
    }

    console.log("[waitlist] GMAIL_APP_PASSWORD defined at send time:", !!process.env.GMAIL_APP_PASSWORD);

    if (!process.env.GMAIL_APP_PASSWORD) {
      console.warn("[waitlist] GMAIL_APP_PASSWORD not set — skipping emails");
      return res.json({ ok: true });
    }

    const transporter = makeTransporter();

    console.log("[waitlist] sending notification email to justin...");
    try {
      const notifInfo = await transporter.sendMail({
        from: "justindrodriguez01@gmail.com",
        to: "justindrodriguez01@gmail.com",
        subject: "New ColdMatch waitlist signup",
        text: `New signup:\n\nEmail: ${normalizedEmail}\nTimestamp: ${timestamp}`,
      });
      console.log("[waitlist] notification email sent:", notifInfo.messageId);
    } catch (notifErr) {
      console.error("[waitlist] notification email FAILED:", notifErr);
    }

    console.log("[waitlist] sending confirmation email to", normalizedEmail, "...");
    try {
      const confirmInfo = await transporter.sendMail({
        from: "justindrodriguez01@gmail.com",
        to: normalizedEmail,
        subject: "You're on the ColdMatch waitlist",
        text: "Hey — you're on the list. We'll reach out when ColdMatch is ready for you. In the meantime, follow along at coldmatch.co. — Justin, ColdMatch",
      });
      console.log("[waitlist] confirmation email sent:", confirmInfo.messageId);
    } catch (confirmErr) {
      console.error("[waitlist] confirmation email FAILED:", confirmErr);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[waitlist] route error:", err);
    res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
