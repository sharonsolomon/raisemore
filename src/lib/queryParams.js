//  isomorphic call for query params in node, edge and web
const queryParams = ({ config, request } = { config: {}, request: {} }) =>
    typeof config !== "undefined" && config?.runtime === "edge"
        ? Object.fromEntries(new URL(request?.url)?.searchParams)
        : typeof request !== "undefined" && typeof window === "undefined"
        ? request?.query //node
        : Object.fromEntries(new URL(window?.location?.search)?.searchParams); // web
export default queryParams;
