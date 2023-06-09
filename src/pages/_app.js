import { Fragment } from "react";
import Head from "next/head";
import useSWR from "swr";
import "styles/globals.css";
import { ClerkLoaded, ClerkProvider, useAuth } from "@clerk/nextjs";
import { createSupabaseClient, SupabaseProvider } from "lib/supabaseHooks";
import { SWRConfig } from "swr";
import { ToastContainer } from "react-toastify";
import Layout from "components/Layout/Layout";
import ChatWidgetWrapper from "components/ChatWidgetWrapper";
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
            <Head>
                <title>Raise More</title>
                {[
                    "https://vitals.vercel-insights.com",
                    "https://clerk.prompt.meerkat-85.lcl.dev",
                    "https://app.papercups.io",
                    "https://clerk.raisemore.app",
                ].map((url) => (
                    <Fragment key={url}>
                        <link rel="dns-prefetch" href={url} />
                        <link rel="preconnect" href={url} crossOrigin="true" />
                    </Fragment>
                ))}
            </Head>
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
            <ToastContainer />
        </>
    );
}

function SupabaseWrapper({ children }) {
    const { getToken, userId } = useAuth();
    const { data: supabaseAccessToken, mutate } = useSWR(
        "clerk",
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
            <ClerkLoaded>
                <ChatWidgetWrapper />
            </ClerkLoaded>
        </SupabaseProvider>
    );
}
export default App;
