import { test, expect } from "@playwright/test";
require("dotenv").config();
import { createClient } from "@supabase/supabase-js";
const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

test.describe("ActBlue API import and webhooks", () => {
    test("Bulk import through UI", async ({ page }) => {
        await page.goto("/sync");
        await page
            .getByRole("textbox", { name: "Client UUID" })
            .type(process.env.TEST_ACTBLUE_CLIENT_UUID);
        await page
            .getByRole("textbox", { name: "Client Secret" })
            .type(process.env.TEST_ACTBLUE_CLIENT_SECRET);
        await page.getByRole("button", { name: "Save ActBlue API credentials" }).click();
        await page.getByText("The credentials were saved and the import is finished processing.");
        await expect(
            page.getByText("The credentials were saved and the import is finished processing.")
        ).toBeDefined();
        await expect(
            page.getByText("The credentials were saved and the import is finished processing.")
        ).toBeVisible();
        await page.screenshot({ path: `__e2e__/results/actblue-import.png` });
        const { count } = await db
            .from("donations")
            .select("*", { count: "exact", head: true })
            .eq("recipient", "Latino Families Forward");
        await expect(count).toBeGreaterThan(54);
    });
    test.skip("Register a webhook and receive one successfully", async ({ page }) => {
        // TODO: write test
        // How to test this with actblue?
    });
});
