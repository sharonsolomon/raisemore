import Link from "next/link";
import PageTitle from "components/Layout/PageTitle";
import Breadcrumbs from "components/Layout/Breadcrumbs";
import CallingSessionsGrid from "components/CallingSessionsGrid";
import { listSubheaderClasses } from "@mui/material";
import { useQuery, useSupabase } from "lib/supabaseHooks";
import { useRouter } from "next/router";

export default function MakeCallsPage() {
    const supabase = useSupabase();
    const router = useRouter();
    const { data: lists } = useQuery(supabase.from("saved_lists").select("*"));
    return (
        <div className="">
            <div className="mx-auto max-w-7xl px-2 ">
                <Breadcrumbs
                    pages={[
                        {
                            name: "Make Calls",
                            href: "/dialer",
                            current: true,
                        },
                    ]}
                />
                <PageTitle title="Make Calls" descriptor="Join or start a calling session." />
            </div>
            <div className="mx-auto max-w-7xl px-2">
                {/* A button for starting a new calling session */}{" "}
                <h3>Start a new calling session:</h3>
                <div className="flex space-x-3 mt-5">
                    <label htmlFor="list" className="block text-sm leading-6 text-gray-700 mt-1.5">
                        List
                    </label>
                    <div className="w-64">
                        <select
                            id="list"
                            name="list"
                            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            {...(!lists?.length && {
                                disabled: true,
                                style: { background: "#eee" },
                            })}
                        >
                            {!lists?.length && <option>No lists available</option>}
                            {lists?.map((list) => (
                                <option key={list.id} value={list.id}>
                                    {list.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button
                        className="btn-primary"
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            const listID = document.getElementById("list").value;
                            supabase
                                .from("call_sessions")
                                .insert({ list_id: listID })
                                .select()
                                .single()
                                .then((newCallSession) => {
                                    router.push("/dialer/" + newCallSession.data.id);
                                });
                        }}
                        {...(!lists?.length && { disabled: true })}
                    >
                        Start a new session
                    </button>
                </div>
                {/* List currently active "calling sessions" as cards. */}{" "}
                <h3>Join an active calling session:</h3>
                <CallingSessionsGrid hideStart={true} />
            </div>
        </div>
    );
}
