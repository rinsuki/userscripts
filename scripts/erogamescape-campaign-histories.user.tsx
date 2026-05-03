import React from "@rinsuki/dom-chef"

defineUserScript({
    name: "ErogameScape: ゲームのセール履歴を追加",
    description: "エロゲー批評空間のゲームページに、ゲームのセール(キャンペーン)履歴を表示します。",
    version: "0.1.0",
    grant: "none",
    match: ["https://erogamescape.dyndns.org/~ap2/ero/toukei_kaiseki/game.php?*"],
    includeContributionURL: false,
    namespace: "https://rinsuki.net",
})

const gameIdPlaceholder = "__GAME_ID__"
const sql = `SELECT
    row_to_json(campaignlist) AS campaign,
    row_to_json(campaign_game) AS campaign_game
FROM campaign_game
INNER JOIN campaignlist ON campaign_game.campaign = campaignlist.id
WHERE campaign_game.game = ${gameIdPlaceholder} ORDER BY campaignlist.end_timestamp DESC
-- UserScript: ${GM_info.script.name} ${GM_info.script.version}`

type Row = {
    campaign: {
        name: string,
        url: string,
        start_timestamp: string,
        end_timestamp: string,
    },
    campaign_game: {
        content: string,
        url: string | null,
    }
}

const domainsToServiceName = {
    ".dmm.co.jp": "FANZA",
    ".dmm.com": "DMM",
    ".dlsite.com": "DLsite",
    ".dlaf.jp": "DLsite",
}

function domainToServiceName(url: string): string | null {
    const parsed = URL.parse(url)
    if (parsed == null) return null
    for (const [domain, serviceName] of Object.entries(domainsToServiceName)) {
        if (parsed.hostname.endsWith(domain)) return serviceName
        if (domain.startsWith(".") && parsed.hostname === domain.slice(1)) return serviceName
    }
    return null
}

const sectionId = "userscript-erogamescape-campaign-histories"

const style = `#${sectionId} {
    & .current-campaign {
        color: red;
        font-weight: bolder;
    }
}`

async function main() {
    const url = new URL(location.href)
    const gameId = url.searchParams.get("game")
    if (gameId == null) return

    const section = <section id={sectionId}>
        <h3>セール履歴 (UserScript: {GM_info.script.name} {GM_info.script.version})</h3>
        <style>{style}</style>
    </section>
    const beforeElements = [
        document.querySelector(`#toContents + div[style="margin-bottom: 20px;"]`),
        document.getElementById("toContents"),
    ]
    for (const el of beforeElements) {
        if (el == null) continue
        el.insertAdjacentElement("afterend", section)
        break
    }

    fetch("/~ap2/ero/toukei_kaiseki/sql_for_erogamer_form.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `sql=${encodeURIComponent(sql.replace(gameIdPlaceholder, gameId))}`,
    }).then(async r => {
        if (!r.ok) throw new Error(`HTTP error ${r.status}\n\n${await r.text()}`)
        const dom = new DOMParser().parseFromString(await r.text(), "text/html")
        const table = dom.querySelector<HTMLTableElement>("#query_result_main > table")
        if (table == null) throw new Error(`テーブルが見つからない`)
        const rows = []
        const keys: string[] = []
        for (const rowEl of table.rows) {
            console.log(rowEl)
            if (rowEl.querySelector("th") != null) {
                keys.push(...Array.from(rowEl.cells, c => c.textContent.trim() ?? ""))
                continue
            }
            const values = Array.from(rowEl.cells, c => c.textContent.trim() ?? "")

            const row = Object.fromEntries(values.map((v, i) => [keys[i], JSON.parse(v)])) as Row
            rows.push(row)
        }

        console.log(rows)

        if (rows.length) {
            section.append(<table>
                <tr>
                    <th>終了日時 (たぶんJST)</th>
                    <th>内容</th>
                    <th>キャンペーン名</th>
                </tr>
                {rows.map(row => {
                    const startDate = new Date(row.campaign.start_timestamp)
                    const endDate = new Date(row.campaign.end_timestamp)
                    const isCurrentCampaign = endDate.getTime() > Date.now()
                    const serviceName = domainToServiceName(row.campaign_game.url ?? row.campaign.url ?? "")
                    const duration = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                    return <tr>
                        <td title={`${row.campaign.start_timestamp} 〜 ${row.campaign.end_timestamp}`}>
                            <span className={isCurrentCampaign ? "current-campaign" : ""}>{row.campaign.end_timestamp}</span>
                            {" "}
                            <small>(約{duration}日間)</small>
                        </td>
                        <td><a href={row.campaign_game.url ?? undefined}>{row.campaign_game.content}</a></td>
                        <td>{serviceName && `[${serviceName}] `}<a href={row.campaign.url ?? undefined}>{row.campaign.name}</a></td>
                    </tr>
                })}
            </table>)
        } else {
            section.append(<p>セール履歴が見つからなかったか、取得に失敗しました。</p>)
        }
    })
}

main().catch(e => {
    console.error(e)
    alert(`セール情報の取得に失敗しました:\n${e}\n\nfrom UserScript ${GM_info.script.name} ${GM_info.script.version}`)
})