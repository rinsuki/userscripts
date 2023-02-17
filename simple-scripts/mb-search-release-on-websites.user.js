// ==UserScript==
// @name        MusicBrainz: Search Release on Websites
// @namespace   https://rinsuki.net
// @match       https://musicbrainz.org/release/*/edit
// @match       https://musicbrainz.org/release/add
// @grant       none
// @version     1.0
// @author      rinsuki
// ==/UserScript==
// @ts-check

(async () => {
    const sites = [
        ["https://music.youtube.com/search?q={query}", "YouTube Music"],
        ["https://open.spotify.com/search/{query}", "Spotify"],
        ["https://music.apple.com/jp/search?term={query}", "Apple Music"],
        ["https://isrceam.deta.dev/apple/jp/search?q={query}", "Apple Music (ISRCeam)"],
        ["https://ototoy.jp/find/?q={query}", "OTOTOY"],
        ["https://ototoy.jp/find/?q=site:ototoy.jp+{query}", "OTOTOY (Google)"],
        ["https://mora.jp/search/top?keyWord={query}", "mora"],
        ["https://www.google.com/search?client=firefox-b-d&q={query}", "Google"],
    ]

    let externalLinkEditor
    while (null == (externalLinkEditor = document.getElementById("external-links-editor"))) {
        await new Promise(r => setTimeout(r, 100))
    }

    const linkList = document.createElement("ul")
    function refresh() {
        linkList.innerHTML = ""
        for (const [pattern, name] of sites) {
            const domain = new URL(pattern).hostname
            const link = document.createElement("a")
            /** @type {HTMLInputElement} */
            const nameInput = document.querySelector(`input#name`)
            link.href = pattern.replace("{query}", encodeURIComponent(nameInput.value))
            link.textContent = `Search on ${name}`
            link.target = "_blank"
            link.style.marginRight = "1em"
            const li = document.createElement("li")
            li.appendChild(link)
            linkList.appendChild(li)
        }
        const button = document.createElement("button")
        button.textContent = "Refresh"
        button.onclick = refresh
        const li = document.createElement("li")
        li.appendChild(button)
        linkList.appendChild(li)
    }
    externalLinkEditor.parentElement.parentElement.appendChild(linkList)
    refresh()
})()