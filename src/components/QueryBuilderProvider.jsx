import useSWR from "swr";
const fetcher = (url) => fetch(url).then((r) => r.json());

const className = (...classes) => classes.filter(Boolean).join(" ");

import { QueryBuilderBootstrap } from "@react-querybuilder/bootstrap";
import { useState, useEffect, useCallback } from "react";
import { useSupabase, useQuery } from "lib/supabaseHooks";
import SaveList from "./SaveList";
import SupabaseTable from "./SupabaseTable";
import { useRouter } from "next/router";

import {
    formatQuery,
    parseSQL,
    add,
    defaultCombinators,
    Field,
    move,
    QueryBuilder,
    remove,
    RuleGroupType,
    update,
} from "react-querybuilder";

const initialQuery = {
    combinator: "and",
    rules: [],
};

export default function QueryBuilderProvider({
    table,
    children,
    listID,
    forceListUpdate,
    select = "*",
}) {
    const supabase = useSupabase();
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);

    const { data: list, mutate: fetchList } = useQuery(
        listID && supabase.from("saved_lists").select().eq("id", listID).single()
    );

    // Keep the local temporary state in line with the serverside on any serverside changes
    useEffect(() => {
        if (list?.query) setQuery(parseSQL(list.query));
    }, [list?.query]);

    var formattedQuery = formatQuery(query, {
        format: "sql",
        parseNumbers: true,
    });
    // .replaceAll("like '%", "like '%");
    // console.log("formattedQuery", formattedQuery);

    const { data: columns } = useQuery(supabase.rpc("columns", { tblname: table }));

    const fields = columns?.map((a) => ({
        name: a,
        label: a,
    }));

    // add a filter rule
    const addRule = useCallback(() => {
        setQuery((query) =>
            add(query, { field: "first_name", operator: "contains", value: "" }, [])
        );
    }, []);

    const saveList = async (listNameTemp) => {
        const listObject = {
            name: listNameTemp,
            query: formattedQuery,
        };
        if (listID) listObject.id = listID;
        let { data: upsertedList, error } = await supabase
            .from("saved_lists")
            .upsert(listObject, { onConflict: "id" })
            .select()
            .single();

        if (error) throw error;
        // setListID(upsertedList.id);
        // fetchList();
        router.push("/savedlists/" + upsertedList.id);
        // If we're already on that page, invalidate the list data
        if (forceListUpdate) forceListUpdate();
    };

    return (
        <>
            <div className="qbp">
                <div className="qbp-query-bar flex">
                    <pre>
                        <code>
                            Query:{" "}
                            {formattedQuery == "(1 = 1)"
                                ? "No filters, returning all results.."
                                : formattedQuery}
                        </code>
                    </pre>

                    <button
                        onClick={addRule}
                        type="button"
                        className="btn-primary my-1 mx-2 relative inline-block justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-100"
                    >
                        Add Filter Step
                    </button>
                    <SaveList listName={list?.name} saveList={saveList} />
                </div>
                <QueryBuilderBootstrap>
                    <QueryBuilder
                        resetOnFieldChange="false"
                        resetOnOperatorChange="false"
                        // debugMode
                        // showCombinatorsBetweenRules
                        fields={fields}
                        query={query}
                        onQueryChange={(q) => setQuery(q)}
                        // Prevent new groups/hide group+ button
                        controlElements={{
                            addGroupAction: () => null,
                        }}
                    />
                </QueryBuilderBootstrap>
            </div>
            <SupabaseTable
                table={table}
                columns={columns}
                currentQuery={formattedQuery}
                queryObj={query}
                select={select}
            />
        </>
    );
}
