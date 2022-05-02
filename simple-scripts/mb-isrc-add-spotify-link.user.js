// ==UserScript==
// @name        MB: Add Spotify Search Link on ISRC page
// @namespace   https://rinsuki.net
// @match       https://musicbrainz.org/isrc/*
// @grant       none
// @version     1.0
// @author      rinsuki
// @license     MIT
// @description Adds Spotify search link on ISRC page.
// ==/UserScript==

(() => {
    const isrc = document.querySelector("#page > h1 > a[href^=\"/isrc\"] > bdi > code").textContent
    const url = `https://open.spotify.com/search/` + encodeURIComponent(`isrc:${isrc}`)
    const a = document.createElement("a")
    a.href = url
    a.textContent = "Search on Spotify"
    a.target = "_blank"
    const header = document.querySelector("#page > h1 > a[href^=\"/isrc/\"]").parentElement
    header.parentElement.insertBefore(a, header.nextSibling)
})()