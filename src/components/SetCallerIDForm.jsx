import InsetInput from "components/InsetInput";
import request from "lib/request";
const SetCallerIDForm = ({ mutate, submitButtonText }) => (
    <form
        onSubmit={async (e) => {
            e.preventDefault();
            console.log("requesting new number " + e.target.areaCode.value);
            console.log(await request("/api/buyNumber", { areaCode: e.target.areaCode.value }));
            mutate();
        }}
    >
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
export default SetCallerIDForm;
