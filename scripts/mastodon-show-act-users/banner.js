// @ts-check
/** @type {import("../_common/banner-type").BannerType} */
export default {
    name: "Mastodon Show act users in /@xxx/12345",
    namespace: "https://rinsuki.net",
    version: "0.3.2",
    description: "Mastodonの投稿詳細画面でBT/favしたユーザー一覧を見れるようにする",
    author: "rinsuki",
    include: [
        /^https:\/\/[^/]*\/@[A-Za-z0-9_]+\/[0-9]+([?#].*)?$/,
    ],
    excludeMatch: [
        "https://*/@*/*/embed",
        "https://*.tiktok.com/*",
    ],
    grant: [],
    
    includeContributionURL: true,
}