import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import { createSupabaseClient } from "lib/supabaseHooks";

export default async function handler(req) {
    if (req.method !== "POST") {
        return new Response(null, {
            status: 405,
            statusText: "Actblue webhook must be a POST request",
        });
    }

    let webhook_body;
    try {
        webhook_body = await req.json();
    } catch (e) {
        console.error(e);
        return NextResponse.json("400 Bad Request POST body JSON unparseable", {
            status: 400,
            statusText: "Bad Request",
        });
    }

    // Extract basic auth
    const basicAuth = req.headers.get("authorization");
    const authValue = basicAuth?.toString()?.split(" ")[1];
    const [user, pwd] = atob(authValue).split(":");
    if (!basicAuth || !user) {
        return new Response(null, {
            status: 401,
            statusText: "Unauthorized Request",
        });
    }
    // console.log(user);

    // TODO: Need a pw check here to some kind of token table
    const organization_id = user;

    // Now log it to db for later processing
    const supabaseServiceRole = createSupabaseClient(null, { serviceRole: true });

    /* Quick delete for testing only */
    // await supabaseServiceRole
    //     .from("actblue_webhooks")
    //     .delete()
    //     .eq("organization_id", "org_2MN0oHoBqEyuDYfFBX8UvB5bKFo")
    //     .select();

    const { data, error } = await supabaseServiceRole
        .from("actblue_webhooks")
        .insert({
            first_line_item_id: webhook_body.lineitems[0].lineitemid,
            webhook_body,
            organization_id,
        })
        .select()
        .single();
    if (error) {
        return Response.json(error, {
            status: 500,
            statusText: "Server Error",
        });
    }
    // console.log({ data, error });
    const { id } = data;

    // And trigger the next function to process it
    fetch(process.env.ENVIRONMENT_URL + "/api/integrations/actblue/processWebhook", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
    });

    return NextResponse.json(
        { message: "Successfully received webhook, recorded as ID " + id },
        { status: 200 }
    );
}
