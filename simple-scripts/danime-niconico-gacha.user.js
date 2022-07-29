// ==UserScript==
// @name        dアニメニコニコ支店 アニメガチャ
// @namespace   https://rinsuki.net
// @description 何を見たらいいかわからない時に適当にアニメを選んで1話を再生するためのボタンを追加します
// @grant       none
// @version     1.0
// @author      rinsuki
// @license     MIT
// @match       https://site.nicovideo.jp/danime/all_contents_1201*
// ==/UserScript==

// @ts-check
(() => {
    document.body.appendChild((() => {
        const details = document.createElement("details")
        details.style.position = "fixed"
        details.style.bottom = "1em"
        details.style.right = "1em"
        details.style.background = "white"
        details.style.color = "black"
        details.style.padding = "0.5em"
        details.style.border = "1px solid black"
        details.open = true
        details.appendChild((() => {
            const div = document.createElement("div")
            div.appendChild((() => {
                const gachaButton = document.createElement("button")
                gachaButton.textContent = "ガチャ"
                gachaButton.style.backgroundColor = "#eb5528"
                gachaButton.style.color = "white"
                gachaButton.style.border = "none"
                gachaButton.style.padding = "0.5em"
                gachaButton.style.display = "block"
                gachaButton.style.width = "100%"
                gachaButton.addEventListener("click", () => {
                    /** @type {HTMLAnchorElement[]} */
                    const allLinks = Array.from(document.querySelectorAll("#listbox a"))
                    const links = allLinks.filter(link => !link.href.includes("/watch/"))
                    const link = allLinks[Math.floor(Math.random() * allLinks.length)]
                    const anchor = document.createElement("a")
                    anchor.target = "_blank"
                    anchor.href = link.href
                    anchor.click()
                })
                return gachaButton
            })())
            return div
        })())
        details.appendChild((() => {
            const summary = document.createElement("summary")
            const span = document.createElement("span")
            span.style.display = "inline-block"
            span.innerText = "アニメガチャ"
            summary.appendChild(span)
            return summary
        })())
        return details
    })())
})()