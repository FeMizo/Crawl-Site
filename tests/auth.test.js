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
const { USER_ROLE } = require("../lib/user-roles");

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "TestPass123!";

const emails = {
  // Role permission tests
  owner: `owner-${suffix}@example.com`,
  superAdmin: `super-${suffix}@example.com`,
  admin: `admin-${suffix}@example.com`,
  editor: `editor-${suffix}@example.com`,
  user: `user-${suffix}@example.com`,
  target: `target-${suffix}@example.com`,
  login: `login-${suffix}@example.com`,
  // Auth endpoint tests
  me: `me-${suffix}@example.com`,
  profile: `profile-${suffix}@example.com`,
  password: `password-${suffix}@example.com`,
  forgot: `forgot-${suffix}@example.com`,
  reset: `reset-${suffix}@example.com`,
  // Register tests (created via API, cleaned up by email pattern)
  registerCleanup: `register-`,
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

const bcrypt = require("bcryptjs");
const request = require("supertest");

// ─── Existing: server health + role validations ──────────────────────────────

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
          in: [
            emails.owner,
            emails.superAdmin,
            emails.admin,
            emails.editor,
            emails.user,
            emails.target,
            emails.login,
          ],
        },
      },
    });
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

// ─── Auth endpoints: register ─────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  const created = [];

  afterAll(async () => {
    if (created.length) {
      await prisma.user.deleteMany({ where: { email: { in: created } } });
    }
  });

  test("short password returns 400", async () => {
    const res = await request(app).post("/api/auth/register").send({
      email: "short@example.com",
      password: "1234567",
    });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/8 caracteres/i);
  });

  test("successful registration returns 201, user data and sets cookie", async () => {
    const email = `register-ok-${suffix}@example.com`;
    created.push(email);

    const res = await request(app).post("/api/auth/register").send({
      email,
      password: PASSWORD,
      name: "Test User",
    });

    expect(res.statusCode).toBe(201);
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.role).toBe(USER_ROLE.USER);
    expect(res.body.user.passwordHash).toBeUndefined();
    const cookie = res.headers["set-cookie"]?.[0] || "";
    expect(cookie).toMatch(/auth_token/);
  });

  test("duplicate email returns 409", async () => {
    const email = `register-dup-${suffix}@example.com`;
    created.push(email);

    await request(app).post("/api/auth/register").send({ email, password: PASSWORD });

    const res = await request(app).post("/api/auth/register").send({ email, password: PASSWORD });
    expect(res.statusCode).toBe(409);
    expect(res.body.error).toMatch(/ya esta registrado/i);
  });
});

// ─── Auth endpoints: login ────────────────────────────────────────────────────

describe("POST /api/auth/login", () => {
  const email = `login2-${suffix}@example.com`;

  beforeAll(() => createUser(email));
  afterAll(() => prisma.user.deleteMany({ where: { email: { in: [email] } } }));

  test("non-existent email returns 401", async () => {
    const { response } = await login(`nobody-${suffix}@example.com`);
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toMatch(/credenciales invalidas/i);
  });

  test("sets httpOnly auth_token cookie on success", async () => {
    const { response } = await login(email);
    expect(response.statusCode).toBe(200);
    const cookie = response.headers["set-cookie"]?.[0] || "";
    expect(cookie).toMatch(/auth_token/);
    expect(cookie).toMatch(/HttpOnly/i);
  });

  test("does not return passwordHash in response", async () => {
    const { response } = await login(email);
    expect(response.body.user.passwordHash).toBeUndefined();
  });
});

// ─── Auth endpoints: logout ───────────────────────────────────────────────────

describe("POST /api/auth/logout", () => {
  const email = `logout-${suffix}@example.com`;

  beforeAll(() => createUser(email));
  afterAll(() => prisma.user.deleteMany({ where: { email: { in: [email] } } }));

  test("clears cookie and returns ok", async () => {
    const { cookie } = await login(email);
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
    // Cookie should be cleared (empty value or max-age=0)
    const setCookie = res.headers["set-cookie"]?.[0] || "";
    expect(setCookie).toMatch(/auth_token/);
    expect(setCookie).toMatch(/Expires=Thu, 01 Jan 1970|Max-Age=0/i);
  });

  test("after logout, auth_token no longer grants access", async () => {
    // Use an agent so cookies are managed automatically (like a browser)
    const agent = request.agent(app);
    await agent.post("/api/auth/login").send({ email, password: PASSWORD });
    await agent.post("/api/auth/logout");

    const res = await agent.get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });
});

// ─── Auth endpoints: GET /api/auth/me ─────────────────────────────────────────

describe("GET /api/auth/me", () => {
  beforeAll(() => createUser(emails.me));
  afterAll(() => prisma.user.deleteMany({ where: { email: { in: [emails.me] } } }));

  test("returns 401 without session", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });

  test("returns user data with valid session", async () => {
    const { cookie } = await login(emails.me);
    const res = await request(app).get("/api/auth/me").set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(emails.me);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  test("optional=1 returns null user without session", async () => {
    const res = await request(app).get("/api/auth/me?optional=1");
    expect(res.statusCode).toBe(200);
    expect(res.body.user).toBeNull();
  });

  test("optional=1 returns user data with valid session", async () => {
    const { cookie } = await login(emails.me);
    const res = await request(app)
      .get("/api/auth/me?optional=1")
      .set("Cookie", cookie);

    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe(emails.me);
  });

  test("invalid auth_token cookie returns 401", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Cookie", "auth_token=invalid.jwt.token");
    expect(res.statusCode).toBe(401);
  });
});

// ─── Auth endpoints: PUT /api/auth/profile ────────────────────────────────────

describe("PUT /api/auth/profile", () => {
  beforeAll(() => createUser(emails.profile));
  afterAll(() => prisma.user.deleteMany({ where: { email: { in: [emails.profile] } } }));

  test("returns 401 without session", async () => {
    const res = await request(app).put("/api/auth/profile").send({ name: "New Name" });
    expect(res.statusCode).toBe(401);
  });

  test("updates display name", async () => {
    const { cookie } = await login(emails.profile);
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Cookie", cookie)
      .send({ name: "Updated Name" });

    expect(res.statusCode).toBe(200);
    expect(res.body.user.name).toBe("Updated Name");
  });

  test("invalid phone returns 400", async () => {
    const { cookie } = await login(emails.profile);
    const res = await request(app)
      .put("/api/auth/profile")
      .set("Cookie", cookie)
      .send({ phoneCountry: "MX", phoneNumber: "123" });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/telefono/i);
  });
});

// ─── Auth endpoints: PUT /api/auth/password ───────────────────────────────────

describe("PUT /api/auth/password", () => {
  beforeAll(() => createUser(emails.password));
  afterAll(() => prisma.user.deleteMany({ where: { email: { in: [emails.password] } } }));

  test("returns 401 without session", async () => {
    const res = await request(app)
      .put("/api/auth/password")
      .send({ currentPassword: PASSWORD, newPassword: "NewPass999!" });
    expect(res.statusCode).toBe(401);
  });

  test("returns 400 when fields are missing", async () => {
    const { cookie } = await login(emails.password);
    const res = await request(app)
      .put("/api/auth/password")
      .set("Cookie", cookie)
      .send({});
    expect(res.statusCode).toBe(400);
  });

  test("returns 400 when new password is too short", async () => {
    const { cookie } = await login(emails.password);
    const res = await request(app)
      .put("/api/auth/password")
      .set("Cookie", cookie)
      .send({ currentPassword: PASSWORD, newPassword: "short1" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/8 caracteres/i);
  });

  test("returns 401 with wrong current password", async () => {
    const { cookie } = await login(emails.password);
    const res = await request(app)
      .put("/api/auth/password")
      .set("Cookie", cookie)
      .send({ currentPassword: "WrongPass!", newPassword: "NewPass999!" });
    expect(res.statusCode).toBe(401);
    expect(res.body.error).toMatch(/incorrecta/i);
  });

  test("changes password successfully and old one no longer works", async () => {
    const { cookie } = await login(emails.password);
    const newPassword = "NewPass999!";

    const res = await request(app)
      .put("/api/auth/password")
      .set("Cookie", cookie)
      .send({ currentPassword: PASSWORD, newPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    // Old password should no longer work
    const { response: oldLogin } = await login(emails.password, PASSWORD);
    expect(oldLogin.statusCode).toBe(401);

    // New password should work
    const { response: newLogin } = await login(emails.password, newPassword);
    expect(newLogin.statusCode).toBe(200);
  });
});

// ─── Auth endpoints: POST /api/auth/forgot-password ──────────────────────────

describe("POST /api/auth/forgot-password", () => {
  beforeAll(() => createUser(emails.forgot));
  afterAll(() => prisma.user.deleteMany({ where: { email: { in: [emails.forgot] } } }));

  test("returns 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ password: "NewPass999!" });
    expect(res.statusCode).toBe(400);
  });

  test("returns 400 when new password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: emails.forgot });
    expect(res.statusCode).toBe(400);
  });

  test("returns 400 when new password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: emails.forgot, password: "short" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/8 caracteres/i);
  });

  test("non-existent email still returns 200 (no email disclosure)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: `nobody-${suffix}@example.com`, password: "NewPass999!" });
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  test("resets password for existing user and new password works", async () => {
    const newPassword = "ForgotPass99!";
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: emails.forgot, password: newPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    const { response } = await login(emails.forgot, newPassword);
    expect(response.statusCode).toBe(200);
  });
});

// ─── Auth endpoints: POST /api/auth/reset-password ───────────────────────────

describe("POST /api/auth/reset-password", () => {
  beforeAll(() => createUser(emails.reset));
  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { in: [emails.reset] } } });
    await prisma.$disconnect();
  });

  test("returns 400 when fields are missing", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({});
    expect(res.statusCode).toBe(400);
  });

  test("returns 400 when new password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: emails.reset, password: "short" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/8 caracteres/i);
  });

  test("returns 404 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: `nobody-${suffix}@example.com`, password: "NewPass999!" });
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toMatch(/no encontrado/i);
  });

  test("resets password for existing user", async () => {
    const newPassword = "ResetPass99!";
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ email: emails.reset, password: newPassword });

    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);

    const { response } = await login(emails.reset, newPassword);
    expect(response.statusCode).toBe(200);
  });
});
