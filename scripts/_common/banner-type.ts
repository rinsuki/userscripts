export const licenses = ["MIT"] as const

export type BannerType = {
    name: string,
    namespace: string,
    description: string,
    version: string,
    icon?: string,
    runAt?: "document-start" | "document-body" | "document-end" | "document-idle",
    noframes?: true,
    unwrap?: true,

    match?: string[],
    include?: RegExp[],
    exclude?: (string|RegExp)[],
    excludeMatch?: string[],

    grant: (
        | "GM_getValue"
        | "GM_setValue"
        | "GM.registerMenuCommand"
        | "GM.xmlHttpRequest"
    )[] | "none",

    require: string[],
    resource?: Record<string, string>,

    license?: typeof licenses[number],
    includeContributionURL: boolean,
    author: string,
    homepageURL?: string,
    supportURL?: string,
}
