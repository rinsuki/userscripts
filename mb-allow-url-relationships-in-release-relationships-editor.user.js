// ==UserScript==
// @name               MB: Allow URL Relationships in Release Relationships Editor
// @description        WIP!! THIS SCRIPT WOULD NOT VALIDATE THE RELATIONSHIP TYPE, PLEASE USE IT VERY CAREFULLY!! Excludes recording-url relationships. Special Thanks: Discord client modding community (such as Vencord), I stole the idea from them
// @namespace          https://rinsuki.net
// @author             rinsuki
// @version            0.1.1
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

    const altRequireName = "__alt__webpack_require__";
    function hookApplier(chunk, hooks) {
        for (const modKey of Object.keys(chunk[1])) {
            const mod = chunk[1][modKey];
            if (typeof mod !== "function")
                continue;
            let modCode = mod.toString();
            let modded = false;
            let needsRequire = false;
            for (const hook of hooks) {
                if (!hook.find.every(f => modCode.includes(f)))
                    continue;
                if (hook.export) {
                    const e = hook.export;
                    if (!e.find.test(modCode)) {
                        alert(`RE is outdated (or conflict with another script), please tell the author to update!\n\nScript: ${GM_info.script.name}\n\nexport.find: ${JSON.stringify(hook.find)}\npatch.find: ${e.find.source}`);
                        continue;
                    }
                    console.log(e);
                    window[e.name] = modKey;
                }
                for (const [i, patch] of (hook.patches ?? []).entries()) {
                    if (!patch.find.test(modCode)) {
                        alert(`RE is outdated (or conflict with another script), please tell the author to update!\n\nScript: ${GM_info.script.name}\n\nhook.find: ${JSON.stringify(hook.find)}\npatch.find: ${patch.find.source}`);
                        continue;
                    }
                    console.log(patch);
                    let replace = patch.replace;
                    if (patch.callback) {
                        if (!replace.includes("$<callback>")) {
                            alert("WARNING: callback is exists, but patch didn't have a $<callback>");
                        }
                        const callbackName = `__userjs_${hook.name}__patch${i}__cb`;
                        window[callbackName] = patch.callback;
                        replace = replace.replaceAll("$<callback>", `window.${callbackName}`);
                    }
                    if (replace.includes("$<require>")) {
                        needsRequire = true;
                        replace = replace.replaceAll("$<require>", altRequireName);
                    }
                    modCode = modCode.replace(patch.find, replace);
                }
                modded = true;
                hook.patchedAtLeastOnce = true;
            }
            if (modded) {
                if (needsRequire) {
                    // try to extract require
                    const codeIndex = modCode.indexOf("{");
                    const useStrictIndex = modCode.indexOf("use strict");
                    const argStartIndex = modCode.indexOf("(");
                    const argEndIndex = modCode.indexOf(")");
                    if (argStartIndex >= argEndIndex || argEndIndex >= codeIndex) {
                        alert(`RE: failed to find the __webpack_require__, please tell the author to update!\n\nScript: ${GM_info.script.name}\n\nexport.find: ${JSON.stringify(hook.find)}\npatch.find: ${e.find.source}`);
                        return;
                    }
                    const argNames = modCode.slice(argStartIndex + 1, argEndIndex).split(",");
                    if (argNames.length < 3) {
                        // TODO: add the arg
                        alert(`RE: failed to inject the __webpack_require__, please tell the author to update!\n\nScript: ${GM_info.script.name}\n\nexport.find: ${JSON.stringify(hook.find)}\npatch.find: ${e.find.source}`);
                        return;
                    }
                    const injectIndex = useStrictIndex !== -1 ? useStrictIndex + "use strict".length + 2 : codeIndex + 1;
                    modCode = modCode.slice(0, injectIndex) + `const ${altRequireName}=${argNames[2]};` + modCode.slice(injectIndex);
                }
                const moddedCode = `({${modCode}})\n\n//# sourceURL=userscript-webpack-hook://${encodeURIComponent(GM_info.script.name.replace(/[: ]/g, "_"))}_${GM_info.script.uuid}/patched.${chunk[0].join("_")}.${modKey}.js`;
                console.log(moddedCode);
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

    function varname(capture) {
        let source = "[A-Za-z_][A-Za-z_0-9]*";
        if (capture) {
            source = `(${typeof capture === "string" ? `?<${capture}>` : ""}${source})`;
        }
        return { source };
    }
    function REk(name) {
        return { source: `\\k<${name}>` };
    }
    function REttl(strings, ...args) {
        let regex = "";
        for (let i = 0; i < strings.length; i++) {
            regex += RegExp.escape(strings[i]);
            const arg = args[i];
            if (typeof arg === "function") {
                regex += varname().source;
            }
            else if (typeof arg === "number") {
                regex += `\\${arg}`;
            }
            else if (arg != null) {
                regex += arg.source;
            }
        }
        return new RegExp(regex);
    }
    function REparts(pre, main, post) {
        let regex = "";
        if (pre != null) {
            regex += `(?<=${pre.source})`;
        }
        regex += main.source;
        if (post != null) {
            regex += `(?=${post.source})`;
        }
        return new RegExp(regex);
    }

    const hooks = [
        {
            name: "patch_calculateAllowedRelations",
            find: [".link_type_tree);for("],
            patches: [
                {
                    // allows you to choose "Related type: URL" in "Add relationship" dialog.
                    find: REparts(REttl `,${varname(true)})){if(`, REttl `"url"!==${varname}`, REttl `){const`),
                    replace: '"recording-url"!==$1',
                },
                {
                    // allows you to choose "Related type: URL" in "Add relationship" dialog, but for works.
                    find: REparts(REttl `}if(`, REttl `${varname(true)}!==${varname(true)}&&"url"!==${1}`, REttl `){const `),
                    replace: '$1!==$2&&("url"!==$1||"work"===$2)',
                }
            ],
        },
        {
            name: "patch_RelationshipDialogContent_hasBlankRequiredFields",
            find: ["autocomplete?.selectedItem?.entity"],
            patches: [
                {
                    // allows you to press "Done" in Add relationships dialog.
                    find: REparts(REttl `null==${varname}.autocomplete.selectedItem||`, REttl `!${varname}(${varname(true)}.autocomplete?.selectedItem?.entity)`),
                    replace: "($1.targetType === 'url' ? false : $&)",
                }
            ],
        },
        {
            name: "patch_getInitialRelationshipUpdates",
            find: ['if("url"===', ".target_type)continue;"],
            patches: [
                {
                    // allows you to see (release|release-group)-url relationships.
                    find: REparts(REttl `if(`, REttl `"url"===${varname(true)}.target_type`, REttl `)continue;`),
                    replace: '"url"===$1.target_type&&"recording"==$1.source_type',
                }
            ],
        },
        {
            name: "patch_DialogTargetEntity",
            find: ['"required section"', '="url"==='],
            patches: [
                {
                    // forbid you from edit existing *-url relationships (because we couldn't correctly edit them).
                    find: REparts(REttl `${varname}="url"===${varname}?(0,${varname}.jsx)("input",{`, REttl `onChange:${varname},type:"text",value:${varname(true)}.target.name`),
                    replace: "readOnly: $1.relationshipId>=0, $&",
                }
            ],
        },
        {
            name: "patch_relationshipsHaveSamePhraseGroup",
            find: ["entity0.id===", "linkTypeID==="],
            patches: [
                {
                    // allows you to change the URL of *-url relationships (only if they are not saved to the server).
                    find: REttl `(${varname(true)},${varname(true)}){return ${1}.linkTypeID===${2}.linkTypeID&&${1}.entity0.id===${2}.entity0.id&&${1}.entity1.id===${2}.entity1.id&&`,
                    replace: "$&($1.entity1.entityType==='url'?$1.entity1.name===$2.entity1.name:true)&&",
                }
            ]
        },
        {
            name: "find_ExternalLinksEditor_validateLink",
            find: ["Links to this website are not allowed"],
            export: {
                name: "__userjs_validateLink_module",
                find: REttl `${varname(true)}.set("error",null),${1}.set("url",${varname})`,
            }
        },
        {
            name: "patch_DialogTargetEntity_reducer",
            find: ['&&"update-url-text"==='],
            patches: [
                {
                    // (partially) validate the URL you input
                    find: REparts(null, REttl `const ${varname("url")}=${varname}.text;${varname("invariant")}("url"===${varname("state")}.targetType);const ${varname("newState")}={...${REk("state")}};${/.+?/};return ${varname}.name=${varname},${REk("newState")}.target=${varname}`, REttl `,${REk("newState")}}`),
                    replace: "$&,$<callback>($<newState>, $<url>, $<require>(__userjs_validateLink_module))",
                    callback(newState, url, module) {
                        const validateLink = Object.values(module).find(f => f.length === 2);
                        // DONT DO THIS
                        validateLink({
                            source: {
                                entityType: "release",
                            },
                        }, {
                            read() {
                                return {
                                    isSubmitted: false,
                                    url,
                                    relationships: [],
                                };
                            },
                            set(key, value) {
                                if (key === "error") {
                                    // value is now ErrorT (and value.message is ReactNode), but newState.error is `string`, so the type system wont pass
                                    // but hey, works at least for now
                                    newState.error = value?.message ?? "";
                                }
                            },
                            get(key) {
                                if (key === "relationships") {
                                    return {
                                        read() {
                                            return [];
                                        }
                                    };
                                }
                            }
                        });
                    }
                }
            ]
        },
        {
            name: "find_URLCleanup",
            find: ["%E2%80%8E"],
            export: {
                name: "__userjs_URLCleanup_module",
                find: REttl `%E2%80%8E`
            }
        },
        {
            name: "patch_RelationshipDialogContent_doAccept",
            find: ['type:"update-relationship-state"})'],
            patches: [
                {
                    // clean the URL
                    find: REparts(REttl `const ${varname}=function(){`, REttl `${varname}({batchSelectionCount:${varname},creditsToChangeForSource:${varname}.creditsToChange,creditsToChangeForTarget:${varname}.creditsToChange,newRelationshipState:${varname("newState")},oldRelationshipState:${varname("oldState")}`),
                    replace: `$<callback>($<oldState>, $<newState>, $<require>, __userjs_URLCleanup_module);$&`,
                    callback(oldState, newState, require, requireKey) {
                        if (newState.entity1.entityType !== "url")
                            return;
                        if (oldState.entity1.entityType === newState.entity1.entityType && oldState.entity1.name === newState.entity1.name)
                            return;
                        const cleaner = Object.values(require(requireKey)).find(f => f.length === 1 && f.toString().includes("%E2%80%8E"));
                        newState.entity1.name = cleaner(newState.entity1.name);
                    }
                }
            ]
        },
    ];
    window.webpackChunkmusicbrainz_server ??= [];
    console.log(hooks);
    hookWebpack(window.webpackChunkmusicbrainz_server, hooks, () => document.getElementById("tracklist") != null);

})();
