// ==UserScript==
// @name        MB: Artist Credit Splitter, but Powered by AI
// @version     1.1.0
// @description OpenRouter でいい感じに MusicBrainz のアーティストクレジットを分割します (失敗することもあります)
// @namespace   https://rinsuki.net/
// @author      rinsuki
// @match       https://musicbrainz.org/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM.registerMenuCommand
// @grant       GM.xmlHttpRequest
// ==/UserScript==

(function () {
    'use strict';

    const SYSTEM_PROMPT = [
        "あなたはアーティストクレジットを分割するプロフェッショナルです。",
        "あなたは与えられた文字列を分割し、適切なオブジェクトの配列に変換する必要があります。",
        "それぞれのオブジェクトは、`name`と`joinPhrase`の2つのフィールドを持つ必要があります。",
        "`name`フィールドにはアーティストの名前を、`joinPhrase`フィールドには次の名前と結合するために使用されるフレーズを含める必要があります。",
        "ルール:",
        "* 出力は、入力のすべての文字を、そのままの文字で、削除せずに含める必要があります。句読点や括弧も全て含めます (だいたいの場合はそれらは`joinPhrase`に含めることになるでしょう)。文字種を変換してもいけません (例えば `、` を `,` に変換することはできません)。出力が入力と一致しない場合、ユーザーにエラーが表示されます。",
        "* 出力は、1つのオブジェクトに付き1人のアーティスト(個人またはグループ)を含める必要があります。つまり、CVクレジットを1つのアーティストオブジェクトに入力することはできません。たとえば、`キャラ (CV. 人物名)`を`name`に設定することは許可されていません。",
        "* `joinPharse`に人物名を含めることはできません。CVクレジットなどが含まれる場合は、人物名の部分でオブジェクトを分割し、次のオブジェクトの`name`に代入してください。",
        "* 出力はJSON形式をそのまま出力する必要があります (Markdownのコードブロックなどは不要です)。",
    ].join("\n");
    const exampleInputs = [
        { role: "user", content: "せるふとぷりん（稲垣好 / 市ノ瀬加那）" },
        { role: "assistant", content: JSON.stringify([{ "name": "せるふ", "joinPhrase": "と" }, { "name": "ぷりん", "joinPhrase": "（" }, { "name": "稲垣好", "joinPhrase": " / " }, { "name": "市ノ瀬加那", "joinPhrase": "）" }]) },
        { role: "user", content: "Triad Primus [渋谷凛(CV:福原綾香)×神谷奈緒(CV:松井恵理子)×北条加蓮(CV:渕上舞)]" },
        { role: "assistant", content: JSON.stringify([
                { "name": "Triad Primus", "joinPhrase": " [" },
                { "name": "渋谷凛", "joinPhrase": "(CV:" },
                { "name": "福原綾香", "joinPhrase": ")×" },
                { "name": "神谷奈緒", "joinPhrase": "(CV:" },
                { "name": "松井恵理子", "joinPhrase": ")×" },
                { "name": "北条加蓮", "joinPhrase": "(CV:" },
                { "name": "渕上舞", "joinPhrase": ")]" },
            ]) },
    ];
    function copiedArtistCreditToPlainString(artistCredit) {
        return artistCredit.map(credit => credit.name + credit.joinPhrase).join("");
    }
    GM.registerMenuCommand("Split clipboard content (OpenRouter)", () => {
        const inputString = localStorage.getItem("copiedArtistCredit");
        if (inputString == null) {
            alert("No copied artist credit found.");
            return;
        }
        const inputJSON = JSON.parse(inputString);
        const input = copiedArtistCreditToPlainString(inputJSON.names);
        let apiKey = GM_getValue("openrouter_api_key");
        if (apiKey == null) {
            apiKey = prompt("Please input your OpenRouter API key") ?? undefined;
            if (apiKey == null) {
                return;
            }
            GM_setValue("openrouter_api_key", apiKey);
        }
        const div = document.createElement("div");
        div.style.position = "fixed";
        div.style.top = "0";
        div.style.left = "0";
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        div.style.zIndex = "9999";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.color = "white";
        div.style.fontSize = "20px";
        div.textContent = "Asking to the LLM...";
        document.body.appendChild(div);
        fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: prompt("model", "google/gemini-2.0-flash-exp:free"),
                temperature: 0,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    ...exampleInputs,
                    { role: "user", content: input },
                ],
            })
        }).then(r => r.json()).then(r => {
            div.remove();
            console.log(r);
            const generated = JSON.parse(r.choices[0].message.content);
            const output = copiedArtistCreditToPlainString(generated);
            if (output !== input) {
                alert("LLM's output does not match with input. The LLM moment...\n\n" + input + "\n" + output);
                return;
            }
            if (confirm("Done! ... according to the LLM (" + r.model + ").\n\n" + generated.map(a => JSON.stringify(a)).join("\n"))) {
                localStorage.setItem("copiedArtistCredit", JSON.stringify({
                    names: generated,
                }));
            }
        });
    });
    GM.registerMenuCommand("Split clipboard content (OpenAI)", () => {
        const inputString = localStorage.getItem("copiedArtistCredit");
        if (inputString == null) {
            alert("No copied artist credit found.");
            return;
        }
        const inputJSON = JSON.parse(inputString);
        const input = copiedArtistCreditToPlainString(inputJSON.names);
        let apiKey = GM_getValue("openai_api_key");
        if (apiKey == null) {
            apiKey = prompt("Please input your OpenAI API key") ?? undefined;
            if (apiKey == null) {
                return;
            }
            GM_setValue("openai_api_key", apiKey);
        }
        const div = document.createElement("div");
        div.style.position = "fixed";
        div.style.top = "0";
        div.style.left = "0";
        div.style.width = "100%";
        div.style.height = "100%";
        div.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
        div.style.zIndex = "9999";
        div.style.display = "flex";
        div.style.alignItems = "center";
        div.style.justifyContent = "center";
        div.style.color = "white";
        div.style.fontSize = "20px";
        div.textContent = "Asking to the LLM...";
        document.body.appendChild(div);
        fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: prompt("model", "gpt-4.1-mini"),
                temperature: 0,
                messages: [
                    { role: "system", content: SYSTEM_PROMPT },
                    ...exampleInputs,
                    { role: "user", content: input },
                ],
            })
        }).then(r => r.json()).then(r => {
            div.remove();
            console.log(r);
            const generated = JSON.parse(r.choices[0].message.content);
            const output = copiedArtistCreditToPlainString(generated);
            if (output !== input) {
                alert("LLM's output does not match with input. The LLM moment...\n\n" + input + "\n" + output);
                return;
            }
            if (confirm("Done! ... according to the LLM (" + r.model + ").\n\n" + generated.map(a => JSON.stringify(a)).join("\n"))) {
                localStorage.setItem("copiedArtistCredit", JSON.stringify({
                    names: generated,
                }));
            }
        });
    });

})();
