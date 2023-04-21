import PageTitle from "components/Layout/PageTitle";
import Breadcrumbs from "components/Layout/Breadcrumbs";
import InsetInput from "components/InsetInput";
import { useQuery, useSupabase } from "lib/supabaseHooks";

const request = async (url, obj) => {
    const res = await fetch(url + "?" + new URLSearchParams(obj));
    return await res.json();
};

export default function CallerIDPage() {
    const supabase = useSupabase();
    // modify this destructuring so that phoneNumber defaults to null
    const { mutate, data: { phone_number: phoneNumber } = {} } = useQuery(
        supabase.from("caller_ids").select("phone_number").single()
    );

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
                <p className="mt-3">{phoneNumber ? phoneNumber : "You don't have a number yet!"}</p>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault();
                        console.log("requesting new number " + e.target.areaCode.value);
                        await request("/api/buyNumber", { areaCode: e.target.areaCode.value });
                        mutate();
                    }}
                >
                    <h3>Pick a new area code</h3>
                    <p className="mt-3">
                        This will replace your current caller ID with a new number.
                    </p>
                    <InsetInput
                        label="Area Code"
                        name="areaCode"
                        type="text"
                        placeholder="Enter an area code"
                        required
                        className="w-52"
                    />
                    <button type="submit" className="btn btn-primary">
                        Replace Caller ID
                    </button>
                </form>
            </div>
        </div>
    );
}
