// ==UserScript==
// @name        YTM: MusicBrainz Checker
// @namespace   Violentmonkey Scripts
// @match       https://music.youtube.com/*
// @grant       GM_notification
// @grant       GM_openInTab
// @version     1.0
// @author      -
// @description Check Currently Playing Album is Registered in YouTube Music
// ==/UserScript==

// @ts-check

(() => {
    const contentInfoWrapper = document.querySelector("ytmusic-player-bar > .middle-controls > .content-info-wrapper")
    if (contentInfoWrapper == null) return alert("Failed to find .content-info-wrapper")
    console.log("Starting YTM: MusicBrainz Checker", contentInfoWrapper)

    const browseIdToPlaylistIdMap = new Map()
    /**
     * @param {string} browseId
     */
    async function browseIdToPlaylistId(browseId) {
        if (browseIdToPlaylistIdMap.has(browseId)) {
            return browseIdToPlaylistIdMap.get(browseId)
        }
        const r = await fetch("https://music.youtube.com/youtubei/v1/browse?key=AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30&prettyPrint=false", {
            method: "POST",
            body: JSON.stringify({
                browseId,
                context: {
                    client: {
                        clientName: "WEB_REMIX",
                        clientVersion: "1.20211221.01.00"
                    }
                }
            }),
        }).then(res => res.json())
        const url = new URL(r.microformat.microformatDataRenderer.urlCanonical)
        const playlistId = url.searchParams.get("list")
        if (url.pathname !== "/playlist" || playlistId == null) throw new Error("??? Unknown URL " + url)
        browseIdToPlaylistIdMap.set(browseId, playlistId)
        return playlistId
    }

    const mbExistsCache = new Set()
    const observer = new MutationObserver(events => {
        /** @type { HTMLAnchorElement | null } */
        const browseLink = contentInfoWrapper.querySelector(`a[href*="browse/"]`)
        if (browseLink == null) {
            console.log("can't find browseLink")
            return
        }
        const albumTitle = browseLink.textContent
        if (albumTitle == null) {
            alert("albumTitle is null")
            return
        }
        const browseId = /^\/browse\/([^?/]+)$/.exec(browseLink.pathname)?.[1]
        if (browseId == null) return
        if (!browseId.startsWith("MPREb_")) {
            console.log(`Unknown browseId ${browseId}`)
            return
        }
        (async () => {
            try {
                const playlistId = await browseIdToPlaylistId(browseId)
                const playlistURL = `https://music.youtube.com/playlist?list=${playlistId}`
                const endpoint = new URL("https://musicbrainz.org/ws/2/url")
                endpoint.searchParams.set("resource", playlistURL)
                const r = await fetch(endpoint.href, {
                    method: "HEAD"
                })
                if (r.status === 404) {
                    GM_notification(`アルバム「${albumTitle}」は MusicBrainz に登録されていません`, "YTM: MusicBrainz Checker", undefined, () => {
                        const url = new URL("https://musicbrainz.org/search?type=release&limit=25&method=indexed")
                        url.searchParams.set("query", albumTitle)
                        GM_openInTab(url.href)
                    })
                } else if (r.status < 300) {
                    console.log("Found in MusicBrainz", albumTitle, playlistId)
                    mbExistsCache.add(playlistId)
                }
            } catch(e) {
                console.error("FAIL!!!", e)
            }
        })()
    })
    observer.observe(contentInfoWrapper, {
        subtree: true,
        childList: true,
        attributes: true,
        attributeFilter: ["href"],
    })
})()