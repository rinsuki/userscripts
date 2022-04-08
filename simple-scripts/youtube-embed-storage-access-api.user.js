// ==UserScript==
// @name        YouTube Embed: Use Storage Access API
// @namespace   https://rinsuki.net
// @match       https://www.youtube.com/embed/*
// @grant       none
// @version     1.0
// @author      rinsuki
// @license     MIT
// @description Use Storage Access API to Play YouTube (Music)? Premium Required Videos on Embed Player
// ==/UserScript==

document.requestStorageAccess().then(()=> {
    console.warn("[UserScript] --- requestStorageAccess success ---")
}, () => {
    console.warn("[UserScript] --- requestStorageAccess failed ---")
})

const origOpen = XMLHttpRequest.prototype.open
const origSend = XMLHttpRequest.prototype.send
const weakMap = new WeakMap()

// addEventListener("mouseenter", () => document.requestStorageAccess())

XMLHttpRequest.prototype.open = function(method, url, ...args) {
    weakMap.set(this, url)
    return origOpen.apply(this, [method, url, ...args])
}

XMLHttpRequest.prototype.send = function(...args) {
    const url = weakMap.get(this)
    if (!url.includes("youtubei/v1/player")) {
        return origSend.apply(this, args)
    }
    document.requestStorageAccess().then(()=> {
        console.warn("[UserScript] --- requestStorageAccess success ---")
    }, () => {
        console.warn("[UserScript] --- requestStorageAccess failed ---")
    }).then(() => {
        origSend.apply(this, args)
    })
}