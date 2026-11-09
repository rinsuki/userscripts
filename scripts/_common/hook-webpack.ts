// SPDX-License-Identifier: GPL-3.0-or-later
// window.webpackChunk<appname>
export type WebpackChunk = [number[], Record<string, unknown>, unknown]
export type WebpackPatch = {
    find: RegExp,
    replace: string,
}

export type WebpackHook = {
    name: string,
    find: string[],
    patches: WebpackPatch[],
    dontCareEvenIfNotPatchedWhenPageLoaded?: true,
    patchedAtLeastOnce?: true,
}

function hookApplier(chunk: WebpackChunk, hooks: WebpackHook[]) {
    for (const modKey of Object.keys(chunk[1])) {
        const mod = chunk[1][modKey]
        if (typeof mod !== "function") continue
        let modCode = mod.toString()
        let modded = false
        for (const hook of hooks) {
            if (!hook.find.every(f => modCode.includes(f))) continue
            for (const patch of hook.patches) {
                if (!patch.find.test(modCode)) {
                    alert(`RE is outdated (or conflict with another script), please tell the author to update!\n\nScript: ${GM_info.script.name}\n\nhook.find: ${JSON.stringify(hook.find)}\npatch.find: ${patch.find.source}`)
                    continue
                }
                console.log(patch)
                modCode = modCode.replace(patch.find, patch.replace)
            }
            modded = true
            hook.patchedAtLeastOnce = true
        }
        if (modded) {
            const moddedCode = `({${modCode}})`
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