// ==UserScript==
// @name        Annict Slot Generator
// @namespace   https://rinsuki.net
// @description Annictのスロットを自動生成します
// @grant       none
// @version     1.0
// @author      rinsuki
// @license     MIT
// @match       https://annict.com/*
// ==/UserScript==

// @ts-check
async function main() {
    const path = location.pathname
    const match = /\/db\/works\/(\d+)\/slots\/new/.exec(path)
    if (match == null) return
    const programIds = new URL(location.href).searchParams.get("program_ids")
    if (programIds == null) return
    const workId = match[1]
    /** @type {HTMLTextAreaElement} */
    // @ts-ignore
    const textarea = document.getElementById("deprecated_db_slot_rows_form_rows")
    if (textarea == null) return console.warn("textarea not found")

    const episodesPage = await fetch(`/db/works/${workId}/episodes`)
        .then(r => r.text())
        .then(r => new DOMParser().parseFromString(r, "text/html"))
    console.log(episodesPage)
    const episodes = Array.from(episodesPage.querySelectorAll(".f-application__main__content > .container > .card > .card-body > table tr"))
        .slice(1)
        .map(tr => {
            return {
                // @ts-ignore
                id: tr.querySelector(`td:first-child a[href*="/episodes/"]`).textContent,
                sort: parseFloat(tr.querySelector(`td:nth-child(2)`)?.lastChild?.nodeValue ?? "-1"),
                countText: tr.querySelector(`td:nth-child(2)`)?.firstChild?.nodeValue?.trim() ?? "",
            }
        })
        .sort((a, b) => a.sort - b.sort)
    console.log(episodes)
    
    const csv = textarea.value.split("\n").filter(a => a.trim().length)
    let alertText = "更新内容: \n"
    for (let i = 0; i < csv.length; i++) {
        let values = csv[i].split(",")
        const episode = episodes[i]
        if (values.length < 3) {
            if (episode != null) {
                // @ts-ignore
                values.push(episodes[i].id)
                alertText += `${i+1}回目: ${episode.id} (sort: ${episode.sort}): ${episode.countText}\n`
            } else {
                alertText += `${i+1}回目: エピソードなし\n`
            }
        } else {
            alertText += `${i+1}回目: 指定済み、`
            if (episode.id === values[2]) {
                alertText += "一致\n"
            } else {
                alertText += `不一致… (想定: ${episode.id}, 実際: ${values[2]})\n`
            }
        }
        csv[i] = values.join(",")
    }
    alertText += "\n\n以下の内容でCSVを更新しますか？"
    if (!confirm(alertText)) {
        return
    }
    textarea.value = csv.join("\n")
    
}
addEventListener("turbo:load", main)