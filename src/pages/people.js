import QueryBuilderProvider from "components/QueryBuilderProvider";
import Breadcrumbs from "components/Layout/Breadcrumbs";
import PageTitle from "components/Layout/PageTitle";

export default function PeoplePage() {
    return (
        <div className="">
            <div className="mx-auto max-w-7xl px-2 ">
                <Breadcrumbs pages={[{ name: "Create a List", href: "/people", current: true }]} />
                <PageTitle
                    title="Create a List"
                    descriptor="Browse donors and prospects, create queries, and save lists."
                />
            </div>
            <div className="mx-auto max-w-7xl px-2  ">
                <QueryBuilderProvider table="people_for_user_display" />
            </div>
        </div>
    );
}
