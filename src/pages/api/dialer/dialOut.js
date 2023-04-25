import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import { Authorization, TWILIO_API_URL } from "lib/twilio";
import queryParams from "lib/queryParams";

export default async function handler(request) {
    const { conferenceSID, numberToDial, personID, callerID } = queryParams({ config, request });

    const response = await fetch(
        `${TWILIO_API_URL}/Conferences/${conferenceSID}/Participants.json`,
        {
            method: "POST",
            headers: new Headers({
                ...Authorization,
                "Content-Type": "application/x-www-form-urlencoded",
            }),

            body: new URLSearchParams({
                Label: "outboundCall|" + personID.toString() || "error recieving personid",
                EarlyMedia: "True",
                Beep: "True",
                // statusCallback: 'https://example.com',
                // statusCallbackEvent: ['ringing'],
                // record: true,
                From: callerID,
                To: "+1" + numberToDial,
            }).toString(),
        }
    );
    const responseJSON = await response.json();
    console.log({ responseJSON });
    return NextResponse.json(responseJSON);
}
