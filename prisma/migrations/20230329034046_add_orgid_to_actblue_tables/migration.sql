-- AlterTable
ALTER TABLE "actblue_csv_credentials" ADD COLUMN     "organization_id" TEXT NOT NULL DEFAULT requesting_org_id();

-- AlterTable
ALTER TABLE "actblue_csv_requests" ADD COLUMN     "organization_id" TEXT NOT NULL DEFAULT requesting_org_id();

-- AlterTable
ALTER TABLE "actblue_webhooks" ALTER COLUMN "organization_id" SET DEFAULT requesting_org_id();

-- AlterTable
ALTER TABLE "conference_updates" ALTER COLUMN "organization_id" SET DEFAULT requesting_org_id();
