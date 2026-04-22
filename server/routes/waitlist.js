const express = require("express");
const { Resend } = require("resend");
const { query } = require("../db");

const router = express.Router();

console.log("[waitlist] module loaded — RESEND_API_KEY defined:", !!process.env.RESEND_API_KEY);

router.post("/", async (req, res) => {
  console.log("[waitlist] POST /waitlist hit — body:", req.body);

  const { email } = req.body;
  if (!email || !email.includes("@")) {
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
    console.log("[waitlist] DB insert rows:", result.rows.length, "(0 = duplicate)");

    res.json({ ok: true });

    if (result.rows.length === 0) {
      console.log("[waitlist] duplicate — skipping emails");
      return;
    }

    if (!process.env.RESEND_API_KEY) {
      console.warn("[waitlist] RESEND_API_KEY not set — skipping emails");
      return;
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log("[waitlist] sending notification email to justin...");
    const { error: notifErr } = await resend.emails.send({
      from: "ColdMatch <noreply@coldmatch.co>",
      to: "justindrodriguez01@gmail.com",
      subject: "New ColdMatch waitlist signup",
      text: `New signup:\n\nEmail: ${normalizedEmail}\nTimestamp: ${timestamp}`,
    });
    if (notifErr) console.error("[waitlist] notification email FAILED:", notifErr);
    else console.log("[waitlist] notification email sent");

    console.log("[waitlist] sending confirmation email to", normalizedEmail);
    const { error: confirmErr } = await resend.emails.send({
      from: "ColdMatch <noreply@coldmatch.co>",
      to: normalizedEmail,
      subject: "You're on the ColdMatch waitlist",
      text: "Hey, you are on the ColdMatch waitlist. We will reach out when it is ready for you. In the meantime, follow along at coldmatch.co.\n\nJustin, ColdMatch",
    });
    if (confirmErr) console.error("[waitlist] confirmation email FAILED:", confirmErr);
    else console.log("[waitlist] confirmation email sent");
  } catch (err) {
    console.error("[waitlist] route error:", err);
    if (!res.headersSent) res.status(500).json({ error: "server error" });
  }
});

module.exports = router;
