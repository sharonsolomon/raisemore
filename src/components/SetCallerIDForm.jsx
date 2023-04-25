import { useOrganization } from "@clerk/nextjs";
import InsetInput from "components/InsetInput";
import request from "lib/request";

const SetCallerIDForm = ({ submitButtonText }) => {
    const { organization } = useOrganization();
    const mutate = async (e) => {
        e.preventDefault();
        console.log("requesting new number " + e.target.areaCode.value);
        await request("/api/buyNumber", { areaCode: e.target.areaCode.value });
        await organization.reload();
    };
    return (
        <form onSubmit={mutate}>
            <InsetInput
                label="Area Code"
                name="areaCode"
                type="text"
                placeholder="Enter an area code (e.g. 202)"
                required
                className="w-60"
            />
            <button type="submit" className="btn btn-primary">
                {submitButtonText ?? "Replace Caller ID"}
            </button>
        </form>
    );
};
export default SetCallerIDForm;
