const express = require("express");
const OpenAI  = require("openai");

const router = express.Router();

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ─── Angle registry ───────────────────────────────────────────────────────────
const ANGLE_DESCRIPTIONS = {
  breaking_in:       "How they broke into finance and their advice for someone trying to do the same",
  firm_strategy:     "Their firm's deals, strategy, or focus area — only reference deals or strategy explicitly mentioned in the recipient's profile or that are publicly known facts about the firm; never invent specific deals",
  career_transition: "A specific career move they made — between roles, firms, or fields — and what drove that decision",
};

// ─── Sender block ─────────────────────────────────────────────────────────────
// Uses recruiting_stage and target_areas. Does not include goal or target_role.
function buildSenderBlock(u, angleKey, customNote) {
  const stage       = u.recruiting_stage || "not provided";
  const targetAreas = u.target_areas     || "not provided";
  const angle       = ANGLE_DESCRIPTIONS[angleKey] || "not provided";
  const note        = customNote         || "none";
  const resume      = u.attach_resume    ? "true" : "false";

  return [
    `SENDER DATA:`,
    `- Full name: ${u.name     || "not provided"}`,
    `- School: ${u.school      || "not provided"}`,
    `- Year: ${u.year          || "not provided"}`,
    `- Major: ${u.major        || "not provided"}`,
    `- Hometown: ${u.hometown  || "not provided"}`,
    `- Activities & clubs: ${u.activities || "not provided"}`,
    `- Recruiting stage: ${stage}`,
    `- Target areas: ${targetAreas}`,
    `- Selected angle: ${angle}`,
    `- Custom note: ${note}`,
    `- Attach resume: ${resume}`,
  ].join("\n");
}

// ─── Recipient block ──────────────────────────────────────────────────────────
// Wraps the raw scraped LinkedIn string in a strict labeled template so GPT
// is forced to populate each field from verified data only.
function buildRecipientBlock(profileData) {
  return `\
RAW SCRAPED LINKEDIN DATA — read this carefully before filling in the block below:
${profileData}

RECIPIENT DATA — populate each field using ONLY what is explicitly stated in the raw data above.
If a field is not clearly and explicitly present, write NOT AVAILABLE. Do not infer, invent, or assume.
- Full name: [extract from data]
- Current role: [job title — only if explicitly present, otherwise: NOT AVAILABLE]
- Current firm: [employer — only if explicitly present, otherwise: NOT AVAILABLE]
- Previous roles: [list of previous titles and firms from experience — only what is explicitly present, otherwise: NOT AVAILABLE]
- Education: [schools attended — only what is explicitly in education data, otherwise: NOT AVAILABLE]
- Location: [city/region — only if explicitly present, otherwise: NOT AVAILABLE]
- About section: [verbatim if present, otherwise: NOT AVAILABLE]

Any field marked NOT AVAILABLE must never be referenced, implied, or compensated for in the email.
If a field is NOT AVAILABLE, act as if that information does not exist.`;
}

// ─── CTA calibration ──────────────────────────────────────────────────────────
function ctaInstruction(u) {
  const stage = (u.recruiting_stage || "").toLowerCase();
  const areas = u.target_areas ? ` about ${u.target_areas} recruiting` : "";

  if (stage.includes("building early connections") || stage.includes("exploring")) {
    return `Ask (soft): express genuine curiosity and close with something like "would love to hear your perspective if you ever have a few minutes." No pressure, no job ask.`;
  }
  if (stage.includes("actively looking for any relevant")) {
    return `Ask (warm): slightly more direct — "would love to connect and learn more about your path" — keep it relational, not transactional.`;
  }
  if (stage.includes("sophomore") || stage.includes("junior") || stage.includes("senior")) {
    return `Ask (direct): reference their target areas explicitly — "would love to find time for a quick call${areas} if you're open to it."`;
  }
  // Default fallback
  return `Ask: close with a low-pressure ask for a quick call. Acknowledge they're busy.`;
}

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

${buildSenderBlock(userProfile, null, null)}

${buildRecipientBlock(profileData)}

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
// Body: { profileData: string, userProfile: object, targetingAngle: string, customNote: string }
// Returns: { subject, body }
router.post("/email", async (req, res) => {
  const { profileData, userProfile, targetingAngle, customNote } = req.body;

  if (!profileData || !userProfile) {
    return res.status(400).json({ error: "profileData and userProfile are required" });
  }

  const angleKey = targetingAngle && ANGLE_DESCRIPTIONS[targetingAngle] ? targetingAngle : "breaking_in";

  const resumeRule = userProfile.attach_resume
    ? `RESUME: The sender is attaching their resume. Include exactly one natural mention — e.g. "I've attached my resume for reference" — placed where it fits. Do not force it at the end.`
    : `RESUME: attach_resume is false. Do NOT mention a resume anywhere in the email under any circumstances.`;

  const customNoteRule = customNote
    ? `CUSTOM NOTE: "${customNote}" — weave this in naturally in the body if it fits. It is supplementary; never let it override the angle.`
    : `CUSTOM NOTE: none provided.`;

  const ctaRule = ctaInstruction(userProfile);

  try {
    const openai = getOpenAI();

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [{
        role: "user",
        content: `CRITICAL RULES — NON-NEGOTIABLE. Violating any of these is a failure:
1. Only reference facts explicitly listed in the RECIPIENT DATA block. Never invent or infer details.
2. Do not reference a school the recipient attended unless it is explicitly listed in their education data.
3. Do not reference a firm unless it is explicitly listed as their current or previous employer.
4. Do not imply shared experiences unless that connection is explicitly verified in both the sender's profile and the recipient's data.
5. If a field is marked NOT AVAILABLE, do not mention it, imply it, or compensate by guessing around it.
6. If there is limited genuine overlap between sender and recipient, write a shorter and more honest cold outreach email. Do not fabricate connections.
7. Never summarize the recipient's About section back to them.
8. Never mention how long the sender has been interested in finance or any personal backstory beyond their current school, year, and major.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildRecipientBlock(profileData)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${buildSenderBlock(userProfile, angleKey, customNote)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 1 — VERIFY SHARED BACKGROUND (do this silently before writing anything):
- Does the sender's school exactly match any school in the recipient's education data? If yes → shared university confirmed.
- Do any of the sender's activities or clubs match any organization in the recipient's profile? If yes → shared org confirmed.
- Does the sender's hometown match the recipient's location? If yes → shared location noted.
Only use a connection if it is confirmed here. If nothing is confirmed, do not force one.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STEP 2 — WRITE THE EMAIL using this exact structure:

1. Greeting: Hi [recipient first name only],
   — Never use Mr. or Ms. Regardless of seniority, always use first name only.

2. Intro (1 sentence): "My name is [sender full name], and I'm a [year] at [school] studying [major]."
   — Use the exact school name and major from SENDER DATA. Never hardcode Michigan or Business Administration.

3. Hook (1 sentence): The single strongest verified connection from Step 1, stated plainly.
   — If shared university confirmed: lead with that — e.g. "I noticed you went to [School] too" or "I saw you're a [School] alum."
   — If no shared university: one specific, verified observation about the recipient's career based ONLY on confirmed RECIPIENT DATA — their actual role, firm, or career path. If no strong hook exists, use a brief honest reason for reaching out based on their field or role.
   — Never invent a hook. Never compliment a trait directly.

4. Body (1–2 sentences): Genuine curiosity driven by the selected angle. Specific to what this person actually did. ${customNoteRule}

5. ${ctaRule}

6. ${resumeRule}

7. Sign-off: Best,\\n[sender full name]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUBJECT LINE RULES:
- If shared university confirmed: "[School Name] Student Reaching Out" or "[School Name] Student Interested in [Recipient's Firm or Field]" — e.g. "Michigan Ross Student Interested in IB at Goldman Sachs"
- If no shared university: "[Sender School] Student Interested in [Recipient's Field or Firm]"
- Never say "Fellow Alum" — the sender is a current student, not an alum.
- Never use "Quick Question" or any vague filler subject line.
- Only reference firms or schools that are verified in the data.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HARD LIMITS:
- Under 120 words total (body only, excluding subject and sign-off)
- Email must sound like a real human wrote it — not AI, not a template

BANNED PHRASES — do not use any of these under any circumstances:
"your journey", "truly impressive", "your impressive background",
"I came across your profile and was impressed", "I would greatly appreciate",
"thank you for considering", "I hope this email finds you well",
"I hope this note finds you well", "which aligns with my goals",
"which aligns perfectly", "I noticed you also" (unless the shared connection is explicitly verified),
"extensive experience", "really resonated", "built a strong career",
"any insights you could share", "I look forward to", "which is fascinating",
"15 minutes" or any specific time duration for the ask,
any phrase that summarizes the recipient's About section,
any phrase that invents a specific deal, project, or initiative not in the data,
em dashes (—) in any form — rewrite any sentence that would use one to avoid it entirely; use a period, comma, or restructure the sentence instead

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Return ONLY this JSON:
{
  "subject": "subject line per the rules above",
  "body": "full email — \\n\\n between paragraphs, \\n between Best, and sender name"
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
