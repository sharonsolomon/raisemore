import PageTitle from "components/Layout/PageTitle";
import Breadcrumbs from "components/Layout/Breadcrumbs";

export default function Reports() {
    return (
        <div className="">
            <div className="mx-auto max-w-7xl px-2 ">
                <Breadcrumbs pages={[{ name: "Reports", href: "/reports", current: true }]} />
                <PageTitle title="Reports" descriptor="View existing or generate new reports." />
            </div>
            <div className="mx-auto max-w-7xl px-2  ">Not implemented yet.</div>
        </div>
    );
}
