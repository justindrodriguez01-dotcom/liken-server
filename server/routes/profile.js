const express     = require("express");
const requireAuth = require("../middleware/auth");
const { query }   = require("../db");

const router = express.Router();

// All profile routes require a valid JWT.
router.use(requireAuth);

// ─── GET /profile ─────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM profiles WHERE user_id = $1",
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.json(null); // No profile yet — caller creates one with POST
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[profile/GET]", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

// ─── POST /profile ────────────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const {
    name, school, year, major, hometown,
    goal, target_field, target_role,
    timeline, background_blurb,
    work_experience, activities,
  } = req.body;

  try {
    // Upsert: insert if none exists, update if it does.
    const result = await query(
      `INSERT INTO profiles
         (user_id, name, school, year, major, hometown,
          goal, target_field, target_role, timeline,
          background_blurb, work_experience, activities, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
       ON CONFLICT (user_id) DO UPDATE SET
         name             = EXCLUDED.name,
         school           = EXCLUDED.school,
         year             = EXCLUDED.year,
         major            = EXCLUDED.major,
         hometown         = EXCLUDED.hometown,
         goal             = EXCLUDED.goal,
         target_field     = EXCLUDED.target_field,
         target_role      = EXCLUDED.target_role,
         timeline         = EXCLUDED.timeline,
         background_blurb = EXCLUDED.background_blurb,
         work_experience  = EXCLUDED.work_experience,
         activities       = EXCLUDED.activities,
         updated_at       = NOW()
       RETURNING *`,
      [
        req.userId, name, school, year, major, hometown,
        goal, target_field, target_role, timeline,
        background_blurb,
        work_experience ? JSON.stringify(work_experience) : null,
        activities,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("[profile/POST]", err);
    res.status(500).json({ error: "Failed to save profile" });
  }
});

module.exports = router;
