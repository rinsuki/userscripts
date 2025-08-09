import fs from "node:fs"
import pluginTypescript from "@rollup/plugin-typescript"
import pluginNodeResolve from "@rollup/plugin-node-resolve"
import string from "rollup-plugin-string-import"
import type { RollupOptions } from "rollup"
import type { BannerType } from "./scripts/_common/banner-type"
import externalGlobals from "rollup-plugin-external-globals"
/// @ts-expect-error
import { table as externalGlobalsTableRaw } from "./external-globals.js"
import { readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import { join } from "node:path"
import { walk } from "estree-walker"
import { runInNewContext } from "node:vm"

const files = fs.readdirSync("./scripts")
const externalGlobalsTable: Record<string, { var: string } & ({ path: string } | { url: string })> = externalGlobalsTableRaw
const umdTables = Object.entries(externalGlobalsTable)
    .map(kv => {
        return [kv[0], kv[1].var + ` /* ${[
            "__UMD_IMPORT",
            kv[0]
        ].join(":")} */`] as const
    })

function evalDefineUserScript(code: string): BannerType {
    return JSON.parse(runInNewContext(`
        RegExp.prototype.toJSON = function() {
            return this.toString();
        }
        function defineUserScript(banner) {
            return banner;
        }
        JSON.stringify(${code})
    `))
}

function convertBannerObjectToString(opts: BannerType): string {
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
        "",
    ].join("\n")
}

export default files.filter(a => !a.startsWith(".") && !a.endsWith("_common") && (a.includes(".user.") || !a.includes("."))).map(file => {
    const baseId = process.cwd() + "/node_modules/";

    const fileAbs = join(process.cwd(), "scripts", file);
    const stat = fs.statSync(fileAbs);
    const entry = stat.isDirectory() ? join(fileAbs, "src", "index.tsx") : fileAbs;

    return {
        input: entry,
        output: [{
            name: file+".user",
            file: "./dist/" + file.split(".user.")[0] + ".user.js",
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
                name: "banner-extractor",
                generateBundle(options, bundle) {
                    const firstBundle = Object.values(bundle)[0];
                    if (firstBundle.type !== "chunk") {
                        throw new Error("Expected first bundle to be a chunk");
                    }
                    let code = firstBundle.code
                    if (!code.includes("defineUserScript")) {
                        return
                    }
                    const ast = this.parse(code);
                    walk(ast, {
                        enter(node) {
                            if (
                                node.type === "CallExpression" &&
                                node.callee.type === "Identifier" &&
                                node.callee.name === "defineUserScript" &&
                                "start" in node && typeof node.start === "number" &&
                                "end" in node && typeof node.end === "number"
                            ) {
                                const defineCode = code.slice(node.start, node.end);
                                code = convertBannerObjectToString(evalDefineUserScript(defineCode)) + code.slice(0, node.start) + code.slice(code[node.end] === ";" ? node.end + 1 : node.end).trimStart();
                            }
                        }
                    })
                    firstBundle.code = code;
                }
            },
            {
                name: "banner-fallback",
                async generateBundle(options, bundle) {
                    const firstBundle = Object.values(bundle)[0];
                    if (firstBundle.type !== "chunk") {
                        throw new Error("Expected first bundle to be a chunk");
                    }

                    const bannerJs = `./scripts/${file}/banner.js`
                    if (!fs.existsSync(bannerJs)) {
                        return
                    }
                    let ourBanner
                    const content = fs.readFileSync(bannerJs, { encoding: "utf-8" })
                    if (content.startsWith("// ==UserScript==")) {
                        ourBanner = content
                    } else {
                        const mod = await import(`${process.cwd()}/scripts/${file}/banner.js?_=${Date.now()}`)
                        if (mod.default?.name == null) {
                            throw new Error(`Invalid banner in ${file}: Expected a default export with a 'name' property`)
                        }
                        const opts: BannerType = {
                            ...mod.default,
                        }

                        ourBanner = convertBannerObjectToString(opts)
                    }

                    const inlineBannerIndex = firstBundle.code.indexOf("// ==/UserScript==")
                    if (inlineBannerIndex === -1) {
                        firstBundle.code = ourBanner + firstBundle.code
                        return
                    }
                    const inlineBannerUntilEnd = firstBundle.code.slice(0, inlineBannerIndex)
                    const ourBannerIndex = ourBanner.indexOf("// ==/UserScript==")
                    const ourBannerUntilEnd = ourBanner.slice(0, ourBannerIndex)
                    if (inlineBannerUntilEnd === ourBannerUntilEnd) {
                        return
                    }

                    console.log(inlineBannerUntilEnd, ourBannerUntilEnd)

                    throw new Error(`Inline banner in ${file} does not match the banner in banner.js.`)
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
                    code = code.replaceAll(/ \/\* __UMD_IMPORT:(.+?) \*\//g, (match, name) => {
                        requires.add(name)
                        return ""
                    })
                    console.log(requires)
                    const headerEnd = code.indexOf("// ==/UserScript==")
                    let header = code.slice(0, headerEnd)
                    const pad = /\/\/ @([a-zA-Z]+ +)/.exec(header)![1].length
                    header += [
                        ...await Promise.all(Array.from(requires).map(async name => {
                            const v = externalGlobalsTable[name]
                            let url: string
                            if ("path" in v) {
                                const path = v.path
                                const pj = JSON.parse(await readFile(`./node_modules/${name}/package.json`, "utf-8"))
                                const file = await readFile(`./node_modules/${name}/${path}`)
                                const hash = ["sha256", "sha512"].map(f =>  f + "-" + createHash(f).update(file).digest("base64")).join(",")
                                url = `https://cdn.jsdelivr.net/npm/${name}@${pj.version}/${path}#${hash}`
                            } else {
                                url = v.url
                            }
                            return `// ${"@require".padEnd(pad)} ${url}`
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
