import { NotFoundError, toErrorResponse, ValidationError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { dependencySchema } from "@/lib/validation/dependency";

async function assertActiveProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!project) throw new NotFoundError("Projeto não encontrado.");
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/dependencies">,
) {
  try {
    const { userId } = await requireSession(request);

    const { projectId } = await ctx.params;
    await assertActiveProject(projectId, userId);

    const dependencies = await prisma.dependency.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    });
    return Response.json(dependencies);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/dependencies">,
) {
  try {
    const { userId } = await requireSession(request);

    const { projectId } = await ctx.params;
    await assertActiveProject(projectId, userId);

    const body = await request.json();
    const parsed = dependencySchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error);

    const dependency = await prisma.dependency.create({
      data: { ...parsed.data, projectId },
    });
    return Response.json(dependency, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
