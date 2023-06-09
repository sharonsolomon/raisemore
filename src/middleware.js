import { withClerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export default withClerkMiddleware((req) => {
    return NextResponse.next();
});

// Stop Middleware running on static files
export const config = {
    matcher: "/((?!.*\\.).*)",
    runtime: "experimental-edge", // for Edge API Routes only
    unstable_allowDynamic: [],
};
