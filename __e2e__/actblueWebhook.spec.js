import fs from "fs";
import path from "path";
import { test, expect } from "@playwright/test";
require("dotenv").config();
import { createClient } from "@supabase/supabase-js";
const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

test.use({
    // All requests we send go to this API endpoint.
    baseURL: "https://api.github.com",
    extraHTTPHeaders: {
        // We set this header per GitHub guidelines.
        Accept: "application/vnd.github.v3+json",
        // Add authorization token to all requests.
        // Assuming personal access token available in the environment.
        Authorization: `token ${process.env.API_TOKEN}`,
    },
});

test.describe("ActBlue Webhook", () => {
    test.skip("Receive a webhook correctly", async ({ page }) => {
        // Load actblue's test payload
        const testPayload = JSON.parse(
            fs.readFileSync(path.join(__dirname, "mocks/actblue-webhook.json"), {
                encoding: "utf8",
                flag: "r",
            })
        );

        const postResponse = await request.post(
            "/api/integrations/actblue/webhook/receive",
            testPayload
        );

        expect(postResponse.ok()).toBeTruthy();

        // wait 2 seconds
        await page.waitForTimeout(2000);

        // check that the donation was created
        const { count } = await db
            .from("donations")
            .select("*", { count: "exact", head: true })
            .eq("amount", 25.9);

        await expect(count).toBe(1);
    });
});
