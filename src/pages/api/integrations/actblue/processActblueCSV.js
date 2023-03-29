// Now let's read the CSV file and process it
// Path: src/pages/api/integrations/actblue/processActblueCSV.js
// Compare this snippet from src/pages/api/integrations/actblue/pollForCSV.js:

import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import { createSupabaseClient } from "lib/supabaseHooks";
import { processDonations } from "pages/api/loadDonationsCSV";

export default async function handler(req) {
    // Supabase
    const supabaseServiceRole = createSupabaseClient(null, { serviceRole: true });

    const { data } = supabaseServiceRole
        .from("actblue_csv_requests")
        .select()
        .eq("actblue_request_id", id)
        .single();

    const { download_url } = data;

    // Download the csv file
    const response = await fetch(download_url);
    const csv = await response.text();

    // Process the csv file
    const donations = await processDonations(csv);
}
