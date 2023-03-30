/*
  Warnings:

  - A unique constraint covering the columns `[actblue_request_id]` on the table `actblue_csv_requests` will be added. If there are existing duplicate values, this will fail.
  - Made the column `actblue_request_id` on table `actblue_csv_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "actblue_csv_requests" ALTER COLUMN "actblue_request_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "actblue_csv_requests_actblue_request_id_key" ON "actblue_csv_requests"("actblue_request_id");
