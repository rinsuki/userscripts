import { ccPrefix } from "./css"
import { startYouTube } from "./start-yt"
import { sleep } from "./utils"

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