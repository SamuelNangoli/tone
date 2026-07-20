// Seeds a realistic demo workspace: demo@tone.app / demo1234
const { PrismaClient } = require("@prisma/client");
const { createClient } = require("@supabase/supabase-js");

const db = new PrismaClient();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY — set them in .env before seeding."
  );
  process.exit(1);
}
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/** Creates (or reuses) a Supabase auth user and returns its id. */
async function ensureAuthUser(email, password) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (!error) return data.user.id;
  if (!/already registered/i.test(error.message)) throw error;

  // Already exists — look it up (Admin API has no getUserByEmail helper).
  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) throw listError;
  const found = list.users.find((u) => u.email === email);
  if (!found) throw new Error(`Could not find existing Supabase user for ${email}`);
  return found.id;
}

const BLOG_SAMPLE = `Why "just add a dashboard" is how good products die

Every B2B product eventually hears it: "customers are asking for a dashboard." And every team that says yes without asking why ends up shipping a wall of charts nobody opens twice.

Here's the uncomfortable part: dashboards are usually a symptom. When users ask to "see everything," what they're really saying is "I don't trust the product to tell me when something matters." The fix isn't more pixels — it's better defaults, sharper alerts, and one number that actually maps to their job.

We killed our dashboard roadmap last year. Support tickets about "visibility" dropped 40%. Turns out people didn't want to look at the product more. They wanted to look at it less, with more confidence.`;

const LINKEDIN_SAMPLE = `Hot take after 200 customer calls this year:

Nobody churns because of missing features.

They churn because week 2 felt like homework.

Onboarding isn't a checklist — it's the product's first promise. If activation takes a meeting, a CSV import, and a prayer, the feature gap was never your problem.

We rebuilt our first-run experience 3 times before it clicked. The version that worked was the one that did LESS.`;

const EMAIL_SAMPLE = `Subject: You're 10 minutes from your first automated report

Hi Sam,

You connected your data yesterday — nice. The next step is the one people tell us actually changed their week: your first automated report.

Pick a metric, pick a channel, hit schedule. That's it. Monday mornings stop starting with a spreadsheet.

If anything feels clunky, reply and a human (me) reads it.

— Maya at Northbeam Analytics`;

async function main() {
  const existing = await db.user.findUnique({ where: { email: "demo@tone.app" } });
  if (existing) {
    console.log("Seed already applied — skipping.");
    return;
  }

  const mayaAuthId = await ensureAuthUser("demo@tone.app", "demo1234");
  const user = await db.user.create({
    data: {
      id: mayaAuthId,
      name: "Maya Chen",
      email: "demo@tone.app",
      prefs: JSON.stringify({ theme: "system", density: "comfortable" }),
    },
  });

  const workspace = await db.workspace.create({
    data: {
      name: "Northbeam Analytics",
      slug: "northbeam-analytics",
      industry: "B2B SaaS",
      accentColor: "#6366f1",
      memberships: { create: { userId: user.id, role: "owner" } },
    },
  });

  const jordanAuthId = await ensureAuthUser("jordan@northbeam.app", "demo1234");
  const editor = await db.user.create({
    data: {
      id: jordanAuthId,
      name: "Jordan Reyes",
      email: "jordan@northbeam.app",
    },
  });
  await db.membership.create({
    data: { userId: editor.id, workspaceId: workspace.id, role: "editor" },
  });

  const blogProfile = await db.voiceProfile.create({
    data: {
      workspaceId: workspace.id,
      name: "Company blog",
      description: "Long-form thought leadership — opinionated but earned.",
      // Matches computeAccuracy for 2 samples + quiz + website + the 11
      // feedback rows created below (8 positive).
      accuracy: 71,
      generationCount: 24,
      feedbackCount: 11,
      data: JSON.stringify({
        sliders: { formality: 55, boldness: 70, detail: 65 },
        doWords: ["ship", "signal", "compounding"],
        dontWords: ["synergy", "leverage", "delve", "game-changer"],
        audience: "Heads of Product and RevOps at 50-500 person SaaS companies",
        competitors: ["Amplitude", "Mixpanel", "Heap"],
        websiteUrl: "https://northbeam.app",
        traits: ["opinionated", "evidence-first", "dry humor", "concrete"],
      }),
      samples: {
        create: [
          { title: "Why dashboards die", content: BLOG_SAMPLE },
          { title: "Onboarding hot take", content: LINKEDIN_SAMPLE },
        ],
      },
    },
  });

  // Real feedback rows so the accuracy score survives recomputation.
  await db.feedback.createMany({
    data: Array.from({ length: 11 }, (_, i) => ({
      profileId: blogProfile.id,
      rating: i < 8 ? "up" : "down",
      note: i === 0 ? "Nailed the dry humor" : "",
    })),
  });

  const linkedinProfile = await db.voiceProfile.create({
    data: {
      workspaceId: workspace.id,
      name: "Founder LinkedIn",
      description: "Maya's personal feed — punchier, first person.",
      accuracy: 60,
      generationCount: 9,
      feedbackCount: 4,
      data: JSON.stringify({
        sliders: { formality: 75, boldness: 80, detail: 30 },
        doWords: ["honestly", "shipped"],
        dontWords: ["thrilled to announce", "humbled"],
        audience: "SaaS founders and operators",
        competitors: [],
        websiteUrl: "https://northbeam.app",
        traits: ["punchy", "first-person", "contrarian", "short lines"],
      }),
      samples: { create: [{ title: "Churn take", content: LINKEDIN_SAMPLE }] },
    },
  });
  await db.feedback.createMany({
    data: Array.from({ length: 4 }, (_, i) => ({
      profileId: linkedinProfile.id,
      rating: i < 3 ? "up" : "down",
    })),
  });

  const emailProfile = await db.voiceProfile.create({
    data: {
      workspaceId: workspace.id,
      name: "Lifecycle email",
      description: "Onboarding and activation emails — warm, human, brief.",
      accuracy: 59,
      generationCount: 5,
      feedbackCount: 2,
      data: JSON.stringify({
        sliders: { formality: 70, boldness: 40, detail: 35 },
        doWords: ["you", "minutes"],
        dontWords: ["valued customer", "don't hesitate"],
        audience: "New trial users in their first 14 days",
        competitors: [],
        websiteUrl: "https://northbeam.app",
        traits: ["warm", "human", "brief", "second-person"],
      }),
      samples: { create: [{ title: "Activation nudge", content: EMAIL_SAMPLE }] },
    },
  });
  await db.feedback.createMany({
    data: [
      { profileId: emailProfile.id, rating: "up" },
      { profileId: emailProfile.id, rating: "up" },
    ],
  });

  await db.draft.createMany({
    data: [
      {
        workspaceId: workspace.id,
        profileId: blogProfile.id,
        authorId: user.id,
        title: "The hidden cost of 'quick' integrations",
        contentType: "blog",
        brief: "Why one-off integrations quietly become the biggest tax on a product team",
        content:
          "The hidden cost of 'quick' integrations: what the best teams do differently\n\nEvery 'two-day' integration is a ten-year commitment wearing a disguise.\n\n## Why this keeps happening\nSales needs the logo. The prospect needs the connector. Two days later it works — and now it's yours forever.\n\n## The pattern that works\nTreat integrations as products with owners, SLAs, and a deprecation path. If nobody will own it in year two, don't build it in year one.\n\n## Where to start\nAudit what you have. The signal is compounding: every integration you kill funds one you'll be proud to ship.",
        status: "approved",
      },
      {
        workspaceId: workspace.id,
        profileId: blogProfile.id,
        authorId: user.id,
        title: "Q3 launch post — activation metrics",
        contentType: "linkedin",
        brief: "Announce the new activation metrics feature without sounding like a press release",
        content:
          "We shipped activation metrics today.\n\nNot because dashboards are exciting — because guessing isn't.\n\nEvery team we talked to had a 'north star' they couldn't actually measure. Now the number updates itself, and Monday standups start with signal instead of vibes.\n\nHonestly? Took us longer than it should have. Worth it.",
        status: "published",
      },
    ],
  });

  console.log("Seeded demo workspace: demo@tone.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
