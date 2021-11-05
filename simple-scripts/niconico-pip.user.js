// ==UserScript==
// @name        niconico pip (ボツ)
// @namespace   https://rinsuki.net
// @match       https://www.nicovideo.jp/watch/*
// @grant       none
// @version     1.0
// @author      rinsuki
// @description ボツ案
// ==/UserScript==
// @ts-check

(() => {
    function start() {
        const buttonContainer = document.querySelector(".ControllerContainer-area:last-child")
        if (buttonContainer == null) return
        const inputVideo = document.querySelector("video")
        const commentCanvas = document.querySelector(".CommentRenderer").querySelector("canvas")
        const pipVideo = document.createElement("video")
        pipVideo.muted = true
        pipVideo.srcObject = commentCanvas.captureStream()
        pipVideo.style.position = "fixed"
        pipVideo.style.bottom = "0"
        pipVideo.style.left = "0"
        pipVideo.style.width = "160px"
        pipVideo.style.height = "90px"
        pipVideo.play()
        pipVideo.controls = true
        document.body.appendChild(pipVideo)
        const origClearRect = CanvasRenderingContext2D.prototype.clearRect
        CanvasRenderingContext2D.prototype.clearRect = function(x, y, w, h) {
            if (this.canvas != commentCanvas || pipVideo.paused) return origClearRect.call(this, x, y, w, h)
            this.drawImage(inputVideo, 0, 0, inputVideo.videoWidth, inputVideo.videoHeight, x, y, w, h)
        }
    }
    const button = document.createElement("button")
    button.onclick = () => {
        button.remove()
        start()
    }
    button.className = "ActionButton ControllerButton"
    button.textContent = "PiP"
    button.dataset.title = "PiPを有効にする"
    button.style.color = "white"
    button.style.lineHeight = "18px"
    const container = document.querySelector(".ControllerContainer-area:last-child")
    container.insertBefore(button, container.firstElementChild)
})()