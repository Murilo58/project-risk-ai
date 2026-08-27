import { NotFoundError, toErrorResponse, ValidationError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validation/project";

async function findActiveProject(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    include: {
      milestones: { orderBy: { plannedDate: "asc" } },
      dependencies: { orderBy: { createdAt: "desc" } },
      risks: { orderBy: [{ severity: "desc" }, { createdAt: "desc" }] },
    },
  });
  if (!project) throw new NotFoundError("Projeto não encontrado.");
  return project;
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]">,
) {
  try {
    const { projectId } = await ctx.params;
    const project = await findActiveProject(projectId);
    return Response.json(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]">,
) {
  try {
    const { projectId } = await ctx.params;
    await findActiveProject(projectId);

    const body = await request.json();
    const parsed = projectSchema.partial().safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: parsed.data,
    });
    return Response.json(project);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]">,
) {
  try {
    const { projectId } = await ctx.params;
    await findActiveProject(projectId);

    await prisma.project.update({
      where: { id: projectId },
      data: { deletedAt: new Date() },
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
