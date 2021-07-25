import { YOUTUBE_ORIGIN } from "./const"
import { sleep } from "./utils"

export class YTPlayer {
    iframe = document.createElement("iframe")
    widgetid: number
    connected = false

    constructor(videoId: string) {
        this.widgetid = Date.now()
        this.iframe.src = `${YOUTUBE_ORIGIN}/embed/${videoId}?autoplay=1&fs=0&disablekb=1&modestbranding=1&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1&origin=${location.origin}&vq=highres&widgetid=${this.widgetid}`
        window.addEventListener("message", e => {
            if (e.origin !== YOUTUBE_ORIGIN) return console.log("invalid origin")
            const data = JSON.parse(e.data)
            if (data.id !== this.widgetid) return
            this.connected = true
            switch (data.event) {
            case "onReady":
                if (this.onReadyCallback != null) this.onReadyCallback()
                break
            case "infoDelivery":
                const info = data.info as {
                    currentTime: number,
                }
                const diff = Math.abs(info.currentTime - __videoplayer.originalCurrentTime())
                if (diff > 0.5) {
                    this.call("seekTo", __videoplayer.originalCurrentTime(), true)
                }
                break
            case "onStateChange":
                const isPaused = data.info !== 1
                if (isPaused !== __videoplayer.paused()) {
                    if (isPaused) {
                        __videoplayer.pause()
                    } else {
                        __videoplayer.play()
                    }
                }
            default:
                console.log("iframe event", data)
            }
        })
        this.iframe.addEventListener("load", async () => {
            for (let i=0; i<100 && !this.connected; i++) {
                this.sendListening()
                await sleep(100)
            }
        })
    }

    postMessage(obj: any) {
        this.iframe.contentWindow!.postMessage(JSON.stringify({
            ...obj,
            id: this.widgetid,
        }), YOUTUBE_ORIGIN)
    }

    onReadyCallback?: () => any

    onLoad(callback: () => any) {
        this.iframe.addEventListener("load", callback)
    }

    sendListening() {
        this.postMessage({event: "listening", channel: "widget"})
    }

    call(func: string, ...args: any[]) {
        this.postMessage({event: "command", func, args, channel: "widget"})
    }
}