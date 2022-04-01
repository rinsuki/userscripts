// ==UserScript==
// @name        MB: copy tracklist from mora
// @namespace   https://rinsuki.net
// @match       https://mora.jp/package/*
// @grant       none
// @version     1.0
// @author      rinsuki
// @license     MIT
// @description generates Track List for MusicBrainz, from mora.jp page.
// ==/UserScript==

const origFunc = Package.receivePackageData

Package.receivePackageData = function(obj, json) {
    origFunc(obj, json)
    console.log(json)
    var tracks = ""
    function createTextarea() {
        if (tracks === "") return
        const textarea = document.createElement("textarea")
        textarea.value = tracks
        const desc = document.querySelector("#package_description")
        desc.parentElement.insertBefore(textarea, desc)
        tracks = ""
    }
    for (const track of json.trackList) {
        tracks += `${track.trackNo}. ${track.title} - ${track.artistName} (${track.durationStr})\n`
    }
    createTextarea()
}