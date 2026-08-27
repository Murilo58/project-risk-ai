import { NotFoundError, toErrorResponse, ValidationError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { milestoneSchema } from "@/lib/validation/milestone";

async function assertActiveProject(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { id: true },
  });
  if (!project) throw new NotFoundError("Projeto não encontrado.");
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/milestones">,
) {
  try {
    const { projectId } = await ctx.params;
    await assertActiveProject(projectId);

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { plannedDate: "asc" },
    });
    return Response.json(milestones);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/milestones">,
) {
  try {
    const { projectId } = await ctx.params;
    await assertActiveProject(projectId);

    const body = await request.json();
    const parsed = milestoneSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error);

    const milestone = await prisma.milestone.create({
      data: { ...parsed.data, projectId },
    });
    return Response.json(milestone, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
