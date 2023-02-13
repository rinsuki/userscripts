// ==UserScript==
// @name        Swarm Export History
// @namespace   https://rinsuki.net
// @match       https://*.swarmapp.com/history
// @version     1.0
// @author      -
// @description export history
// @grant       GM_registerMenuCommand
// @grant       unsafeWindow
// @grant       GM_xmlhttpRequest
// ==/UserScript==

// @ts-check

(function () {
    // @ts-ignore
    const callSwarmAPI = (path, options) => new Promise((resolve, reject) => unsafeWindow.fourSq.api.services.service_(path, options, {
        success: resolve,
        error: reject,
    }))
    /**
     * 
     * @param {Window} window 
     */
    async function main(window) {
        await new Promise(resolve => window.onload = resolve)
        function appendText(text) {
            const pre = window.document.createElement("div")
            pre.textContent = text
            window.document.body.appendChild(pre)
        }
        appendText("Exporting...")
        // @ts-ignore
        const { LOCALE: locale, USER_PROFILE: { id: userID } } = unsafeWindow.fourSq.config.user
        let items = []
        while (true) {
            const [res] = await Promise.all([callSwarmAPI(`v2/users/${userID}/historysearch`, {
                offset: items.length,
                limit: 50,
                m: "swarm",
                clusters: "false",
                sort: "newestfirst",
            }), new Promise(resolve => setTimeout(resolve, 8000))])
            items.push(...res.response.checkins.items)
            appendText(`Got ${res.response.checkins.items.length} items, total ${items.length} items.`)
            if (res.response.checkins.items.length === 0) break
        }
        const file = new File([JSON.stringify(items, null, 2)], `swarm_export.${userID}.${new Date().toISOString().replace(/[^0-9T]/g, "")}.json`, { type: "application/json" })
        const url = URL.createObjectURL(file)
        const a = window.document.createElement("a")
        a.href = url
        a.download = file.name
        window.document.body.appendChild(a)
        a.click()
    }
    GM_registerMenuCommand("Export History", () => {
        const progress = window.open("about:blank", "progress", "width=800,height=600")
        if (progress == null) return alert("please allow popup")
        main(progress)
    })
})()