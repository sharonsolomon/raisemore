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

test.describe("Basic flow for pledge followup (LeftRising requirements)", () => {
    // ****************
    // Basics
    test("Import donations", async ({ page }) => {
        await page.goto("/import");
        await page.getByRole("radio", { name: "Donations" }).click();
        await page.getByRole("button", { name: "Next step" }).click();
        const fileChooserPromise = page.waitForEvent("filechooser");
        await page.getByText("Browse").click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles("__e2e__/mocks/ab-sample.csv");
        await page.waitForSelector("h2");
        await expect(page.getByText("File uploaded successfully")).toBeVisible();
        await page.getByRole("button", { name: "Upload another file" }).click();
        await expect(page.getByText("Are you importing donations/donors,")).toBeVisible();
    });
    test("Import pledges", async ({ page }) => {
        await page.goto("/import");
        await page.getByRole("radio", { name: "Pledges" }).click();
        await page.getByRole("button", { name: "Next step" }).click();
        const fileChooserPromise = page.waitForEvent("filechooser");
        await page.getByText("Browse").click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles("__e2e__/mocks/upload-pledges-basic-test.csv");
        await page.waitForSelector("h2");
        await expect(page.getByText("File uploaded successfully")).toBeVisible();
        await page.getByRole("button", { name: "Upload another file" }).click();
        await expect(page.getByText("Are you importing donations/donors,")).toBeVisible();
    });
    test("Import prospects", async ({ page }) => {
        await page.goto("/import");
        await page.getByRole("radio", { name: "Prospects" }).click();
        await page.getByRole("button", { name: "Next step" }).click();
        const fileChooserPromise = page.waitForEvent("filechooser");
        await page.getByText("Browse").click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles("__e2e__/mocks/upload-prospects-basic-test.csv");
        await page.waitForSelector("h2");
        await expect(page.getByText("File uploaded successfully")).toBeVisible();
        await page.getByRole("button", { name: "Upload another file" }).click();
        await expect(page.getByText("Are you importing donations/donors,")).toBeVisible();
    });
    test("People page displays correctly", async ({ page }) => {
        await page.goto("/people");
        await expect(page.getByRole("button", { name: "View Person" }).first()).toBeVisible();
        await page.getByRole("button", { name: "View Person" }).first().click();
        await page.waitForURL(/.*\/people\/[a-z0-9-]+/);
        // Get the last component (after the last slash) of the url
        const personId = page.url().split("/").pop();
        const { data: person } = await db
            .from("people")
            .select("*")
            .eq("id", personId)
            .limit(1)
            .single();
        await expect(page.locator("h1")).toContainText(person.first_name + " " + person.last_name);
    });
    test("Line-item FEC data appear accurately in profiles", async ({ page }) => {
        // Go to people search
        await page.goto("/people");
        // Add first name
        await page.getByRole("button", { name: "Add Filter Step" }).click();
        await page.getByTestId("operators").selectOption("=");
        await page.getByRole("textbox", { name: "Value" }).click();
        await page.getByRole("textbox", { name: "Value" }).fill("Eileen");
        // Check to see if any search was run
        await page.getByRole("cell", { name: "Eileen" }).click();
        // Last name
        await page.getByRole("button", { name: "Add Filter Step" }).click();
        await page.getByTestId("fields").nth(1).selectOption("last_name");
        await page.getByRole("textbox", { name: "Value" }).nth(1).click();
        await page.getByRole("textbox", { name: "Value" }).nth(1).fill("Farbman");
        // Check to see if any search was run
        await page.getByRole("cell", { name: "Farbman" }).click();
        // Go over to the persons page
        await page.getByRole("button", { name: "View Person" }).click();
        // Count up the donations
        await page.getByText("$500 to");
        await expect(page.getByText("$500 to")).toHaveCount(14);
        /*
            TODO: The imported donations don't match official records exactly
            Additionally, "Actblue" shows up as the committee receiving a lot of donations
            and we should replace it with the committee ID noted in the memo line of AB donations
        */
    });
    test("Imported donations appear accurately in profiles", async ({ page }) => {
        // TODO: this needs a more accurate donation section selector
        // Live db check
        let response = await db.from("people").select("*, donations (*)").limit(1).single();
        let id = response.data.id;
        let donations = response.data.donations;
        expect(id).toBeTruthy();
        expect(id).not.toHaveLength(0);
        expect(donations).not.toHaveLength(0);
        await page.goto(`/people/${id}`);

        await expect(page.locator(".DonationHistory li")).toHaveCount(donations.length);
        await checkDonationsArePresent(donations);

        // Helper function
        async function checkDonationsArePresent(donations) {
            for (let donation of donations) {
                await expect(
                    page
                        .getByRole("listitem")
                        .filter({ hasText: "$" + donation.amount.toString() + " - " })
                ).toBeVisible();
            }
        }
    });
    test("Imported pledges appear accurately in profiles", async ({ page }) => {
        // TODO: this needs a more accurate pledge section selector
        // Live db check
        let { data: pledge } = await db.from("pledges").select("*, people (*)").limit(1).single();
        let id = pledge.people.id;
        expect(pledge).toBeTruthy();
        expect(id).toBeTruthy();
        await page.goto(`/people/${id}`);
        await expect(
            page.getByRole("listitem").filter({ hasText: "$" + pledge.amount.toString() + " - " })
        ).toBeVisible();
    });
    test("Add and remove different phone numbers and emails", async ({ page }) => {
        // Importing phones and emails now has the right data structures and works
        // Primary is un-implemented
        // First, add, and remove, and make primary buttons
        // Add email and phone, note, and pledge, done

        // Go to a random person
        await page.goto("/people");
        await expect(page.getByRole("button", { name: "View Person" }).first()).toBeVisible();
        await page.getByRole("button", { name: "View Person" }).first().click();
        await page.waitForURL(/.*\/people\/[a-z0-9-]+/);

        const randomSeed = Math.random().toString().slice(0, 1);

        // Add an example phone and email, remove and restore them
        await page.getByRole("button", { name: "Add Phone" }).click();
        await page.locator('input[name="newPhoneNumber"]').fill(`555123456${randomSeed}`);
        await page.getByRole("button", { name: "Add Phone" }).click();
        await expect(page.locator('input[name="newPhoneNumber"]')).not.toBeVisible();
        await expect(page.getByText(`(555) 123-456${randomSeed}`)).toBeVisible();
        await page
            .getByRole("definition")
            .filter({ hasText: `(555) 123-456${randomSeed}x` })
            .first()
            .getByRole("button", { name: "x" })
            .click();
        await page.getByRole("button", { name: "Restore" }).click();

        // Email
        await page.getByRole("button", { name: "Add Email" }).click();
        await page.locator('input[name="newEmail"]').fill(`example${randomSeed}@example.com`);
        await page.getByRole("button", { name: "Add Email" }).click();
        await page.getByText(`example${randomSeed}@example.com`).click();
        await page
            .getByRole("definition")
            .filter({ hasText: `example${randomSeed}@example.comx` })
            .first()
            .getByRole("button", { name: "x" })
            .click();
        await page.getByRole("button", { name: "Restore" }).click();
        await page.getByText(`example${randomSeed}@example.com`).click();

        // Add an example tag and remove it
        await page.getByRole("button", { name: "Add Tag" }).click();
        await page.locator('input[name="newTag"]').fill(`exampleTag${randomSeed}`);
        await page.getByRole("button", { name: "Add Tag" }).click();
        await expect(page.getByText(`exampleTag${randomSeed}`)).toBeVisible();
        // TODO: remove the tag
    });
    test.skip("Make primary different phone numbers and emails", async ({ page }) => {
        // TODO
    });
    test("Create a single-table list", async ({ page }) => {
        await page.goto("/people");
        await page.getByRole("button", { name: "Add Filter Step" }).click();
        await page.getByTestId("fields").selectOption("state");
        await page.getByRole("textbox", { name: "Value" }).fill("NY");
        await page.getByRole("button", { name: "Save List" }).click();
        await page
            .getByRole("menu", { name: "Save List" })
            .getByRole("textbox")
            .fill("Everyone in New York");
        await page.getByRole("menuitem", { name: "Save" }).click();
        await page.goto("/savedlists");
        // TODO: follow advice to replace waitfornavigation with waitforurl
        const navigationPromise = page.waitForNavigation();
        await page.getByRole("button", { name: "Edit Query" }).click();
        await navigationPromise;
        // Take a screenshot
        await page.screenshot({
            path: `__e2e__/results/debug.png`,
        });
        await expect(page.getByText("Everyone in New York")).toBeVisible();
    });
    test.skip("Create a multi-table list re: pledges, past donations", async ({ page }) => {
        // TODO
    });
    test.skip("Create a multi-table list with summary join-table of FEC data", async ({ page }) => {
        // TODO
    });
    test("Start call session on single-table list, call 3 people, add notes and pledges", async ({
        page,
    }) => {
        // TODO: write test
        await page.goto("/savedlists");

        const navigationPromise = page.waitForNavigation();
        await page
            .locator("tr")
            .filter({ hasText: "Everyone in New York" })
            .filter({ has: page.getByRole("button", { name: "Start Call Session" }) });
        await navigationPromise;

        // Dial in from twilio
        const dialInFromNumber = 5856695750;
        await page.getByLabel("Your phone number").fill(dialInFromNumber);
        await page.getByRole("button", { name: "Make calls" }).click();
        const numberToDial = await page
            .locator(".dialer-top-card")
            .textContent()
            .replaceAll(/[^0-9]/g, "");
        twilio.calls.create({
            url: "http://demo.twilio.com/docs/voice.xml",
            to: numberToDial,
            from: dialInFromNumber,
        });

        // Wait for call to connect
        await page.getByText("You're dialed in to the call session!");
        expect(await page.getByText("You're dialed in to the call session!")).toBeVisible();

        // Make a call
        await page.getByRole("button", { name: "Call" }).click();

        // Mark not home
        await page.getByRole("button", { name: "Not home" }).click();
        await page
            .getByRole("textarea", { name: "Add your note..." })
            .fill("Called but they didn't pick up, left a long voicemail");
        await page.getByRole("button", { name: "Save interaction" }).click();
        await page.getByText(
            "Call: Not home, Called but they didn't pick up, left a long voicemail"
        );

        // move to next person
        await page.getByRole("button", { name: "Next" }).click();

        // Repeat
        await page.getByRole("button", { name: "Pledged" }).click();
        await page
            .getByRole("textarea", { name: "Add your note..." })
            .fill("Great conversation! Call them back soon to follow up");

        await page.getByRole("button", { name: "Add pledge" }).click();
        await page.getByRole("textbox", { name: "pledge" }).fill("123");
        await page.getByRole("button", { name: "Save interaction" }).click();
        await page.getByText("Call: Pledged, Great conversation! Call them back soon to follow up");
        await page.getByText("Pledge: $123");
        await page.getByText("$123 - ");

        // move to next person
        await page.getByRole("button", { name: "Next" }).click();

        // Repeat one last time
        await page.getByRole("button", { name: "Hostile" }).click();
        await page
            .getByRole("textarea", { name: "Add your note..." })
            .fill("Blah blah blah example three");
        await page.getByRole("button", { name: "Save interaction" }).click();
        await page.getByText("Call: Hostile, Blah blah blah example three");

        // That's it
        const navigationPromise2 = page.waitForNavigation();
        await page.getByRole("button", { name: "Leave session" }).click();
        await navigationPromise2;
        await expect(page.getByText("Join or start a calling session.")).toBeVisible();
    });
    test("New notes and pledges are persisted", async ({ page }) => {
        // Test new notes and pledges are persisted
        // 1. go to interactions page
        // 2. look for the 3 interactions we just created in the previous test
        // 3. check that the notes and pledges are there
        await page.goto("/interactions");
        await expect(
            page.getByText("Called but they didn't pick up, left a long voicemail")
        ).toBeVisible();
        await expect(
            page.getByText("Great conversation! Call them back soon to follow up")
        ).toBeVisible();
        await expect(page.getByText("Blah blah blah example three")).toBeVisible();
    });
    test("Call sessions sync page view as realtime multi-player", async ({ page }) => {
        // TODO: write test
        // Create two pages
        const pageOne = await context.newPage();
        const pageTwo = await context.newPage();

        // Get pages of a browser context
        // const allPages = context.pages();

        // Navigate both pages to the make calls page
        await pageOne.goto("/dialer/1");
        await pageTwo.goto("/dialer/1");

        // make sure the second page context matches first page's dom
        const firstPersonName = await pageOne.locator("h1").textContent();
        await expect(pageTwo.locator("h1").textContent()).toBe(firstPersonName);

        // dial in from twilio on page one
        const dialInFromNumber = 5856695750;
        await pageOne.getByLabel("Your phone number").fill(dialInFromNumber);
        await pageOne.getByRole("button", { name: "Make calls" }).click();
        const numberToDial = await pageOne
            .locator(".dialer-top-card")
            .textContent()
            .replaceAll(/[^0-9]/g, "");
        twilio.calls.create({
            url: "http://demo.twilio.com/docs/voice.xml",
            to: numberToDial,
            from: dialInFromNumber,
        });

        // Wait for call to connect
        await pageOne.getByText("You're dialed in to the call session!");
        expect(await pageOne.getByText("You're dialed in to the call session!")).toBeVisible();

        // Fill in page two's dial-in-from-number prompt
        await pageTwo.getByLabel("Your phone number").fill(dialInFromNumber);
        await pageTwo.getByRole("button", { name: "Make calls" }).click();

        // check page two status
        await pageTwo.getByText("You're dialed in to the call session!");
        expect(await pageTwo.getByText("You're dialed in to the call session!")).toBeVisible();

        let lastPersonName = firstPersonName,
            currentPersonName = await pageOne.locator("h1").textContent();
        for (let i = 0; i < 3; i++) {
            // Check that the new name doesn't match the old name
            await expect(lastPersonName).not.toBe(currentPersonName);

            // Check that the first and second page header match
            await expect(pageTwo.locator("h1").textContent()).toBe(currentPersonName);

            // Advance one person by clicking the button with the text "Skip"
            await pageOne.getByRole("button", { name: "Skip" }).click();

            // Wait for the page to update (react), without using hard timeout

            lastPersonName = currentPersonName;
            currentPersonName = await pageOne.locator("h1").textContent();
        }
    });
    test("Pledges page displays all pledges correctly", async ({ page }) => {
        await page.goto("/pledges");

        const { data: pledges } = await db.from("pledges").select("*");
        for (const pledge of pledges) {
            await expect(page.getByText("$" + pledge.amount)).toBeVisible();
        }
    });
    test("Contact History page displays all past call attempts correctly", async ({ page }) => {
        await page.goto("/interactions");

        const { data: interactions } = await db
            .from("interactions")
            .select("*")
            .eq("organization_id", orgID);
        for (const interaction of interactions) {
            await expect(page.getByText(interaction.note)).toBeVisible();
        }
    });

    // ****************
    // Jacobs additions
    test("Edit bio, occupation, employer", async ({ page }) => {
        // Just need to write the test
        const { data: person } = await db
            .from("people")
            .select("*, donations (*)")
            .limit(1)
            .single();
        await page.goto("/people/" + person.id);

        // Bio
        const newValues = {
            "edit bio": "A new example bio",
            "edit occupation": "New occupation",
            "edit employer": "New employer",
        };
        for (const [ariaName, value] of Object.entries(newValues)) {
            const form = await page.getByRole("form", { name: ariaName });
            form.getByRole("button").click();
            form.getByRole("textbox").type(value);
            form.getByRole("button", { name: "Save" }).click();
        }
        // Await the persistance
        await page.waitForLoadState("networkidle");

        // Check that the changes were made on the page
        for (const [ariaName, value] of Object.entries(newValues)) {
            await expect(page.getByText(value)).toBeVisible();
        }

        // Check the db that changes were persisted
        const { data: updatedPerson } = await db
            .from("people")
            .select("*, donations (*)")
            .eq("id", person.id)
            .single();
        await expect(updatedPerson.bio).toBe("A new example bio");
        await expect(updatedPerson.occupation).toBe("New occupation");
        await expect(updatedPerson.employer).toBe("New employer");
    });
    test("Import multiple phone numbers", async ({ page }) => {
        // mock file will be in __e2e__/mocks/import-multiple-phone-numbers-prospects-test.csv
        // mock file will be in __e2e__/mocks/import-multiple-phone-numbers-donations-test.csv

        const fileName = "__e2e__/mocks/import-multiple-phone-numbers-prospects-test.csv";

        await page.goto("/import");
        await page.getByRole("radio", { name: "Prospects" }).click();
        await page.getByRole("button", { name: "Next step" }).click();
        const fileChooserPromise = page.waitForEvent("filechooser");
        await page.getByText("Browse").click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(fileName);
        await page.waitForSelector("h2");
        await expect(page.getByText("File uploaded successfully")).toBeVisible();
        await page.getByRole("button", { name: "Upload another file" }).click();
        await expect(page.getByText("Are you importing donations/donors,")).toBeVisible();

        const { people } = db.from("people").select("*, phone_numbers(count)");
        let areThereMultiplePhones = false;
        for (const person of people) {
            if (person.phone_numbers.count > 1) {
                areThereMultiplePhones = true;
                break;
            }
        }
        await expect(areThereMultiplePhones).toBe(true);
    });
    test.skip("Calling cycles through each phone number in a contact before advancing", async ({
        page,
    }) => {
        // TODO
    });
    test("Import bio field", async ({ page }) => {
        const { count } = await db
            .from("people")
            .select("*", { count: "exact", head: true })
            .not("bio", "is", null);
        expect(count).toBe(0);

        await page.goto("/import");
        await page.getByRole("radio", { name: "Prospects" }).click();
        await page.getByRole("button", { name: "Next step" }).click();
        const fileChooserPromise = page.waitForEvent("filechooser");
        await page.getByText("Browse").click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles("__e2e__/mocks/upload-bio-column-test-prospects.csv");
        await page.waitForSelector("h2");
        await expect(page.getByText("File uploaded successfully")).toBeVisible();
        await page.getByRole("button", { name: "Upload another file" }).click();
        await expect(page.getByText("Are you importing donations/donors,")).toBeVisible();

        const { count: secondCount } = await db
            .from("people")
            .select("*", { count: "exact", head: true })
            .not("bio", "is", null);
        expect(secondCount).toBeGreaterThan(0);
    });
    test("Import with a tag column", async ({ page }) => {
        const { count } = await db.from("tags").select("*", { count: "exact", head: true });
        expect(count).toBe(0);

        await page.goto("/import");
        await page.getByRole("radio", { name: "Prospects" }).click();
        await page.getByRole("button", { name: "Next step" }).click();
        const fileChooserPromise = page.waitForEvent("filechooser");
        await page.getByText("Browse").click();
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles("__e2e__/mocks/upload-tag-column-test-prospects.csv");
        await page.waitForSelector("h2");
        await expect(page.getByText("File uploaded successfully")).toBeVisible();
        await page.getByRole("button", { name: "Upload another file" }).click();
        await expect(page.getByText("Are you importing donations/donors,")).toBeVisible();

        const { count: secondCount } = await db
            .from("tags")
            .select("*", { count: "exact", head: true });
        expect(secondCount).toBeGreaterThan(0);
    });
    test.skip("Start calling from a single person", async ({ page }) => {
        // TODO
    });
});
