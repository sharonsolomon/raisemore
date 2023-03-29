-- CreateTable
CREATE TABLE "actblue_csv_credentials" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "client_uuid" UUID,
    "client_secret" TEXT,
    "inserted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),

    CONSTRAINT "actblue_csv_access_secrets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "actblue_csv_requests" (
    "id" BIGSERIAL NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inserted_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6),
    "actblue_request_id" UUID,
    "error" TEXT,
    "download_url" TEXT,
    "status" TEXT,

    CONSTRAINT "actblue_csv_requests_pkey" PRIMARY KEY ("id")
);
