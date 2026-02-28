// ==UserScript==
// @name            MB: Copy Recording Relationships to Karaoke/Edited Recordings
// @description     Copy recording-{artist, work, etc...} relationships to karaoke/edited recordings with one button!
// @version         0.3.0
// @grant           none
// @namespace       https://rinsuki.net
// @author          rinsuki
// @match           https://*.musicbrainz.org/release/*/edit-relationships*
// @contributionURL https://github.com/sponsors/rinsuki
// @homepageURL     https://github.com/rinsuki/userscripts
// @supportURL      https://github.com/rinsuki/userscripts/issues
// @require         https://cdn.jsdelivr.net/npm/@rinsuki/dom-chef@5.1.1/umd.js#sha256-EvGMVNob2jRhcwSo8gGGJp3mZJENNaQwrpYlNRQlUMc=,sha512-b/5dx8A+dc01RsqR2hF2Na/DFwwn64M4PQFka7dXhcAeXjPfpkgWS9YFs1LHPaEckkxAI7ivhVn6i+OrFivnYQ==
// ==/UserScript==

(function () {
    'use strict';

    //#region node_modules/.pnpm/typedbrainz@0.2.0/node_modules/typedbrainz/lib/index.js
    // SPDX-License-Identifier: MIT
    function isReleaseRelationshipEditor(relationshipEditor) {
        return relationshipEditor.state?.entity.entityType === "release";
    }

    //#endregion

    async function resolveRecordingsRelationships(recordings, parent) {
        // とりあえず愚直な実装 (TODO: appearsOnを使ってmediumで引くとかもできるはず)
        const progressBar = document.createElement("progress");
        progressBar.max = recordings.length;
        progressBar.value = 0;
        parent.appendChild(progressBar);
        recordings.sort((a, b) => {
            if (a.relationships != null && b.relationships == null)
                return -1;
            if (a.relationships == null && b.relationships != null)
                return 1;
            return 0;
        });
        for (const recording of recordings) {
            if (recording.relationships != null) {
                progressBar.value += 1;
                continue;
            }
            const res = await fetch("/ws/js/entity/" + recording.gid + "?inc=rels");
            if (!res.ok) {
                alert(`Failed to fetch recording ${recording.gid}: ${res.status} ${await res.text()}`);
            }
            const freshRecording = await res.json();
            Object.assign(recording, {
                relationships: freshRecording.relationships,
            });
            progressBar.value += 1;
        }
        progressBar.remove();
    }

    /** @jsx h */

    const KARAOKE_REL_LINK_TYPE_ID = 226; // gid: 39a08d0e-26e4-44fb-ae19-906f5fe9435d
    const EDITS_REL_LINK_TYPE_ID = 309; // gid: ce01b3ac-dd47-4702-9302-085344f96e84
    const WORK_REL_LINK_TYPE_ID = 278; // gid: a3005666-a872-32c3-ad06-98af558e99b0
    const WORK_REL_KARAOKE_LINK_ATTR_TYPE_ID = 1261; // gid: 3d984f6e-bbe2-4620-9425-5f32e945b60d
    const WORK_REL_PARTIAL_LINK_ATTR_TYPE_ID = 579; // gid: d2b63be6-91ec-426a-987a-30b47f8aae2d
    async function doIt(button) {
        const MB = window.MB;
        if (MB == null)
            return alert("MB global not found");
        if (MB.tree == null)
            return alert("MB.tree not found");
        const editor = MB.relationshipEditor;
        if (editor == null || !isReleaseRelationshipEditor(editor))
            return alert("Relationship editor not found");
        const currentRecordings = new Map();
        const dstRecordingStates = new Map();
        for (const medium of MB.tree.iterate(editor.state.mediums)) {
            for (const track of MB.tree.iterate(medium[1])) {
                currentRecordings.set(track.recording.gid, track.recording);
                dstRecordingStates.set(track.recording.gid, track);
            }
        }
        const recToRecRelationships = new Map();
        for (const dstRecording of Array.from(/* currentRecordings はループ内で変化するので Array.from で確定させる */ currentRecordings.values())) {
            console.log("dstrec", dstRecording);
            const srcRecordingRels = [
                ...dstRecording.relationships.filter(rel => KARAOKE_REL_LINK_TYPE_ID === rel.linkTypeID && rel.entity1_id === dstRecording.id),
                ...dstRecording.relationships.filter(rel => EDITS_REL_LINK_TYPE_ID === rel.linkTypeID && rel.entity0_id === dstRecording.id),
            ];
            for (const srcRecordingRel of srcRecordingRels) {
                const srcRecording = srcRecordingRel.target;
                if (srcRecording.entityType !== "recording")
                    continue; // ?
                let obj = recToRecRelationships.get(`${dstRecording.gid}:${srcRecording.gid}`);
                if (obj == null) {
                    obj = {
                        srcRecordingId: srcRecording.gid,
                        dstRecordingId: dstRecording.gid,
                        karaoke: false,
                        partial: false,
                    };
                    if (!currentRecordings.has(srcRecording.gid))
                        currentRecordings.set(srcRecording.gid, srcRecording);
                    recToRecRelationships.set(`${dstRecording.gid}:${srcRecording.gid}`, obj);
                }
                if (srcRecordingRel.linkTypeID === KARAOKE_REL_LINK_TYPE_ID) {
                    obj.karaoke = true;
                }
                else if (srcRecordingRel.linkTypeID === EDITS_REL_LINK_TYPE_ID) {
                    obj.partial = true;
                }
            }
        }
        await resolveRecordingsRelationships(Array.from(recToRecRelationships.values())
            .map(x => x.srcRecordingId)
            .map(gid => currentRecordings.get(gid)), button);
        for (const recToRecRel of recToRecRelationships.values()) {
            const srcRecording = currentRecordings.get(recToRecRel.srcRecordingId);
            const dstRecording = currentRecordings.get(recToRecRel.dstRecordingId);
            for (const rel of srcRecording.relationships) {
                if (rel.source_type === "recording" && rel.target_type === "recording")
                    continue; // probably don't want to copy
                if (rel.source_type === "url" || rel.target_type === "url")
                    continue; // probably don't want to copy
                const attrs = [...rel.attributes];
                let oldRelationshipState = null;
                if (rel.linkTypeID === WORK_REL_LINK_TYPE_ID) {
                    const neededAttrIds = new Set();
                    if (recToRecRel.karaoke)
                        neededAttrIds.add(WORK_REL_KARAOKE_LINK_ATTR_TYPE_ID);
                    if (recToRecRel.partial)
                        neededAttrIds.add(WORK_REL_PARTIAL_LINK_ATTR_TYPE_ID);
                    for (const neededAttrId of neededAttrIds) {
                        if (attrs.find(x => x.typeID === neededAttrId) != null)
                            continue;
                        const neededAttr = MB.linkedEntities.link_attribute_type[neededAttrId];
                        attrs.push({
                            type: neededAttr,
                            typeID: neededAttr.id,
                            typeName: neededAttr.name,
                        });
                    }
                    const dstRecAllRels = dstRecordingStates.get(dstRecording.gid).targetTypeGroups;
                    const dstRecWorkRelsObj = dstRecAllRels && MB.tree
                        .iterate(dstRecAllRels)
                        .find(r => r[0] === "work")?.[1];
                    const dstRecWorkRels = dstRecWorkRelsObj && MB.tree
                        .iterate(dstRecWorkRelsObj)
                        .flatMap(r => MB.tree.iterate(r.phraseGroups))
                        .flatMap(r => MB.tree.iterate(r.relationships))
                        .toArray();
                    console.log("drwrels", dstRecWorkRels, rel.backward);
                    const dstRecWorkRel = dstRecWorkRels?.find(r => rel.backward
                        ? r.entity0.id === rel.target.id && r.entity1.id === dstRecording.id
                        : r.entity0.id === dstRecording.id && r.entity1.id === rel.target.id);
                    if (dstRecWorkRel != null) {
                        const oldRelAttrIds = new Set(MB.tree.iterate(dstRecWorkRel.attributes).map(x => x.typeID));
                        if (attrs.every(x => oldRelAttrIds.has(x.typeID))) {
                            continue;
                        }
                        const oldRelAttrNames = MB.tree.iterate(dstRecWorkRel.attributes).map(x => x.typeName).toArray().join(", ") || "(none)";
                        const newRelAttrNames = attrs.map(x => x.typeName).join(", ") || "(none)";
                        if (confirm([
                            `While copying`,
                            "",
                            `Relationship to work "${rel.target.name}" (${rel.target.id})`,
                            `to Destination recording "${dstRecording.name}" (${dstRecording.id})`,
                            `from Source recording "${srcRecording.name}" (${srcRecording.id})`,
                            "",
                            "an existing relationship with the same work but different attributes was found.",
                            "",
                            "Do you want to overwrite the existing relationship's attributes with the new ones?",
                            "",
                            `${oldRelAttrNames} → ${newRelAttrNames}`,
                            "",
                            "OK = Overwrite",
                            "Cancel = Add New Recording-Work Relationship",
                        ].join("\n"))) {
                            oldRelationshipState = dstRecWorkRel;
                        }
                    }
                }
                editor.dispatch({
                    type: "update-relationship-state",
                    sourceEntity: rel.backward ? rel.target : dstRecording,
                    oldRelationshipState,
                    newRelationshipState: {
                        _lineage: [],
                        _original: null,
                        editsPending: false,
                        entity0: rel.backward ? rel.target : dstRecording,
                        entity1: rel.backward ? dstRecording : rel.target,
                        entity0_credit: rel.entity0_credit,
                        entity1_credit: rel.entity1_credit,
                        begin_date: rel.begin_date,
                        end_date: rel.end_date,
                        ended: rel.ended,
                        id: editor.getRelationshipStateId(null),
                        linkTypeID: rel.linkTypeID,
                        linkOrder: rel.linkOrder,
                        // ↑ここまでは新規relationshipを作成する時限定
                        ...(oldRelationshipState ? oldRelationshipState : {}),
                        _status: oldRelationshipState ? (oldRelationshipState._status || 2) : 1,
                        attributes: MB.tree.fromDistinctAscArray(attrs),
                    },
                    batchSelectionCount: undefined,
                    creditsToChangeForSource: "",
                    creditsToChangeForTarget: "",
                });
            }
        }
        let editNote = editor.state.editNoteField.value;
        if (editNote.length)
            editNote += "\n";
        editNote += "Script: \"" + GM.info.script.name + "\" (" + GM.info.script.version + ")";
        editor.dispatch({ type: "update-edit-note", editNote });
    }
    const elm = DOMChef.h("div", null,
        DOMChef.h("button", { onClick: (e) => {
                const button = e.currentTarget;
                button.disabled = true;
                doIt(button).finally(() => {
                    button.querySelector(".only-for-loading")?.remove();
                    button.disabled = false;
                });
            } }, "Copy Recording Relationships to Karaoke Recordings"));
    document.querySelector("#content > div.tabs")?.insertAdjacentElement("afterend", elm);

})();
