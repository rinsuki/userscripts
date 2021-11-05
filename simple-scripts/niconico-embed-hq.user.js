// ==UserScript==
// @name        embed.nicovideo.jp 1080p support
// @namespace   https://rinsuki.net
// @match       https://embed.nicovideo.jp/watch/*
// @grant       GM_xmlhttpRequest
// @connect     www.nicovideo.jp
// @version     1.0
// @author      -
// @description 2021/7/10 17:59:48
// ==/UserScript==
// @ts-check

(() => {
    /** @type {{error: string} | {url: string}} */
    // @ts-expect-error
    const IResponse = "you shouldn't use this as value"
    function userland() {
        const egui = document.getElementById("EMBED_HQ_USERSCRIPT")
        const origFetch = window.fetch
        window.fetch = (...args) => {
            if (typeof args[0] !== "string") return origFetch(...args)
            if (!args[0].startsWith("https://www.nicovideo.jp/api/watch/v3_guest/")) return origFetch(...args)
            console.log("hooking request", ...args)
            const reqdiv = document.createElement("div")
            reqdiv.dataset.url = args[0].replace("/v3_guest/", "/v3/").replace("?_frontendId=70&", "?_frontendId=6&") + "&withoutHistory=true"
            return new Promise((resolve, reject) => {
                const observer = new MutationObserver(events => {
                    for (const event of events) {
                        if (event.attributeName !== "data-response") continue
                        /** @type {typeof IResponse} */
                        const res = JSON.parse(reqdiv.dataset.response)
                        console.log(res)
                        if ("error" in res) {
                            reject(res.error)
                        } else {
                            resolve(fetch(res.url).then(r => {
                                URL.revokeObjectURL(res.url)
                                return r
                            }))
                        }
                        observer.disconnect()
                    }
                })
                observer.observe(reqdiv, {
                    attributes: true,
                    attributeFilter: ["data-response"]
                })
                egui.appendChild(reqdiv)
            })
        }
    }
    const egui = document.createElement("div")
    egui.id = "EMBED_HQ_USERSCRIPT"
    egui.style.display = "none !important"
    const script = document.createElement("script")
    script.innerHTML = `(${userland.toString()})()`
    egui.appendChild(script)
    const observer = new MutationObserver(events => {
        for (const event of events) {
            for (const node of event.addedNodes) {
                if (!(node instanceof HTMLDivElement)) continue
                const url = new URL(node.dataset.url).href
                if (!url.startsWith("https://www.nicovideo.jp/api/watch/v3/")) {
                    return
                }
                console.log("hooking request received", url)
                GM_xmlhttpRequest({
                    method: "GET",
                    url,
                    responseType: "blob",
                    onload(r) {
                        console.log("!", r.response)
                        const url = URL.createObjectURL(r.response)
                        node.dataset.response = JSON.stringify({url})
                    },
                    onerror(r) {
                        node.dataset.response = JSON.stringify({error: r.error})
                    },
                })
            }
        }
    })
    observer.observe(egui, {
        childList: true,
    })
    document.body.appendChild(egui)
})()