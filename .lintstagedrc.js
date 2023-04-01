// .lintstagedrc.js
module.exports = {
    "src/**/*.{js,ts,jsx,tsx}": ["npm run format", "eslint --fix"],
};
