import { NextResponse } from "next/server";
// Page can't fedge itself on edge but works fine on node? weird but ok.
// export const config = { runtime: "edge" };
import { createSupabaseClient } from "lib/supabaseHooks";
import { getAuth } from "@clerk/nextjs/server";
import { BASE_URI } from "pages/api/integrations/actblue/csv/request";

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
    console.log("Polling for CSV");
    // Supabase
    const supabaseServiceRole = createSupabaseClient(null, { serviceRole: true });

    // Get the id from body
    const body = await req.body;
    console.log({ body });
    const { id, orgID } = body;

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

    const { data: credential, credentialError } = await supabaseServiceRole
        .from("actblue_csv_credentials")
        .select()
        .eq("organization_id", orgID)
        .single();

    if (credentialError) {
        console.error(credentialError);
        return NextResponse.json(credentialError, { status: 500 });
    }

    const { client_uuid, client_secret } = credential;

    // Start polling
    for (let i = 0; i < 6; i++) {
        const response = await fetch(`${BASE_URI}/csvs/${id}`, {
            method: "GET",
            headers: {
                Authorization: `Basic ${btoa(`${client_uuid}:${client_secret}`)}`,
            },
        });
        const csv = await response.json();
        console.log({ csv });

        if (!csv?.download_url) {
            console.log("loop" + i);
            // Wait a second and then try again
            await sleep(750);
            continue;
        }

        console.log("got file");

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
        fetch(`${process.env.ENVIRONMENT_URL}/api/integrations/actblue/csv/process`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id, orgID }),
        });

        return NextResponse.json({ status: "URL saved and dispatched" });
    }

    console.log("end for loop and make fetch");

    // Start a new edge function and end this one
    fetch(`${process.env.ENVIRONMENT_URL}/api/integrations/actblue/csv/poll`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, orgID }),
    });

    return NextResponse.json({ status: "ok" });
}
