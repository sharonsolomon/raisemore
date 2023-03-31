import { test, expect } from "@playwright/test";
require("dotenv").config();
import { createClient } from "@supabase/supabase-js";
const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

test.describe("Basic security measures", () => {
    test.skip("Database row level security: unauthorized users cannot access anything", async ({
        page,
    }) => {
        // TODO: write test
    });
    test.skip("Database row level security: users can only access their own organization", async ({
        page,
    }) => {
        // TODO: write test
    });
    test.skip("API: doesn't allow unauthorized access", async ({ page }) => {
        // TODO: write test
    });
    test.skip("API: Users can only access their own organization", async ({ page }) => {
        // TODO: write test
    });
    test.skip("API: Users can only upload to their own organization", async ({ page }) => {
        // TODO: write test
    });
});
