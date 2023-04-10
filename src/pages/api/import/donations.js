import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import { getAuth } from "@clerk/nextjs/server";
const { v4: uuid } = require("uuid");
const Papa = require("papaparse"); // Handles csvs
import { createSupabaseClient } from "lib/supabaseHooks";
import { EMAIL_VALIDATION_REGEX } from "lib/validation";
import { ObjectType } from "@clerk/nextjs/dist/api";
// List of columns in order from csv file
let permitTheseColumns = [
    "person_id",
    "id",
    "batch_id",
    "organization_id",
    "receipt_id",
    "date",
    "amount",
    "recurring_total_months",
    "recurrence_number",
    "recipient",
    "fundraising_page",
    "fundraising_partner",
    "reference_code_2",
    "reference_code",
    "donor_first_name",
    "donor_last_name",
    "donor_addr1",
    "donor_addr2",
    "donor_city",
    "donor_state",
    "donor_zip",
    "donor_country",
    "donor_occupation",
    "donor_employer",
    "donor_email",
    "donor_phone",
    "new_express_signup",
    "comments",
    "check_number",
    "check_date",
    "employer_addr1",
    "employer_addr2",
    "employer_city",
    "employer_state",
    "employer_zip",
    "employer_country",
    "donor_id",
    "fundraiser_id",
    "fundraiser_recipient_id",
    "fundraiser_contact_email",
    "fundraiser_contact_first_name",
    "fundraiser_contact_last_name",
    "partner_id",
    "partner_contact_email",
    "partner_contact_first_name",
    "partner_contact_last_name",
    "lineitem_id",
    "ab_test_name",
    "ab_variation",
    "recipient_committee",
    "recipient_id",
    "recipient_gov_id",
    "recipient_election",
    "payment_id",
    "payment_date",
    "disbursement_id",
    "disbursement_date",
    "recovery_id",
    "recovery_date",
    "refund_id",
    "refund_date",
    "fee",
    "recur_weekly",
    "actblue_express_lane",
    "card_type",
    "mobile",
    "recurring_upsell_shown",
    "recurring_upsell_succeeded",
    "double_down",
    "smart_recurring",
    "monthly_recurring_amount",
    "apple_pay",
    "card_replaced_by_account_updater",
    "actblue_express_donor",
    "custom_field_1_label",
    "custom_field_1_value",
    "donor_us_passport_number",
    "text_message_opt_in",
    "gift_identifier",
    "gift_declined",
    "shipping_addr1",
    "shipping_city",
    "shipping_state",
    "shipping_zip",
    "shipping_country",
    "weekly_recurring_amount",
    "smart_boost_amount",
    "smart_boost_shown",
    "bio",
    "tags",
];

// Load csv of donations to donation and people table
export default async function loadDonationsCSV(req, res) {
    const { searchParams } = new URL(req.url);
    let fileName = searchParams.get("fileName");

    // Clerk
    const { orgId: orgID, getToken, userId: userID } = getAuth(req);

    // No unauthorized access
    if (!orgID) return res.status(401).send();

    // Supabase
    const supabase = createSupabaseClient(
        await getToken({
            template:
                process.env.NEXT_PUBLIC_ENVIRONMENT != "development"
                    ? "supabase"
                    : "supabase-local-development",
        })
    );
    const supabaseServiceRole = createSupabaseClient(null, { serviceRole: true });

    // Assign a unique batch ID for transaction integrity
    const batchID = uuid();
    console.log({ batchID });
    supabase
        .from("import_batches")
        .insert([{ id: batchID, file_url: fileName, organization_id: orgID, user_id: userID }]);

    // Log the time of function execution
    console.time("functionexectime");
    console.log("------");
    console.log("loadDonationsCSV()");

    // Load the file from the bucket
    const rawContent = await loadFile({ fileName, supabaseServiceRole });

    // Parse the csv file to an array of well-formed donation objects
    const fileParsedToJSON = donationsCSVtoArray({ rawContent, batchID, orgID });

    // Major refactoring for code reuse
    const resultingPromises = await processDonations({
        fileParsedToJSON,
        supabase,
        supabaseServiceRole,
        orgID,
        batchID,
    });

    await supabase
        .from("import_batches")
        .upsert([{ id: batchID, finalized: new Date().toISOString() }]);
    console.timeEnd("functionexectime");

    // res.send(`File uploaded successfully, and ${fileParsedToJSON.length} records processed.`);
    return new Response(
        `File uploaded successfully, and ${fileParsedToJSON.length} records processed.`
    );
}

async function loadFile({ fileName, supabaseServiceRole }) {
    console.time("load file");
    // Get the file from supabase storage
    const { data: fileBlob, error } = await supabaseServiceRole.storage
        .from("public/imports")
        .download(fileName);
    let rawContent = await fileBlob.text();
    console.log("rawContent.length", rawContent.length);
    console.timeEnd("load file");
    return rawContent;
}

export function donationsCSVtoArray({ rawContent, batchID, orgID }) {
    console.time("parse file");
    let { data: fileParsedToJSON } = Papa.parse(rawContent, {
        header: true,
        skipEmptyLines: true,
        delimiter: ",",
        transformHeader: (header) => header.trim().replaceAll(" ", "_").toLowerCase(),
    });

    // Add the batch ID
    fileParsedToJSON = fileParsedToJSON.map((row) => ({
        ...row,
        batch_id: batchID,
        organization_id: orgID,
    }));

    // This is not necessary anymore because of later normalization before insert
    // Loop through every row and drop every key that is not present in permitTheseColumns
    // fileParsedToJSON = stripKeys(fileParsedToJSON, permitTheseColumns);

    console.timeEnd("parse file");

    return fileParsedToJSON;
}

export async function processDonations({
    fileParsedToJSON,
    supabase,
    supabaseServiceRole,
    orgID,
    batchID,
}) {
    // Grab the people collection as an array of rows
    console.time("people query");
    const { data: people } = await supabaseServiceRole
        .from("people")
        .select("*, emails (*), phone_numbers(*)")
        .eq("organization_id", orgID);
    console.timeEnd("people query");
    console.time("edit file");

    // Hashmap by email and fullname
    const hashByEmail = new Map();
    const hashByFullname = new Map();
    people.forEach((person, i) => {
        hashByFullname.set(person.first_name + "|" + person.last_name, i);
        for (const emailRecord of person.emails) {
            hashByEmail.set(emailRecord.email, i);
        }
    });

    // Keep track of who has been updated
    const peopleIndexesToUpsert = [],
        newEmails = [],
        newPhones = [],
        newTags = [];

    // Loop through donation objects
    for (let index = 0; index < fileParsedToJSON.length; index++) {
        const donation = fileParsedToJSON[index];

        // Create an object to hold new information, desctructre to remove the email and phones
        const { tags, email, phones, ...newPerson } = {
            ...newPersonFromDonationObject(donation),
            batch_id: batchID,
            organization_id: orgID,
        };

        // Does person already exist? Try by email and fullname and only coalesce to default upon nullish (?? instead of ||)
        let matchingIndex = email
            ? hashByEmail.get(email) ?? people.length
            : hashByFullname.get(donation?.donor_first_name + "|" + donation?.donor_last_name) ??
              people.length;

        // If the person doesn't already exist, assign them a new UUID
        const personID = matchingIndex == people.length ? uuid() : people[matchingIndex].id;

        // Update person with donor info from donation
        const oldPerson = people[matchingIndex];
        people[matchingIndex] = { ...oldPerson, ...newPerson, id: personID };

        // If email isn't present, upload it
        if (!hashByEmail.has(email) && EMAIL_VALIDATION_REGEX.test(email)) {
            const newEmailRecord = {
                email: email,
                person_id: personID,
                primary_for: personID,
                batch_id: batchID,
            };
            const oldEmails = people[matchingIndex]?.emails || [];
            people[matchingIndex].emails = [...oldEmails, newEmailRecord];
            newEmails.push(newEmailRecord);
        }

        // Handle multiple phones
        for (const phone of phones) {
            const validated_phone_number = Number(phone?.toString().replaceAll("[^0-9]", ""));
            const phoneIsValid = validated_phone_number?.toString().length === 10;
            if (
                phoneIsValid &&
                (matchingIndex == people.length ||
                    !people[matchingIndex]?.phone_numbers
                        ?.map((phoneRecord) =>
                            phoneRecord.phone_number.toString().replaceAll("[^0-9]", "")
                        )
                        .includes(validated_phone_number.toString()))
            ) {
                const newPhoneRecord = {
                    phone_number: validated_phone_number,
                    person_id: personID,
                    batch_id: batchID,
                };
                const oldPhones = people[matchingIndex]?.phone_numbers || [];
                people[matchingIndex].phone_numbers = [...oldPhones, newPhoneRecord];
                newPhones.push(newPhoneRecord);
            }
            // TODO: else {throw a validation error;}
        }

        // Tags!
        tags?.split(",")
            ?.map((tag) => tag.trim())
            ?.filter((tag) => typeof tag === "string" && tag?.length > 0)
            ?.forEach((tag) =>
                newTags.push({
                    tag,
                    person_id: personID,
                    organization_id: orgID,
                    batch_id: batchID,
                })
            );

        // Adjust name and email hashes for future searches
        hashByFullname.set(newPerson.first_name + "|" + newPerson.last_name, matchingIndex);
        if (email) hashByEmail.set(email, matchingIndex);

        // Keep track of the changes we've made to people, and inject its id as new donation object's foreign key
        peopleIndexesToUpsert.push(matchingIndex);
        fileParsedToJSON[index].person_id = personID;
        // console.log({ matchingIndex });
    }
    console.timeEnd("edit file");

    // OK we are actually going to insert People first bc of foreign key
    console.time("upsert records into people");

    let peopleToUpsert = [...new Set(peopleIndexesToUpsert)].map((recordIndex) => ({
        ...people[recordIndex],
        organization_id: orgID,
        batch_id: batchID,
    }));
    // Strip keys not present in newPersonFromDonationObject()
    console.log("dropping some people keys");
    peopleToUpsert = stripKeys(
        peopleToUpsert,
        Object.keys({
            ...newPersonFromDonationObject(),
            id: null,
            organization_id: null,
            batch_id: null,
        })
    );

    const peopleInsertResults = await supabase
        .from("people")
        .upsert(peopleToUpsert, { ignoreDuplicates: false })
        .select("id");
    if (peopleInsertResults?.error) {
        console.error(peopleInsertResults?.error);
        return NextResponse.json(peopleInsertResults.error, { status: 400 });
    }

    const phoneInsertResults = await supabase
        .from("phone_numbers")
        .upsert(
            newPhones.map((newRecordObject) => ({
                ...newRecordObject,
                organization_id: orgID,
                batch_id: batchID,
            })),
            { ignoreDuplicates: false }
        )
        .select("id");
    if (phoneInsertResults?.error) {
        console.error(phoneInsertResults?.error);
        return NextResponse.json(phoneInsertResults.error, { status: 400 });
    }

    const emailsInsertResults = await supabase
        .from("emails")
        .upsert(
            newEmails.map((newRecordObject) => ({
                ...newRecordObject,
                organization_id: orgID,
                batch_id: batchID,
            })),
            { ignoreDuplicates: false }
        )
        .select("id");
    if (emailsInsertResults?.error) {
        console.error(emailsInsertResults?.error);
        return NextResponse.json(emailsInsertResults.error, { status: 400 });
    }

    // Upsert tags
    const { error: tagInsertError } = await supabase
        .from("tags")
        .upsert(newTags, { ignoreDuplicates: true })
        .select("id");
    if (tagInsertError) {
        console.error(tagInsertError);
        return NextResponse.json(tagInsertError, { status: 400 });
    }

    console.timeEnd("upsert records into people");

    console.time("upload donations to db");
    console.log("dropping some donation keys");
    const donationsToInsert = stripKeys(fileParsedToJSON, permitTheseColumns);
    const chunkSize = 100;
    const donationsInsertResults = [];
    for (let i = 0; i < fileParsedToJSON.length; i += chunkSize) {
        donationsInsertResults.push(
            supabase.from("donations").insert(donationsToInsert.slice(i, i + chunkSize))
        );
    }

    const finalResponses = await Promise.allSettled(donationsInsertResults);

    // TODO: Need better error handling:
    console.timeEnd("upload donations to db");

    return finalResponses;
}

// Standarized!
export const cleanPhone = (phone) =>
    Number(
        phone
            ?.trim()
            .toString()
            .replaceAll(/[^0-9]/g, "")
            .substring(0, 10)
    );

function newPersonFromDonationObject(donation = {}) {
    // Multiple phone fields
    const phoneFields = Object.keys(donation).filter(
        (field) => field.startsWith("donor_phone") || field.startsWith("phone")
    );
    const phones = phoneFields?.map((phoneField) => cleanPhone(donation[phoneField]));
    return {
        // Basic assignments
        last_name: donation?.donor_last_name?.trim(),
        first_name: donation?.donor_first_name?.trim(),
        email: donation?.donor_email?.trim(),
        phones,
        employer: donation?.donor_employer?.trim(),
        occupation: donation?.donor_occupation?.trim(),
        bio: donation?.bio?.trim(),
        tags: donation?.tags?.trim(),

        // Address
        addr1: donation?.donor_addr1?.trim(),
        addr2: donation?.donor_addr2?.trim(),
        city: donation?.donor_city?.trim(),
        state: donation?.donor_state?.trim(),
        country: donation?.donor_country?.trim(),
        zip: donation?.donor_zip?.trim(),
    };
}

export function stripKeys(arr, options) {
    const randomLabel = Math.random().toString(36).substring(7);
    console.time("stripkeys" + randomLabel);

    const permitTheseKeys = Array.isArray(options) ? options : options.keep;
    const requiredKeys = options?.require || [];

    if (!Array.isArray(arr) || !(arr?.length > 0) || typeof arr[0] !== "object") return arr;

    // Quick algorithm change, let's assume keys are the same in each row.
    const approvedAndPresentKeyHash = permitTheseKeys.reduce((accumulator, key) => {
        if (arr[0].hasOwnProperty(key)) accumulator[key] = true;
        return accumulator;
    }, {});

    // Diff arr keys with approved keys
    const keysWeAreDropping = Object.keys(arr[0]).filter(
        (key) => !approvedAndPresentKeyHash.hasOwnProperty(key)
    );
    console.log({ keysWeAreDropping });

    // Construct a new array with every row but only with the approved keys
    const newArray = arr
        ?.filter((row) =>
            requiredKeys.every(
                (requiredKey) => row.hasOwnProperty(requiredKey) && row[requiredKey] !== null
            )
        )
        ?.map((row) =>
            Object.keys(approvedAndPresentKeyHash).reduce((accumulator, key) => {
                accumulator[key] = row[key];
                return accumulator;
            }, {})
        );
    console.timeEnd("stripkeys" + randomLabel);
    return newArray;
}
