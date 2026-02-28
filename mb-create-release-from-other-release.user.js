// ==UserScript==
// @name        MB: Create Release from Other Release
// @match       https://*.musicbrainz.org/release-group/*
// @grant       none
// @namespace   https://rinsuki.net
// @author      rinsuki
// @description in the release group page
// @homepageURL https://github.com/rinsuki/userscripts
// @supportURL  https://github.com/rinsuki/userscripts/issues
// ==/UserScript==

(function () {
    'use strict';

    function main() {
        const table = document.querySelector("table.mergeable-table");
        if (table == null)
            return;
        for (const row of table.rows) {
            const link = row.querySelector("td > a[href^='/release/'][href*='-']:has(bdi)");
            if (link == null)
                continue;
            const button = document.createElement("button");
            button.textContent = "Copy";
            button.addEventListener("click", e => {
                e.preventDefault();
                button.textContent = "……";
                button.disabled = true;
                fetch(`/ws/js/release/${new URL(link.href).pathname.split("/")[2]}`).then(r => r.json()).then((r) => {
                    let f = {
                        name: r.name,
                        release_group: r.releaseGroup?.gid,
                        comment: r.comment,
                        barcode: r.barcode,
                        language: r.language?.iso_code_3,
                        script: r.script?.iso_code,
                    };
                    for (let i = 0; i < (r.labels?.length ?? 0); i++) {
                        f[`labels.${i}.mbid`] = r.labels?.[i].label?.gid;
                    }
                    for (let i = 0; i < r.artistCredit.names.length; i++) {
                        f[`artist_credit.names.${i}.name`] = r.artistCredit.names[i].name;
                        f[`artist_credit.names.${i}.mbid`] = r.artistCredit.names[i].artist?.gid;
                        f[`artist_credit.names.${i}.join_phrase`] = r.artistCredit.names[i].joinPhrase;
                    }
                    const form = document.createElement("form");
                    form.method = "POST";
                    form.action = "/release/add";
                    for (const [k, v] of Object.entries(f)) {
                        if (v == null)
                            continue;
                        const input = document.createElement("input");
                        input.type = "hidden";
                        input.name = k;
                        input.value = v;
                        form.appendChild(input);
                    }
                    document.body.appendChild(form);
                    form.submit();
                }).catch(e => {
                    console.error(e);
                    button.textContent = "Error";
                    button.disabled = false;
                });
            });
            link.parentElement?.prepend(button);
        }
    }
    main();

})();
