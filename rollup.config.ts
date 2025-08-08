import fs from "node:fs"
import pluginTypescript from "@rollup/plugin-typescript"
import pluginNodeResolve from "@rollup/plugin-node-resolve"
import type { RollupOptions } from "rollup"
import type { BannerType } from "./scripts/_common/banner-type"

const files = fs.readdirSync("./scripts")

export default files.filter(a => !a.startsWith(".") && !a.endsWith("_common")).map(file => {
    const baseId = process.cwd() + "/node_modules/";
    return {
        input: "./scripts/" + file + "/src/index.tsx",
        output: [{
            name: file+".user",
            file: "./dist/" + file + ".user.js",
            banner: async (chunk) => {
                const content = fs.readFileSync(`./scripts/${file}/banner.js`, { encoding: "utf-8" })
                if (content.startsWith("// ==UserScript==")) {
                    return content
                }
                const mod = await import(`./scripts/${file}/banner.js?_=${Date.now()}`)
                if (mod.default?.name == null) {
                    throw new Error(`Invalid banner in ${file}: Expected a default export with a 'name' property`)  
                }
                const opts: BannerType = {
                    ...mod.default,
                }

                opts.homepageURL ??= "https://github.com/rinsuki/userscripts"
                opts.supportURL ??= "https://github.com/rinsuki/userscripts/issues"

                const optsArray: (readonly [string, string])[] = Object.entries(opts).flatMap(([key, value]) => {
                    if (key === "includeContributionURL" && value) {
                        return [
                            ["contributionURL", "https://rinsuki.fanbox.cc/"],
                            ["contributionURL", "https://github.com/sponsors/rinsuki"],
                        ] as const
                    }
                    const normalizedKey = key
                        .replace(/[A-Z]/g, (m) => {
                            return "-" + m.toLowerCase()
                        })
                        .replaceAll("-u-r-l", "URL")
                    if (Array.isArray(value)) {
                        return value.map(v => [normalizedKey, String(v)] as const)
                    }
                    if (value === false) return [] as [string, string][]
                    let stringValue = String(value)
                    if (value === true) stringValue = ""
                    return [[normalizedKey, stringValue]] as const
                })
                const keysMax = Math.max(...optsArray.map(a => a[0].length))
                return [
                    "// ==UserScript==",
                    ...optsArray.map(kv => {
                        const [key, value] = kv
                        return `// @${key.padEnd(keysMax)} ${value}`.replaceAll(/ +$/g, "")
                    }),
                    "// ==/UserScript==",
                    "",
                ].join("\n")
            },
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
    } satisfies RollupOptions
})