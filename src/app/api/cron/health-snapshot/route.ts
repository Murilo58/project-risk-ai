import { snapshotAllActiveProjects } from "@/domain/health-score/service";
import { toErrorResponse } from "@/lib/api-errors";

// Vercel Cron invokes scheduled jobs with GET and automatically attaches
// `Authorization: Bearer $CRON_SECRET` when that env var is set. POST is kept
// for manual/local triggering (e.g. curl) during development.
async function handle(request: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    const authHeader = request.headers.get("authorization");
    if (!secret || authHeader !== `Bearer ${secret}`) {
      return Response.json({ error: "Não autorizado." }, { status: 401 });
    }

    const results = await snapshotAllActiveProjects();
    return Response.json({ snapshotted: results.length, results });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export const GET = handle;
export const POST = handle;
