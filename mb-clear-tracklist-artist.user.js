// ==UserScript==
// @name        MB: Clear Tracklist Artist
// @namespace   https://rinsuki.net
// @match       https://*.musicbrainz.org/release/add
// @match       https://*.musicbrainz.org/release/*/edit
// @grant       none
// @author      rinsuki
// @homepageURL https://github.com/rinsuki/userscripts
// @supportURL  https://github.com/rinsuki/userscripts/issues
// ==/UserScript==

(function () {
    'use strict';

    function isMBWithReleaseEditor(mb) {
        return mb.releaseEditor !== undefined;
    }

    function main() {
        const tracklist = document.getElementById("tracklist");
        if (tracklist == null)
            return;
        const button = document.createElement("button");
        button.textContent = "Clear Tracklist Artist";
        button.addEventListener("click", () => {
            const MB = window.MB;
            if (!isMBWithReleaseEditor(MB))
                return alert("You are not on the release editor page.");
            if (!confirm("Are you sure you want to clear the tracklist artist?"))
                return;
            for (const track of MB.releaseEditor.rootField.release().allTracks()) {
                track.artistCredit({ names: [] });
            }
        });
        tracklist.prepend(button);
    }
    main();

})();
