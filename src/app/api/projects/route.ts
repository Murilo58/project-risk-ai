import { toErrorResponse, ValidationError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth/dal";
import { prisma } from "@/lib/prisma";
import { projectSchema } from "@/lib/validation/project";

export async function GET(request: Request) {
  try {
    const { userId } = await requireSession(request);

    const projects = await prisma.project.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { milestones: true, dependencies: true, risks: true } },
      },
    });
    return Response.json(projects);
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await requireSession(request);

    const body = await request.json();
    const parsed = projectSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error);

    const project = await prisma.project.create({ data: { ...parsed.data, userId } });
    return Response.json(project, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}
