-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('active', 'disabled');

-- AlterTable
ALTER TABLE "Project"
  ALTER COLUMN "status" DROP DEFAULT,
  ALTER COLUMN "status" TYPE "ProjectStatus" USING (
    CASE
      WHEN "status" = 'disabled' THEN 'disabled'::"ProjectStatus"
      ELSE 'active'::"ProjectStatus"
    END
  ),
  ALTER COLUMN "status" SET DEFAULT 'active';

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");
