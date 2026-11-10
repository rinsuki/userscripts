// SPDX-License-Identifier: GPL-3.0-or-later
// window.webpackChunk<appname>
export type WebpackChunk = [number[], Record<string, unknown>, unknown]
export type WebpackPatch = {
    find: RegExp,
    replace: string,
    callback?: Function,
}
export type WebpackExport = {
    find: RegExp,
    name: string,
}

export type WebpackHook = {
    name: string,
    find: string[],
    patches?: WebpackPatch[],
    export?: WebpackExport,
    dontCareEvenIfNotPatchedWhenPageLoaded?: true,
    patchedAtLeastOnce?: true,
}

const altRequireName = "__alt__webpack_require__"

function hookApplier(chunk: WebpackChunk, hooks: WebpackHook[]) {
    for (const modKey of Object.keys(chunk[1])) {
        const mod = chunk[1][modKey]
        if (typeof mod !== "function") continue
        let modCode = mod.toString()
        let modded = false
        let needsRequire = false
        for (const hook of hooks) {
            if (!hook.find.every(f => modCode.includes(f))) continue
            if (hook.export) {
                const e = hook.export
                if (!e.find.test(modCode)) {
                    alert(`RE is outdated (or conflict with another script), please tell the author to update!\n\nScript: ${GM_info.script.name}\n\nexport.find: ${JSON.stringify(hook.find)}\npatch.find: ${e.find.source}`)
                    continue
                }
                console.log(e);
                (window as any)[e.name] = modKey
            }
            for (const [i, patch] of (hook.patches ?? []).entries()) {
                if (!patch.find.test(modCode)) {
                    alert(`RE is outdated (or conflict with another script), please tell the author to update!\n\nScript: ${GM_info.script.name}\n\nhook.find: ${JSON.stringify(hook.find)}\npatch.find: ${patch.find.source}`)
                    continue
                }
                console.log(patch)
                let replace = patch.replace
                if (patch.callback) {
                    if (!replace.includes("$<callback>")) {
                        alert("WARNING: callback is exists, but patch didn't have a $<callback>")
                    }
                    const callbackName = `__userjs_${hook.name}__patch${i}__cb`;
                    (window as any)[callbackName] = patch.callback
                    replace = replace.replaceAll("$<callback>", `window.${callbackName}`)
                }
                if (replace.includes("$<require>")) {
                    needsRequire = true
                    replace = replace.replaceAll("$<require>", altRequireName)
                }
                modCode = modCode.replace(patch.find, replace)
            }
            modded = true
            hook.patchedAtLeastOnce = true
        }
        if (modded) {
            if (needsRequire) {
                // try to extract require
                const codeIndex = modCode.indexOf("{")
                const useStrictIndex = modCode.indexOf("use strict");
                const argStartIndex = modCode.indexOf("(")
                const argEndIndex = modCode.indexOf(")")
                if (argStartIndex >= argEndIndex || argEndIndex >= codeIndex) {
                    alert(`RE: failed to find the __webpack_require__, please tell the author to update!\n\nScript: ${GM_info.script.name}\n\nexport.find: ${JSON.stringify(hook.find)}\npatch.find: ${e.find.source}`)
                    return
                }
                const argNames = modCode.slice(argStartIndex+1, argEndIndex).split(",")
                if (argNames.length < 3) {
                    // TODO: add the arg
                    alert(`RE: failed to inject the __webpack_require__, please tell the author to update!\n\nScript: ${GM_info.script.name}\n\nexport.find: ${JSON.stringify(hook.find)}\npatch.find: ${e.find.source}`)
                    return
                }
                const injectIndex = useStrictIndex !== -1 ? useStrictIndex + "use strict".length + 2 : codeIndex + 1
                modCode = modCode.slice(0, injectIndex) + `const ${altRequireName}=${argNames[2]};` + modCode.slice(injectIndex)
            }
            const moddedCode = `({${modCode}})\n\n//# sourceURL=userscript-webpack-hook://${encodeURIComponent(GM_info.script.name.replace(/[: ]/g, "_"))}_${GM_info.script.uuid}/patched.${chunk[0].join("_")}.${modKey}.js`
            console.log(moddedCode)
            const evaled = eval(moddedCode)
            chunk[1][modKey] = evaled[modKey]
        }
    }
}

type PushFn = WebpackChunk[]["push"]

export function hookWebpack(chunkArray: WebpackChunk[], hooks: WebpackHook[], checkPageLoaded?: () => boolean) {
    const hookedModuleIds = new Set<number>()

    const proxyMaker = (push: PushFn) => new Proxy(push, {
        apply(target, thisArg, argArray: Parameters<PushFn>) {
            for (const arg of argArray) {
                let hasNotHookedChunks = false
                for (const chunkid of arg[0]) {
                    if (hookedModuleIds.has(chunkid)) continue
                    hookedModuleIds.add(chunkid)
                    hasNotHookedChunks = true
                }
                if (hasNotHookedChunks) {
                    hookApplier(arg, hooks)
                }
            }

            return Reflect.apply(target, thisArg, argArray)
        }
    })
    
    let current = proxyMaker(chunkArray.push)

    Object.defineProperty(chunkArray, "push", {
        configurable: true,

        get() {
            return current
        },

        set(newFunc) {
            current = proxyMaker(newFunc)
        }
    })

    if (checkPageLoaded) {
        const timer = setInterval(() => {
            if (!checkPageLoaded()) return
            clearInterval(timer)
            let everyPatchesAreApplied = true
            for (const hook of hooks) {
                if (hook.dontCareEvenIfNotPatchedWhenPageLoaded) continue
                if (hook.patchedAtLeastOnce) continue
                everyPatchesAreApplied = false
                break
            }
            if (everyPatchesAreApplied) return
            alert([
                `UserScript ${GM_info.script.name}:`,
                "",
                "It seems we've arrived too late to patch the page, or the script is outdated and didn't follow the page's change.",
                "",
                "You might be need to adjust your UserScript loader settings.",
                "",
                "Tampermonkey:",
                `* Set Config mode to "Advanced"`,
                `* find "Security" and change "Content Script API" to "UserScripts API Dynamic"`,
                `* dont forget to click the save button!`,
                "",
                `Violentmonkey: Open the settings and enable "Synchronous <page> mode" checkbox.`,
                "",
                "for nerds:",
                "failed to patch the page's script, maybe @run-at document-start is too late or patch is outdated.",
                "",
                "success:",
                ...(hooks.filter(h => h.patchedAtLeastOnce).map(h => "* " + h.name)),
                "failed:",
                ...(hooks.filter(h => !h.patchedAtLeastOnce).map(h => "* " + h.name)),
            ].join("\n"))
        }, 1000)
    }
}