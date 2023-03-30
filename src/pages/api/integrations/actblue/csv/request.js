import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import { createSupabaseClient } from "lib/supabaseHooks";
import { getAuth } from "@clerk/nextjs/server";
export const BASE_URI = "https://secure.actblue.com/api/v1";

export default async function handler(req) {
    console.log("Requesting CSV");

    if (req.method !== "POST") {
        console.log("Not POST");
        return Response.json("Actblue request init must be a POST request", {
            status: 405,
            statusText: "Method Not Allowed",
        });
    }
    // Clerk
    console.log("b");

    const { orgId: orgID, getToken, userId: userID } = getAuth(req);
    // For testing:
    // const orgID = "org_2MN0oHoBqEyuDYfFBX8UvB5bKFo";

    console.log("after clerk");

    // No unauthorized access
    if (!orgID) {
        console.error("no orgid");
        return NextResponse.json("no org id", { status: 401 });
    }

    // Supabase
    console.log("get credentials");
    const supabaseServiceRole = createSupabaseClient(null, { serviceRole: true });

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

    const body = {
        csv_type: "paid_contributions",
        // 6 months range: (the maximum allowed by ActBlue)
        // date_range_start: new Date(new Date().setDate(new Date().getDate() - 180)).toISOString(),
        // date_range_end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
        date_range_start: "2020-07-08",
        date_range_end: "2020-12-28",
    };

    let response = await fetch(`${BASE_URI}/csvs`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${btoa(`${client_uuid}:${client_secret}`)}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    const csv = await response.json();
    const id = csv.id;
    if (!id) {
        console.error("no csv id!" + JSON.stringify(csv));
        return NextResponse.json("no csv id!" + JSON.stringify(csv), { status: 500 });
    }

    // Put it in the DB
    console.log("put in db");
    const { data, error } = await supabaseServiceRole.from("actblue_csv_requests").insert({
        actblue_request_id: id,
        organization_id: orgID,
    });
    if (error) {
        console.error(error);
        return NextResponse.json(error, { status: 500 });
    }

    console.log("start polling");
    // Start polling
    fetch(`${process.env.ENVIRONMENT_URL}/api/integrations/actblue/csv/poll`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, orgID }),
    });

    return Response.json("Successfully posted and logged request, started polling");
}
