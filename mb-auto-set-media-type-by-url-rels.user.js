// ==UserScript==
// @name            MB: Automatically Set Media Type by URL Relationships
// @description     Automatically set the media type based on the relationships of release's URL.
// @namespace       https://rinsuki.net
// @author          rinsuki
// @grant           none
// @match           https://*.musicbrainz.org/release/add*
// @match           https://*.musicbrainz.org/release/*/edit*
// @exclude-match   https://*.musicbrainz.org/release/*/edit-relationships*
// @run-at          document-idle
// @contributionURL https://rinsuki.fanbox.cc/
// @contributionURL https://github.com/sponsors/rinsuki
// @homepageURL     https://github.com/rinsuki/userscripts
// @supportURL      https://github.com/rinsuki/userscripts/issues
// ==/UserScript==

(function () {
    'use strict';

    const LINK_TYPE_GID_RELEASE_FREE_STREAMING = "08445ccf-7b99-4438-9f9a-fb9ac18099ee";
    const LINK_TYPE_GID_RELEASE_PAID_STREAMING = "320adf26-96fa-4183-9045-1f5f32f833cb";
    const LINK_TYPE_GID_RELEASE_PAID_DOWNLOAD = "98e08c20-8402-4163-8970-53504bb6a1e4";

    const MEDIUM_FORMAT_DIGITAL_RELEASE = "12";

    function isMBWithReleaseEditor(mb) {
        return mb.releaseEditor !== undefined;
    }

    const DIGITAL_MEDIA_TYPES = [
        LINK_TYPE_GID_RELEASE_FREE_STREAMING,
        LINK_TYPE_GID_RELEASE_PAID_DOWNLOAD,
        LINK_TYPE_GID_RELEASE_PAID_STREAMING,
    ];
    function estimateMediumType(MB) {
        for (const url of MB.releaseEditor.externalLinks?.externalLinksEditorRef.current?.state.links ?? []) {
            if (url.type == null)
                continue;
            const gid = MB.linkedEntities.link_type[url.type]?.gid;
            if (DIGITAL_MEDIA_TYPES.includes(gid)) {
                return MEDIUM_FORMAT_DIGITAL_RELEASE;
            }
        }
    }
    function doIt(medium, type) {
        if (medium.formatID()?.length < 1) {
            medium.formatID(type);
        }
    }
    function main() {
        const MB = window.MB;
        if (!isMBWithReleaseEditor(MB))
            return console.log("You are not on the release editor page.");
        MB.releaseEditor.rootField.release().mediums.subscribe(m => {
            const type = estimateMediumType(MB);
            if (type == null)
                return;
            for (const medium of m) {
                doIt(medium, type);
            }
        });
        MB.releaseEditor.activeTabID.subscribe(tabID => {
            if (tabID !== "#tracklist")
                return;
            const type = estimateMediumType(MB);
            if (type == null)
                return;
            for (const medium of MB.releaseEditor.rootField.release().mediums()) {
                doIt(medium, type);
            }
        });
    }
    main();

})();
