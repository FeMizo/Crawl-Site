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
const bcrypt = require("bcryptjs");
const request = require("supertest");

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "TestPass123!";
const email = `schedule-${suffix}@example.com`;

async function createUser() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.create({
    data: {
      email,
      name: email.split("@")[0],
      passwordHash,
      role: "EDITOR",
      emailVerified: true,
    },
  });
}

async function login() {
  const response = await request(app).post("/api/auth/login").send({
    email,
    password: PASSWORD,
  });

  return {
    response,
    cookie: response.headers["set-cookie"]?.[0] || "",
  };
}

describe("GET/PUT /api/projects/:projectId/schedule", () => {
  let cookie;
  let user;
  let project;
  let subscription;

  beforeAll(async () => {
    user = await createUser();
    subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        plan: "PRO",
        maxProjects: 20,
        maxPagesPerCrawl: 2000,
        maxCrawlsPerMonth: 999,
        maxHistoryRuns: 50,
        features: ["scheduled_crawl"],
      },
      update: {
        plan: "PRO",
        features: ["scheduled_crawl"],
      },
    });
    project = await prisma.project.create({
      data: {
        userId: user.id,
        name: "Schedule Project",
        targetUrl: "https://example.com",
      },
    });
    const auth = await login();
    cookie = auth.cookie;
  });

  afterAll(async () => {
    await prisma.project.deleteMany({ where: { id: project?.id } });
    await prisma.subscription.deleteMany({ where: { id: subscription?.id } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  test("GET returns null when the project has no schedule", async () => {
    const res = await request(app)
      .get(`/api/projects/${project.id}/schedule`)
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.schedule).toBeNull();
  });

  test("PUT creates a schedule and computes the next run", async () => {
    const res = await request(app)
      .put(`/api/projects/${project.id}/schedule`)
      .set("Cookie", cookie)
      .send({
        enabled: true,
        frequency: "daily",
        maxPages: 120,
        renderMode: "auto",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.schedule.frequency).toBe("daily");
    expect(res.body.schedule.maxPages).toBe(120);
    expect(res.body.schedule.enabled).toBe(true);
    expect(new Date(res.body.schedule.nextRunAt).getTime()).toBeGreaterThan(Date.now());
  });
});
