import { decideSuggestion } from "@/domain/ai-advisor/service";
import { toErrorResponse } from "@/lib/api-errors";

export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/ai-advisor/suggestions/[suggestionId]/accept">,
) {
  try {
    const { suggestionId } = await ctx.params;
    const suggestion = await decideSuggestion(suggestionId, "ACCEPTED");
    return Response.json(suggestion);
  } catch (error) {
    return toErrorResponse(error);
  }
}
