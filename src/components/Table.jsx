import Link from "next/link";

const Table = ({ rows, columns, rowCount, onPageChange }) => {
    return (
        <div className="mt-3 flow-root">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="overflow-scroll shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg w-full h-1/2">
                        <table className="w-full table-fixed min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                                <tr>
                                    {columns?.map((column, i) => (
                                        <th
                                            scope="col"
                                            key={column.field}
                                            className={
                                                "px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-32 overflow-ellipsis" +
                                                (i == 0 ? " py-3.5 pl-4 pr-3 sm:pl-6" : "")
                                            }
                                        >
                                            {column}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {(rows ?? [])?.map((row) => (
                                    <tr key={row.id}>
                                        {Object.entries(row)?.map(([columnName, value], i) => (
                                            <td
                                                key={row.id + columnName}
                                                className={
                                                    "whitespace-nowrap px-3 py-3 text-sm text-gray-500 w-32 overflow-ellipsis" +
                                                    (i == 0 ? " pl-4 pr-3 sm:pl-6" : "")
                                                }
                                            >
                                                {["first_name", "last_name"].includes(
                                                    columnName
                                                ) ? (
                                                    <Link href={`/people/${row.id}`}>{value}</Link>
                                                ) : (
                                                    value
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Table;

{
    /* <Tooltip title={params.value}>
                        <div className="MuiDataGrid-cellContent">{params.value}</div>
                    </Tooltip> */
}
// testing lint staged
// again
