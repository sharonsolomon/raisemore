import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useSupabase } from "lib/supabaseHooks";
import Table from "components/Table";
import { compilePostgrestQuery } from "lib/compilePostgrestQuery";
import { ObjectType } from "@clerk/nextjs/dist/api";

const flatten = (rows) => {
    if (!rows) return [];
    return rows.map((row) => {
        let newRow = {};
        for (let [key, value] of Object.entries(row)) {
            if (typeof value === "object") {
                if (!value) newRow[key] = value;
                else if (Array.isArray(value)) {
                    for (let [subkey, subvalue] of Object.entries(value[0])) {
                        newRow[key + "_" + subkey] = subvalue;
                    }
                } else if (Object.keys(value).length > 0) {
                    for (let [subkey, subvalue] of Object.entries(value ?? {})) {
                        newRow[key + "_" + subkey] = subvalue;
                    }
                }
            } else {
                newRow[key] = value;
            }
        }
        return newRow;
    });
};

export default function SupabaseTable({
    table,
    select = "*",
    currentQuery,
    queryObj,
    setFilterColumns = () => {},
}) {
    const [page, setPage] = useState(0);
    let perPage = 10;

    const supabase = useSupabase();
    let { data, error, mutate } = useQuery(
        compilePostgrestQuery({
            currentQuery: queryObj,
            supabase,
            table,
            page,
            perPage,
            select,
        })
    );
    if (error) console.error(error);
    let rows = flatten(data);

    let rowCount = Number(rows?.count || 0);
    // if (rows && rows?.count) delete rows.count; // This line breaks subsequent SWR loads from having count

    let { data: columns } = useQuery(supabase.rpc("columns", { tblname: table }));
    if (select !== "*") {
        columns = [...select.split(",")];
    }
    if (rows?.length) {
        columns = Object.keys(rows[0]);
    }
    if (table === "saved_lists" && columns && rows?.length) {
        // columns?.push("Edit query");
        // columns?.push("New call session");
        columns = [...columns, "Edit query", "New call session"];
        rows = rows.map((row) => ({
            ...row,
            "Edit query": <LoadListButton row={row} />,
            "New call session": <MakeCallsButton row={row} />,
        }));
    }

    return (
        <Table
            columns={columns}
            rows={rows}
            rowCount={Number(rowCount) || 0}
            onPageChange={setPage}
            page={page}
            perPage={perPage}
        />
    );
}

const LoadListButton = (params) => {
    const router = useRouter();
    return (
        <strong>
            <button
                className="btn btn-primary"
                color="primary"
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    // console.log(params, params.row);
                    router.push("/savedlists/" + params.row.id);
                }}
            >
                Edit Query
            </button>
        </strong>
    );
};

const MakeCallsButton = (params) => {
    const router = useRouter();
    const supabase = useSupabase();
    return (
        <strong>
            <button
                className="btn btn-primary"
                color="primary"
                size="small"
                onClick={(e) => {
                    e.stopPropagation();
                    // console.log("list row params", params, params.row);

                    supabase
                        .from("call_sessions")
                        .insert({ list_id: params.row.id })
                        .select()
                        .single()
                        .then((newCallSession) => {
                            router.push("/dialer/" + newCallSession.data.id);
                        });
                }}
            >
                New Call Session
            </button>
        </strong>
    );
};
