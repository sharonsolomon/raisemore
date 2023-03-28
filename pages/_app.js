import useSWR from "swr";
import { useState, useEffect } from "react";
import "styles/globals.css";
import Layout from "components/Layout";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import ChatWidgetWrapper from "components/ChatWidgetWrapper";
import { createSupabaseClient, SupabaseProvider } from "lib/supabaseHooks";
import { SWRConfig, useSWRConfig } from "swr";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
import { Analytics } from "@vercel/analytics/react";

function App({ Component, pageProps }) {
    const optionsSWR = {
        fetcher: (url, init) => fetch(url, init).then((res) => res.json()),
        keepPreviousData: true,
    };
    const globalCSS = `
        html, body, .MuiDataGrid-root, code {
            font-family: ${inter.style.fontFamily} !important;
        }
    `;
    return (
        <>
            <style jsx global>
                {globalCSS}
            </style>
            <SWRConfig value={optionsSWR}>
                <ClerkProvider {...pageProps}>
                    <SupabaseWrapper>
                        <Component {...pageProps} />
                    </SupabaseWrapper>
                </ClerkProvider>
            </SWRConfig>
            <Analytics />
        </>
    );
}

function SupabaseWrapper({ children }) {
    const { getToken } = useAuth();
    const { data: supabaseAccessToken } = useSWR(
        () => "clerk",
        async () =>
            await getToken({
                template:
                    process.env.NEXT_PUBLIC_ENVIRONMENT != "development"
                        ? "supabase"
                        : "supabase-local-development",
            })
    );
    const supabaseClient = supabaseAccessToken && createSupabaseClient(supabaseAccessToken);

    return (
        <SupabaseProvider value={supabaseClient}>
            <Layout>{supabaseClient && children}</Layout>
            <ChatWidgetWrapper />
        </SupabaseProvider>
    );
}

// useEffect(() => {
//     let now = async () => {
//         // Get the clerk.dev JWT
//         const supabaseAccessToken = await getToken({
//             template:
//                 process.env.NEXT_PUBLIC_ENVIRONMENT != "development"
//                     ? "supabase"
//                     : "supabase-local-development",
//         });
//         // Create and set the client
//         setSupabaseClient(createSupabaseClient(supabaseAccessToken));

//         // Invalidate all previous SWR cached calls
//         mutate(
//             (key) => true, // which cache keys are updated
//             undefined, // update cache data to `undefined`
//             { revalidate: false } // do not revalidate
//         );
//     };
//     if (userId) now();
//     // eslint-disable-next-line react-hooks/exhaustive-deps
// }, [userId, sessionId, orgId]);

export default App;
