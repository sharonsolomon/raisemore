import Link from "next/link";
import Breadcrumbs from "components/Layout/Breadcrumbs";
import PageTitle from "components/Layout/PageTitle";
import InsetInput from "components/InsetInput";
import { randomUUID } from "lib/randomUUID-polyfill";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useSupabase } from "lib/supabaseHooks";
import { useState } from "react";
import { notifyError, notify } from "lib/toasts";

const copy = (v) => {
    navigator.clipboard.writeText(v);
};

const InsetInputWithCopy = (props) => (
    <div className="flex w-full">
        <InsetInput {...props} className={"mt-6 max-w-2xl flex-grow"} />
        <CopyButton value={props?.placeholder ?? props?.value} />
    </div>
);

const CopyButton = ({ value }) => {
    const [isCopied, setIsCopied] = useState(false);
    return (
        <div className="flex-initial ml-3">
            <button
                type="button"
                className="btn-primary mt-6 transition duration-150 ease-in-out"
                {...(isCopied && { disabled: true })}
                onClick={() => {
                    copy(value);
                    setIsCopied(true);
                    setTimeout(() => setIsCopied(false), 1500);
                }}
            >
                {isCopied ? "Copied" : "Copy"}
            </button>
        </div>
    );
};

export default function SyncPage() {
    const { orgId: orgID } = useAuth();
    const supabase = useSupabase();

    const { data, error, mutate } = useQuery(
        supabase.from("actblue_csv_credentials").select("*").limit(1).maybeSingle()
    );
    console.log({ data });
    const client_uuid = data?.client_uuid;
    const client_secret = data?.client_secret;

    const submit = (event) => {
        console.log("submit()");
        event.preventDefault();
        asyncSubmit(event);
    };

    const asyncSubmit = async (event) => {
        console.log("asyncsubmit()");
        // get form data and create a new actblue_csv_credentials row
        const form_client_uuid = event.target[0].value;
        const form_client_secret = event.target[1].value;

        // Validate
        // form_client_uuid must contain four "-" characters
        if (form_client_uuid.split("-").length !== 5) {
            notifyError("ActBlue Client UUID must contain four dashes");
        }
        // form_client_secret must be 56 characters long
        if (form_client_secret.length !== 56) {
            notifyError("ActBlue Client Secret must be 56 characters long");
        }
        if (form_client_uuid.split("-").length !== 5 || form_client_secret.length !== 56) {
            return;
        }

        console.log({ form_client_uuid, form_client_secret });

        // Save credentials to db
        const supabaseResponse = await supabase
            .from("actblue_csv_credentials")
            .insert({ client_uuid: form_client_uuid, client_secret: form_client_secret })
            .select()
            .maybeSingle();
        console.log({ supabaseResponse });
        const id = supabaseResponse.data.id;
        console.log({ id });

        // Update UI
        mutate();

        // Start a listner for the csv request being processed
        const channel = supabase
            .channel("actblue_csv_requests")
            .on(
                "postgres_changes",
                {
                    event: "UPDATE",
                    schema: "public",
                    table: "actblue_csv_requests",
                    filter: `id=eq.${id}`,
                },
                ({ new: update }) => {
                    console.log({ update });
                    if (update?.status === "processed") {
                        notify("The credentials were saved and the import is finished processing.");
                        supabase.removeChannel(channel);
                    }
                }
            )
            .subscribe();

        // Trigger csv request
        const fetchResponse = await fetch("/api/integrations/actblue/csv/request", {
            method: "POST",
        });
        console.log({ fetchResponse });
    };

    return (
        <>
            <div className="mx-auto max-w-7xl px-2">
                <Breadcrumbs
                    pages={[
                        {
                            name: "Sync",
                            href: "/sync",
                            current: true,
                        },
                    ]}
                />
                <PageTitle
                    title="Sync Settings"
                    descriptor={
                        <>
                            Configure automatic continuous imports from ActBlue.{" "}
                            <Link className="link" href="/help/sync">
                                Learn more.
                            </Link>
                        </>
                    }
                />
            </div>
            <div className="mx-auto max-w-7xl px-2">
                <form onSubmit={submit}>
                    <h2 className="mt-8 mb-4">Create ActBlue API Credentials</h2>
                    <p className="">
                        We use the ActBlue API to load your past donation and donor information in
                        bulk securely to our server.
                    </p>
                    <p className="mt-3 px-6 text-gray-500 border-l-2 border-gray-200 text-base">
                        Generate new API credentials at{" "}
                        <Link href="https://secure.actblue.com/my-dashboards" className="link">
                            ActBlue dashboard
                        </Link>{" "}
                        {"-> dashboard -> admin (left menu) -> API Credentials"}.
                    </p>
                    <p className="mt-3 px-6 text-gray-500 border-l-2 border-gray-200 text-base">
                        Then enter below:
                    </p>
                    <InsetInput
                        label="Client UUID"
                        placeholder={client_uuid ?? "abcdefghi-abcd-abcd-abcd-abcdefghijkl"}
                        className={"w-96"}
                        disabled={!!client_uuid}
                        {...(client_uuid && { value: client_uuid })}
                    />
                    <InsetInput
                        label="Client Secret"
                        placeholder={
                            client_secret ??
                            "aBc/AbCdEfghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwx=="
                        }
                        className={"mt-6 w-96"}
                        disabled={!!client_uuid}
                        {...(client_secret && { value: client_secret })}
                    />
                    <button type="submit" className="btn-primary mt-4" disabled={!!client_uuid}>
                        Save ActBlue API credentials
                    </button>
                    <span className="ml-3 text-sm">
                        (triggers non-duplicative bulk sync of past donations)
                    </span>
                    <h2 className="mt-14 mb-4">Webhook Setup</h2>
                    <p className="">
                        ActBlue uses webhooks to notify us in realtime as each of your donations
                        come in, keeping Raise More up to date. <br />
                    </p>
                    <p className="mt-3 px-6 text-gray-500 border-l-2 border-gray-200 text-base">
                        Navigate to{" "}
                        <Link href="https://secure.actblue.com/my-dashboards" className="link">
                            ActBlue Dashboard
                        </Link>{" "}
                        {"-> dashboard -> tools (left menu) -> Webhooks -> Request a New Webhook. "}
                    </p>
                    <p className="mt-3 px-6 text-gray-500 border-l-2 border-gray-200 text-base">
                        Then, input the below information:
                    </p>
                    <InsetInput
                        label="Type"
                        placeholder="ActBlue Default"
                        className={"mt-8 max-w-2xl"}
                        disabled
                    />
                    <InsetInputWithCopy
                        label="Endpoint URL"
                        placeholder="https://www.raisemore.app/api/integrations/actblue/webhook/receive"
                        disabled
                    />
                    <InsetInputWithCopy label="Username" placeholder={orgID} disabled />
                    <InsetInputWithCopy label="Password" placeholder={randomUUID()} disabled />
                    <InsetInputWithCopy
                        label="Requested backfill"
                        placeholder="Do not enter a date, not necessary"
                        disabled
                    />
                    <p className="mt-6 mb-12">
                        Once you have sent the information to ActBlue, we will then notify you upon
                        the first successful webhook delivery.
                    </p>
                </form>
            </div>
        </>
    );
}
