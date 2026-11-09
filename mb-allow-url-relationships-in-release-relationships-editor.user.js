// ==UserScript==
// @name               MB: Allow URL Relationships in Release Relationships Editor
// @description        WIP!! THIS SCRIPT WOULD NOT CLEAN UP THE URL, PLEASE DO IT MANUALLY!! Special Thanks: Discord client modding community (such as Vencord), I stole the idea from them
// @namespace          https://rinsuki.net
// @author             rinsuki
// @version            0.0.2
// @license            GPL-3.0-or-later
// @grant              none
// @match              https://*.musicbrainz.org/release/*/edit-relationships*
// @run-at             document-start
// @contributionURL    https://github.com/sponsors/rinsuki
// @contributionAmount from 5.00 USD
// @homepageURL        https://github.com/rinsuki/userscripts
// @supportURL         https://github.com/rinsuki/userscripts/issues
// ==/UserScript==

(function () {
    'use strict';

    function hookApplier(chunk, hooks) {
        for (const modKey of Object.keys(chunk[1])) {
            const mod = chunk[1][modKey];
            if (typeof mod !== "function")
                continue;
            let modCode = mod.toString();
            let modded = false;
            for (const hook of hooks) {
                if (!hook.find.every(f => modCode.includes(f)))
                    continue;
                for (const patch of hook.patches) {
                    if (!patch.find.test(modCode)) {
                        alert(`RE is outdated (or conflict with another script), please tell the author to update!\n\nScript: ${GM_info.script.name}\n\nhook.find: ${JSON.stringify(hook.find)}\npatch.find: ${patch.find.source}`);
                        continue;
                    }
                    console.log(patch);
                    modCode = modCode.replace(patch.find, patch.replace);
                }
                modded = true;
                hook.patchedAtLeastOnce = true;
            }
            if (modded) {
                const moddedCode = `({${modCode}})`;
                const evaled = eval(moddedCode);
                chunk[1][modKey] = evaled[modKey];
            }
        }
    }
    function hookWebpack(chunkArray, hooks, checkPageLoaded) {
        const hookedModuleIds = new Set();
        const proxyMaker = (push) => new Proxy(push, {
            apply(target, thisArg, argArray) {
                for (const arg of argArray) {
                    let hasNotHookedChunks = false;
                    for (const chunkid of arg[0]) {
                        if (hookedModuleIds.has(chunkid))
                            continue;
                        hookedModuleIds.add(chunkid);
                        hasNotHookedChunks = true;
                    }
                    if (hasNotHookedChunks) {
                        hookApplier(arg, hooks);
                    }
                }
                return Reflect.apply(target, thisArg, argArray);
            }
        });
        let current = proxyMaker(chunkArray.push);
        Object.defineProperty(chunkArray, "push", {
            configurable: true,
            get() {
                return current;
            },
            set(newFunc) {
                current = proxyMaker(newFunc);
            }
        });
        if (checkPageLoaded) {
            const timer = setInterval(() => {
                if (!checkPageLoaded())
                    return;
                clearInterval(timer);
                let everyPatchesAreApplied = true;
                for (const hook of hooks) {
                    if (hook.dontCareEvenIfNotPatchedWhenPageLoaded)
                        continue;
                    if (hook.patchedAtLeastOnce)
                        continue;
                    everyPatchesAreApplied = false;
                    break;
                }
                if (everyPatchesAreApplied)
                    return;
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
                ].join("\n"));
            }, 1000);
        }
    }

    // SPDX-License-Identifier: GPL-3.0-or-later
    function REpatch(input) {
        const source = input.source;
        if (!source.includes("[varname]"))
            return input;
        // not all, but should be enough for minified scripts
        return new RegExp(source.replaceAll("[varname]", "[A-Za-z_][A-Za-z_0-9]*"), input.flags);
    }
    const hooks = [
        {
            name: "patch_calculateAllowedRelations",
            find: [".link_type_tree);for("],
            patches: [
                {
                    find: REpatch(/(?<=\)\){if\()"url"!==[varname](?=\)\{const )/),
                    replace: "true",
                }
            ],
        },
        {
            name: "patch_RelationshipDialogContent_hasBlankRequiredFields",
            find: ["autocomplete?.selectedItem?.entity"],
            patches: [
                {
                    find: REpatch(/![varname]\(([varname])\.autocomplete\?\.selectedItem\?\.entity\)/),
                    replace: "($1.targetType === 'url' ? false : $&)",
                }
            ],
        },
        {
            name: "patch_getInitialRelationshipUpdates",
            find: ['if("url"===', ".target_type)continue;"],
            patches: [
                {
                    find: REpatch(/if\("url"===([varname])\.target_type\)continue;/),
                    replace: 'if("url"===$1.target_type&&"recording"==$1.source_type)continue;',
                }
            ],
        }
    ];
    window.webpackChunkmusicbrainz_server ??= [];
    console.log(hooks);
    hookWebpack(window.webpackChunkmusicbrainz_server, hooks, () => document.getElementById("tracklist") != null);

})();
