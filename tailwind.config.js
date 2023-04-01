// tailwind.config.js
const defaultTheme = require("tailwindcss/defaultTheme");
/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./src/pages/**/*.{js,ts,jsx,tsx}", "./src/components/**/*.{js,ts,jsx,tsx}"],
    theme: {
        extend: {
            fontSize: {
                "2xl": "1.4rem",
                "4xl": "2.5rem",
            },
            colors: {
                indigo: {
                    300: "#388bff",
                    400: "#388bff",
                    500: "#388bff",
                    600: "#388bff",
                    700: "#388bff",
                    800: "#388bff",
                },
                blue: {
                    // 300: "#388bff",
                    // 400: "#388bff",
                    500: "#388bff",
                    600: "#388bff",
                    700: "#388bff",
                    800: "#388bff",
                },
            },
        },
    },
    plugins: [require("@tailwindcss/forms")],
};
