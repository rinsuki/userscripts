// @ts-check
/** @type {import("../_common/banner-type").BannerType} */
export default {
    name: "ニコニコ動画の検索のソート選択を表にする",
    namespace: "rinsuki.net",
    version: "1.0",
    description: "ニコニコ動画の検索のソート順を選ぶところを表レイアウトにします。",
    author: "rinsuki",
    match: [
        "https://www.nicovideo.jp/tag/*",
        "https://www.nicovideo.jp/search/*",
    ],
    require: [
        "https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.production.min.js#sha256=c9486f126615859fc61ac84840a02b2efc920d287a71d99d708c74b2947750fe",
        "https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.production.min.js#sha256=bc5b7797e8a595e365c1385b0d47683d3a85f3533c58d499659b771c48ec6d25",
    ],
    grant: [],
    includeContributionURL: true,
}