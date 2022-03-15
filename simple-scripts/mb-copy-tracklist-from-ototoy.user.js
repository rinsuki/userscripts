// ==UserScript==
// @name        MB: copy tracklist from OTOTOY
// @namespace   Violentmonkey Scripts
// @match       https://ototoy.jp/_/default/p/*
// @grant       none
// @version     1.0
// @author      -
// @description 2022/3/16 0:06:25
// ==/UserScript==

(() => {
    const tracklist = document.getElementById("tracklist")
    if (tracklist == null) return
    const tracks = []
    for (const tr of tracklist.querySelectorAll("tr")) {
        const number = tr.querySelector("td:nth-child(1) canvas")
        const title = tr.querySelector("td > span[id^=title-]")
        if (title == null) continue
        const artist = title.parentElement.querySelector("span > a.artist")
        const time = tr.querySelector("td:nth-child(3)")
        tracks.push(`${number.textContent.trim()}. ${title.textContent.trim()} - ${artist.textContent.trim()} (${time.textContent.trim()})`)
    }
    const textarea = document.createElement("textarea")
    textarea.value = tracks.join("\n")
    document.querySelector(".album-addendum").appendChild(textarea)
})()