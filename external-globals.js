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
    "dom-chef": {
        var: "DOMChef",
        url: "https://update.greasyfork.org/scripts/545051/1637871/dom-chef%20511%20UMD%20version.js#sha256=12f18c54da1bda34617304a8f20186269de664910d35a430ae962535142550c7",
    }
}