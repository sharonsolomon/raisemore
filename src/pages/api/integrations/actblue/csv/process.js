import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import { createSupabaseClient } from "lib/supabaseHooks";
import { processDonations, donationsCSVtoArray } from "pages/api/loadDonationsCSV";
import { BASE_URI } from "pages/api/integrations/actblue/csv/request";
import { v4 as uuid } from "uuid";

export default async function handler(req) {
    console.log("Processing CSV");
    // Supabase
    const supabaseServiceRole = createSupabaseClient(null, { serviceRole: true });

    // Get the id from body
    const { id, orgID } = await req.json();

    // Check to see how long this process has been going. If it's been more than 10 minutes, shut it down and send off an error report
    const { data, error } = await supabaseServiceRole
        .from("actblue_csv_requests")
        .select()
        .eq("actblue_request_id", id)
        .eq("organization_id", orgID)
        .single();
    if (error) {
        console.error(error);
        return NextResponse.json(error, { status: 500 });
    }
    if (!data) {
        console.error("No actblue csv record found to process");
        return NextResponse.json("No actblue csv record found to process", { status: 500 });
    }
    const { download_url } = data;

    // Download the csv file
    const response = await fetch(download_url);
    const rawContent = await response.text();
    const batchID = uuid();

    // Process the CSV to a set of donations
    const fileParsedToJSON = await donationsCSVtoArray({ rawContent, batchID, orgID });

    // console.log({ fileParsedToJSON });
    // return;

    // Processing with reused function from loadDonationsCSV
    const resultingPromiseResults = await processDonations({
        fileParsedToJSON,
        supabase: supabaseServiceRole,
        supabaseServiceRole,
        orgID,
        batchID,
    });

    // Update the actblue csv request record
    const { data: updateData, error: updateError } = await supabaseServiceRole
        .from("actblue_csv_requests")
        .update({
            status: "processed",
        })
        .eq("actblue_request_id", id)
        .eq("organization_id", orgID)
        .single();
    if (updateError) {
        console.error(updateError);
        return NextResponse.json(updateError, { status: 500 });
    }
}
