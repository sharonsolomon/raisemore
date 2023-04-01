import Head from "next/head";
import useSWR from "swr";
import { useState, useEffect, Fragment } from "react";
import "styles/globals.css";
import Layout from "components/Layout/Layout";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import ChatWidgetWrapper from "components/ChatWidgetWrapper";
import { createSupabaseClient, SupabaseProvider } from "lib/supabaseHooks";
import { SWRConfig, useSWRConfig } from "swr";
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
import { Analytics } from "@vercel/analytics/react";
import { ToastContainer } from "react-toastify";

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
            <Head>
                {[
                    "https://vitals.vercel-insights.com",
                    // "https://clerk.prompt.meerkat-85.lcl.dev",
                    "https://app.papercups.io",
                    // "https://clerk.raisemore.app",
                ].map((url) => (
                    <Fragment key={url}>
                        <link rel="dns-prefetch" href={url} />
                        <link rel="preconnect" href={url} crossorigin />
                    </Fragment>
                ))}
                <style jsx global>
                    {globalCSS}
                </style>
            </Head>

            <SWRConfig value={optionsSWR}>
                <ClerkProvider {...pageProps}>
                    <SupabaseWrapper>
                        <Component {...pageProps} />
                    </SupabaseWrapper>
                </ClerkProvider>
            </SWRConfig>
            <Analytics />
            <ToastContainer />
        </>
    );
}

function SupabaseWrapper({ children }) {
    const { getToken, userId } = useAuth();
    const { data: supabaseAccessToken, mutate } = useSWR(
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
    if (userId && !supabaseClient) mutate();

    return (
        <SupabaseProvider value={supabaseClient}>
            <Layout>{children}</Layout>
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
