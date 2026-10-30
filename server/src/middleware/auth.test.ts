import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../app.js";

// Real Clerk token verification requires a live Clerk backend; these tests
// focus on the security-relevant rejection paths that don't need network.
// Authenticated-request success is verified via live browser testing (Phase 6).

describe("auth middleware rejection paths", () => {
  const app = createApp();

  it("rejects GET /api/v1/auth/me with no Authorization header", async () => {
    const res = await request(app).get("/api/v1/auth/me");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("rejects GET /api/v1/kingdoms/mine with no Authorization header", async () => {
    const res = await request(app).get("/api/v1/kingdoms/mine");
    expect(res.status).toBe(401);
  });

  it("rejects POST /api/v1/kingdoms with no Authorization header", async () => {
    const res = await request(app)
      .post("/api/v1/kingdoms")
      .send({ name: "X", lat: 1, lng: 1 });
    expect(res.status).toBe(401);
  });

  it("rejects a malformed Bearer header", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer");
    expect(res.status).toBe(401);
  });

  it("rejects an empty-token Bearer header", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer ");
    expect(res.status).toBe(401);
  });

  it("rejects a garbage/invalid JWT", async () => {
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", "Bearer not.a.real.jwt");
    expect([401, 500]).toContain(res.status);
  });

  it("rejects an expired-but-structurally-valid JWT", async () => {
    // Header.payload with expired exp claim; signature invalid → rejected.
    const payload = Buffer.from(
      JSON.stringify({
        sub: "user_test",
        exp: Math.floor(Date.now() / 1000) - 3600,
      }),
    ).toString("base64url");
    const token = `eyJhbGciOiJSUzI1NiJ9.${payload}.badsig`;
    const res = await request(app)
      .get("/api/v1/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("keeps /api/v1/health public", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
  });
});
