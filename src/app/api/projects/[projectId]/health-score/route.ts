import { computeAndSnapshotHealthScore } from "@/domain/health-score/service";
import { NotFoundError, toErrorResponse } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/health-score">,
) {
  try {
    const { userId } = await requireSession(request);

    const { projectId } = await ctx.params;
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw new NotFoundError("Projeto não encontrado.");

    const result = await computeAndSnapshotHealthScore(projectId);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
