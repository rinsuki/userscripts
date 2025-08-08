import fs from "node:fs"
import pluginTypescript from "@rollup/plugin-typescript"
import pluginNodeResolve from "@rollup/plugin-node-resolve"
import string from "rollup-plugin-string-import"
import type { RollupOptions } from "rollup"
import type { BannerType } from "./scripts/_common/banner-type"
import externalGlobals from "rollup-plugin-external-globals"
/// @ts-expect-error
import { table as externalGlobalsTable } from "./external-globals.js"
import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"

const files = fs.readdirSync("./scripts")
const umdTables = Object.entries(externalGlobalsTable as Record<string, { var: string, path: string }>)
    .map(kv => {
        return [kv[0], kv[1].var + ` /* ${[
            "__UMD_IMPORT",
            kv[0],
            kv[1].path,
        ].join(":")} */`] as const
    })

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
                const mod = await import(`${process.cwd()}/scripts/${file}/banner.js?_=${Date.now()}`)
                if (mod.default?.name == null) {
                    throw new Error(`Invalid banner in ${file}: Expected a default export with a 'name' property`)
                }
                const opts: BannerType = {
                    ...mod.default,
                }

                if (process.env.NO_URLS !== "true") {
                    opts.homepageURL ??= "https://github.com/rinsuki/userscripts"
                    opts.supportURL ??= "https://github.com/rinsuki/userscripts/issues"
                }

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
                    if (typeof value === "object" && value != null) {
                        return Object.entries(value).map(kv => kv.join(" ")).map(x => [normalizedKey, x])
                    }
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
            externalGlobals(Object.fromEntries(umdTables)),
            string({
                include: ["**/*.html", "**/*.css"],
            }),
            {
                name: "region",
                transform(code, id) {
                    if (!id.startsWith(baseId)) {
                        return code;
                    }
                    return "//#region node_modules/" + id.slice(baseId.length) + "\n" + code + "\n//#endregion"
                }
            },
            {
                name: "add-require",
                async generateBundle(options, bundle) {
                    const firstBundle = Object.values(bundle)[0];
                    if (firstBundle.type !== "chunk") {
                        throw new Error("Expected first bundle to be a chunk");
                    }
                    const requires = new Set<string>()
                    let code = firstBundle.code
                    code = code.replaceAll(/ \/\* __UMD_IMPORT:([^:]+:.+?) \*\//g, (match, np) => {
                        requires.add(np)
                        return ""
                    })
                    console.log(requires)
                    const headerEnd = code.indexOf("// ==/UserScript==")
                    let header = code.slice(0, headerEnd)
                    const pad = /\/\/ @([a-zA-Z]+ +)/.exec(header)![1].length
                    header += [
                        ...await Promise.all(Array.from(requires).map(async np => {
                            const [name, path] = np.split(":")
                            const pj = JSON.parse(await readFile(`./node_modules/${name}/package.json`, "utf-8"))
                            const file = await readFile(`./node_modules/${name}/${path}`)
                            const hash = ["sha256", "sha512"].map(f =>  f + "-" + createHash(f).update(file).digest("base64")).join(",")
                            return `// ${"@require".padEnd(pad)} https://cdn.jsdelivr.net/npm/${name}@${pj.version}/${path}#${hash}`
                        })),
                    ].join("\n")
                    code = header.trimEnd() + "\n" + code.slice(headerEnd)
                    firstBundle.code = code
                }
            }
        ],
        watch: {
            clearScreen: false,
        },
    } satisfies RollupOptions
})
