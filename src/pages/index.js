import { useState, useEffect } from "react";
import { useSupabase, useQuery } from "lib/supabaseHooks";
import Breadcrumbs from "components/Layout/Breadcrumbs";
import PageTitle from "components/Layout/PageTitle";
import CallingSessionsGrid from "components/CallingSessionsGrid";
import { clerkClient, getAuth, buildClerkProps } from "@clerk/nextjs/server";
import { CurrencyDollarIcon, HandRaisedIcon, PhoneIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const stats = [
    {
        name: "Total Raised",
        previousStat: "---",
        change: "---",
        changeType: "increase",
        query: "total_sum_donations",
        icon: CurrencyDollarIcon,
        href: "/donations",
    },
    {
        name: "Unfulfilled Pledges",
        previousStat: "---",
        change: "---",
        changeType: "increase",
        query: "total_sum_unfulfilled_pledges",
        icon: HandRaisedIcon,
        href: "/pledges",
    },
    {
        name: "Phone Calls Made",
        previousStat: "---",
        change: "---",
        changeType: "increase",
        query: "total_number_of_calls",
        icon: PhoneIcon,
        href: "/contacthistory",
    },
];

function classNames(...classes) {
    return classes.filter(Boolean).join(" ");
}

export function StatCard({ query, table, item }) {
    const { data, error } = useQuery(useSupabase().from(table).select(query).maybeSingle());

    item.stat = data ? (Object.keys(data) ? data[Object.keys(data)[0]] : 0) : 0;

    // Fix NaN
    if (isNaN(item.stat)) item.stat = 0;

    // Format certain metrics
    if (["pledge", "raise"].some((v) => item.name.toLowerCase().includes(v.toLowerCase())))
        item.stat = "$" + Number(item.stat).toLocaleString();

    return (
        <Link href={item?.href} key={item.id}>
            {/* the below dev is a card with shadow, i want the shadow to be a purple and pink gradient */}
            <div className="card relative bg-white px-4 pt-7 pb-0 sm:px-6 rounded-lg shadow-md border hover:shadow-lg hover:cursor-pointer">
                <dt>
                    <div className="absolute rounded-md bg-blue-200 p-3">
                        <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                    <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
                </dd>
            </div>
        </Link>
    );
}

export default function Home(props) {
    // return <pre>{JSON.stringify(props, 0, 2)}</pre>;
    return (
        <div className="">
            <div className="mx-auto max-w-7xl px-2">
                <Breadcrumbs pages={[{ name: "Dashboard", href: "/", current: true }]} />
                <PageTitle
                    title="👋&nbsp; Dashboard"
                    descriptor="Welcome to your fundraising home base!"
                />
            </div>
            <div className="mx-auto max-w-7xl px-2">
                <div>
                    <h3 className="mt-7">Metrics</h3>
                    <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {stats.map((item, i) => (
                            <StatCard
                                key={i}
                                item={item}
                                query={item.query}
                                table="dashboard_by_account"
                            />
                        ))}
                    </dl>
                </div>
                <div>
                    <h3>Join an active calling session:</h3>
                    <CallingSessionsGrid />
                </div>
            </div>
        </div>
    );
}

// export const getServerSideProps = async ({ req }) => {
//     // const { getToken, userId, sessionId, orgId } = getAuth(req);
//     // const user = userId ? await clerkClient.users.getUser(userId) : undefined;
//     const token = clerkClient.getToken({
//         template:
//             process.env.NEXT_PUBLIC_ENVIRONMENT != "development"
//                 ? "supabase"
//                 : "supabase-local-development",
//     });
//     return { props: { ...buildClerkProps(req, { token }) } };
// };
