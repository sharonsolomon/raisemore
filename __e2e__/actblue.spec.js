import { test, expect } from "@playwright/test";
require("dotenv").config();
import { createClient } from "@supabase/supabase-js";
const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

test.describe("ActBlue API import and webhooks", () => {
    test.skip("Bulk import through UI", async ({ page }) => {
        // TODO: write test
    });
    test.skip("Register a webhook and receive one successfully", async ({ page }) => {
        // TODO: write test
    });
});
