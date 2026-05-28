// ==UserScript==
// @name        YouTube: Select Codec
// @description Select the codec for YouTube videos.
// @grant       none
// @namespace   https://rinsuki.net
// @match       https://www.youtube.com/*
// @homepageURL https://github.com/rinsuki/userscripts
// @supportURL  https://github.com/rinsuki/userscripts/issues
// ==/UserScript==

(function () {
    'use strict';

    function getInternalPlayerObject() {
        const playerElm = document.getElementById("movie_player");
        if (!playerElm)
            return;
        if (!("getPlayerResponse" in playerElm))
            return;
        if (typeof playerElm.getPlayerResponse !== "function")
            return;
        let internalPlayer;
        const oldApply = Function.prototype.apply;
        const newApply = new Proxy(Function.prototype.apply, {
            apply(target, thisArg, args) {
                if (internalPlayer == null)
                    internalPlayer = args[0];
                return Reflect.apply(target, thisArg, args);
            },
        });
        Function.prototype.apply = newApply;
        playerElm.getPlayerResponse();
        if (Function.prototype.apply === newApply)
            Function.prototype.apply = oldApply;
        return internalPlayer;
    }
    const button = document.createElement("button");
    button.style.zIndex = "2147483647";
    button.style.position = "fixed";
    button.style.top = "0px";
    button.style.right = "0px";
    button.innerText = "SC";
    document.body.appendChild(button);
    button.addEventListener("click", () => {
        const player = getInternalPlayerObject();
        if (player == null) {
            alert("Failed to get the internal player object.");
            return;
        }
        const adaptiveFormats = player.getPlayerResponse().streamingData.adaptiveFormats;
        const videoFormats = adaptiveFormats.filter(format => "qualityLabel" in format);
        const itag = prompt([
            "Select itag:",
            "",
            ...videoFormats
                .toSorted((a, b) => {
                if (a.qualityLabel.length !== b.qualityLabel.length)
                    return b.qualityLabel.length - a.qualityLabel.length;
                if (a.width !== b.width)
                    return b.width - a.width;
                return b.bitrate - a.bitrate;
            })
                .map(format => `${format.itag}: ${format.qualityLabel} (${format.mimeType}, ${format.width}x${format.height}, ${format.fps}fps, ${format.bitrate}bps)`),
        ].join("\n"));
        if (itag == null)
            return;
        const selectedFormat = videoFormats.find(format => format.itag === Number(itag));
        if (!selectedFormat) {
            alert("Invalid itag.");
            return;
        }
        player.setPlaybackQuality(selectedFormat.quality, selectedFormat.itag.toString());
    });

})();
