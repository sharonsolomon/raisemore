import Link from "next/link";
import Tooltip from "@mui/material/Tooltip";
import { Fragment } from "react";

const Table = ({ rows, columns, rowCount, onPageChange, page }) => {
    return (
        <div className="mt-3 flow-root data-grid">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="min-w-full py-2 align-middle sm:px-6 lg:px-8">
                    <div className="shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg w-full overflow-hidden">
                        <div
                            className="overflow-scroll"
                            style={rows?.length ? { height: "56vh" } : {}}
                        >
                            <table className="w-full table-fixed min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {columns?.map((column, columnNum) => (
                                            <th
                                                scope="col"
                                                key={column}
                                                className={
                                                    "px-3 py-3.5 text-left text-sm font-semibold text-gray-900 w-32 overflow-ellipsis " +
                                                    (columnNum == 0
                                                        ? " py-3.5 pl-4 pr-3 sm:pl-6"
                                                        : "")
                                                }
                                            >
                                                {column}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                {rows?.length > 0 && (
                                    <tbody
                                        className="divide-y divide-gray-200 bg-white my-0"
                                        style={{ "max-height": "50vh" }}
                                    >
                                        {(rows ?? [])?.map((row, rowNum) => (
                                            <tr key={row.id}>
                                                {Object.entries(row)?.map(
                                                    ([columnName, value], columnNum) => (
                                                        <Tooltip
                                                            title={value}
                                                            key={row.id + columnName}
                                                            arrow
                                                        >
                                                            <td
                                                                className={
                                                                    "whitespace-nowrap px-3 py-3 text-sm text-gray-500 w-32 overflow-ellipsis " +
                                                                    (columnNum == 0
                                                                        ? " pl-4 pr-3 sm:pl-6"
                                                                        : "") +
                                                                    (rowNum == rows.length - 1
                                                                        ? " border-b"
                                                                        : "")
                                                                }
                                                            >
                                                                {[
                                                                    "first_name",
                                                                    "last_name",
                                                                ].includes(columnName) ? (
                                                                    <Link
                                                                        href={`/people/${row.id}`}
                                                                    >
                                                                        {value}
                                                                    </Link>
                                                                ) : (
                                                                    value
                                                                )}
                                                            </td>
                                                        </Tooltip>
                                                    )
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                )}
                            </table>
                        </div>
                        {rows?.length === 0 && (
                            <div>
                                <div
                                    colSpan={columns?.length}
                                    className="text-sm text-gray-400 flex justify-center border-t"
                                    style={{ height: "50vh" }}
                                >
                                    <div className="my-auto">No matching records found</div>
                                </div>
                            </div>
                        )}
                        <Pagination page={page} rowCount={rowCount} onPageChange={onPageChange} />
                    </div>
                </div>
            </div>
        </div>
    );
};

function Pagination({ page, rowCount, onPageChange }) {
    return (
        <div
            className=" flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6"
            aria-label="Pagination"
        >
            <div className="hidden sm:block">
                <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to{" "}
                    <span className="font-medium">10</span> of{" "}
                    <span className="font-medium">{rowCount}</span> results
                </p>
            </div>
            <div className="flex flex-1 justify-between sm:justify-end">
                <button
                    href="#"
                    className="btn mx-3 my-0"
                    type="button"
                    onClick={() => {
                        onPageChange(page - 1);
                    }}
                >
                    Previous
                </button>
                <button
                    href="#"
                    className="btn my-0"
                    type="button"
                    onClick={() => {
                        onPageChange(page + 1);
                    }}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export default Table;

{
    /* <Tooltip title={params.value}>
                        <div className="MuiDataGrid-cellContent">{params.value}</div>
                    </Tooltip> */
}
