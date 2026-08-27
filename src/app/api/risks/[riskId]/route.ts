import { computeSeverity } from "@/domain/risks/severity";
import { NotFoundError, toErrorResponse, ValidationError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { riskSchema } from "@/lib/validation/risk";

async function findRisk(riskId: string) {
  const risk = await prisma.risk.findUnique({ where: { id: riskId } });
  if (!risk) throw new NotFoundError("Risco não encontrado.");
  return risk;
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/risks/[riskId]">) {
  try {
    const { riskId } = await ctx.params;
    const existing = await findRisk(riskId);

    const body = await request.json();
    const parsed = riskSchema.partial().safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error);

    const probability = parsed.data.probability ?? existing.probability;
    const impact = parsed.data.impact ?? existing.impact;

    const risk = await prisma.risk.update({
      where: { id: riskId },
      data: { ...parsed.data, severity: computeSeverity(probability, impact) },
    });
    return Response.json(risk);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/risks/[riskId]">,
) {
  try {
    const { riskId } = await ctx.params;
    await findRisk(riskId);

    await prisma.risk.delete({ where: { id: riskId } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
