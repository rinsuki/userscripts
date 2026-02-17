defineUserScript({
    name: "YTM: Don't Suggest Video",
    namespace: "https://rinsuki.net",
    match: "https://music.youtube.com/*",
    grant: "none",
    author: "rinsuki",
    runAt: "document-start",
    version: "0.1.0",
    description: "Hide video-only tracks from \"Up Next\" tab on YTM.",
})

function urlFromFetch(input: Parameters<typeof fetch>[0]): string {
    if (typeof input === "string") return input
    if ("url" in input) return input.url
    return input.href
}

function shouldFilterThisEntry(json: any): boolean {
    if (json.playlistPanelVideoWrapperRenderer) return true // たぶん
    if (json.automixPreviewVideoRenderer) return true
    const thumbnails = json.playlistPanelVideoRenderer?.thumbnail?.thumbnails
    if (!Array.isArray(thumbnails)) {
        debugger;
        return true // ?
    }
    for (const thumbnail of thumbnails) {
        if (typeof thumbnail.url === "string" && thumbnail.url.includes("i.ytimg.com")) {
            // debugger;
            return false
        }
    }
    return true
}

function handleNextResponse(json: any) {
    if (Array.isArray(json.continuationContents?.playlistPanelContinuation?.contents)) {
        json.continuationContents.playlistPanelContinuation.contents = json.continuationContents.playlistPanelContinuation.contents.filter(shouldFilterThisEntry);
    }
    if (Array.isArray(json.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer?.watchNextTabbedResultsRenderer?.tabs)) {
        for (const tab of json.contents.singleColumnMusicWatchNextResultsRenderer.tabbedRenderer.watchNextTabbedResultsRenderer.tabs) {
            if (Array.isArray(tab.tabRenderer?.content?.musicQueueRenderer?.content?.playlistPanelRenderer?.contents)) {
                tab.tabRenderer.content.musicQueueRenderer.content.playlistPanelRenderer.contents = tab.tabRenderer.content.musicQueueRenderer.content.playlistPanelRenderer.contents.filter(shouldFilterThisEntry);
            }
        }
    }
}

window.fetch = new Proxy(window.fetch, {
    apply(target, thisArg, args: Parameters<typeof fetch>) {
        const promise = Reflect.apply(target, thisArg, args);
        const url = urlFromFetch(args[0]);
        if (!url.includes("/next")) return promise
        return promise.then(async resOriginal => {
            const res = resOriginal.clone();
            try {
                const json = await res.json();
                handleNextResponse(json);
                return Response.json(json, {
                    status: resOriginal.status,
                    statusText: resOriginal.statusText,
                    headers: resOriginal.headers,
                })
            } catch(e) {
                debugger;
                return resOriginal;
            }
        })
    }
})