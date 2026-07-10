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
    const value = line.slice(separator + 1).trim();
    const normalizedValue = value.replace(/^['"]|['"]$/g, "");
    process.env[key] = normalizedValue;
  }
}

applyEnvFile(".env.local");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = require("../src/server");
const request = require("supertest");
const { PrismaRateLimitStore } = require("../lib/server/rate-limit-store");

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const TEST_PREFIX = `test-${suffix}`;

async function cleanupPrefix(prefix) {
  await prisma.rateLimitEntry.deleteMany({
    where: { key: { startsWith: `${prefix}:` } },
  });
}

describe("PrismaRateLimitStore (unit)", () => {
  afterAll(async () => {
    await cleanupPrefix(TEST_PREFIX);
  });

  test("increment same key twice within window returns totalHits 1 then 2 with same resetTime", async () => {
    const store = new PrismaRateLimitStore({ prisma, prefix: TEST_PREFIX });
    store.init({ windowMs: 60 * 1000 });

    const key = `incr-${suffix}`;
    const first = await store.increment(key);
    expect(first.totalHits).toBe(1);

    const second = await store.increment(key);
    expect(second.totalHits).toBe(2);
    expect(second.resetTime.getTime()).toBe(first.resetTime.getTime());
  });

  test("increment resets an expired entry to totalHits 1 with a future resetTime", async () => {
    const store = new PrismaRateLimitStore({ prisma, prefix: TEST_PREFIX });
    store.init({ windowMs: 60 * 1000 });

    const key = `expired-${suffix}`;
    const fullKey = `${TEST_PREFIX}:${key}`;

    await prisma.rateLimitEntry.create({
      data: {
        key: fullKey,
        count: 5,
        expiresAt: new Date(Date.now() - 1000), // already expired
      },
    });

    const result = await store.increment(key);
    expect(result.totalHits).toBe(1);
    expect(result.resetTime.getTime()).toBeGreaterThan(Date.now());
  });

  test("decrement after two increments leaves count at 1 (read via Prisma)", async () => {
    const store = new PrismaRateLimitStore({ prisma, prefix: TEST_PREFIX });
    store.init({ windowMs: 60 * 1000 });

    const key = `decr-${suffix}`;
    const fullKey = `${TEST_PREFIX}:${key}`;

    await store.increment(key);
    await store.increment(key);
    await store.decrement(key);

    const row = await prisma.rateLimitEntry.findUnique({ where: { key: fullKey } });
    expect(row.count).toBe(1);
  });

  test("resetKey removes the row", async () => {
    const store = new PrismaRateLimitStore({ prisma, prefix: TEST_PREFIX });
    store.init({ windowMs: 60 * 1000 });

    const key = `reset-${suffix}`;
    const fullKey = `${TEST_PREFIX}:${key}`;

    await store.increment(key);
    await store.resetKey(key);

    const row = await prisma.rateLimitEntry.findUnique({ where: { key: fullKey } });
    expect(row).toBeNull();
  });

  test("persists across separate store instances (the serverless scenario)", async () => {
    const key = `shared-${suffix}`;

    const storeA = new PrismaRateLimitStore({ prisma, prefix: TEST_PREFIX });
    storeA.init({ windowMs: 60 * 1000 });
    const storeB = new PrismaRateLimitStore({ prisma, prefix: TEST_PREFIX });
    storeB.init({ windowMs: 60 * 1000 });

    const resultA = await storeA.increment(key);
    expect(resultA.totalHits).toBe(1);

    const resultB = await storeB.increment(key);
    expect(resultB.totalHits).toBe(2);
  });
});

describe("POST /api/auth/login rate limiting (integration)", () => {
  // NOTE: `trust proxy` is not configured on the Express app (confirmed by
  // inspection), so express-rate-limit's keyGenerator falls back to
  // req.ip / req.socket.remoteAddress regardless of X-Forwarded-For. In this
  // test environment (supertest against an in-process app) every request
  // shares the same loopback address, so no header is needed to get a
  // consistent rate-limit key across requests.
  const email = `nonexistent-${suffix}@example.com`;

  afterAll(async () => {
    await cleanupPrefix("auth");
  });

  test("21st failed login attempt from the same IP returns 429", async () => {
    let lastResponse;
    for (let i = 0; i < 21; i++) {
      lastResponse = await request(app)
        .post("/api/auth/login")
        .send({ email, password: "wrong-password" });
    }

    expect(lastResponse.statusCode).toBe(429);
    expect(lastResponse.body).toEqual({
      error: "Demasiados intentos. Intenta de nuevo en 15 minutos.",
    });
  });
});
