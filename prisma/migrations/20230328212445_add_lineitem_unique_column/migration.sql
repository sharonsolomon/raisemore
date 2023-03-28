-- AlterTable
ALTER TABLE "actblue_webhooks" ADD COLUMN     "first_line_item_id" TEXT;
ALTER TABLE "actblue_webhooks" ADD COLUMN     "processed" BOOLEAN NOT NULL DEFAULT FALSE;