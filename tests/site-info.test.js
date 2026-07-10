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
const email = `site-info-${suffix}@example.com`;

async function createUser() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.create({
    data: {
      email,
      name: email.split("@")[0],
      passwordHash,
      role: "USER",
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

describe("GET /api/site-info SSRF guard", () => {
  let cookie;

  beforeAll(async () => {
    await createUser();
    const { cookie: authCookie } = await login();
    cookie = authCookie;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
  });

  test("rejects localhost URL with 400 and URL no permitida", async () => {
    const res = await request(app)
      .get("/api/site-info")
      .set("Cookie", cookie)
      .query({ url: "http://localhost:3000" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "URL no permitida" });
  });

  test("rejects 127.0.0.1 URL with 400 and URL no permitida", async () => {
    const res = await request(app)
      .get("/api/site-info")
      .set("Cookie", cookie)
      .query({ url: "http://127.0.0.1/admin" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "URL no permitida" });
  });

  test("rejects private-range IP URL with 400 and URL no permitida", async () => {
    const res = await request(app)
      .get("/api/site-info")
      .set("Cookie", cookie)
      .query({ url: "http://10.0.0.1/" });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "URL no permitida" });
  });

  test("returns 400 URL requerida when no url param is provided", async () => {
    const res = await request(app).get("/api/site-info").set("Cookie", cookie);

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "URL requerida" });
  });

  test("requires authentication (401 without cookie)", async () => {
    const res = await request(app)
      .get("/api/site-info")
      .query({ url: "https://example.com" });

    expect(res.statusCode).toBe(401);
  });
});
