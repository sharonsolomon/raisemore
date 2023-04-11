import QueryBuilderProvider from "components/QueryBuilderProvider";
import Breadcrumbs from "components/Layout/Breadcrumbs";
import PageTitle from "components/Layout/PageTitle";

export default function Dashboard() {
    return (
        <div className="">
            <div className="mx-auto max-w-7xl px-2 ">
                <Breadcrumbs pages={[{ name: "Donations", href: "/donations" }]} />
                <PageTitle title="Donations" descriptor="All donations." />
            </div>
            <div className="mx-auto max-w-7xl px-2  ">
                <QueryBuilderProvider
                    table="donations"
                    select="people (first_name, last_name), created_at, amount, receipt_id, fundraising_page, lineitem_id, disbursement_id, card_type"
                />
            </div>
        </div>
    );
}
