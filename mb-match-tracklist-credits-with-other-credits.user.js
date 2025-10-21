// ==UserScript==
// @name        MB: Match Tracklist Credits with Other Credits
// @namespace   https://rinsuki.net
// @grant       none
// @match       https://*musicbrainz.org/release/*/edit
// @match       https://*musicbrainz.org/release/add
// @homepageURL https://github.com/rinsuki/userscripts
// @supportURL  https://github.com/rinsuki/userscripts/issues
// ==/UserScript==

(function () {
    'use strict';

    function doItForSpecificArtistCredit(creditMap, artistCredit) {
        const names = [...artistCredit().names];
        // ループ中にnamesを書き換えるのであえて for-of を使わない
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            if (name.artist == null) {
                for (const [knownName, knownArtist] of creditMap) {
                    if (knownArtist == null)
                        continue;
                    if (!name.name.startsWith(knownName))
                        continue;
                    const remainName = name.name.slice(knownName.length);
                    if (remainName === "") {
                        // 完全一致
                        name.artist = knownArtist;
                        break;
                    }
                    name.name = knownName;
                    name.artist = knownArtist;
                    name.joinPhrase = remainName + name.joinPhrase;
                    break;
                }
            }
            let firstArtist = null;
            for (const [knownName, knownArtist] of creditMap) {
                if (knownArtist == null)
                    continue;
                const i = name.joinPhrase.indexOf(knownName);
                if (i === -1)
                    continue;
                if (firstArtist == null || firstArtist[0] > i) {
                    firstArtist = [i, knownName, knownArtist];
                }
            }
            if (firstArtist != null) {
                const [i, knownName, knownArtist] = firstArtist;
                const remainName = name.joinPhrase.slice(i + knownName.length);
                name.joinPhrase = name.joinPhrase.slice(0, i);
                const newCreditName = {
                    name: knownName,
                    artist: knownArtist,
                    joinPhrase: remainName,
                };
                names.splice(i + 1, 0, newCreditName);
            }
        }
        artistCredit({
            names,
        });
    }
    function doItEntirely() {
        const MB = window.MB;
        if (MB == null)
            return;
        const editor = MB.releaseEditor;
        const currentCredits = [
            ...editor.rootField.release().releaseGroup().artistCredit.names,
            ...editor.rootField.release().artistCredit().names,
            ...Array.from(editor.rootField.release().allTracks()).flatMap(t => [...t.artistCredit().names, ...t.recording().artistCredit.names]),
        ];
        const creditMap = new Map();
        for (const credit of currentCredits) {
            if (!creditMap.has(credit.name)) {
                if (credit.artist != null) {
                    creditMap.set(credit.name, credit.artist);
                }
            }
            else {
                if (credit.artist == null) {
                    creditMap.set(credit.name, null);
                }
                else {
                    const current = creditMap.get(credit.name);
                    if (current == null)
                        continue;
                    if (current.id !== credit.artist.id) {
                        creditMap.set(credit.name, null);
                    }
                }
            }
        }
        doItForSpecificArtistCredit(creditMap, editor.rootField.release().artistCredit);
        for (const track of editor.rootField.release().allTracks()) {
            doItForSpecificArtistCredit(creditMap, track.artistCredit);
        }
    }
    const button = document.createElement("button");
    button.id = "mb-match-tracklist-credits-with-other-credits-button";
    document.getElementById(button.id)?.remove();
    button.textContent = "Match Tracklist Credits with Other Credits";
    button.addEventListener("click", doItEntirely);
    document.getElementById("release-editor")?.prepend(button);

})();
