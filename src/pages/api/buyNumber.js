import { NextResponse } from "next/server";
import twilioInit from "twilio";
import { createAuthorizedSupabase } from "lib/supabaseHooks";
import { cleanPhone } from "lib/validation";

// config for new callerid numbers
const additional = {
    // voiceCallerIdLookup: true, // TODO: look more into documentation on this
    voiceUrl: "https://www.raisemore.app/api/dialer/incomingCall",
    voiceMethod: "POST",
    smsUrl: "https://www.raisemore.app/api/dialer/incomingSms",
    smsMethod: "POST",
};

// Buy a phone number from Twilio and add it to the caller_ids table
export default async function handler(req) {
    const { supabase, orgID, error: authError } = await createAuthorizedSupabase(req);
    if (authError) throw error;

    const { areaCode } = req.query;
    if (!areaCode) throw "Missing area code";
    console.log({ areaCode });

    const twilio = twilioInit(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const twilioResponse = await twilio.incomingPhoneNumbers.create({
        areaCode,
        ...additional,
    });
    if (!twilioResponse?.phoneNumber) throw JSON.stringify(twilioResponse);
    // Upsert the caller id per organization (multiple are not allowed):
    const { error } = await supabase.from("caller_ids").upsert(
        {
            phone_number: cleanPhone(twilioResponse.phoneNumber),
            twilio_sid: twilioResponse.sid,
            organization_id: orgID,
        },
        { onConflict: "organization_id" }
    );
    if (error) throw JSON.stringify(error);

    return NextResponse.json(twilioResponse);
}
