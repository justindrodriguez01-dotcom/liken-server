const express = require("express");
const OpenAI  = require("openai");

const router = express.Router();
// TODO: re-add auth middleware after frontend auth is implemented
// const requireAuth = require("../middleware/auth");
// router.use(requireAuth);

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function buildSenderBlock(u) {
  return [
    `- Name: ${u.name || "not provided"}`,
    `- School: ${u.school || "not provided"}${u.year ? `, ${u.year} year` : ""}`,
    `- Major: ${u.major || "not provided"}`,
    `- Hometown: ${u.hometown || "not provided"}`,
    `- Target job location: ${u.target_job_location || "not provided"}`,
    `- Career goal: ${u.goal || "not provided"}`,
    `- Target field: ${u.target_field || "not provided"}`,
    `- Target role type: ${u.target_role || "not provided"} (internship/full-time/exploring)`,
    `- Timeline: ${u.timeline || "not provided"}`,
    `- Work experience: ${u.work_experience || "not provided"}`,
    `- Activities and clubs: ${u.activities || "not provided"}`,
    `- Background: ${u.background_blurb || "not provided"}`,
  ].join("\n");
}

const ANGLE_DESCRIPTIONS = {
  breaking_in:       "the sender wants to understand how the recipient broke into their field and what advice they'd give someone trying to do the same",
  firm_strategy:     "the sender is curious about the recipient's firm specifically — its deals, investment strategy, focus areas, or how they think about the work",
  career_transition: "the sender is curious about a specific move the recipient made — between roles, firms, or fields — and what drove that decision",
};

// ─── POST /generate/score ──────────────────────────────────────────────────────
// Body: { profileData: string, userProfile: object }
// Returns: { score, reasons, recommendation }
router.post("/score", async (req, res) => {
  const { profileData, userProfile } = req.body;

  if (!profileData || !userProfile) {
    return res.status(400).json({ error: "profileData and userProfile are required" });
  }

  try {
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [{
        role: "user",
        content: `You are an experienced career mentor helping a college student decide whether a specific LinkedIn connection is worth cold emailing right now.

You have full context on both people:

SENDER:
${buildSenderBlock(userProfile)}

RECIPIENT:
${profileData}

Your job: Give an honest, calibrated score from 0-100 representing how valuable it would be for THIS sender to reach out to THIS recipient RIGHT NOW given the sender's specific goals and stage.

Think like a mentor who actually knows the sender personally and is advising them on whether this is a good use of their time. Consider:
- Is this person genuinely relevant to what the sender wants to achieve right now? Not just impressive, but actually useful for their specific goal.
- Is there any real common ground that makes the outreach feel natural rather than random? (shared school, hometown proximity, similar background, relevant career path)
- Given the sender's stage and experience level, is this person realistically going to respond and provide value?
- Does the recipient's seniority, field, role, and company actually align with what the sender is trying to do?
- Is the timing right? (e.g. a freshman reaching out to a senior banker during peak recruiting season)

Be honest. A peer with only student orgs is not useful for someone trying to get a PE internship. A senior professional in a completely different field is not useful regardless of how impressive they are. A mid-level professional at a target firm who shares the sender's school is extremely valuable.

Return ONLY this JSON, no explanation:
{
  "score": number,
  "reasons": [
    "specific reason 1",
    "specific reason 2",
    "specific reason 3"
  ],
  "recommendation": "strong match" | "worth reaching out" | "weak match"
}

Reasons must be specific, punchy, and max one line each. State a concrete fact and why it matters — no filler connector phrases.

BANNED phrases (do not use): "which creates a natural connection", "which aligns with", "could lead to", "valuable insights", "which is relevant to", "making them a strong", "given sender's goals", "which may be helpful"

Format: state the specific fact, then the direct implication — no padding.
Bad: "Works in finance, which aligns with sender's goals and could lead to valuable insights"
Bad: "Shares Michigan background, which creates a natural connection"
Good: "VP at Blackstone NY — senior enough to speak to PE recruiting, not so senior they won't respond"
Good: "Michigan Ross alum, same school as sender — shared background makes the outreach non-random"
Good: "Went IB → PE at a mid-market fund — exactly the path sender wants to understand"`,
      }],
    });

    const raw    = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
    const result = JSON.parse(raw);
    res.json(result);
  } catch (err) {
    console.error("[generate/score]", err);
    res.status(500).json({ error: "Score generation failed" });
  }
});

// ─── POST /generate/email ──────────────────────────────────────────────────────
// Body: { profileData: string, userProfile: object, targetingAngle: string }
// Returns: { subject, body }
router.post("/email", async (req, res) => {
  const { profileData, userProfile, targetingAngle, customNote } = req.body;

  if (!profileData || !userProfile) {
    return res.status(400).json({ error: "profileData and userProfile are required" });
  }

  const angleKey = targetingAngle && ANGLE_DESCRIPTIONS[targetingAngle] ? targetingAngle : "breaking_in";
  const angleDescription = ANGLE_DESCRIPTIONS[angleKey];

  const customNoteInstruction = customNote
    ? `\nCUSTOM CONTEXT FROM SENDER: "${customNote}" — weave this in naturally where it fits. Do not let it override the angle above.`
    : "";

  const resumeInstruction = userProfile.attach_resume
    ? "\nRESUME NOTE: The sender is attaching their resume to this email. Naturally work in a brief mention of this — e.g. 'I've attached my resume for context' — placed wherever it fits best. Do not force it at the end."
    : "";

  try {
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      messages: [{
        role: "user",
        content: `You are writing a cold outreach email on behalf of a college student. It must sound like a real human wrote it — not AI, not a template.

SENDER CONTEXT:
${buildSenderBlock(userProfile)}

RECIPIENT CONTEXT:
${profileData}

ANGLE — this drives the email's focus and the specific ask:
${angleDescription}${customNoteInstruction}${resumeInstruction}

━━━ STEP 1: DETECT SHARED BACKGROUND (do this before writing anything) ━━━

SHARED UNIVERSITY — mandatory highest-priority hook:
Compare sender's school against every institution in the recipient's profile. If they match (same university, any campus), this is the primary hook and must appear in TWO places:
  1. Subject line must include the school name — e.g. "Fellow Michigan Alum", "Michigan → Goldman", "Dartmouth Student Quick Question". The name must literally appear.
  2. Email opening must lead with the shared connection as the natural reason for reaching out — e.g. "I noticed you're a fellow Michigan alum", "As a fellow Wolverine", "I saw you went to Michigan — I'm a current junior there." It should feel like the reason they're writing, not a throwaway line.

OTHER SHARED BACKGROUND:
Check whether sender and recipient share clubs, student organizations, sports teams, Greek life, or hometown. If found:
  • Weave in after the university mention if one exists, or
  • Use as the opening hook if no shared university is present.

━━━ STEP 2: WRITE THE EMAIL ━━━

Hi [first name],

[Opening — 1 sentence]
Use the strongest hook from Step 1. If no shared background exists, open with one specific verifiable fact from their actual career history, firm, or education — stated plainly, no compliments, no "I came across your profile."

[Body — 2–3 sentences]
Genuine curiosity driven by the angle. Specific to what this person actually did — their real roles, firm, or career decisions. If a customNote was provided, weave it in here naturally only if it fits. Do not force it.

[Ask — 1 sentence]
Low-pressure. Acknowledge they're busy. Ask for 15 minutes.

Best,
[Sender first name]

━━━ RULES ━━━
- Under 120 words total
- Never invent details not in the profile
- NEVER use: "your journey", "truly impressive", "I hope this finds you well", "would greatly appreciate", "any insights you could share", "thank you for considering", "I look forward to", "extensive experience", "really resonated", "was impressed by", "which is fascinating", "that kind of dedication", "built a strong career", "I came across your profile"
- Never summarize their About section
- Never compliment a skill or trait directly
- Never force a shared background connection that doesn't actually exist in the data

Return ONLY this JSON:
{
  "subject": "subject line — if shared university found, must include school name; otherwise ≤8 words, specific, no recipient name",
  "body": "full email — \\n\\n between paragraphs, \\n between Best, and sender name",
  "hook": "one specific line: e.g. 'Shared Michigan — school in subject + opening', 'No shared school — opens with their Carlyle→Blackstone move', 'AFA connection woven into body per custom note'"
}`,
      }],
    });

    const raw    = completion.choices[0].message.content.replace(/```json|```/g, "").trim();
    const result = JSON.parse(raw);
    res.json(result);
  } catch (err) {
    console.error("[generate/email]", err);
    res.status(500).json({ error: "Email generation failed" });
  }
});

module.exports = router;
