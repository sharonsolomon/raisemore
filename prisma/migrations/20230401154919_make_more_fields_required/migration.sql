/*
  Warnings:

  - Made the column `created_at` on table `actblue_csv_credentials` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `call_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `needs_log_to_advance` on table `call_sessions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization_id` on table `conference_updates` required. This step will fail if there are existing NULL values in that column.
  - Made the column `person_id` on table `donations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `donations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `inserted_at` on table `donations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `amount` on table `donations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization_id` on table `donations` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `emails` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `import_batches` required. This step will fail if there are existing NULL values in that column.
  - Made the column `created_at` on table `interactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `inserted_at` on table `interactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `person_id` on table `interactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `resulted_in_pledge` on table `interactions` required. This step will fail if there are existing NULL values in that column.
  - Made the column `organization_id` on table `interactions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "actblue_csv_credentials" ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "call_sessions" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "needs_log_to_advance" SET NOT NULL;

-- AlterTable
ALTER TABLE "conference_updates" ALTER COLUMN "organization_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "donations" ALTER COLUMN "person_id" SET NOT NULL,
ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "inserted_at" SET NOT NULL,
ALTER COLUMN "amount" SET NOT NULL,
ALTER COLUMN "organization_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "emails" ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "import_batches" ALTER COLUMN "created_at" SET NOT NULL;

-- AlterTable
ALTER TABLE "interactions" ALTER COLUMN "created_at" SET NOT NULL,
ALTER COLUMN "inserted_at" SET NOT NULL,
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "person_id" SET NOT NULL,
ALTER COLUMN "resulted_in_pledge" SET NOT NULL,
ALTER COLUMN "organization_id" SET NOT NULL;
