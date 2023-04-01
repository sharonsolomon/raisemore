import useSWR, { preload } from "swr";
const fetcher = (url) => fetch(url).then((r) => r.json());
import { useEffect, useState } from "react";
// import Box from "@mui/material/Box";
// import { DataGrid } from "@mui/x-data-grid";
import Tooltip from "@mui/material/Tooltip";
// import Stack from "@mui/material/Stack";
import { useRouter } from "next/router";
import { useQuery, useSupabase } from "lib/supabaseHooks";
import Table from "components/Table";
import { compilePostgrestQuery } from "lib/compilePostgrestQuery";
import { parseSQL } from "react-querybuilder";

export default function SupabaseTable({
    table,
    query = "*",
    currentQuery,
    queryObj,
    setFilterColumns = () => {},
}) {
    const [page, setPage] = useState(0);
    let perPage = 25;

    const supabase = useSupabase();
    const {
        data: rows,
        error,
        mutate,
    } = useQuery(
        compilePostgrestQuery({
            currentQuery: queryObj,
            supabase,
            table,
            page,
            perPage,
        })
    );
    if (error) console.error(error);

    let rowCount = rows?.count || 0;
    if (rows && rows?.count) delete rows.count;

    const columns = Object.keys(rows?.[0] ?? {});

    return (
        <Table
            columns={columns}
            rows={rows}
            rowCount={Number(rowCount) || 0}
            onPageChange={setPage}
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
