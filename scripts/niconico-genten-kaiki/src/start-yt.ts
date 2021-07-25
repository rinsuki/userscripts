import { ccPrefix } from "./css"
import { YTPlayer } from "./yt-player"

export function startYouTube(videoId: string) {
    __videoplayer.pause()
    __videoplayer.replace(`https://api.rinsuki.net/s/dummymovie/mp4/seconds/${Math.floor(__videoplayer.duration())}`)
    document.body.classList.add(`${ccPrefix}-now`)
    const wrapper = document.createElement("div")
    wrapper.className = `${ccPrefix}-wrapper`
    const player = new YTPlayer(videoId)
    wrapper.appendChild(player.iframe)
    document.getElementById("MainVideoPlayer")!.appendChild(wrapper)
    const button = document.createElement("button")
    button.className = `ActionButton ControllerButton ${ccPrefix}-switchbutton`
    button.innerHTML = `<div class="ControllerButton-inner"><svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path class="${ccPrefix}-ytb-b" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"></path><path class="${ccPrefix}-ytb-p" d="M 45,24 27,14 27,34"></path></svg></div>`
    function updateButtonTitle() {
        button.dataset.title = `YouTubeのコントロールをでき${document.body.classList.contains(`${ccPrefix}-enableytclick`) ? "ない": "る"}ようにする`
    }
    updateButtonTitle()
    button.addEventListener("click", () => {
        document.body.classList.toggle(`${ccPrefix}-enableytclick`)
        updateButtonTitle()
    })
    const cca = document.querySelector(".ControllerContainer-area:last-child")!
    cca.insertBefore(button, cca.firstChild)
    
    player.onReadyCallback = () => {
        __videoplayer.play()
        player.call("addEventListener", "onStateChange")
    }
}