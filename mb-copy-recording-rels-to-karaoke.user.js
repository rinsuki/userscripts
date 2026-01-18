// ==UserScript==
// @name        MB: Copy Recording Relationships to Karaoke Recordings
// @version     0.1.0
// @grant       none
// @namespace   https://rinsuki.net
// @author      rinsuki
// @match       https://*musicbrainz.org/release/*/edit-relationships*
// @homepageURL https://github.com/rinsuki/userscripts
// @supportURL  https://github.com/rinsuki/userscripts/issues
// @require     https://cdn.jsdelivr.net/npm/@rinsuki/dom-chef@5.1.1/umd.js#sha256-EvGMVNob2jRhcwSo8gGGJp3mZJENNaQwrpYlNRQlUMc=,sha512-b/5dx8A+dc01RsqR2hF2Na/DFwwn64M4PQFka7dXhcAeXjPfpkgWS9YFs1LHPaEckkxAI7ivhVn6i+OrFivnYQ==
// ==/UserScript==

(function () {
    'use strict';

    //#region node_modules/.pnpm/typedbrainz@0.1.4/node_modules/typedbrainz/lib/index.js
    // SPDX-License-Identifier: MIT
    function isReleaseRelationshipEditor(relationshipEditor) {
        return relationshipEditor.state?.entity.entityType === "release";
    }

    //#endregion

    /** @jsx h */

    const KARAOKE_REL_LINK_TYPE_ID = 226; // gid: 39a08d0e-26e4-44fb-ae19-906f5fe9435d
    const WORK_REL_LINK_TYPE_ID = 278; // gid: a3005666-a872-32c3-ad06-98af558e99b0
    const WORK_REL_KARAOKE_LINK_ATTR_TYPE_ID = 1261; // gid: 3d984f6e-bbe2-4620-9425-5f32e945b60d
    function doIt() {
        const MB = window.MB;
        if (MB == null)
            return alert("MB global not found");
        if (MB.tree == null)
            return alert("MB.tree not found");
        const editor = MB.relationshipEditor;
        if (editor == null || !isReleaseRelationshipEditor(editor))
            return alert("Relationship editor not found");
        const currentRecordings = new Map();
        for (const medium of MB.tree.iterate(editor.state.mediums)) {
            for (const track of MB.tree.iterate(medium[1])) {
                currentRecordings.set(track.recording.gid, track.recording);
            }
        }
        for (const recording of currentRecordings.values()) {
            const karaokes = recording.relationships.filter(rel => rel.linkTypeID === KARAOKE_REL_LINK_TYPE_ID && rel.entity0_id === recording.id);
            for (const karaoke of karaokes) {
                const karaokeRecording = karaoke.target;
                for (const rel of recording.relationships) {
                    if (rel.source_type === "recording" && rel.target_type === "recording")
                        continue; // probably don't want to copy
                    if (rel.source_type === "url" || rel.target_type === "url")
                        continue; // probably don't want to copy
                    const attrs = [...rel.attributes];
                    if (rel.linkTypeID === WORK_REL_LINK_TYPE_ID && attrs.find(x => x.typeID === WORK_REL_KARAOKE_LINK_ATTR_TYPE_ID) == null) {
                        const karaokeAttr = MB.linkedEntities.link_attribute_type[WORK_REL_KARAOKE_LINK_ATTR_TYPE_ID];
                        attrs.push({
                            type: karaokeAttr,
                            typeID: WORK_REL_KARAOKE_LINK_ATTR_TYPE_ID,
                            typeName: karaokeAttr.name,
                        });
                    }
                    editor.dispatch({
                        type: "update-relationship-state",
                        sourceEntity: rel.backward ? rel.target : karaokeRecording,
                        oldRelationshipState: null,
                        newRelationshipState: {
                            _lineage: [],
                            _original: null,
                            editsPending: false,
                            _status: 1,
                            entity0: rel.backward ? rel.target : karaokeRecording,
                            entity1: rel.backward ? karaokeRecording : rel.target,
                            entity0_credit: rel.entity0_credit,
                            entity1_credit: rel.entity1_credit,
                            begin_date: rel.begin_date,
                            end_date: rel.end_date,
                            ended: rel.ended,
                            attributes: MB.tree.fromDistinctAscArray(attrs),
                            id: editor.getRelationshipStateId(null),
                            linkTypeID: rel.linkTypeID,
                            linkOrder: rel.linkOrder,
                        },
                        batchSelectionCount: undefined,
                        creditsToChangeForSource: "",
                        creditsToChangeForTarget: "",
                    });
                }
            }
        }
        let editNote = editor.state.editNoteField.value;
        if (editNote.length)
            editNote += "\n";
        editNote += "Script: \"" + GM.info.script.name + "\" (" + GM.info.script.version + ")";
        editor.dispatch({ type: "update-edit-note", editNote });
    }
    const elm = DOMChef.h("div", null,
        DOMChef.h("button", { onClick: () => doIt() }, "Copy Recording Relationships to Karaoke Recordings"));
    document.querySelector("#content > div.tabs")?.insertAdjacentElement("afterend", elm);

})();
