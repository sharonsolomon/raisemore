import Link from "next/link";
import Breadcrumbs from "components/Breadcrumbs";
import PageTitle from "components/PageTitle";
import InsetInput from "components/InsetInput";
import { randomUUID } from "lib/randomUUID-polyfill";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useSupabase } from "lib/supabaseHooks";

const copy = () => {};

const InsetInputWithCopy = (props) => (
    <div className="flex w-full">
        <InsetInput {...props} className={"mt-8 max-w-2xl flex-grow"} />
        <CopyButton value={props.placeholder} />
    </div>
);

const CopyButton = ({ value }) => (
    <div className="flex-initial ml-3">
        <button
            type="button"
            className="btn-primary mt-8"
            onClick={() => {
                copy(value);
            }}
        >
            Copy
        </button>
    </div>
);

export default function Sync() {
    const { orgId: orgID } = useAuth();

    const { data, error } = useQuery(
        useSupabase().from("actblue_credentials").select("*").maybeSingle()
    );
    const alreadyHaveCredentials = data?.length > 0;

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
                <p className="mt-6">
                    Complete both steps to backfill data from your database and make sure it stays
                    up to date into the future:
                </p>
                <form>
                    <h3 className="mt-8 text-2xl mb-3 font-medium">
                        Create ActBlue API Credentials
                    </h3>
                    <p className="mx-6 px-6 text-gray-500 border-l-2 text-sm">
                        What is an API? An API is an interface acts as a bridge between two software
                        programs, allowing them to share information, similar to how a vending
                        machine interface (buttons!) allow a user to choose a snack and receive it
                        without directly grabbing it. We use the ActBlue API to bulk load your past
                        donation and donor information securely to our servers.
                    </p>
                    <p className="mt-3">
                        Generate new API credentials at{" "}
                        <Link href="https://secure.actblue.com/my-dashboards" className="link">
                            ActBlue dashboard
                        </Link>{" "}
                        {"-> dashboard -> admin (left menu) -> API Credentials"}, then enter below:
                    </p>

                    <InsetInput
                        label="Client UUID"
                        placeholder="abcdefghi-abcd-abcd-abcd-abcdefghijkl"
                        className={"w-96"}
                        disabled={alreadyHaveCredentials}
                    />
                    <InsetInput
                        label="Client Secret"
                        placeholder="aBc/AbCdEfghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwx=="
                        className={"mt-8 w-96"}
                        disabled={alreadyHaveCredentials}
                    />
                    <button
                        type="submit"
                        className="btn-primary mt-8"
                        disabled={alreadyHaveCredentials}
                    >
                        Save
                    </button>

                    <h3 className="mt-10 text-2xl mb-3 font-medium">Webhook Setup</h3>
                    <p className="mx-6 px-6 text-gray-500 border-l-2 text-sm">
                        What is a webhook? Webhooks are automated messages sent from one app to
                        another when something happens. This lets ActBlue notify us in realtime as
                        each of your donations come in. This helps keep our system 100% up to date
                        in the future, in effect it allows us to avoid any future bulk data loading.
                        It "just works".
                    </p>
                    <p className="mt-3">
                        Navigate to{" "}
                        <Link href="https://secure.actblue.com/my-dashboards" className="link">
                            ActBlue Dashboard
                        </Link>{" "}
                        {"-> dashboard -> tools (left menu) -> Webhooks -> Request a New Webhook"}
                    </p>
                    <p className="mt-3">Then, input the below information:</p>
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
                    <p className="mt-6">That's it!</p>
                </form>
            </div>
        </>
    );
}
