import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import { createSupabaseClient } from "lib/supabaseHooks";
import { getAuth } from "@clerk/nextjs/server";

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
        .eq("organization_id", orgID")
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
    const loop = pollCSV(id);

    // Wait 20 seconds and clear interval (edge function is limited to 30 seconds)
    setTimeout(() => {
        clearInterval(loop);
    }, 20000);

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

const pollCSV = async (csvUUID) => {
    const loop = setInterval(async () => {
        const response = await fetch(`${BASE_URI}/csvs/${csvUUID}`);
        const csv = await response.json();
        if (csv.download_url) {
            clearInterval(loop);
            const response = await fetch(csv.download_url);
            const csv = await response.text();
            console.log(csv);
        }
    }, 1000);
    return loop;
};