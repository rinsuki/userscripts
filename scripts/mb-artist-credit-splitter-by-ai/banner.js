// @ts-check
/** @type {import("../_common/banner-type").BannerType} */
export default {
    name: "MB: Artist Credit Splitter, but Powered by AI",
    namespace: "https://rinsuki.net/",
    version: "1.1.0",
    description: "OpenRouter でいい感じに MusicBrainz のアーティストクレジットを分割します (失敗することもあります)",
    author: "rinsuki",
    match: [
        "https://musicbrainz.org/*",
    ],
    grant: [
        "GM_getValue",
        "GM_setValue",
        "GM.registerMenuCommand",
        "GM.xmlHttpRequest",
    ],
    require: [],
    includeContributionURL: true,
}