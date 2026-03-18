const request = require("supertest");
const app = require("../src/server");

describe("Basic server and auth validations", () => {
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
});
