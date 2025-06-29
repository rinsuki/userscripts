// ==UserScript==
// @name        MusicBrainz: Seed URLs to Release Recordings
// @namespace   https://rinsuki.net
// @match       https://musicbrainz.org/release/*/edit-relationships
// @require     https://cdn.jsdelivr.net/npm/zod@3.24.4/lib/index.umd.js#sha256=25623a1c332de4571b75a2a6fb8be1fae40180c8fdfd7b4420f09bea727cee1c
// @grant       none
// @version     0.1
// @author      rinsuki
// ==/UserScript==

(function () {
    'use strict';

    //#region node_modules/.pnpm/typedbrainz@0.1.3/node_modules/typedbrainz/lib/index.js
    // SPDX-License-Identifier: MIT
    function isReleaseRelationshipEditor(relationshipEditor) {
        return relationshipEditor.state?.entity.entityType === "release";
    }

    //#endregion

    const zSeedJSON = Zod.object({
        recordings: Zod.record(Zod.string(), // recording id
        Zod.object({
            url: Zod.string().url(),
            types: Zod.array(Zod.string()), // link_type UUID
        })),
        note: Zod.string(),
    });
    async function main() {
        // check hash
        const urlParams = new URLSearchParams(location.hash.slice(1));
        const rawJson = urlParams.get("seed-urls-v1");
        if (rawJson == null)
            return;
        while (window.MB?.relationshipEditor?.state == null) {
            console.log("Waiting for window.MB.relationshipEditor?.state to be defined...");
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log("!", window.MB.relationshipEditor);
        if (!isReleaseRelationshipEditor(window.MB.relationshipEditor)) {
            return;
        }
        const { linkedEntities, relationshipEditor } = window.MB;
        const button = document.createElement("button");
        button.textContent = "Seed URLs to Recordings";
        button.style.zoom = "2";
        button.addEventListener("click", () => {
            const json = zSeedJSON.parse(JSON.parse(rawJson));
            console.log(json);
            const errors = [];
            relationshipEditor.dispatch({
                type: "update-edit-note",
                editNote: (relationshipEditor.state.editNoteField.value + "\n" + json.note + "\n''Powered by \"" + GM_info.script.name + "\" script''").trim(),
            });
            for (const medium of relationshipEditor.state.entity.mediums) {
                console.log(medium);
                for (const track of medium.tracks ?? []) {
                    console.log(track);
                    if (track.recording.gid in json.recordings) {
                        const rel = json.recordings[track.recording.gid];
                        delete json.recordings[track.recording.gid];
                        for (const relType of rel.types) {
                            let linkTypeID;
                            if (relType in linkedEntities.link_type && linkedEntities.link_type[relType].type0 === "recording" && linkedEntities.link_type[relType].type1 === "url") {
                                linkTypeID = linkedEntities.link_type[relType].id;
                            }
                            if (linkTypeID == null) {
                                for (const lt of Object.values(linkedEntities.link_type)) {
                                    if (lt.type0 !== "recording")
                                        continue;
                                    if (lt.type1 !== "url")
                                        continue;
                                    console.log(lt);
                                    if (lt.name === relType) {
                                        linkTypeID = lt.id;
                                        break;
                                    }
                                }
                            }
                            if (linkTypeID == null) {
                                errors.push(`Failed to find link type ${JSON.stringify(relType)} for recording ${track.recording.gid}`);
                                continue;
                            }
                            // it will be marked as "incomplete" in the UI, but actually working?
                            // @see https://github.com/metabrainz/musicbrainz-server/blob/e214b4d3c13f7ee6b2eb2f9c186ecab310354a5b/root/static/scripts/relationship-editor/components/RelationshipItem.js#L153-L163
                            relationshipEditor.dispatch({
                                type: "update-relationship-state",
                                sourceEntity: track.recording,
                                oldRelationshipState: null,
                                newRelationshipState: {
                                    id: relationshipEditor.getRelationshipStateId(null),
                                    linkOrder: 0,
                                    linkTypeID,
                                    _lineage: ["added"],
                                    _original: null,
                                    _status: 1,
                                    attributes: null,
                                    begin_date: null, // TODO: support?
                                    end_date: null, // TODO: support?
                                    editsPending: false,
                                    ended: false,
                                    entity0: track.recording,
                                    entity0_credit: "",
                                    entity1: {
                                        decoded: "",
                                        editsPending: false,
                                        entityType: "url",
                                        gid: "",
                                        name: rel.url,
                                        id: relationshipEditor.getRelationshipStateId(null),
                                        last_updated: null,
                                        href_url: "",
                                        pretty_name: "",
                                    },
                                    entity1_credit: "test",
                                },
                                batchSelectionCount: undefined,
                                creditsToChangeForSource: "",
                                creditsToChangeForTarget: "",
                            });
                        }
                    }
                }
            }
            for (const remainingRecordingId of Object.keys(json.recordings)) {
                errors.push(`Can't find ${remainingRecordingId}, skipped`);
            }
            if (errors.length === 0) {
                alert("All URLs seeded successfully!");
            }
            else {
                alert("URLs seeded, but with some errors:\n" + errors.map(x => "* " + x).join("\n"));
            }
        });
        const before = document.querySelector("#content > p");
        before.parentElement.insertBefore(button, before);
        console.log("done");
    }
    main();

})();
