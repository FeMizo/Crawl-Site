const { loadEnvConfig } = require("@next/env");
const fs = require("fs");
const path = require("path");
loadEnvConfig(process.cwd(), true);
const bcrypt = require("bcryptjs");
const request = require("supertest");

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
const { USER_ROLE } = require("../lib/user-roles");

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "TestPass123!";

const emails = {
  owner: `owner-${suffix}@example.com`,
  superAdmin: `super-${suffix}@example.com`,
  admin: `admin-${suffix}@example.com`,
  editor: `editor-${suffix}@example.com`,
  user: `user-${suffix}@example.com`,
  target: `target-${suffix}@example.com`,
  login: `login-${suffix}@example.com`,
};

async function createUser(email, role = USER_ROLE.USER) {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.create({
    data: {
      email,
      name: email.split("@")[0],
      passwordHash,
      role: role.toUpperCase(),
    },
  });
}

async function login(email, password = PASSWORD) {
  const response = await request(app).post("/api/auth/login").send({
    email,
    password,
  });

  return {
    response,
    cookie: response.headers["set-cookie"]?.[0] || "",
  };
}

describe("Basic server, auth and role validations", () => {
  beforeAll(async () => {
    process.env.OWNER_EMAILS = `${emails.owner},femiss0693@gmail.com`;

    await createUser(emails.owner, USER_ROLE.SUPER_ADMIN);
    await createUser(emails.superAdmin, USER_ROLE.SUPER_ADMIN);
    await createUser(emails.admin, USER_ROLE.ADMIN);
    await createUser(emails.editor, USER_ROLE.EDITOR);
    await createUser(emails.user, USER_ROLE.USER);
    await createUser(emails.target, USER_ROLE.USER);
    await createUser(emails.login, USER_ROLE.USER);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: Object.values(emails),
        },
      },
    });
    await prisma.$disconnect();
  });

  test("GET / should return 200", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
  });

  test("POST /api/auth/register missing fields returns 400", async () => {
    const res = await request(app).post("/api/auth/register").send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("POST /api/auth/register invalid email returns 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "correo-invalido",
      password: "12345678",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email valido/i);
  });

  test("POST /api/auth/register invalid phone returns 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "test@example.com",
      password: "12345678",
      phoneCountry: "MX",
      phoneNumber: "1234",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/telefono/i);
  });

  test("POST /api/auth/login succeeds with valid credentials", async () => {
    const { response } = await login(emails.login);
    expect(response.statusCode).toBe(200);
    expect(response.body.user.email).toBe(emails.login);
    expect(response.body.user.role).toBe(USER_ROLE.USER);
  });

  test("POST /api/auth/login rejects invalid credentials", async () => {
    const { response } = await login(emails.login, "wrong-password");
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toMatch(/credenciales invalidas/i);
  });

  test("super_admin can assign admin but not owner", async () => {
    const { cookie } = await login(emails.superAdmin);

    const promoteToAdmin = await request(app)
      .put(`/api/admin/users/${(await prisma.user.findUnique({ where: { email: emails.target } })).id}/role`)
      .set("Cookie", cookie)
      .send({ role: USER_ROLE.ADMIN });

    expect(promoteToAdmin.statusCode).toBe(200);
    expect(promoteToAdmin.body.user.assignedRole).toBe(USER_ROLE.ADMIN);

    const promoteToOwner = await request(app)
      .put(`/api/admin/users/${promoteToAdmin.body.user.id}/role`)
      .set("Cookie", cookie)
      .send({ role: USER_ROLE.OWNER });

    expect(promoteToOwner.statusCode).toBe(403);
    expect(promoteToOwner.body.error).toMatch(/asignar ese rol|owner/i);
  });

  test("normal user cannot elevate privileges", async () => {
    const targetUser = await prisma.user.findUnique({
      where: { email: emails.editor },
    });
    const { cookie } = await login(emails.user);

    const response = await request(app)
      .put(`/api/admin/users/${targetUser.id}/role`)
      .set("Cookie", cookie)
      .send({ role: USER_ROLE.ADMIN });

    expect(response.statusCode).toBe(403);
    expect(response.body.error).toMatch(/permisos/i);
  });

  test("owner role is effective for allowlisted email and cannot be reassigned by super_admin", async () => {
    const ownerUser = await prisma.user.findUnique({
      where: { email: emails.owner },
    });
    const { response: ownerLogin } = await login(emails.owner);
    expect(ownerLogin.statusCode).toBe(200);
    expect(ownerLogin.body.user.role).toBe(USER_ROLE.OWNER);

    const { cookie } = await login(emails.superAdmin);
    const updateOwner = await request(app)
      .put(`/api/admin/users/${ownerUser.id}/role`)
      .set("Cookie", cookie)
      .send({ role: USER_ROLE.USER });

    expect(updateOwner.statusCode).toBe(403);
    expect(updateOwner.body.error).toMatch(/owner|permisos/i);
  });
});
