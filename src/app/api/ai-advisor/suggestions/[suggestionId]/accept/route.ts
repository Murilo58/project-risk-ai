import { decideSuggestion } from "@/domain/ai-advisor/service";
import { toErrorResponse } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth/dal";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/ai-advisor/suggestions/[suggestionId]/accept">,
) {
  try {
    const { userId } = await requireSession(request);

    const { suggestionId } = await ctx.params;
    const suggestion = await decideSuggestion(suggestionId, userId, "ACCEPTED");
    return Response.json(suggestion);
  } catch (error) {
    return toErrorResponse(error);
  }
}
