-- CreateTable
CREATE TABLE "caller_ids" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inserted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "phone_number" BIGINT NOT NULL,
    "twilio_sid" TEXT,
    "organization_id" TEXT NOT NULL DEFAULT requesting_org_id(),

    CONSTRAINT "caller_ids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "caller_ids_organization_id_key" ON "caller_ids"("organization_id");
