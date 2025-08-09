import { ccPrefix } from "./css"
import { startYouTube } from "./start-yt"
import { sleep } from "./utils"

defineUserScript({
    name: "原点回帰(Re) あるいは ZenTube in 公式プレーヤー",
    namespace: "rinsuki.net",
    version: "1.0",
    description: "動画説明文内のYouTubeへのリンクに「原点回帰」ボタンが追加され、そのボタンを押すとYouTubeの埋め込みプレーヤーで動画が再生されるようになります。",
    author: "-",
    match: "https://www.nicovideo.jp/watch/*",
    grant: "none",
    includeContributionURL: true,
});

(async () => {
    // 本当は Observe とかしたほうがいいんだろうが…
    async function waitForSelectorExists(selector: string) {
        for (let i=0; i<5; i++) {
            const res = document.querySelector(selector)
            if (res != null) return res
            await sleep(1000)
        }
    }
    function createActivateButton(videoId: string, dom: HTMLElement) {
        const button = document.createElement("button")
        button.innerText = "原点回帰"
        button.className = `${ccPrefix}-start`
        button.addEventListener("click", () => startYouTube(videoId))
        dom.parentElement!.insertBefore(button, dom.nextSibling)
    }
    const domDescription = await waitForSelectorExists(".VideoDescription-html")
    if (domDescription == null) return
    for (const link of domDescription.querySelectorAll("a")) {
        console.log(link)
        if (link.hostname === "youtu.be") createActivateButton(link.pathname.slice(1), link)
        if ((link.hostname === "youtube.com" || link.hostname.endsWith(".youtube.com")) && link.pathname === "/watch") {
            const url = new URL(link.href)
            const vid = url.searchParams.get("v")
            if (vid != null) createActivateButton(vid, link)
        }
    }
})()