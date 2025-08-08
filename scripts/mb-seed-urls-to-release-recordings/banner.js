// @ts-check
/** @type {import("../_common/banner-type").BannerType} */
export default {
    name: "MusicBrainz: Seed URLs to Release Recordings",
    namespace: "https://rinsuki.net",
    version: "0.2.1",
    description: "Import recording-url relationship to release's recordings.",
    author: "rinsuki",
    match: [
        "https://musicbrainz.org/release/*/edit-relationships",
        "https://*.musicbrainz.org/release/*/edit-relationships",
    ],
    grant: "none",
    includeContributionURL: true,
}