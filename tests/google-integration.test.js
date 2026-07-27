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
    process.env[key] = value.replace(/^['"]|['"]$/g, "");
  }
}

applyEnvFile(".env.local");

process.env.GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "test-google-client";
process.env.GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "test-google-secret";
process.env.GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "http://localhost/callback";

jest.mock("../lib/google-workspace", () => {
  const actual = jest.requireActual("../lib/google-workspace");
  return {
    ...actual,
    listSearchConsoleProperties: jest.fn(),
    listGa4Properties: jest.fn(),
    fetchSearchConsoleSnapshot: jest.fn(),
    fetchGa4Snapshot: jest.fn(),
  };
});

const {
  listSearchConsoleProperties,
  listGa4Properties,
  fetchSearchConsoleSnapshot,
  fetchGa4Snapshot,
} = require("../lib/google-workspace");
const { PrismaClient } = require("@prisma/client");
const { encryptSecret } = require("../lib/secret-crypto");
const bcrypt = require("bcryptjs");
const request = require("supertest");
const prisma = new PrismaClient();
const app = require("../src/server");

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "TestPass123!";
const email = `google-${suffix}@example.com`;

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
  const response = await request(app).post("/api/auth/login").send({ email, password: PASSWORD });
  return response.headers["set-cookie"]?.[0] || "";
}

describe("Google integration endpoints", () => {
  let cookie;
  let user;
  let project;
  let googleConnection;

  beforeAll(async () => {
    user = await createUser();
    project = await prisma.project.create({
      data: {
        userId: user.id,
        name: "Google Project",
        targetUrl: "https://example.com",
      },
    });
    googleConnection = await prisma.googleDriveConnection.create({
      data: {
        userId: user.id,
        email: user.email,
        encryptedRefreshToken: encryptSecret("refresh-token"),
        encryptedAccessToken: encryptSecret("access-token"),
        scopes: [
          "https://www.googleapis.com/auth/webmasters.readonly",
          "https://www.googleapis.com/auth/analytics.readonly",
        ],
        status: "connected",
        lastSyncAt: new Date(),
      },
    });
    cookie = await login();
  });

  afterAll(async () => {
    await prisma.crawlAlert.deleteMany({ where: { projectId: project?.id } });
    await prisma.googleInsightSnapshot.deleteMany({ where: { projectId: project?.id } });
    await prisma.projectGoogleBinding.deleteMany({ where: { projectId: project?.id } });
    await prisma.googleDriveConnection.deleteMany({ where: { userId: user?.id } });
    await prisma.project.deleteMany({ where: { id: project?.id } });
    await prisma.user.deleteMany({ where: { id: user?.id } });
    await prisma.$disconnect();
  });

  test("connect route includes Search Console and GA4 scopes", async () => {
    const response = await request(app)
      .get("/api/google/connect")
      .set("Cookie", cookie);

    expect(response.statusCode).toBe(200);
    const authUrl = new URL(response.body.authUrl);
    const scopes = decodeURIComponent(authUrl.searchParams.get("scope") || "");
    expect(scopes).toContain("webmasters.readonly");
    expect(scopes).toContain("analytics.readonly");
  });

  test("lists properties and saves a binding", async () => {
    listSearchConsoleProperties.mockResolvedValue([
      { property: "https://example.com/", permissionLevel: "siteOwner" },
    ]);
    listGa4Properties.mockResolvedValue([
      { propertyId: "123456789", displayName: "GA4 Property", accountDisplayName: "Main" },
    ]);

    const getRes = await request(app)
      .get(`/api/projects/${project.id}/google-integration`)
      .set("Cookie", cookie);

    expect(getRes.statusCode).toBe(200);
    expect(getRes.body.availableProperties.searchConsole).toHaveLength(1);
    expect(getRes.body.availableProperties.ga4).toHaveLength(1);

    const putRes = await request(app)
      .put(`/api/projects/${project.id}/google-integration`)
      .set("Cookie", cookie)
      .send({
        searchConsoleProperty: "https://example.com/",
        ga4PropertyId: "properties/123456789",
      });

    expect(putRes.statusCode).toBe(200);
    expect(putRes.body.binding.searchConsoleProperty).toBe("https://example.com/");
    expect(putRes.body.binding.ga4PropertyId).toBe("123456789");
  });

  test("sync saves snapshots and creates regression alerts on later drops", async () => {
    fetchSearchConsoleSnapshot
      .mockResolvedValueOnce({
        summary: { clicks: 120, impressions: 1200, ctr: 0.1, position: 8.4 },
        topQueries: [{ query: "seo", clicks: 80, impressions: 800, ctr: 0.1, position: 8 }],
        topPages: [{ page: "https://example.com/", clicks: 40, impressions: 400, ctr: 0.1, position: 7 }],
      })
      .mockResolvedValueOnce({
        summary: { clicks: 60, impressions: 600, ctr: 0.05, position: 10.2 },
        topQueries: [{ query: "seo", clicks: 30, impressions: 300, ctr: 0.1, position: 9 }],
        topPages: [{ page: "https://example.com/", clicks: 20, impressions: 200, ctr: 0.1, position: 8 }],
      });
    fetchGa4Snapshot
      .mockResolvedValueOnce({
        summary: { sessions: 220, users: 180, conversions: 20 },
        landingPages: [{ landingPage: "/", sessions: 120, users: 100, conversions: 8 }],
        sourceMedium: [{ sourceMedium: "google / organic", sessions: 150, users: 120, conversions: 9 }],
      })
      .mockResolvedValueOnce({
        summary: { sessions: 90, users: 70, conversions: 4 },
        landingPages: [{ landingPage: "/", sessions: 45, users: 35, conversions: 2 }],
        sourceMedium: [{ sourceMedium: "google / organic", sessions: 60, users: 45, conversions: 3 }],
      });

    const firstSync = await request(app)
      .post(`/api/projects/${project.id}/google-integration/sync`)
      .set("Cookie", cookie);
    expect(firstSync.statusCode).toBe(200);

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.googleInsightSnapshot.updateMany({
      where: { projectId: project.id },
      data: { snapshotDate: yesterday },
    });

    const secondSync = await request(app)
      .post(`/api/projects/${project.id}/google-integration/sync`)
      .set("Cookie", cookie);
    expect(secondSync.statusCode).toBe(200);

    const binding = await prisma.projectGoogleBinding.findUnique({
      where: { projectId: project.id },
    });
    expect(binding.lastSyncAt).toBeTruthy();

    const snapshots = await prisma.googleInsightSnapshot.findMany({
      where: { projectId: project.id },
      orderBy: { snapshotDate: "asc" },
    });
    expect(snapshots).toHaveLength(4);

    const alerts = await prisma.crawlAlert.findMany({
      where: { projectId: project.id, type: { startsWith: "google_" } },
    });
    expect(alerts.length).toBeGreaterThan(0);
  });
});
