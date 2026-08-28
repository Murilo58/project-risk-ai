import {
  AiAdvisorNotConfiguredError,
  AiAdvisorUnavailableError,
} from "@/domain/ai-advisor/claudeClient";
import { AiAdvisorCooldownError, requestAiAnalysis } from "@/domain/ai-advisor/service";
import { toErrorResponse } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth/dal";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/projects/[projectId]/ai-advisor">,
) {
  try {
    await requireSession(request);

    const { projectId } = await ctx.params;
    const suggestions = await requestAiAnalysis(projectId);
    return Response.json(suggestions, { status: 201 });
  } catch (error) {
    if (error instanceof AiAdvisorCooldownError) {
      return Response.json(
        { error: error.message, retryAfterSeconds: error.retryAfterSeconds },
        { status: 429 },
      );
    }
    if (
      error instanceof AiAdvisorNotConfiguredError ||
      error instanceof AiAdvisorUnavailableError
    ) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    return toErrorResponse(error);
  }
}
