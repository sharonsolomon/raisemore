const { v4: uuid } = require("uuid");
import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import { createSupabaseClient } from "lib/supabaseHooks";
import { processDonations } from "pages/api/loadDonationsCSV";

export default async function handler(req) {
    console.log("process actblue webhook handler()");
    console.time("processWebhook");

    if (req.method !== "POST") {
        return new Response(null, {
            status: 405,
            statusText: "Linking call must be a POST",
        });
    }

    let JSONbody;
    try {
        JSONbody = await req.json();
    } catch (e) {
        console.error(e);
        return NextResponse.json("400 Bad Request POST body JSON unparseable", {
            status: 400,
            statusText: "Bad Request",
        });
    }

    const { id } = JSONbody;

    // Pull from DB for processing
    const supabaseServiceRole = createSupabaseClient(null, { serviceRole: true });
    const { data, error } = await supabaseServiceRole
        .from("actblue_webhooks")
        .select()
        .eq("id", id)
        .single();
    if (error) {
        return Response.json(error, {
            status: 500,
            statusText: "Server Error",
        });
    }

    // Process the original webhook
    const { webhook_body: webhook, organization_id: orgID } = data;

    // Mapping...
    const donationObject = {
        organization_id: orgID,
        receipt_id: webhook?.contribution?.orderNumber,
        date: webhook?.contribution?.createdAt,
        amount: webhook?.lineitems[0]?.amount,
        recurring_total_months: webhook?.lineitems[0]?.recurringDuration,
        // "recurrence_number":null,
        recipient: webhook?.lineitems[0]?.committeeName,
        // "fundraising_page", // There's no URL, it might be webhook?.form?.name which is the form's name but not url
        // "fundraising_partner",
        reference_code_2: webhook?.contribution?.refcodes?.refcode2,
        reference_code: webhook?.contribution?.refcodes?.refcode,
        donor_first_name: webhook?.donor?.firstname,
        donor_last_name: webhook?.donor?.lastname,
        donor_addr1: webhook?.donor?.addr1,
        donor_addr2: webhook?.donor?.addr2,
        donor_city: webhook?.donor?.city,
        donor_state: webhook?.donor?.state,
        donor_zip: webhook?.donor?.zip,
        donor_country: webhook?.donor?.country,
        donor_occupation: webhook?.donor?.employerData?.occupation,
        donor_employer: webhook?.donor?.employerData?.employer,
        donor_email: webhook?.donor?.email,
        donor_phone: webhook?.donor?.phone,
        new_express_signup: webhook?.donor?.expressSignup,
        // "comments":,
        // "check_number",
        // "check_date",
        employer_addr1: webhook?.donor?.employerData?.employerAddr1,
        employer_addr2: webhook?.donor?.employerData?.employerAddr2,
        employer_city: webhook?.donor?.employerData?.employerCity,
        employer_state: webhook?.donor?.employerData?.employerState,
        employer_zip: webhook?.donor?.employerData?.employerZip, // undocumented?
        employer_country: webhook?.donor?.employerData?.employerCountry,
        // "donor_id",
        // "fundraiser_id",
        // "fundraiser_recipient_id",
        // "fundraiser_contact_email",
        // "fundraiser_contact_first_name",
        // "fundraiser_contact_last_name",
        // "partner_id",
        // "partner_contact_email",
        // "partner_contact_first_name",
        // "partner_contact_last_name",
        lineitem_id: webhook?.lineitems[0]?.lineitemId,
        ab_test_name: webhook?.contribution?.abTestName,
        ab_variation: webhook?.contribution?.abTestVariation,
        recipient_committee: webhook?.lineitems[0]?.committeeName,
        recipient_id: webhook?.lineitems[0]?.entityId,
        recipient_gov_id: webhook?.lineitems[0]?.fecId,
        // "recipient_election",
        payment_id: webhook?.lineitems[0]?.paymentId,
        payment_date: webhook?.lineitems[0]?.paidAt,
        // "disbursement_id":webhook?.lineitems[0]?.,
        // "disbursement_date",
        // "recovery_id",
        // "recovery_date",
        // "refund_id",
        // "refund_date",
        // "fee",
        // "recur_weekly",
        actblue_express_lane: webhook?.contribution?.isExpress ? "t" : "",
        // "card_type",
        mobile: webhook?.contribution?.isMobile ? "t" : "",
        // "recurring_upsell_shown",
        // "recurring_upsell_succeeded",
        // "double_down",
        // "smart_recurring",
        monthly_recurring_amount: webhook?.lineitems[0]?.recurringAmount,
        // "apple_pay",
        // "card_replaced_by_account_updater",
        actblue_express_donor: webhook?.donor?.isEligibleForExpressLane,
        custom_field_1_label: webhook?.contribution?.customFields[0]?.label,
        custom_field_1_value: webhook?.contribution?.customFields[0]?.answer,
        // "donor_us_passport_number",
        text_message_opt_in: webhook?.contribution?.textMessageOption,
        gift_identifier: webhook?.contribution?.giftIdentifier,
        gift_declined: webhook?.contribution?.giftDeclined,
        shipping_addr1: webhook?.contribution?.shippingAddr1,
        shipping_city: webhook?.contribution?.shippingCity,
        shipping_state: webhook?.contribution?.shippingState,
        shipping_zip: webhook?.contribution?.shippingZip,
        shipping_country: webhook?.contribution?.shippingCountry,
        // "weekly_recurring_amount",
        smart_boost_amount: webhook?.contribution?.smartBoostAmount,
        // smart_boost_shown: webhook?.contribution?.smartBoostAmount,
    };

    // Processing with reused function from loadDonationsCSV
    const resultingPromises = await processDonations({
        fileParsedToJSON: [donationObject],
        supabase: supabaseServiceRole,
        supabaseServiceRole,
        orgID,
        batchID: uuid(),
    });

    // resultingPromises.forEach((result) => console.log({ result }));
    // console.log({ resultingPromises });

    console.timeEnd("processWebhook");

    // Update db record to show it was processed
    const showWebhookProcessedResponse = await supabaseServiceRole
        .from("actblue_webhooks")
        .update({ processed: true })
        .eq("id", id);
    if (showWebhookProcessedResponse?.error) {
        console.error(showWebhookProcessedResponse?.error);
        return Response.json(showWebhookProcessedResponse?.error, {
            status: 500,
            statusText: "Server Error",
        });
    }

    return NextResponse.json({ resultingPromises }, { status: 200 });
}
