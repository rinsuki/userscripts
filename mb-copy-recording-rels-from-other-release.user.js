// ==UserScript==
// @name        MB: [WIP] Copy Recording Relationships from Other Release
// @version     0.1.0
// @grant       none
// @namespace   https://rinsuki.net
// @author      rinsuki
// @match       https://*.musicbrainz.org/release/*/edit-relationships*
// @homepageURL https://github.com/rinsuki/userscripts
// @supportURL  https://github.com/rinsuki/userscripts/issues
// @require     https://cdn.jsdelivr.net/npm/@rinsuki/dom-chef@5.1.1/umd.js#sha256-EvGMVNob2jRhcwSo8gGGJp3mZJENNaQwrpYlNRQlUMc=,sha512-b/5dx8A+dc01RsqR2hF2Na/DFwwn64M4PQFka7dXhcAeXjPfpkgWS9YFs1LHPaEckkxAI7ivhVn6i+OrFivnYQ==
// ==/UserScript==

(function () {
    'use strict';

    class HTTPError extends Error {
        response;
        text;
        constructor(response, text) {
            super(`HTTP-${response.status}: ${text}`);
            this.response = response;
            this.text = text;
        }
    }
    async function fetchOkOrThrow(...args) {
        const res = await fetch(...args);
        if (!res.ok) {
            throw new HTTPError(res, await res.text());
        }
        return res;
    }

    //#region node_modules/.pnpm/typedbrainz@0.2.0/node_modules/typedbrainz/lib/index.js
    // SPDX-License-Identifier: MIT
    function isReleaseRelationshipEditor(relationshipEditor) {
        return relationshipEditor.state?.entity.entityType === "release";
    }

    //#endregion

    /** @jsx h */

    let abortController = null;
    const elm = DOMChef.h("div", null,
        DOMChef.h("details", { style: { border: "1px solid #ccc", margin: "1em 0", padding: "0.5em" }, open: true },
            DOMChef.h("summary", { style: { marginBottom: "0.5em" } },
                DOMChef.h("h2", { style: { display: "inline" } }, "Copy Recording Relationships from Other Release")),
            DOMChef.h("form", { action: "javascript:", onSubmit: e => {
                    e.preventDefault();
                    const input = e.currentTarget.querySelector("input[type=text]");
                    if (input == null)
                        return;
                    const mbid = (input.value.match(/(?:^|\/release\/)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i) ?? [])[1];
                    if (!mbid) {
                        alert("Invalid MBID or URL");
                        return;
                    }
                    if (abortController) {
                        abortController.abort();
                    }
                    abortController = new AbortController();
                    fetchReleaseAndShowCopyUI(mbid, abortController, e.currentTarget).catch(err => {
                        console.error(err);
                        alert(err.message);
                    });
                } },
                DOMChef.h("input", { type: "text", placeholder: "Release MBID or URL", size: 40 }),
                DOMChef.h("input", { type: "submit", value: "Load" }))));
    async function fetchReleaseAndShowCopyUI(mbid, ac, form) {
        const resRaw = await fetchOkOrThrow(`/ws/js/entity/${mbid}`).catch(e => { throw new Error(`failed to fetch release: ${e.message}`, { cause: e }); });
        const resJSON = await resRaw.json().catch(e => { throw new Error(`failed to fetch release (parsing json): ${e.message}`, { cause: e }); });
        console.log(resJSON);
        const elm = DOMChef.h("div", null,
            DOMChef.h("h3", null,
                "Copy from ",
                resJSON.name),
            DOMChef.h("form", { action: "javascript:", onSubmit: e => {
                    e.preventDefault();
                    const input = e.currentTarget.querySelector("select");
                    if (input == null)
                        return;
                    const mediumid = parseInt(input.value, 10);
                    if (!Number.isSafeInteger(mediumid)) {
                        alert("Invalid medium ID");
                        return;
                    }
                    fetchMediumAndShowCopyUI(resJSON.gid, mediumid, ac, e.currentTarget).catch(err => {
                        console.error(err);
                        alert(err.message);
                    });
                } },
                resJSON.mediums
                    ? DOMChef.h("div", null,
                        DOMChef.h("select", { size: Math.max(Math.min(2, resJSON.mediums?.length), 5) }, resJSON.mediums.map(medium => {
                            return DOMChef.h("option", { value: medium.id },
                                medium.position,
                                ". ",
                                medium.format?.name ?? "(unknown)",
                                medium.name.length ? ": " + medium.name : "");
                        })))
                    : "(no mediums)",
                DOMChef.h("input", { type: "submit", value: "Load" })));
        if (ac.signal.aborted)
            return;
        form.nextElementSibling?.remove();
        form.insertAdjacentElement("afterend", elm);
        elm.querySelector("select")?.focus();
    }
    async function fetchMediumAndShowCopyUI(releasegid, mediumid, ac, form) {
        const resRaw = await fetchOkOrThrow(`/ws/js/medium/${mediumid}?inc=recordings+rels`).catch(e => { throw new Error(`failed to fetch medium: ${e.message}`, { cause: e }); });
        const srcMedia = await resRaw.json().catch(e => { throw new Error(`failed to fetch medium (parsing json): ${e.message}`, { cause: e }); });
        const elm = DOMChef.h("div", null,
            DOMChef.h("button", { onClick: () => {
                    if (MB == null)
                        return;
                    const relEditor = MB.relationshipEditor;
                    if (MB.tree == null || !isReleaseRelationshipEditor(relEditor))
                        return;
                    const dstMedia = MB.tree.iterate(relEditor.state.mediums).toArray()[0];
                    let copiedSomeRels = false;
                    for (let i = 0; i < dstMedia[0].tracks.length; i++) {
                        const srcRec = srcMedia.tracks[i].recording;
                        const dstRec = dstMedia[0].tracks[i].recording;
                        for (const rel of srcRec.relationships) {
                            copiedSomeRels = true;
                            relEditor.dispatch({
                                type: "update-relationship-state",
                                sourceEntity: dstRec,
                                oldRelationshipState: null,
                                newRelationshipState: {
                                    _lineage: [],
                                    _original: null,
                                    editsPending: false,
                                    _status: 1,
                                    entity0: rel.backward ? rel.target : dstRec,
                                    entity1: rel.backward ? dstRec : rel.target,
                                    entity0_credit: rel.entity0_credit,
                                    entity1_credit: rel.entity1_credit,
                                    begin_date: rel.begin_date,
                                    end_date: rel.end_date,
                                    ended: rel.ended,
                                    attributes: MB.tree.fromDistinctAscArray(rel.attributes.map(attribute => {
                                        const type = MB.linkedEntities.link_attribute_type[attribute.type.gid];
                                        return {
                                            ...attribute,
                                            type,
                                            typeID: type.id,
                                        };
                                    })),
                                    id: relEditor.getRelationshipStateId(null),
                                    linkTypeID: rel.linkTypeID,
                                    linkOrder: rel.linkOrder,
                                },
                                batchSelectionCount: undefined,
                                creditsToChangeForSource: "",
                                creditsToChangeForTarget: "",
                            });
                        }
                    }
                    if (copiedSomeRels) {
                        let editNote = relEditor.state.editNoteField.value;
                        if (editNote.length)
                            editNote += "\n";
                        editNote += `Relationships Copied from https://musicbrainz.org/release/${releasegid}/disc/${srcMedia.position} (a.k.a. https://musicbrainz.org/medium/${srcMedia.gid} )`;
                        relEditor.dispatch({ type: "update-edit-note", editNote });
                    }
                } }, "Copy"));
        if (ac.signal.aborted)
            return;
        form.nextElementSibling?.remove();
        form.insertAdjacentElement("afterend", elm);
    }
    document.querySelector("#content > div.tabs")?.insertAdjacentElement("afterend", elm);

})();
