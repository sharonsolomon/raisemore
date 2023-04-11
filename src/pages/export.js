import Link from "next/link";
import Breadcrumbs from "components/Layout/Breadcrumbs";
import PageTitle from "components/Layout/PageTitle";
import { useSupabase } from "lib/supabaseHooks";

export default function Export() {
    const supabase = useSupabase();
    return (
        <div className="mx-auto max-w-7xl px-2">
            <Breadcrumbs
                pages={[
                    {
                        name: "Export",
                        href: "/export",
                        current: true,
                    },
                ]}
            />
            <PageTitle
                title="Export"
                descriptor={
                    <>
                        Get bulk exports for NGP, email software, texting, etc.{" "}
                        <Link className="link" href="http://docs.raisemore.com/export">
                            Learn more.
                        </Link>
                    </>
                }
            />
            <h3>Raw export</h3>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    const whichTable = e.target.whichTable.value;
                    // Grab a select of the entire table and .csv() it and download
                    supabase
                        .from(whichTable)
                        .select()
                        .csv()
                        .then((res) => {
                            const blob = new Blob([res.data], {
                                type: "text/csv",
                            });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement("a");
                            a.setAttribute("hidden", "");
                            a.setAttribute("href", url);
                            a.setAttribute("download", `${whichTable}.csv`);
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                        });
                }}
            >
                {" "}
                <div className="flex space-x-3 mt-3">
                    <label
                        htmlFor="whichTable"
                        className="block text-sm font-medium leading-6 text-gray-700 mt-1.5"
                    >
                        Export table
                    </label>
                    <div>
                        <select
                            id="whichTable"
                            name="whichTable"
                            className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
                            defaultValue="Canada"
                        >
                            <option value="people_for_user_display">People</option>
                            <option value="saved_lists">Saved Lists</option>
                            <option value="interactions">Call History</option>
                            <option value="donations">Donations</option>
                            <option value="pledges">Pledges</option>
                        </select>
                    </div>
                    <div>
                        <button type="submit" className="btn-primary">
                            Export
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
