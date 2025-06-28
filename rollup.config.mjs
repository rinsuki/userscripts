import fs from "fs"
import pluginTypescript from "@rollup/plugin-typescript"
import pluginNodeResolve from "@rollup/plugin-node-resolve"

const files = fs.readdirSync(import.meta.dirname+"/scripts")

export default files.filter(a => !a.startsWith(".") && !a.endsWith("_common")).map(file => {
    const baseId = import.meta.dirname + "/node_modules/";
    /** @type {import("rollup").RollupOptions} */
    return {
        input: "./scripts/" + file + "/src/index.tsx",
        output: [{
            name: file+".user",
            file: import.meta.dirname+"/dist/" + file + ".user.js",
            banner: () => fs.readFileSync(`${import.meta.dirname}/scripts/${file}/banner.js`, { encoding: "utf-8" }),
            format: "iife",
        }],
        plugins: [
            pluginTypescript(),
            pluginNodeResolve({
                browser: true,
            }),
            {
                name: "region",
                transform(code, id) {
                    if (!id.startsWith(baseId)) {
                        return code;
                    }
                    return "//#region node_modules/" + id.slice(baseId.length) + "\n" + code + "\n//#endregion"
                }
            }
        ],
        watch: {
            clearScreen: false,
        },
    }
})