import PageTitle from "components/Layout/PageTitle";
import Breadcrumbs from "components/Layout/Breadcrumbs";
import SetCallerIDForm from "components/SetCallerIDForm";
import { useOrganization } from "@clerk/nextjs";
import { prettyPrintPhoneNumber } from "lib/validation";

export default function CallerIDPage() {
    const { organization } = useOrganization();
    const callerID = prettyPrintPhoneNumber(organization?.publicMetadata?.callerID);

    return (
        <div className="">
            <div className="mx-auto max-w-7xl px-2">
                <Breadcrumbs pages={[{ name: "My Caller ID", href: "/callerid", current: true }]} />
                <PageTitle
                    title="My Caller ID"
                    descriptor="Adjust the phone number assigned to your organization."
                />
            </div>
            <div className="mx-auto max-w-7xl px-2">
                <h3>Your current number:</h3>
                <p className="mt-3">{callerID ? callerID : "You don't have a number yet!"}</p>
                <h3>Pick a new area code</h3>{" "}
                <p className="mt-3">This will replace your current caller ID with a new number.</p>{" "}
                <SetCallerIDForm />
            </div>
        </div>
    );
}
