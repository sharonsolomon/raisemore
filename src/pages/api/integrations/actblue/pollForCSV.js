import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import { createSupabaseClient } from "lib/supabaseHooks";
import { getAuth } from "@clerk/nextjs/server";
import { BASE_URI } from "pages/api/integrations/actblue/requestCSV";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req) {
    // Supabase
    const supabaseServiceRole = createSupabaseClient(null, { serviceRole: true });

    // Get the id from body
    const { id, orgID } = req.body;

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
    const { created_at } = data;
    const now = new Date();
    const diff = now - created_at;
    if (diff > 600000) {
        // Send off an error report
        return NextResponse.json({ error: "Request timed out" }, { status: 500 });
    }

    // Start polling
    for (let i = 0; i < 20; i++) {
        const response = await fetch(`${BASE_URI}/csvs/${id}`);
        const csv = await response.json();

        if (!csv?.download_url) {
            // Wait a second and then try again
            await sleep(750);
            break;
        }

        const { error } = await supabaseServiceRole
            .from("actblue_csv_requests")
            .update({ download_url: csv.download_url })
            .eq("actblue_request_id", id)
            .eq("organization_id", orgID);

        if (error) {
            console.error(error);
            return NextResponse.json(error, { status: 500 });
        }

        // Send a fetch request to the processActblueCSV function
        fetch("/api/integrations/actblue/processActblueCSV", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, orgID }),
        });

        return NextResponse.json({ status: "URL saved and dispatched" });
    }

    // Start a new edge function and end this one
    fetch("/api/integrations/actblue/pollForCSV", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, orgID }),
    });

    return NextResponse.json({ status: "ok" });
}
