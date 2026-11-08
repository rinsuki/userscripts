// ==UserScript==
// @name            MB: Allow URL Relationships in Release Relationships Editor
// @description     WIP!! THIS SCRIPT WOULD NOT CLEAN UP THE URL, PLEASE DO IT MANUALLY!! Special Thanks: Discord client modding community (such as Vencord), I stole the idea from them
// @namespace       https://rinsuki.net
// @author          rinsuki
// @version         0.0.1
// @license         GPL-3.0-or-later
// @grant           none
// @match           https://*.musicbrainz.org/release/*/edit-relationships*
// @run-at          document-start
// @contributionURL https://github.com/sponsors/rinsuki
// @homepageURL     https://github.com/rinsuki/userscripts
// @supportURL      https://github.com/rinsuki/userscripts/issues
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
                        alert("RE is outdated, please tell the author to update!");
                        continue;
                    }
                    console.log(patch);
                    modCode = modCode.replace(patch.find, patch.replace);
                }
                modded = true;
            }
            if (modded) {
                const moddedCode = `({${modCode}})`;
                const evaled = eval(moddedCode);
                chunk[1][modKey] = evaled[modKey];
            }
        }
    }
    function hookWebpack(chunkArray, hooks) {
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
            find: [".link_type_tree);for("],
            patches: [
                {
                    find: REpatch(/(?<=\)\){if\()"url"!==[varname](?=\)\{const )/),
                    replace: "true",
                }
            ],
        },
        {
            find: ["autocomplete?.selectedItem?.entity"],
            patches: [
                {
                    find: REpatch(/![varname]\(([varname])\.autocomplete\?\.selectedItem\?\.entity\)/),
                    replace: "($1.targetType === 'url' ? false : $&)",
                }
            ],
        },
        {
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
    hookWebpack(window.webpackChunkmusicbrainz_server, hooks);

})();
