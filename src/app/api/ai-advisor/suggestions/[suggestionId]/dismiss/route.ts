import { decideSuggestion } from "@/domain/ai-advisor/service";
import { toErrorResponse } from "@/lib/api-errors";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/ai-advisor/suggestions/[suggestionId]/dismiss">,
) {
  try {
    const { suggestionId } = await ctx.params;
    const suggestion = await decideSuggestion(suggestionId, "DISMISSED");
    return Response.json(suggestion);
  } catch (error) {
    return toErrorResponse(error);
  }
}
