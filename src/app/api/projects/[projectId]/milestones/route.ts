import { NotFoundError, toErrorResponse, ValidationError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { milestoneSchema, withNormalizedActualDate } from "@/lib/validation/milestone";

async function assertActiveProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId, deletedAt: null },
    select: { id: true },
  });
  if (!project) throw new NotFoundError("Projeto não encontrado.");
}

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/milestones">,
) {
  try {
    const { userId } = await requireSession(request);

    const { projectId } = await ctx.params;
    await assertActiveProject(projectId, userId);

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
    const { userId } = await requireSession(request);

    const { projectId } = await ctx.params;
    await assertActiveProject(projectId, userId);

    const body = await request.json();
    const parsed = milestoneSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error);

    const data = withNormalizedActualDate(parsed.data, parsed.data.status);
    const milestone = await prisma.milestone.create({
      data: { ...data, projectId },
    });
    return Response.json(milestone, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
