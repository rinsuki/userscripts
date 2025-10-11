// @ts-check

/** @type {Record<string, { var: string } & ({ path: string } | { url: string })>} */
export const table = {
    zod: {
        var: "Zod",
        path: "lib/index.umd.js",
    },
    react: {
        var: "React",
        path: "umd/react.production.min.js",
    },
    "react-dom": {
        var: "ReactDOM",
        path: "umd/react-dom.production.min.js",
    },
    "@rinsuki/dom-chef": {
        var: "DOMChef",
        path: "umd.js",
    }
}