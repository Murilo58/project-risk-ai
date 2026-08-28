-- Apply this ONLY after scripts/backfill-project-owner.mjs has assigned
-- every pre-existing "Project" row a real "userId" — running it earlier
-- fails outright if any row still has userId IS NULL. See
-- ARCHITECTURE.md §12 for the full migration sequence.
-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "userId" SET NOT NULL;
