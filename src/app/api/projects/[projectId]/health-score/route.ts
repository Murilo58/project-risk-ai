import { computeAndSnapshotHealthScore } from "@/domain/health-score/service";
import { NotFoundError, toErrorResponse } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/health-score">,
) {
  try {
    const { projectId } = await ctx.params;
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw new NotFoundError("Projeto não encontrado.");

    const result = await computeAndSnapshotHealthScore(projectId);
    return Response.json(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
