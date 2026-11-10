import { hookWebpack, WebpackHook } from "#common/hook-webpack"
import { REk, REparts, REttl, varname } from "#common/regex-builder"
import { DialogTargetEntityStateT, LinksEditorStateT, LinkStateT, RelatableEntityT, RelationshipStateT } from "typedbrainz/types"

defineUserScript({
    name: "MB: Allow URL Relationships in Release Relationships Editor",
    description: "WIP!! THIS SCRIPT WOULD NOT VALIDATE THE RELATIONSHIP TYPE, PLEASE USE IT VERY CAREFULLY!! Excludes recording-url relationships. Special Thanks: Discord client modding community (such as Vencord), I stole the idea from them",
    namespace: "https://rinsuki.net",
    author: "rinsuki",
    version: "0.1.0",
    license: "GPL-3.0-or-later", // because of hook-webpack
    grant: "none",
    match: [
        "https://*.musicbrainz.org/release/*/edit-relationships*",
    ],
    runAt: "document-start",
    includeContributionURL: true,
})

type Mutable<T> = {-readonly [K in keyof T]: T[K]}

const hooks: WebpackHook[] = [
    {
        name: "patch_calculateAllowedRelations",
        find: [".link_type_tree);for("],
        patches: [
            {
                // allows you to choose "Related type: URL" in "Add relationship" dialog.
                find: REparts(
                    REttl`,${varname(true)})){if(`,
                    REttl`"url"!==${varname}`,
                    REttl`){const`,
                ),
                replace: '"recording-url"!==$1',
            }
        ],
    },
    {
        name: "patch_RelationshipDialogContent_hasBlankRequiredFields",
        find: ["autocomplete?.selectedItem?.entity"],
        patches: [
            {
                // allows you to press "Done" in Add relationships dialog.
                find: REparts(
                    REttl`null==${varname}.autocomplete.selectedItem||`,
                    REttl`!${varname}(${varname(true)}.autocomplete?.selectedItem?.entity)`,
                ),
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
                find: REparts(
                    REttl`if(`,
                    REttl`"url"===${varname(true)}.target_type`,
                    REttl`)continue;`
                ),
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
                find: REparts(
                    REttl`${varname}="url"===${varname}?(0,${varname}.jsx)("input",{`,
                    REttl`onChange:${varname},type:"text",value:${varname(true)}.target.name`,
                ),
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
                find: REttl`(${varname(true)},${varname(true)}){return ${1}.linkTypeID===${2}.linkTypeID&&${1}.entity0.id===${2}.entity0.id&&${1}.entity1.id===${2}.entity1.id&&`,
                replace: "$&($1.entity1.entityType==='url'?$1.entity1.name===$2.entity1.name:true)&&",
            }
        ]
    },
    {
        name: "find_ExternalLinksEditor_validateLink",
        find: ["Links to this website are not allowed"],
        export: {
            name: "__userjs_validateLink_module",
            find: REttl`${varname(true)}.set("error",null),${1}.set("url",${varname})`,
        }
    },
    {
        name: "patch_DialogTargetEntity_reducer",
        find: ['&&"update-url-text"==='],
        patches: [
            {
                // (partially) validate the URL you input
                find: REparts(
                    null,
                    REttl`const ${varname("url")}=${varname}.text;${varname("invariant")}("url"===${varname("state")}.targetType);const ${varname("newState")}={...${REk("state")}};${/.+?/};return ${varname}.name=${varname},${REk("newState")}.target=${varname}`,
                    REttl`,${REk("newState")}}`,
                ),
                replace: "$&,$<callback>($<newState>, $<url>, $<require>(__userjs_validateLink_module))",
                callback(newState: Mutable<DialogTargetEntityStateT>, url: string, module: Record<string, (state: Partial<LinksEditorStateT>, linkCtx: any) => void>) {
                    const validateLink = Object.values(module).find(f => f.length === 2)!
                    // DONT DO THIS
                    validateLink({
                        source: {
                            entityType: "release",
                        } satisfies Partial<RelatableEntityT> as any,
                    }, {
                        read(): Partial<LinkStateT> {
                            return {
                                isSubmitted: false,
                                url,
                                relationships: [],
                            }
                        },
                        set(key: string, value: any) {
                            if (key === "error") {
                                // value is now ErrorT (and value.message is ReactNode), but newState.error is `string`, so the type system wont pass
                                // but hey, works at least for now
                                newState.error = value?.message ?? "";
                            }
                        },
                        get(key: string) {
                            if (key === "relationships") {
                                return {
                                    read() {
                                        return []
                                    }
                                }
                            }
                        }
                    })
                }
            }
        ]
    },
    {
        name: "find_URLCleanup",
        find: ["%E2%80%8E"],
        export: {
            name: "__userjs_URLCleanup_module",
            find: REttl`%E2%80%8E`
        }
    },
    {
        name: "patch_RelationshipDialogContent_doAccept",
        find: ['type:"update-relationship-state"})'],
        patches: [
            {
                // clean the URL
                find: REparts(
                    REttl`const ${varname}=function(){`,
                    REttl`${varname}({batchSelectionCount:${varname},creditsToChangeForSource:${varname}.creditsToChange,creditsToChangeForTarget:${varname}.creditsToChange,newRelationshipState:${varname("newState")},oldRelationshipState:${varname("oldState")}`
                ),
                replace: `$<callback>($<oldState>, $<newState>, $<require>, __userjs_URLCleanup_module);$&`,
                callback(oldState: RelationshipStateT, newState: RelationshipStateT, require: (key: string) => Record<string, (input: string) => string>, requireKey: string) {
                    if (newState.entity1.entityType !== "url") return
                    if (oldState.entity1.entityType === newState.entity1.entityType && oldState.entity1.name === newState.entity1.name) return
                    const cleaner = Object.values(require(requireKey)).find(f => f.length === 1 && f.toString().includes("%E2%80%8E"))!
                    newState.entity1.name = cleaner(newState.entity1.name)
                }
            }
        ]
    },
]

declare global {
    var webpackChunkmusicbrainz_server: [number[], Record<string, unknown>, unknown][]
}
window.webpackChunkmusicbrainz_server ??= []

console.log(hooks)
hookWebpack(window.webpackChunkmusicbrainz_server, hooks, () => document.getElementById("tracklist") != null)
