import { NotFoundError, toErrorResponse } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/health-score/history">,
) {
  try {
    await requireSession(request);

    const { projectId } = await ctx.params;
    const project = await prisma.project.findFirst({
      where: { id: projectId, deletedAt: null },
      select: { id: true },
    });
    if (!project) throw new NotFoundError("Projeto não encontrado.");

    const snapshots = await prisma.healthScoreSnapshot.findMany({
      where: { projectId },
      orderBy: { snapshotDate: "asc" },
      select: { snapshotDate: true, overallScore: true },
    });
    return Response.json(snapshots);
  } catch (error) {
    return toErrorResponse(error);
  }
}
