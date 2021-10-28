// ==UserScript==
// @name        ぷちコレスケジュールをicsにするやつ
// @namespace   https://rinsuki.net
// @match       http://sp.pf.mbga.jp/12008305/
// @grant       none
// @version     1.0
// @author      rinsuki
// @description 2021/10/28 9:17:47
// ==/UserScript==
// @ts-check

(() => {
    const current = new Date()
    /**
     * @param {string | number} input 
     * @param {number} keta
     * @returns {string}
     */
     function padStart(input, keta = 2) {
        return input.toString().padStart(keta, "0")
    }
    /**
     * いい感じに年とかを推定して Date を作ってくれるようにしようと思ったけど後々のこと考えてやめた
     * @param {number} month
     * @param {number} day
     * @param {number} hour
     * @param {number} minute
     */
    function createDate(month, day, hour, minute) {
        // 12月〜1月みたいな跨ぎに対応したいという気持ちを込めたコード
        const year = (current.getMonth()) > month ? current.getFullYear() + 1 : current.getFullYear()
        const sec = minute === 0 ? 0 : 59
        // UTC+9 を強制したいので仕方なく string を一回作っている
        return {
            year,
            month,
            day,
            hour,
            minute,
            sec,
        }
    }

    /**
     * RFC 5545 の DATE-TIME (WITH LOCAL TIME) 形式文字列を作る
     * @param {ReturnType<typeof createDate>} date
     * @returns {string}
     */
    function rfc5545String(date) {
        return [
            padStart(date.year, 4),
            padStart(date.month, 2),
            padStart(date.day, 2),
            "T",
            padStart(date.hour, 2),
            padStart(date.minute, 2),
            padStart(date.sec, 2),
        ].join("")
    }
    
    const tpl = document.getElementById("tpl_schedule")
    if (tpl == null) return console.warn("schedule tpl is not found")
    const body = new DOMParser().parseFromString(tpl.innerHTML, "text/html").querySelector("body > div")
    let month = -1, day = -1, rival = "千川ちひろ", round = -1, stages = []
    let rounds = []
    for (const _b of body.children) {
        /** @type {HTMLElement} */
        // @ts-expect-error
        const b = _b
        const text = b.innerText
        const matchDate = text.match(/【(\d+)\/(\d+)】第(\d+)ラウンド/)
        if (matchDate != null) {
            month = parseInt(matchDate[1], 10)
            day = parseInt(matchDate[2], 10)
            round = parseInt(matchDate[3], 10)
        }
        const matchStages = Array.from(text.matchAll(/\[第(\d)ステージ\]\s*(\d+):(\d+)\uFF5E(\d+):(\d+)/g))
        if (matchStages.length > 0) {
            for (const matchStage of matchStages) {
                stages.push({
                    i: matchStage[1],
                    start: createDate(month, day, parseInt(matchStage[2], 10), parseInt(matchStage[3], 10)),
                    end: createDate(month, day, parseInt(matchStage[4], 10), parseInt(matchStage[5], 10)),
                })
            }
        }
        const matchRival = text.match(/ライバルぷちデレラ: (.+?)\n.+、(Vo|Da|Vi)ア/s)
        if (matchRival != null) {
            rival = matchRival[1]
            rounds.push({month,day,rival,round,stages, attr: matchRival[2]})
            // init
            month = -1, day = -1, rival = "千川ちひろ", round = -1, stages = []
        }
    }
    if (rounds.length < 1) return console.warn("zero schedule")
    let ics = []
    const firstStage = rounds[0].stages[0]
    ics.push(
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//rinsuki//mobamas-puchikore-schedule-parser//JP",
        `X-WR-CALNAME:ぷちデレラコレクション (${firstStage.start.year}/${firstStage.start.month}/${firstStage.start.day}〜)`
    )
    let lastAttr = ""
    for (const round of rounds) {
        for (const stage of round.stages) {
            ics.push(
                "BEGIN:VEVENT",
                "UID:" + rfc5545String(stage.start) + "@mobamas-puchikore-schedule-ics.rinsuki.invalid",
                "DTSTART;TZID=Asia/Tokyo:" + rfc5545String(stage.start),
                "DTEND;TZID=Asia/Tokyo:" + rfc5545String(stage.end),
                `SUMMARY:ぷちコレ第${round.round}R: ${round.rival}(${round.attr}) 第${stage.i}ステージ`,
                "URL:http://sp.pf.mbga.jp/12008305/?guid=ON&url=http%3A%2F%2Fmobamas.net%2Fidolmaster%2Fevent_fashion%2Findex",
            )
            // 通知: 属性違う時の1時間前
            if (lastAttr != round.attr) {
                lastAttr = round.attr
                ics.push(
                    "BEGIN:VALARM",
                    "TRIGGER:-PT1H",
                    "ATTACH;VALUE=URI:Chord",
                    "ACTION:AUDIO",
                    "END:VALARM",
                )
            }
            // 通知: 終了10分前
            // 本当は TRIGGER;RELATED=END:-PT10M で行けるはずなのだが Apple の Calendar.app が対応してないので泥臭い対応を…
            const startmin = (stage.start.hour * 60) + stage.start.minute
            let endmin = (stage.end.hour * 60) + stage.end.minute + 1 /* だいたい x9分なので */
            const before10min = endmin - startmin - 10
            ics.push(
                "BEGIN:VALARM",
                `TRIGGER:PT${before10min}M`,
                "ATTACH;VALUE=URI:Chord",
                "ACTION:AUDIO",
                "END:VALARM",
            )
            ics.push(
                "END:VEVENT", ""
            )
        }
    }
    ics.push("END:VCALENDAR")
    const icsString = ics.join("\n")
    const icsFilename = `ぷちデレラコレクション_${padStart(firstStage.start.year, 4)}${padStart(firstStage.start.month)}${padStart(firstStage.start.day)}.ics`
    const icsFile = new File([icsString], icsFilename, { type: "text/calendar" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(icsFile)
    link.download = icsFilename
    link.innerText = "🐒.icsファイル"
    link.className = "info_link unlink"
    link.style.textAlign = "center"
    const scheduleButton = document.querySelector("#event_main_graphic a.js_schedule")
    scheduleButton.parentElement.insertBefore(link, scheduleButton.nextElementSibling)
})()