import { NotFoundError, toErrorResponse, ValidationError } from "@/lib/api-errors";
import { prisma } from "@/lib/prisma";
import { milestoneSchema } from "@/lib/validation/milestone";

async function findMilestone(milestoneId: string) {
  const milestone = await prisma.milestone.findUnique({ where: { id: milestoneId } });
  if (!milestone) throw new NotFoundError("Marco não encontrado.");
  return milestone;
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/milestones/[milestoneId]">,
) {
  try {
    const { milestoneId } = await ctx.params;
    await findMilestone(milestoneId);

    const body = await request.json();
    const parsed = milestoneSchema.partial().safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error);

    const milestone = await prisma.milestone.update({
      where: { id: milestoneId },
      data: parsed.data,
    });
    return Response.json(milestone);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/milestones/[milestoneId]">,
) {
  try {
    const { milestoneId } = await ctx.params;
    await findMilestone(milestoneId);

    await prisma.milestone.delete({ where: { id: milestoneId } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
