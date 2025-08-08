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
    require: [
        "https://cdn.jsdelivr.net/npm/zod@3.24.4/lib/index.umd.js#sha256=25623a1c332de4571b75a2a6fb8be1fae40180c8fdfd7b4420f09bea727cee1c",
    ],
    grant: "none",
    includeContributionURL: true,
}