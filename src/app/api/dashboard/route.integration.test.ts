import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { GET } from "@/app/api/dashboard/route";
import { createUser } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";
import { authCookieHeader } from "@/test/auth";

const createdProjectIds: string[] = [];
let testUserId: string;
let cookie: string;

beforeAll(async () => {
  const user = await createUser({
    name: "Usuário de Teste — Dashboard",
    email: "dashboard-integration-test@example.com",
    password: "correct-password",
  });
  testUserId = user.id;
  cookie = await authCookieHeader(testUserId);
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: testUserId } });
});

afterEach(async () => {
  if (createdProjectIds.length > 0) {
    await prisma.project.deleteMany({ where: { id: { in: createdProjectIds } } });
    createdProjectIds.length = 0;
  }
});

function dashboardRequest(): Request {
  return new Request("http://localhost/api/dashboard", { headers: { Cookie: cookie } });
}

describe("GET /api/dashboard", () => {
  it("only aggregates the caller's own projects", async () => {
    const own = await prisma.project.create({
      data: {
        name: "Meu Projeto",
        owner: "QA",
        startDate: new Date(),
        userId: testUserId,
      },
    });
    createdProjectIds.push(own.id);

    const otherUser = await createUser({
      name: "Outro Usuário",
      email: "other-user-dashboard@example.com",
      password: "correct-password",
    });
    const otherProject = await prisma.project.create({
      data: {
        name: "Projeto de Outro Usuário",
        owner: "QA",
        startDate: new Date(),
        userId: otherUser.id,
      },
    });

    try {
      const response = await GET(dashboardRequest());
      expect(response.status).toBe(200);

      const body = await response.json();
      const ids = body.projects.map((p: { id: string }) => p.id);
      expect(ids).toContain(own.id);
      expect(ids).not.toContain(otherProject.id);
    } finally {
      await prisma.project.delete({ where: { id: otherProject.id } });
      await prisma.user.delete({ where: { id: otherUser.id } });
    }
  });

  it("returns 401 without a valid session", async () => {
    const response = await GET(new Request("http://localhost/api/dashboard"));
    expect(response.status).toBe(401);
  });
});
