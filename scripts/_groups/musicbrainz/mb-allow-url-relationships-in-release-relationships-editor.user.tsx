// SPDX-License-Identifier: GPL-3.0-or-later
import { hookWebpack, WebpackHook } from "#common/hook-webpack"

defineUserScript({
    name: "MB: Allow URL Relationships in Release Relationships Editor",
    description: "WIP!! THIS SCRIPT WOULD NOT CLEAN UP THE URL, PLEASE DO IT MANUALLY!! Special Thanks: Discord client modding community (such as Vencord), I stole the idea from them",
    namespace: "https://rinsuki.net",
    author: "rinsuki",
    version: "0.0.2",
    license: "GPL-3.0-or-later",
    grant: "none",
    match: [
        "https://*.musicbrainz.org/release/*/edit-relationships*",
    ],
    runAt: "document-start",
    includeContributionURL: true,
})

function REpatch(input: RegExp): RegExp {
    const source = input.source
    if (!source.includes("[varname]")) return input
    // not all, but should be enough for minified scripts
    return new RegExp(source.replaceAll("[varname]", "[A-Za-z_][A-Za-z_0-9]*"), input.flags)
}

const hooks: WebpackHook[] = [
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
]

declare global {
    var webpackChunkmusicbrainz_server: [number[], Record<string, unknown>, unknown][]
}
window.webpackChunkmusicbrainz_server ??= []

console.log(hooks)
hookWebpack(window.webpackChunkmusicbrainz_server, hooks, () => document.getElementById("tracklist") != null)
