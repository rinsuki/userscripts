// ==UserScript==
// @name            MB: Barcode Search ++
// @namespace       https://rinsuki.net
// @match           https://*.musicbrainz.org/search*
// @description     Add seed barcode to new release button, highlights barcode-matched releases
// @grant           none
// @contributionURL https://rinsuki.fanbox.cc/
// @contributionURL https://github.com/sponsors/rinsuki
// @homepageURL     https://github.com/rinsuki/userscripts
// @supportURL      https://github.com/rinsuki/userscripts/issues
// ==/UserScript==

(function () {
    'use strict';

    function removeFirstZeroes(str) {
        return str.replace(/^0+/, "");
    }

    function main() {
        const addReleaseLink = document.querySelector('#content a[href="/release/add"]');
        if (addReleaseLink == null)
            return;
        const url = new URL(location.href);
        const searchQuery = url.searchParams.get('query');
        if (searchQuery == null)
            return;
        const barcodeMatch = searchQuery.split(" ").find(part => part.startsWith("barcode:"));
        if (barcodeMatch == null)
            return;
        const barcode = barcodeMatch.replace("barcode:", "");
        // add seed button
        const form = document.createElement("form");
        form.method = "POST";
        form.action = "/release/add";
        form.style.display = "inline";
        const barcodeInput = document.createElement("input");
        barcodeInput.type = "hidden";
        barcodeInput.name = "barcode";
        barcodeInput.value = barcode;
        form.appendChild(barcodeInput);
        const seedName = url.searchParams.get("seed.name");
        if (seedName) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "name";
            input.value = seedName;
            form.appendChild(input);
        }
        const seedUrl = url.searchParams.get("seed.url");
        if (seedUrl) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = "urls.0.url";
            input.value = seedUrl;
            form.appendChild(input);
        }
        const addButton = document.createElement("button");
        addButton.type = "submit";
        addButton.textContent = "with barcode " + barcode + " [UserScript]";
        form.appendChild(addButton);
        addReleaseLink.insertAdjacentElement("afterend", form);
        form.insertAdjacentText("beforebegin", ", or ");
        // try to highlight
        let focused = false;
        for (const td of document.querySelectorAll("td.barcode-cell")) {
            if (removeFirstZeroes(barcode) === removeFirstZeroes(td.textContent.trim())) {
                td.parentElement.style.border = "2px solid blue";
                const link = td.parentElement.querySelector('a[href*="release/"]:not([href*=cover-art])');
                if (link == null)
                    continue;
                let focusTarget = link;
                if (seedUrl) {
                    const form = document.createElement("form");
                    form.method = "POST";
                    form.action = link.href + "/edit";
                    form.style.display = "inline";
                    const input = document.createElement("input");
                    input.type = "hidden";
                    input.name = "urls.0.url";
                    input.value = seedUrl;
                    form.appendChild(input);
                    const editButton = document.createElement("button");
                    editButton.type = "submit";
                    editButton.textContent = "[Add URL UserScript]";
                    form.appendChild(editButton);
                    link.insertAdjacentElement("afterend", form);
                    form.insertAdjacentText("beforebegin", " ");
                    focusTarget = editButton;
                }
                if (!focused) {
                    focusTarget.focus();
                    focused = true;
                }
            }
        }
        if (!focused) {
            addButton.focus();
        }
    }
    main();

})();
