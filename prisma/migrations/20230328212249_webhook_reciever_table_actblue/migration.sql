-- CreateTable
CREATE TABLE "actblue_webhooks" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inserted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "webhook_body" JSONB NOT NULL,
    "organization_id" UUID NOT NULL,

    CONSTRAINT "actblue_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "actblue_webhooks_webhook_body_key" ON "actblue_webhooks"("webhook_body");
