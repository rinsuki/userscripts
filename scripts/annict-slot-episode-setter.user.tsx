defineUserScript({
    name: "Annict Slot Generator",
    namespace: "https://rinsuki.net",
    description: "Annictのスロットを自動生成します",
    grant: "none",
    version: "1.0",
    license: "MIT",
    match: ["https://annict.com/*"],
    includeContributionURL: true,
})

type EpisodeInfo = {
    id: string,
    sort: number,
    countText: string,
}

async function fetchEpisodeListFromNewDbWorksEpisodePage(workId: number) {
    let episodes: EpisodeInfo[] = []
    let page = 1
    while (true) {
        const episodesPage = await fetch(`/db/works/${workId}/episodes?page=${page}`)
            .then(r => r.text())
            .then(r => new DOMParser().parseFromString(r, "text/html"))
        console.log(episodesPage)
        for (const episodeLine of episodesPage.querySelectorAll("#db-main section table > tbody > tr")) {
            episodes.push({
                id: episodeLine.querySelector(`td:first-child a[href*="/episodes/"]`)!.textContent,
                sort: parseFloat(episodeLine.querySelector(`td:nth-child(6)`)!.textContent),
                countText: episodeLine.querySelector(`td:nth-child(3) > div:first-child`)!.lastChild!.textContent!.trim(),
            })
        }
        if (episodesPage.querySelector("#db-main section nav > a:last-child")) {
            page += 1
        } else {
            break
        }
    }

    return episodes.sort((a, b) => a.sort - b.sort)
}

async function main() {
    const path = location.pathname
    const match = /\/db\/works\/(\d+)\/slots\/new/.exec(path)
    if (match == null) return
    const programIds = new URL(location.href).searchParams.get("program_ids")
    if (programIds == null) return
    const workId = parseInt(match[1], 10)
    const textarea = document.getElementById("deprecated_db_slot_rows_form_rows") as HTMLTextAreaElement
    if (textarea == null) return console.warn("textarea not found")

    const episodes = await fetchEpisodeListFromNewDbWorksEpisodePage(workId)
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