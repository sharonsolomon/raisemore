const { withSentryConfig } = require("@sentry/nextjs");

const securityHeaders = [
    {
        key: "X-DNS-Prefetch-Control",
        value: "on",
    },
    {
        key: "X-Content-Type-Options",
        value: "nosniff",
    },
    {
        key: "X-Frame-Options",
        value: "sameorigin",
    },
    {
        key: "X-XSS-Protection",
        value: "1; mode=block",
    },
    {
        key: "Referrer-Policy",
        value: "same-origin",
    },
    // TODO: add a proper Content-Security-Policy that includes clerk and supabase
];

const nextConfig = {
    reactStrictMode: true,
    compiler: {
        styledComponents: true,
        // removeConsole: {
        //     exclude: ["error"],
        // },
    },
    images: {
        // formats: ["image/avif", "image/webp"],
        remotePatterns: [
            {
                protocol: "https",
                hostname: "assets.vercel.com",
                port: "",
                pathname: "/image/upload/**",
            },
            {
                protocol: "https",
                hostname: "lh3.googleusercontent.com",
                port: "",
                pathname: "**",
            },
        ],
    },
    // basePath: "/app",
    async redirects() {
        return [
            {
                source: "/",
                permanent: false,
                missing: [
                    {
                        type: "cookie",
                        key: "__client_uat",
                        // value: "*",
                    },
                ],
                destination: "https://join.raisemore.app/",
                basePath: false,
            },
            // {
            //     source: "/",
            //     permanent: false,
            //     has: [
            //         {
            //             type: "cookie",
            //             key: "__client_uat",
            //             value: "0",
            //         },
            //     ],
            //     destination: "https://join.raisemore.app/",
            //     basePath: false,
            // },
        ];
    },
    async headers() {
        return [
            {
                // Apply these headers to all routes in your application.
                source: "/:path*",
                headers: securityHeaders,
            },
        ];
    },
};

module.exports = nextConfig;

// Sentry
module.exports = withSentryConfig(module.exports, { silent: true }, { hideSourcemaps: true });

// Next bundle analyzer
// const withBundleAnalyzer = require("@next/bundle-analyzer")({
//     enabled: process.env.ANALYZE === "true",
// });
// module.exports = withBundleAnalyzer(module.exports);
