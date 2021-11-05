// ==UserScript==
// @name        embed.nicovideo.jp 1080p support
// @namespace   https://rinsuki.net
// @match       https://embed.nicovideo.jp/watch/*
// @grant       GM_xmlhttpRequest
// @grant       unsafeWindow
// @connect     www.nicovideo.jp
// @version     1.0
// @author      -
// @description 2021/7/10 17:59:48
// ==/UserScript==
// @ts-check

(() => {
    // TODO: find more secure way, it is maybe insecure
    const origFetch = unsafeWindow.fetch
    unsafeWindow.fetch = (...args) => {
        if (typeof args[0] === "string" && args[0].startsWith("https://www.nicovideo.jp/api/watch/v3_guest/")) {
            console.log("hooking request", ...args)
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: JSON.parse(JSON.stringify(args[0])).replace("/v3_guest/", "/v3/").replace("?_frontendId=70&", "?_frontendId=6&") + "&withoutHistory=true",
                    responseType: "blob",
                    onload: (response) => {
                        console.log("!", response.response)
                        const url = URL.createObjectURL(response.response)
                        resolve(unsafeWindow.fetch(url).then(r => {
                            URL.revokeObjectURL(url)
                            return r
                        }))
                    },
                    onerror: (response) => {
                        console.log("fail", response.error)
                        reject(response.error)
                    }
                })
            })
        }
        return origFetch(...args)
    }
})()