// ==UserScript==
// @name            MB: Match Tracklist Credits with Other Credits
// @namespace       https://rinsuki.net
// @version         0.3.0
// @grant           none
// @match           https://*.musicbrainz.org/release/*/edit
// @match           https://*.musicbrainz.org/release/add
// @contributionURL https://rinsuki.fanbox.cc/
// @contributionURL https://github.com/sponsors/rinsuki
// @homepageURL     https://github.com/rinsuki/userscripts
// @supportURL      https://github.com/rinsuki/userscripts/issues
// ==/UserScript==

(function () {
    'use strict';

    function isArtistExist(artist) {
        return artist != null && artist.id != 0 && artist.id != null;
    }
    function doItForSpecificArtistCredit(creditMap, artistCredit) {
        const names = [...artistCredit().names];
        console.log(JSON.stringify(names));
        // ループ中にnamesを書き換えるのであえて for-of を使わない
        for (let i = 0; i < names.length; i++) {
            const name = names[i];
            name.joinPhrase ??= "";
            // アーティストIDが不明の場合、先頭一致できる名前を探す
            if (!isArtistExist(name.artist)) {
                for (const [knownName, knownArtist] of creditMap) {
                    if (!isArtistExist(knownArtist))
                        continue;
                    if (!name.name.startsWith(knownName))
                        continue;
                    const remainName = name.name.slice(knownName.length);
                    if (remainName === "") {
                        // 完全一致したら設定だけでよい
                        name.artist = knownArtist;
                        break;
                    }
                    // おまけがある場合はそれをjoinPhraseに回す
                    name.name = knownName;
                    name.artist = knownArtist;
                    name.joinPhrase = remainName + (name.joinPhrase ?? "");
                    break;
                }
            }
            // joinPhraseに既知の名前があれば分割する
            let firstArtist = null;
            for (const [knownName, knownArtist] of creditMap) {
                if (!isArtistExist(knownArtist))
                    continue;
                if (name.joinPhrase == null)
                    continue;
                const index = name.joinPhrase.indexOf(knownName);
                if (index === -1)
                    continue;
                if (firstArtist == null || firstArtist[0] > index) {
                    firstArtist = [index, knownName, knownArtist];
                }
            }
            // 既知の名前があった!
            if (firstArtist != null) {
                const [index, knownName, knownArtist] = firstArtist;
                const remainName = name.joinPhrase.slice(index + knownName.length);
                name.joinPhrase = name.joinPhrase.slice(0, index);
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
    async function doItEntirely(withShiftKey) {
        const MB = window.MB;
        if (MB == null)
            return;
        const editor = MB.releaseEditor;
        const currentCredits = [
            ...editor.rootField.release().releaseGroup().artistCredit?.names ?? [],
            ...editor.rootField.release().artistCredit().names,
            ...Array.from(editor.rootField.release().allTracks()).flatMap(t => [...t.artistCredit().names, ...t.recording().artistCredit.names]),
        ];
        const releaseUrl = prompt("Enter the release URL to copy credits from (If you keep it empty, it will only match within the current release)");
        if (releaseUrl == null)
            return;
        if (releaseUrl.length) {
            const mbid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(releaseUrl)?.[0];
            if (mbid == null) {
                alert("Invalid release URL");
                return;
            }
            const otherJS = await fetch(`/ws/js/entity/${mbid}`).then(r => r.json());
            if (!("artistCredit" in otherJS)) {
                alert("Could not fetch artist credit data");
                return;
            }
            currentCredits.push(...otherJS.artistCredit.names);
            for (const media of otherJS.mediums) {
                const otherJS = await fetch(`/ws/js/medium/${media.id}`).then(r => r.json());
                for (const track of otherJS.tracks) {
                    currentCredits.push(...track.artistCredit.names);
                }
            }
        }
        const creditMap = new Map();
        for (const credit of currentCredits) {
            if (!creditMap.has(credit.name)) {
                if (isArtistExist(credit.artist)) {
                    creditMap.set(credit.name, credit.artist);
                }
            }
            else {
                if (!isArtistExist(credit.artist)) {
                    console.warn("?");
                    creditMap.set(credit.name, null);
                }
                else {
                    const current = creditMap.get(credit.name);
                    if (current == null)
                        continue;
                    console.log(current);
                    if (current.id != null && current.id !== credit.artist.id) {
                        creditMap.set(credit.name, null);
                    }
                }
            }
        }
        console.log(creditMap);
        doItForSpecificArtistCredit(creditMap, editor.rootField.release().artistCredit);
        for (const track of editor.rootField.release().allTracks()) {
            doItForSpecificArtistCredit(creditMap, track.artistCredit);
        }
        alert("Done");
    }
    const button = document.createElement("button");
    button.id = "mb-match-tracklist-credits-with-other-credits-button";
    document.getElementById(button.id)?.remove();
    button.textContent = "Match Tracklist Credits with Other Credits";
    button.addEventListener("click", (e) => {
        doItEntirely(e.shiftKey);
    });
    document.getElementById("release-editor")?.prepend(button);

})();
