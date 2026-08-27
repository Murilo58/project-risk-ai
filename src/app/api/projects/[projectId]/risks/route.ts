import { computeSeverity } from "@/domain/risks/severity";
import { NotFoundError, toErrorResponse, ValidationError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { riskSchema } from "@/lib/validation/risk";

async function assertActiveProject(projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, deletedAt: null },
    select: { id: true },
  });
  if (!project) throw new NotFoundError("Projeto não encontrado.");
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/risks">,
) {
  try {
    const { projectId } = await ctx.params;
    await assertActiveProject(projectId);

    const risks = await prisma.risk.findMany({
      where: { projectId },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    });
    return Response.json(risks);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/risks">,
) {
  try {
    const { projectId } = await ctx.params;
    await assertActiveProject(projectId);

    const body = await request.json();
    const parsed = riskSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error);

    const { probability, impact } = parsed.data;
    const risk = await prisma.risk.create({
      data: { ...parsed.data, projectId, severity: computeSeverity(probability, impact) },
    });
    return Response.json(risk, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
