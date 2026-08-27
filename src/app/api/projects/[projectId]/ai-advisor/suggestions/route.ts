import { listSuggestions } from "@/domain/ai-advisor/service";
import { toErrorResponse } from "@/lib/api-errors";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/ai-advisor/suggestions">,
) {
  try {
    const { projectId } = await ctx.params;
    const suggestions = await listSuggestions(projectId);
    return Response.json(suggestions);
  } catch (error) {
    return toErrorResponse(error);
  }
}
