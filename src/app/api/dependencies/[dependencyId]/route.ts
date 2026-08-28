import { NotFoundError, toErrorResponse, ValidationError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { dependencySchema } from "@/lib/validation/dependency";

async function findDependency(dependencyId: string, userId: string) {
  const dependency = await prisma.dependency.findFirst({
    where: { id: dependencyId, project: { userId } },
  });
  if (!dependency) throw new NotFoundError("Dependência não encontrada.");
  return dependency;
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/dependencies/[dependencyId]">,
) {
  try {
    const { userId } = await requireSession(request);

    const { dependencyId } = await ctx.params;
    await findDependency(dependencyId, userId);

    const body = await request.json();
    const parsed = dependencySchema.partial().safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error);

    const dependency = await prisma.dependency.update({
      where: { id: dependencyId },
      data: parsed.data,
    });
    return Response.json(dependency);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function DELETE(
  request: Request,
  ctx: RouteContext<"/api/dependencies/[dependencyId]">,
) {
  try {
    const { userId } = await requireSession(request);

    const { dependencyId } = await ctx.params;
    await findDependency(dependencyId, userId);

    await prisma.dependency.delete({ where: { id: dependencyId } });
    return new Response(null, { status: 204 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
