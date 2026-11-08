// SPDX-License-Identifier: GPL-3.0-or-later
// window.webpackChunk<appname>
export type WebpackChunk = [number[], Record<string, unknown>, unknown]
export type WebpackPatch = {
    find: RegExp,
    replace: string,
}

export type WebpackHook = {
    find: string[],
    patches: WebpackPatch[],
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
                    alert(`RE is outdated, please tell the author to update!\n\nScript: ${GM_info.script.name}\n\nhook.find: ${JSON.stringify(hook.find)}\npatch.find: ${patch.find.source}`)
                    continue
                }
                console.log(patch)
                modCode = modCode.replace(patch.find, patch.replace)
            }
            modded = true
        }
        if (modded) {
            const moddedCode = `({${modCode}})`
            const evaled = eval(moddedCode)
            chunk[1][modKey] = evaled[modKey]
        }
    }
}

type PushFn = WebpackChunk[]["push"]

export function hookWebpack(chunkArray: WebpackChunk[], hooks: WebpackHook[]) {
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
}