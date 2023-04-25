"use strict";

import { getAuth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import queryParams from "lib/queryParams";

export default async function updateMetadata(request) {
    const { orgId: orgID } = getAuth(request);
    if (!orgID) throw "Must be authorized";

    const response = await clerkClient.organizations.updateOrganizationMetadata(orgID, {
        publicMetadata: queryParams({ config, request }),
    });

    return NextResponse.json(response);
}
