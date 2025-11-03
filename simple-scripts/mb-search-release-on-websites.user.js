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

/// <reference types="typedbrainz" />

(async () => {
    const sites = [
        ["https://music.youtube.com/search?q={query}", "YouTube Music", "https://music.youtube.com/search?q=\"{upc}\""],
        ["https://open.spotify.com/search/{query}", "Spotify", "https://open.spotify.com/search/upc:{upc}"],
        ["https://music.apple.com/jp/search?term={query}", "Apple Music"],
        ["https://isrceam.rinsuki.net/apple/jp/search?q={query}", "Apple Music (ISRCeam)"],
        ["https://ototoy.jp/find/?q={query}", "OTOTOY"],
        ["https://www.google.com/search?client=firefox-b-d&q=site:ototoy.jp+{query}", "OTOTOY (Google)"],
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
        /** @type {{url: string}[]} */
        // @ts-expect-error
        const links = Array.from(window.MB?.releaseEditor?.externalLinksEditData().newLinks.values() ?? [])
        for (const [pattern, name, barcodePattern] of sites) {
            let exists = false
            for (const link of links) {
                if (link.url.startsWith(new URL(pattern).origin)) {
                    exists = true
                    break
                }
            }
            const domain = new URL(pattern).hostname
            const link = document.createElement("a")
            if (exists) {
                link.style.opacity = "0.5"
            }
            /** @type {HTMLInputElement | null} */
            const barcodeInput = document.querySelector("input#barcode")
            if (barcodeInput && barcodeInput.value.length > 4 && barcodePattern != null) {
                // seems barcode
                const link2 = document.createElement("a")
                if (exists) {
                    link2.style.opacity = "0.5"
                }
                link2.href = barcodePattern.replace("{upc}", encodeURIComponent(barcodeInput.value))
                link2.textContent = `Search on ${name} (by barcode)`
                link2.target = "_blank"
                link2.style.marginRight = "1em"
                const li2 = document.createElement("li")
                li2.appendChild(link2)
                linkList.appendChild(li2)
            }
            /** @type {HTMLInputElement | null} */
            const nameInput = document.querySelector(`input#name`)
            if (!nameInput) continue;
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
    externalLinkEditor.parentElement?.parentElement?.appendChild(linkList)
    refresh()

    /** @type {import("../scripts/_common/mb/release-editor").MBReleaseEditor} */
    // @ts-expect-error
    const releaseEditor = window.MB.releaseEditor
    releaseEditor.rootField.release().name.subscribe(() => refresh())
    releaseEditor.rootField.release().barcode.value.subscribe(() => refresh())
})()
