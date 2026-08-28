import { listSuggestions } from "@/domain/ai-advisor/service";
import { toErrorResponse } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth/dal";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/ai-advisor/suggestions">,
) {
  try {
    const { userId } = await requireSession(request);

    const { projectId } = await ctx.params;
    const suggestions = await listSuggestions(projectId, userId);
    return Response.json(suggestions);
  } catch (error) {
    return toErrorResponse(error);
  }
}
