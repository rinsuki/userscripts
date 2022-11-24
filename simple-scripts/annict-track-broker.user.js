// ==UserScript==
// @name        Annict: Track Broker
// @namespace   https://rinsuki.net
// @match       https://annict.com/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_xmlhttpRequest
// @version     1.0
// @author      rinsuki
// @description Annict の「記録する」ページの内容を指定されたURLに送信します。
// ==/UserScript==

// @ts-check
(() => {
    /** @type {MutationObserver | null} */
    let observer
    const configUI = document.createElement("details")
    configUI.innerHTML = `<summary>Track Broker Config</summary><form><div>URL: <input name="url"></div><div>Authorization Header: <input name="auth" placeholder="Bearer ..."></div><button>Save</button></form>`
    configUI.style.position = "fixed"
    configUI.style.bottom = "1em"
    configUI.style.right = "1em"
    configUI.style.zIndex = "9999"
    configUI.style.backgroundColor = "white"
    configUI.style.border = "1px solid black"
    configUI.style.padding = "0.5em"
    const form = configUI.querySelector("form")
    if (form == null) return
    /** @type {HTMLInputElement | null} */
    const urlField = form.querySelector("input[name=url]")
    /** @type {HTMLInputElement | null} */
    const authField = form.querySelector("input[name=auth]")
    if (urlField == null || authField == null) return
    form.addEventListener("submit", e => {
        e.preventDefault()
        GM_setValue("url", urlField.value)
        GM_setValue("auth", authField.value)
        alert("Saved")
    })
    urlField.value = GM_getValue("url", "")
    authField.value = GM_getValue("auth", "")
    async function main() {
        if (location.pathname !== "/track") {
            configUI.remove()
            return
        } else {
            document.body.appendChild(configUI)
        }
        const watchTarget = document.querySelector(`[data-reloadable-event-name-value="trackable-episode-list"]`)
        if (watchTarget == null) return
        function changed() {
            const works = document.querySelectorAll("#trackable-episode-list .card > .card-body > :first-child")
            let episodes = []
            for (const work of works) {
                const workName = work.querySelector(".col > .small.u-cursor-pointer")?.textContent
                const episodeName = work.querySelector(".col > .fw-bold")?.textContent
                const episodeSource = work.querySelector(".col > .mt-1.small > .text-muted")
                const episodeTimestamp = work.querySelector(".col > .small:not(.mt-1) > .text-muted")?.textContent
                const episodeJSON = {
                    workName,
                    episodeName,
                    episodeSource: episodeSource != null ? {
                        name: episodeSource.textContent,
                        url: episodeSource.getAttribute("href"),
                    } : null,
                    episodeTimestamp,
                }
                episodes.push(episodeJSON)
            }
            const body = {
                episodes,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            }
            console.log("body", body)
            const url = GM_getValue("url", "")
            const auth = GM_getValue("auth", "")
            if (url.length && url.startsWith("http")) {
                const urlObj = new URL(url)
                GM_xmlhttpRequest({
                    url,
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": auth,
                    },
                    data: JSON.stringify(body),
                    onload: res => {
                        console.log(res)
                        if (res.status >= 300) {
                            alert(`failed to send data (${res.status})`)
                        }
                    }
                })
            } else {
                console.warn("skip sending because url is not set or invalid")
            }
        }
        if (observer != null) {
            observer.disconnect()
        }
        observer = new MutationObserver((mutations) => {
            changed()
        })
        observer.observe(watchTarget, {
            childList: true,
        })
        changed()
    }
    addEventListener("turbo:load", main)
})()