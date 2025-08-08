// ==UserScript==
// @name            原点回帰(Re) あるいは ZenTube in 公式プレーヤー
// @namespace       rinsuki.net
// @version         1.0
// @description     動画説明文内のYouTubeへのリンクに「原点回帰」ボタンが追加され、そのボタンを押すとYouTubeの埋め込みプレーヤーで動画が再生されるようになります。
// @author          -
// @match           https://www.nicovideo.jp/watch/*
// @grant           none
// @contributionURL https://rinsuki.fanbox.cc/
// @contributionURL https://github.com/sponsors/rinsuki
// @homepageURL     https://github.com/rinsuki/userscripts
// @supportURL      https://github.com/rinsuki/userscripts/issues

// ==/UserScript==

(function () {
    'use strict';

    const style = document.createElement("style");
    // CSS Class Prefix
    const ccPrefix = "userjs-gentenkaiki";
    style.innerText = `
body.${ccPrefix}-now .${ccPrefix}-start { display: none; }
body.${ccPrefix}-enableytclick .VideoSymbolContainer,
body.${ccPrefix}-enableytclick .CommentRenderer { pointer-events: none; }
body.${ccPrefix}-now #MainVideoPlayer > video { display: none !important; }

.${ccPrefix}-wrapper { z-index: 0; }
.${ccPrefix}-wrapper, .${ccPrefix}-wrapper > iframe { position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none; }
.${ccPrefix}-wrapper > iframe { z-index: 1; }
body:not(.${ccPrefix}-enableytclick) .${ccPrefix}-player > iframe { pointer-events: none; }
.${ccPrefix}-ytb-b { fill: #fff }
.${ccPrefix}-ytb-p { fill: #000 }
body.${ccPrefix}-enableytclick .${ccPrefix}-ytb-b { fill: #f00 }
body.${ccPrefix}-enableytclick #UadPlayer { pointer-events: none; }
`;
    document.head.appendChild(style);

    const YOUTUBE_ORIGIN = "https://www.youtube.com";

    function sleep(msec) { return new Promise(resolve => setTimeout(resolve, msec)); }

    class YTPlayer {
        iframe = document.createElement("iframe");
        widgetid;
        connected = false;
        constructor(videoId) {
            this.widgetid = Date.now();
            this.iframe.src = `${YOUTUBE_ORIGIN}/embed/${videoId}?autoplay=1&fs=0&disablekb=1&modestbranding=1&playsinline=1&rel=0&showinfo=0&iv_load_policy=3&enablejsapi=1&origin=${location.origin}&vq=highres&widgetid=${this.widgetid}`;
            window.addEventListener("message", e => {
                if (e.origin !== YOUTUBE_ORIGIN)
                    return console.log("invalid origin");
                const data = JSON.parse(e.data);
                if (data.id !== this.widgetid)
                    return;
                this.connected = true;
                switch (data.event) {
                    case "onReady":
                        if (this.onReadyCallback != null)
                            this.onReadyCallback();
                        break;
                    case "infoDelivery":
                        const info = data.info;
                        const diff = Math.abs(info.currentTime - __videoplayer.originalCurrentTime());
                        if (diff > 0.5) {
                            this.call("seekTo", __videoplayer.originalCurrentTime(), true);
                        }
                        break;
                    case "onStateChange":
                        const isPaused = data.info !== 1;
                        if (isPaused !== __videoplayer.paused()) {
                            if (isPaused) {
                                __videoplayer.pause();
                            }
                            else {
                                __videoplayer.play();
                            }
                        }
                    default:
                        console.log("iframe event", data);
                }
            });
            this.iframe.addEventListener("load", async () => {
                for (let i = 0; i < 100 && !this.connected; i++) {
                    this.sendListening();
                    await sleep(100);
                }
            });
        }
        postMessage(obj) {
            this.iframe.contentWindow.postMessage(JSON.stringify({
                ...obj,
                id: this.widgetid,
            }), YOUTUBE_ORIGIN);
        }
        onReadyCallback;
        onLoad(callback) {
            this.iframe.addEventListener("load", callback);
        }
        sendListening() {
            this.postMessage({ event: "listening", channel: "widget" });
        }
        call(func, ...args) {
            this.postMessage({ event: "command", func, args, channel: "widget" });
        }
    }

    function startYouTube(videoId) {
        __videoplayer.pause();
        __videoplayer.replace(`https://api.rinsuki.net/s/dummymovie/mp4/seconds/${Math.floor(__videoplayer.duration())}`);
        document.body.classList.add(`${ccPrefix}-now`);
        const wrapper = document.createElement("div");
        wrapper.className = `${ccPrefix}-wrapper`;
        const player = new YTPlayer(videoId);
        wrapper.appendChild(player.iframe);
        document.getElementById("MainVideoPlayer").appendChild(wrapper);
        const button = document.createElement("button");
        button.className = `ActionButton ControllerButton ${ccPrefix}-switchbutton`;
        button.innerHTML = `<div class="ControllerButton-inner"><svg height="100%" version="1.1" viewBox="0 0 68 48" width="100%"><path class="${ccPrefix}-ytb-b" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"></path><path class="${ccPrefix}-ytb-p" d="M 45,24 27,14 27,34"></path></svg></div>`;
        function updateButtonTitle() {
            button.dataset.title = `YouTubeのコントロールをでき${document.body.classList.contains(`${ccPrefix}-enableytclick`) ? "ない" : "る"}ようにする`;
        }
        updateButtonTitle();
        button.addEventListener("click", () => {
            document.body.classList.toggle(`${ccPrefix}-enableytclick`);
            updateButtonTitle();
        });
        const cca = document.querySelector(".ControllerContainer-area:last-child");
        cca.insertBefore(button, cca.firstChild);
        player.onReadyCallback = () => {
            __videoplayer.play();
            player.call("addEventListener", "onStateChange");
        };
    }

    (async () => {
        // 本当は Observe とかしたほうがいいんだろうが…
        async function waitForSelectorExists(selector) {
            for (let i = 0; i < 5; i++) {
                const res = document.querySelector(selector);
                if (res != null)
                    return res;
                await sleep(1000);
            }
        }
        function createActivateButton(videoId, dom) {
            const button = document.createElement("button");
            button.innerText = "原点回帰";
            button.className = `${ccPrefix}-start`;
            button.addEventListener("click", () => startYouTube(videoId));
            dom.parentElement.insertBefore(button, dom.nextSibling);
        }
        const domDescription = await waitForSelectorExists(".VideoDescription-html");
        if (domDescription == null)
            return;
        for (const link of domDescription.querySelectorAll("a")) {
            console.log(link);
            if (link.hostname === "youtu.be")
                createActivateButton(link.pathname.slice(1), link);
            if ((link.hostname === "youtube.com" || link.hostname.endsWith(".youtube.com")) && link.pathname === "/watch") {
                const url = new URL(link.href);
                const vid = url.searchParams.get("v");
                if (vid != null)
                    createActivateButton(vid, link);
            }
        }
    })();

})();
