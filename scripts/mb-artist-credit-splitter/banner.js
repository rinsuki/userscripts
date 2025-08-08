// @ts-check
/** @type {import("../_common/banner-type").BannerType} */
export default {
    name: "MB: Artist Credit Splitter",
    namespace: "https://rinsuki.net/",
    version: "1.0.2",
    description: "いい感じに MusicBrainz のアーティストクレジットを分割します (失敗することもあります)",
    author: "rinsuki",
    match: "https://musicbrainz.org/*",
    grant: "none",
    includeContributionURL: true,
}