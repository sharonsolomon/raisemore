import { Transition } from "@headlessui/react";
import useSWR from "swr";
const fetcher = (url) => fetch(url).then((r) => r.json());
import { useRouter } from "next/router";
// import PageTitle from "components/Layout/PageTitle";
import { PhoneIcon } from "@heroicons/react/24/outline";
import { useState, useEffect, useCallback, useReducer, createContext, useMemo } from "react";
import { useQuery, useSupabase } from "lib/supabaseHooks";
// import { parseSQL } from "react-querybuilder";
import Breadcrumbs from "components/Layout/Breadcrumbs";
import PersonProfile from "components/PersonProfile/PersonProfile";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import { parseSQL } from "react-querybuilder";
import { compilePostgrestQuery } from "lib/compilePostgrestQuery";
import { useOrganization } from "@clerk/nextjs";

export const CallSessionContext = createContext({
    personID: null,
    dial: () => {},
    hangup: () => {},
    outbound: false,
    hasNext: false,
    next: () => {},
    forceFetch: () => {},
    enabled: true,
    needsLogToAdvance: false,
    callSessionID: null,
    session: null,
});

const conferenceUpdatesReducer = (prevState, payload) => {
    // Bulk update
    if (!payload?.hasOwnProperty("new")) {
        return [...payload];
    }

    if (!payload || !payload.hasOwnProperty("new") || !payload.new.hasOwnProperty("created_at")) {
        console.error({
            error: "Conference updates subscription payload invalid",
            payload,
        });
    }

    // Don't push same update entry ID twice to state
    if (prevState.map((item) => item.id).includes(payload.new.id)) {
        return false;
    }

    // Append to end
    return [...prevState, payload.new];
};

export default function CallSessionPage() {
    const router = useRouter();
    const { callSessionID } = router.query;
    const supabase = useSupabase();

    const [conferenceUpdates, appendConferenceUpdate] = useReducer(conferenceUpdatesReducer, []);
    const [forceFetchValue, forceFetchPersonProfile] = useReducer((old) => old + 1, 0);
    const [dialedInFrom, setDialedInFrom] = useState(null);

    const { data: session, mutate: mutateSession } = useQuery(
        supabase
            .from("call_sessions")
            .select("*, saved_lists (*), call_session_participants (*), interactions (*)")
            .eq("id", callSessionID)
            .single()
    );

    const callerID = useOrganization().organization.publicMetadata.callerID;

    let { data: peopleResponse, error } = useQuery(
        compilePostgrestQuery({
            currentQuery: parseSQL(session?.saved_lists?.query),
            supabase,
            table: "people_for_user_display",
        })
    );
    if (error) console.error(error);
    const peopleList = Array.from(peopleResponse?.map((row) => row.id) ?? []);
    console.log({ peopleList });

    const me =
        session?.call_session_participants?.filter(
            (participant) => participant.number_dialed_in_from == dialedInFrom
        )[0] || null;

    // Process conference updates, in order, memoized, to calculate current conference state
    const { dialedIn, outbound, conferenceSID, lastOutboundSid } = useMemo(() => {
        const memoized = {
            conferenceSID: null,
            dialedIn: false,
            outbound: false,
            lastOutboundSid: null,
        };

        // Return defaults if conference hasnt been initialized
        if (!conferenceUpdates?.length) return memoized;

        for (const update of conferenceUpdates) {
            const isItMe = update.call_sid === me?.call_sid;
            const isJoin = update.status_callback_event === "participant-join";
            const isLeave = update.status_callback_event === "participant-leave";
            const isOutbound = update?.participant_label?.includes("outboundCall");

            // Dialed in? boolean
            if (isItMe && isJoin) memoized.dialedIn = true;
            if (isItMe && isLeave) memoized.dialedIn = false;

            // Outbound call? boolean
            if (isOutbound && isJoin) memoized.outbound = true;
            if (isOutbound && isLeave) memoized.outbound = false;

            // Track the last open outbound interaction to force logging
            memoized.lastOutboundSid = update?.call_sid || memoized.lastOutboundSid;
            // Track the most recent twilio conference SID
            memoized.conferenceSID = update?.conference_sid || memoized.conferenceSID;
        }

        return memoized;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conferenceUpdates?.length, session?.id, me?.call_sid]);

    // Handler for dialing in
    useEffect(() => {
        // Ignore onMount
        if (!dialedInFrom) return () => {};

        // Upsert the new dialedInFrom status
        // DONE: correct uniqueness test for upsert
        supabase
            .from("call_session_participants")
            .upsert(
                {
                    call_session_id: callSessionID,
                    number_dialed_in_from: dialedInFrom,
                },
                { onConflict: "call_session_id,number_dialed_in_from" }
            )
            .select()
            .then((response) => {
                console.log(response);
            });
    }, [dialedInFrom, supabase, callSessionID]);

    let hasNext = peopleList?.indexOf(session?.current_person_id) < peopleList?.length - 1;

    function leave() {
        router.push("/dialer");
    }

    // On mount, fetch call_session state and subscribe to table and relational changes
    useEffect(() => {
        console.log("call_sessions.subscribe()");
        const sessionChannel = supabase
            .channel("call_sessions")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "call_sessions",
                    filter: "id=eq." + callSessionID,
                },
                // New is a reserved keyword in JS so to destructure we need to rename
                ({ new: updated }) => {
                    // Single-table refresh
                    // mutateSession((prevState) => ({
                    //     ...prevState,
                    //     ...updated,
                    // }));
                    // TODO: clean this up as an update instead of relational refetch
                    mutateSession();
                }
            )
            .subscribe();

        // Subscribe to call_session_participants to get updated participants and callSIDs
        const participantsChannel = supabase
            .channel("call_session_participants")
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "call_session_participants",
                    filter: "call_session_id=eq." + callSessionID,
                },
                (payload) => {
                    // TODO: clean this up as an update instead of relational refetch
                    mutateSession();
                }
            )
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "interactions",
                    filter: "call_session_id=eq." + callSessionID,
                },
                (payload) => {
                    // TODO: clean this up as an update instead of relational refetch
                    mutateSession();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(sessionChannel);
            supabase.removeChannel(participantsChannel);
        };
    }, [mutateSession, supabase, callSessionID]);

    // Mutation of current person/page triggers fetch
    const setPersonID = useCallback(
        async (newID) => {
            console.log("setPersonID");
            await supabase
                .from("call_sessions")
                .update({ current_person_id: newID })
                .eq("id", callSessionID);
            // Mutation of call_sessions triggers refetch above
            mutateSession();
        },
        [supabase, callSessionID, mutateSession]
    );

    // Find the current person in the list, and move to the next one.
    const nextPerson = useCallback(() => {
        let currentIndex = peopleList.indexOf(session.current_person_id);
        let nextIndex = currentIndex + 1;
        if (nextIndex >= peopleList.length) return false;
        setPersonID(peopleList[nextIndex]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setPersonID, peopleList?.length, session?.current_person_id]);

    useEffect(() => {
        if (!session?.current_person_id && peopleList?.length) {
            setPersonID(peopleList[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setPersonID, peopleList?.length, session?.current_person_id]);

    // On mount, bulk select and setup subscription for conference updates
    useEffect(() => {
        console.log("useEffect 2");

        // Load entire updates
        supabase
            .from("conference_updates")
            .select()
            .order("inserted_at", { ascending: true })
            .then((result) => appendConferenceUpdate(result?.data));

        // Keep realtime updates
        const channel = supabase
            .channel("conference_updates")
            .on(
                "postgres_changes",
                {
                    event: "INSERT",
                    schema: "public",
                    table: "conference_updates",
                    filter: "friendly_name=eq." + callSessionID,
                },
                (payload) => {
                    appendConferenceUpdate(payload);
                    forceFetchPersonProfile();
                }
            )
            .subscribe();
        return () => supabase.removeChannel(channel);
    }, [supabase, callSessionID, forceFetchPersonProfile]);

    async function hangup() {
        return await fetch(
            `/api/dialer/hangup?` +
                new URLSearchParams({
                    conferenceSID,
                    participant: `outboundCall|${session.current_person_id}`,
                }).toString()
        );
    }

    async function dial(number) {
        return await (
            await fetch(
                "/api/dialer/dialOut?" +
                    new URLSearchParams({
                        numberToDial: number.toString(),
                        conferenceSID,
                        personID: session.current_person_id,
                        callerID,
                    }).toString()
            )
        ).json();
    }

    return (
        <div className="dialer-page">
            <div className="dialer-page-above-profile">
                <div className="mx-auto max-w-7xl px-2 ">
                    <Breadcrumbs
                        pages={[
                            {
                                name: "Make Calls",
                                href: "/dialer",
                                current: false,
                            },
                            {
                                name: `Calling list "${session?.saved_lists?.name}"`,
                                href: `/dialer/${callSessionID}`,
                                current: true,
                            },
                        ]}
                    />
                    {/* <PageTitle
                        title={`Dial list: "${session?.saved_lists?.name}"`}
                        descriptor="Enter your phone number below and then dial in to connect."
                    /> */}
                </div>
                <div className="mx-auto max-w-7xl px-2">
                    <div className="p-0 block pb-3 mt-3">
                        <div className="dialer-top-card">
                            {dialedIn ? (
                                <div className="pt-3.5 pb-0.5">
                                    <span className="inline-block">
                                        You&apos;re dialed in to the call session!
                                    </span>
                                    <div className="inline-block align-middle ml-3">
                                        <button
                                            className="text-sm button-xs btn-xs align-center"
                                            type="button"
                                            onClick={leave}
                                        >
                                            <XMarkIcon className="h-4 w-4 align-center inline-flex mx-auto mr-2" />
                                            Leave Session
                                        </button>
                                    </div>
                                </div>
                            ) : !dialedInFrom ? (
                                <form
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        setDialedInFrom(
                                            event.target.dialedInFromInput.value.replaceAll(
                                                /[^0-9]/g,
                                                ""
                                            )
                                        );
                                    }}
                                >
                                    <div className="mt-3 inline-block">
                                        <span className="mr-2 inline-block font-normal text-sm">
                                            Get started dialing:
                                        </span>
                                        <div className="relative inline-block">
                                            <label
                                                htmlFor="dialedInFromInput"
                                                className="absolute -top-2 left-2 inline-block  px-1 text-xs font-medium text-gray-900 bg-blue-50"
                                            >
                                                <span className="inline-block px-1 text-blue-700">
                                                    Your phone number
                                                </span>
                                            </label>
                                            <input
                                                type="tel"
                                                name="dialedInFromInput"
                                                id="dialedInFromInput"
                                                className="mr-2 inline w-48 rounded-md border-0 py-1.5 text-gray-900 shadow-sm placeholder:text-gray-400 ring-2 ring-inset ring-indigo-600 sm:text-sm sm:leading-6 bg-blue-50"
                                                placeholder="(555) 555 - 5555"
                                            />
                                        </div>
                                        <button type="submit" className="btn-primary">
                                            Make calls
                                        </button>
                                    </div>
                                    <h3 className="mt-0 text-blue-700 text-base inline-block ml-5"></h3>
                                </form>
                            ) : (
                                <>
                                    <p className="mt-3.5 mb-1 text-blue-700 text-lg font-semibold inline-block mr-3">
                                        <PhoneIcon className="h-6 w-6 text-blue-700 align-center inline-flex mx-auto mr-2" />{" "}
                                        {process.env.NEXT_PUBLIC_DIALER_NUMBER}
                                    </p>
                                    <p className="mt-2 inline-block text-base font-normal text-blue-700">
                                        Call with your phone to connect to the dialer.
                                    </p>
                                    {/* <p className="mt-2 inline-block text-base text-gray-300 italic">
                                            You should be calling in from {dialedInFrom}
                                        </p> */}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="no-negative-top person-profile">
                <CallSessionContext.Provider
                    value={{
                        enabled: dialedIn,
                        session,
                        dial,
                        hangup,
                        next: nextPerson,
                        hasNext,
                        outbound,
                        needsLogToAdvance: !!session?.needs_log_to_advance,
                        callSessionID: session?.id,
                        forceFetch: forceFetchValue,
                        session,
                        sessionInteractions: session?.interactions,
                        currentPersonID: session?.current_person_id,
                    }}
                >
                    {session?.current_person_id && (
                        // <Transition
                        //     appear={true}
                        //     show={true}
                        //     enter="ease-in duration-500"
                        //     enterFrom="opacity-0"
                        //     enterTo="opacity-100"
                        //     leave="ease-out duration-60"
                        //     leaveFrom="opacity-100"
                        //     leaveTo="opacity-0"
                        //     key={session.current_person_id}
                        // >
                        <PersonProfile personID={session.current_person_id} />
                        // </Transition>
                    )}
                </CallSessionContext.Provider>
            </div>
        </div>
    );
}
