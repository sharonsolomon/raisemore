import { test, expect } from "@playwright/test";
require("dotenv").config();
import { createClient } from "@supabase/supabase-js";
const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);
// Twilio client
import initTwilio from "twilio";
const twilio = initTwilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

test.describe("Remaining MVP reqs", () => {
    test.skip("Clarity is high", async ({ page }) => {
        // TODO: Write out the changes needed in UI for clarity to be high
    });
    test.skip("Each account has it's own calling number", async ({ page }) => {
        // TODO
    });
    test.skip("Sign up and login from marketing page actually works", async ({ page }) => {
        // TODO
    });
    test.skip("Export by date and table available", async ({ page }) => {
        // TODO
    });
}