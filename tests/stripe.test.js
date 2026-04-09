const { loadEnvConfig } = require("@next/env");
const fs = require("fs");
const path = require("path");
loadEnvConfig(process.cwd(), true);

function applyEnvFile(fileName) {
  const envPath = path.join(process.cwd(), fileName);
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf("=");
    if (separator < 0) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] = value;
  }
}
applyEnvFile(".env.local");

const bcrypt = require("bcryptjs");
const request = require("supertest");
const { PrismaClient } = require("@prisma/client");
const { USER_ROLE } = require("../lib/user-roles");

const prisma = new PrismaClient();
const app = require("../src/server");

const suffix = `stripe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "TestPass123!";
const TEST_EMAIL = `stripe-user-${suffix}@example.com`;

// ─── Stripe mock ─────────────────────────────────────────────────────────────
// We mock stripe so tests never hit the real Stripe API
const MOCK_SESSION_ID = "cs_test_mock_session";
const MOCK_SESSION_URL = "https://checkout.stripe.com/mock";
const MOCK_CUSTOMER_ID = "cus_mock123";
const MOCK_SUB_ID = "sub_mock123";
const MOCK_PORTAL_URL = "https://billing.stripe.com/mock";

jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    customers: {
      create: jest.fn().mockResolvedValue({ id: MOCK_CUSTOMER_ID }),
    },
    checkout: {
      sessions: {
        create: jest.fn().mockResolvedValue({
          id: MOCK_SESSION_ID,
          url: MOCK_SESSION_URL,
        }),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn().mockResolvedValue({ url: MOCK_PORTAL_URL }),
      },
    },
    subscriptions: {
      update: jest.fn().mockResolvedValue({ id: MOCK_SUB_ID, cancel_at_period_end: true }),
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  }));
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function createUser(email, role = USER_ROLE.USER) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.create({
    data: { email, name: email.split("@")[0], passwordHash, role: role.toUpperCase() },
  });
}

async function login(email) {
  const res = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  return res.headers["set-cookie"]?.[0] || "";
}

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Stripe subscription endpoints", () => {
  let cookie;
  let userId;

  beforeAll(async () => {
    const user = await createUser(TEST_EMAIL);
    userId = user.id;
    cookie = await login(TEST_EMAIL);
  });

  afterAll(async () => {
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.$disconnect();
  });

  // ─── GET /api/subscription ───────────────────────────────────────────────
  describe("GET /api/subscription", () => {
    it("returns 401 without session", async () => {
      const res = await request(app).get("/api/subscription");
      expect(res.status).toBe(401);
    });

    it("returns FREE plan info for new user", async () => {
      const res = await request(app)
        .get("/api/subscription")
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.subscription.plan).toBe("FREE");
      expect(res.body.usage).toBeDefined();
      expect(res.body.limits).toBeDefined();
      expect(res.body.stripeEnabled).toBe(true); // env has STRIPE_SECRET_KEY
    });
  });

  // ─── GET /api/subscription/plans ─────────────────────────────────────────
  describe("GET /api/subscription/plans", () => {
    it("returns all plans with prices in MXN", async () => {
      const res = await request(app).get("/api/subscription/plans");
      expect(res.status).toBe(200);
      expect(res.body.plans).toHaveLength(4);

      const starter = res.body.plans.find((p) => p.plan === "STARTER");
      expect(starter.price).toBe(499);
      expect(starter.currency).toBe("MXN");

      const pro = res.body.plans.find((p) => p.plan === "PRO");
      expect(pro.price).toBe(1299);

      const agency = res.body.plans.find((p) => p.plan === "AGENCY");
      expect(agency.price).toBe(2999);
    });
  });

  // ─── POST /api/subscription/checkout ─────────────────────────────────────
  describe("POST /api/subscription/checkout", () => {
    it("returns 401 without session", async () => {
      const res = await request(app).post("/api/subscription/checkout").send({ plan: "STARTER" });
      expect(res.status).toBe(401);
    });

    it("returns 400 for FREE plan", async () => {
      const res = await request(app)
        .post("/api/subscription/checkout")
        .set("Cookie", cookie)
        .send({ plan: "FREE" });
      expect(res.status).toBe(400);
    });

    it("returns 400 for invalid plan", async () => {
      const res = await request(app)
        .post("/api/subscription/checkout")
        .set("Cookie", cookie)
        .send({ plan: "INVALID" });
      expect(res.status).toBe(400);
    });

    it("creates a Stripe checkout session for STARTER", async () => {
      const res = await request(app)
        .post("/api/subscription/checkout")
        .set("Cookie", cookie)
        .send({ plan: "STARTER" });
      expect(res.status).toBe(200);
      expect(res.body.url).toBe(MOCK_SESSION_URL);
      expect(res.body.sessionId).toBe(MOCK_SESSION_ID);
    });

    it("creates a Stripe checkout session for PRO", async () => {
      const res = await request(app)
        .post("/api/subscription/checkout")
        .set("Cookie", cookie)
        .send({ plan: "PRO" });
      expect(res.status).toBe(200);
      expect(res.body.url).toBe(MOCK_SESSION_URL);
    });
  });

  // ─── POST /api/subscription/portal ───────────────────────────────────────
  describe("POST /api/subscription/portal", () => {
    it("returns 401 without session", async () => {
      const res = await request(app).post("/api/subscription/portal");
      expect(res.status).toBe(401);
    });

    it("returns 400 when user has no stripeCustomerId", async () => {
      // New user has no Stripe customer yet
      await prisma.subscription.deleteMany({ where: { userId } });
      const res = await request(app)
        .post("/api/subscription/portal")
        .set("Cookie", cookie);
      expect(res.status).toBe(400);
    });

    it("returns portal URL when user has Stripe customer", async () => {
      // Seed a subscription with stripeCustomerId
      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: "STARTER",
          stripeCustomerId: MOCK_CUSTOMER_ID,
          stripeSubId: MOCK_SUB_ID,
          maxProjects: 5,
          maxPagesPerCrawl: 500,
          maxCrawlsPerMonth: 10,
          maxHistoryRuns: 10,
          features: ["excel_report"],
        },
        update: {
          stripeCustomerId: MOCK_CUSTOMER_ID,
          stripeSubId: MOCK_SUB_ID,
        },
      });

      const res = await request(app)
        .post("/api/subscription/portal")
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.url).toBe(MOCK_PORTAL_URL);
    });
  });

  // ─── POST /api/subscription/cancel ───────────────────────────────────────
  describe("POST /api/subscription/cancel", () => {
    it("returns 401 without session", async () => {
      const res = await request(app).post("/api/subscription/cancel");
      expect(res.status).toBe(401);
    });

    it("cancels subscription via Stripe when stripeSubId exists", async () => {
      const res = await request(app)
        .post("/api/subscription/cancel")
        .set("Cookie", cookie);
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/periodo de facturaci/);

      // DB should have cancelledAt set
      const sub = await prisma.subscription.findUnique({ where: { userId } });
      expect(sub.cancelledAt).not.toBeNull();
    });

    it("returns 400 when user is already on FREE", async () => {
      // Set to FREE first
      await prisma.subscription.update({
        where: { userId },
        data: { plan: "FREE", stripeSubId: null },
      });
      const res = await request(app)
        .post("/api/subscription/cancel")
        .set("Cookie", cookie);
      expect(res.status).toBe(400);
    });
  });

  // ─── POST /api/stripe/webhook ─────────────────────────────────────────────
  describe("POST /api/stripe/webhook", () => {
    const Stripe = require("stripe");

    // Reconfigure Stripe constructor so the new instance created per-request
    // has a constructEvent that returns the desired event payload.
    function makeWebhookRequest(eventType, data) {
      const eventPayload = { type: eventType, data: { object: data } };
      Stripe.mockImplementation(() => ({
        customers: { create: jest.fn().mockResolvedValue({ id: MOCK_CUSTOMER_ID }) },
        checkout: { sessions: { create: jest.fn().mockResolvedValue({ id: MOCK_SESSION_ID, url: MOCK_SESSION_URL }) } },
        billingPortal: { sessions: { create: jest.fn().mockResolvedValue({ url: MOCK_PORTAL_URL }) } },
        subscriptions: { update: jest.fn().mockResolvedValue({ id: MOCK_SUB_ID }) },
        webhooks: { constructEvent: jest.fn().mockReturnValue(eventPayload) },
      }));

      return request(app)
        .post("/api/stripe/webhook")
        .set("stripe-signature", "mock_sig")
        .set("Content-Type", "application/json")
        .send(Buffer.from(JSON.stringify(eventPayload)));
    }

    it("returns 400 with invalid signature", async () => {
      Stripe.mockImplementation(() => ({
        webhooks: {
          constructEvent: jest.fn().mockImplementation(() => {
            throw new Error("Invalid signature");
          }),
        },
      }));

      const res = await request(app)
        .post("/api/stripe/webhook")
        .set("stripe-signature", "bad_sig")
        .set("Content-Type", "application/json")
        .send(Buffer.from("{}"));
      expect(res.status).toBe(400);
    });

    it("handles checkout.session.completed and activates plan", async () => {
      // Reset subscription to FREE
      await prisma.subscription.upsert({
        where: { userId },
        create: { userId, plan: "FREE", maxProjects: 1, maxPagesPerCrawl: 50, maxCrawlsPerMonth: 2, maxHistoryRuns: 1, features: [] },
        update: { plan: "FREE", stripeSubId: null, cancelledAt: null },
      });

      const res = await makeWebhookRequest("checkout.session.completed", {
        customer: MOCK_CUSTOMER_ID,
        subscription: MOCK_SUB_ID,
        metadata: { userId, plan: "PRO" },
      });

      expect(res.status).toBe(200);
      expect(res.body.received).toBe(true);

      const sub = await prisma.subscription.findUnique({ where: { userId } });
      expect(sub.plan).toBe("PRO");
      expect(sub.stripeSubId).toBe(MOCK_SUB_ID);
      expect(sub.cancelledAt).toBeNull();
    });

    it("handles customer.subscription.updated — plan change via portal", async () => {
      // Set current sub to PRO
      await prisma.subscription.update({
        where: { userId },
        data: { plan: "PRO", stripeSubId: MOCK_SUB_ID, cancelledAt: null },
      });

      const starterPriceId = process.env.STRIPE_PRICE_STARTER;
      const res = await makeWebhookRequest("customer.subscription.updated", {
        id: MOCK_SUB_ID,
        status: "active",
        cancel_at_period_end: false,
        items: { data: [{ price: { id: starterPriceId } }] },
      });

      expect(res.status).toBe(200);
      const sub = await prisma.subscription.findUnique({ where: { userId } });
      expect(sub.plan).toBe("STARTER");
      expect(sub.cancelledAt).toBeNull();
    });

    it("handles customer.subscription.updated — cancel_at_period_end", async () => {
      await prisma.subscription.update({
        where: { userId },
        data: { plan: "STARTER", stripeSubId: MOCK_SUB_ID, cancelledAt: null },
      });

      const res = await makeWebhookRequest("customer.subscription.updated", {
        id: MOCK_SUB_ID,
        status: "active",
        cancel_at_period_end: true,
        items: { data: [{ price: { id: "price_unknown" } }] },
      });

      expect(res.status).toBe(200);
      const sub = await prisma.subscription.findUnique({ where: { userId } });
      expect(sub.cancelledAt).not.toBeNull();
    });

    it("handles customer.subscription.deleted — reverts to FREE", async () => {
      await prisma.subscription.update({
        where: { userId },
        data: { plan: "PRO", stripeSubId: MOCK_SUB_ID, cancelledAt: null },
      });

      const res = await makeWebhookRequest("customer.subscription.deleted", {
        id: MOCK_SUB_ID,
      });

      expect(res.status).toBe(200);
      const sub = await prisma.subscription.findUnique({ where: { userId } });
      expect(sub.plan).toBe("FREE");
      expect(sub.stripeSubId).toBeNull();
      expect(sub.cancelledAt).not.toBeNull();
    });
  });
});
