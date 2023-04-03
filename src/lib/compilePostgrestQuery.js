export const compilePostgrestQuery = ({ currentQuery, supabase, table, page, perPage }) => {
    let tableSplit = table.split(",")[0];
    // the rest
    let rightSplit = table.split(",").slice(1).join(",");
    let select = "*" + (table.indexOf(",") !== -1 ? "," + rightSplit : "");

    let queryWithFilters = supabase
        .from(table.split(",")[0])
        .select(select, { count: "estimated", head: false });

    const convert_sql_operators_to_postgrest = {
        // sql: "postgrest",
        "=": "eq",
        ">": "gt",
        ">=": "gte",
        "<": "lt",
        "<=": "lte",
        "<>": "or",
        "!=": "neq",
        like: "like",
        ilike: "ilike",
        in: "in",
        is: "is",
        "@@": "fts",
        "@@": "plfts",
        "@@": "phfts",
        "@@": "wfts",
        "@>": "cs",
        "<@": "cd",
        "&&": "ov",
        "<<": "sl",
        ">>": "sr",
        "&<": "nxr",
        "&>": "nxl",
        "-|-": "adj",
        not: "not",
        contains: "like",
        beginsWith: "",
        endsWith: "",
        "does not contain": "",
        "does not begin with": "",
        "does not end with": "",
        "is null": "",
        "is not null": "",
        "not in": "",
        between: "",
        "not between": "",
    };

    currentQuery?.rules?.forEach((rule) => {
        console.log({ rule });
        queryWithFilters = queryWithFilters.filter(
            rule.field,
            convert_sql_operators_to_postgrest[rule.operator.toLowerCase()],
            // TODO: Needs to be a CASE statement for each operator
            rule.operator.toLowerCase() == "contains" ? `%${rule.value}%` : rule.value
        );
    });

    queryWithFilters = queryWithFilters.range(page * perPage, (page + 1) * perPage - 1);

    return queryWithFilters;
};
