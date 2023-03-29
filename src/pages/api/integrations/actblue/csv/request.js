import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import { createSupabaseClient } from "lib/supabaseHooks";
import { getAuth } from "@clerk/nextjs/server";
export const BASE_URI = "https://secure.actblue.com/api/v1";

export default async function handler(req) {
    // Clerk
    const { orgId: orgID, getToken, userId: userID } = getAuth(req);

    // No unauthorized access
    if (!orgID) return res.status(401).send();

    // Supabase
    const supabaseServiceRole = createSupabaseClient(null, { serviceRole: true });

    const { data: credential } = supabaseServiceRole
        .from("actblue_csv_credentials")
        .select()
        .eq("organization_id", orgID)
        .single();

    const { client_uuid, client_secret } = credential;

    const body = {
        csv_type: "paid_contributions",
        // One year range:
        date_range_start: new Date(new Date().setDate(new Date().getDate() - 365)).toISOString(),
        date_range_end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    };

    const response = await fetch(`${BASE_URI}/csvs`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${Buffer.from(`${client_uuid}:${client_secret}`).toString(
                "base64"
            )}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    const csv = await response.json();
    const id = csv.id;

    // Put it in the DB
    const response = await supabaseServiceRole.from("actblue_csv_requests").insert({
        actblue_request_id: id,
        organization_id: orgID,
    });
    if (response?.error) {
        console.error(error);
        return NextResponse.json(error, { status: 500 });
    }

    // Start polling
    fetch("/api/integrations/actblue/pollForCSV", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, orgID }),
    });
}
