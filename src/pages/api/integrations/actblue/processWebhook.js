import { NextResponse } from "next/server";
export const config = { runtime: "edge" };
import { createSupabaseClient } from "lib/supabaseHooks";

export default async function handler(req) {
    return NextResponse.json({ message: "OK" }, { status: 200 });
}
