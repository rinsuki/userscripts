import { RecordingT, REL_STATUS_EDIT_T, REL_STATUS_REMOVE_T, RelationshipEditStatusT, RelationshipStateT, ReleaseRelationshipEditorActionT, UrlT } from "typedbrainz/types"
import { CompleteReleaseRelationshipEditor } from "../../_common/mb/get-release-relationship-editor-or-throw"

export type PreparedRelationship = {
    recording: RecordingT,
    url: string,
    linkTypeID: number | "all",
    ended: boolean,
}

export function applyRelationships(
    relationships: PreparedRelationship[],
    editNote: string,
    relationshipEditor: CompleteReleaseRelationshipEditor,
): void {
    const tree = window.MB?.tree
    if (tree == null) return alert("MB.tree is missing.")
    relationshipEditor.dispatch({
        type: "update-edit-note",
        editNote: (relationshipEditor.state.editNoteField.value + "\n" + editNote + "\n''Powered by \"" + GM_info.script.name + "\" script (" + GM_info.script.version + ")''").trim(),
    })
    let alreadyAlerted = false

    for (const relationship of relationships) {
        // it will be marked as "incomplete" in the UI, but actually working?
        // @see https://github.com/metabrainz/musicbrainz-server/blob/e214b4d3c13f7ee6b2eb2f9c186ecab310354a5b/root/static/scripts/relationship-editor/components/RelationshipItem.js#L153-L163

        // if we already have a same relationship, just change ended flag
        const existingRels = relationship.recording.relationships!
            .filter(r => !r.editsPending)
            .filter(r => r.target_type === "url" && (r.target as UrlT).href_url === relationship.url && (relationship.linkTypeID === "all" || r.linkTypeID === relationship.linkTypeID))
            .toSorted((a, b) => {
                if (a.ended !== b.ended) {
                    return (a.ended === relationship.ended) ? -1 : 1
                }
                return a.id - b.id
            })
        const dispatchesEdit: ReleaseRelationshipEditorActionT[] = []
        const dispatchesRemove: ReleaseRelationshipEditorActionT[] = []
        if (existingRels.length > 0) {
            let weAlreadyHaveRel = false
            for (const existingRel of existingRels) {
                const oldRelationshipState: RelationshipStateT = {
                    ...existingRel,
                    _lineage: ["loaded from database"],
                    _original: null,
                    _status: 0,
                    attributes: tree.fromDistinctAscArray(existingRel.attributes),
                    entity0: relationship.recording,
                    entity1: existingRel.target as UrlT,
                }
                oldRelationshipState._original = oldRelationshipState
                const isSimpleRel = existingRel.begin_date == null && existingRel.end_date == null
                if (isSimpleRel) {
                    if (weAlreadyHaveRel) {
                        dispatchesRemove.push({
                            type: "update-relationship-state",
                            sourceEntity: relationship.recording,
                            batchSelectionCount: undefined,
                            creditsToChangeForSource: "",
                            creditsToChangeForTarget: "",
                            oldRelationshipState: null,
                            newRelationshipState: {
                                ...oldRelationshipState,
                                _lineage: [...oldRelationshipState._lineage, "removed"],
                                _status: 3 satisfies REL_STATUS_REMOVE_T,
                            },
                        })
                        continue
                    }
                    weAlreadyHaveRel = true
                }
                if (existingRel.ended !== relationship.ended) {
                    dispatchesEdit.push({
                        type: "update-relationship-state",
                        sourceEntity: relationship.recording,
                        batchSelectionCount: undefined,
                        creditsToChangeForSource: "",
                        creditsToChangeForTarget: "",
                        oldRelationshipState: null,
                        newRelationshipState: {
                            ...oldRelationshipState,
                            _lineage: [...oldRelationshipState._lineage, "edited"],
                            _status: 2 satisfies REL_STATUS_EDIT_T,
                            ended: relationship.ended,
                        }
                    })
                }
            }
            if (dispatchesRemove.length) {
                for (const d of dispatchesRemove) {
                    relationshipEditor.dispatch(d)
                }
                if (!alreadyAlerted) {
                    alert("Please re-seed after submit these edits.")
                    alreadyAlerted = true
                }
            } else if (dispatchesEdit.length) {
                for (const d of dispatchesEdit) {
                    relationshipEditor.dispatch(d)
                }
            }
            continue
        }

        if (relationship.linkTypeID === "all") continue

        relationshipEditor.dispatch({
            type: "update-relationship-state",
            sourceEntity: relationship.recording,
            oldRelationshipState: null,
            newRelationshipState: {
                id: relationshipEditor.getRelationshipStateId(null),
                linkOrder: 0,
                linkTypeID: relationship.linkTypeID,
                _lineage: ["added"],
                _original: null,
                _status: 1 as RelationshipEditStatusT,
                attributes: null,
                begin_date: null, // TODO: support?
                end_date: null, // TODO: support?
                editsPending: false,
                ended: !!relationship.ended, // defaults to false
                entity0: relationship.recording,
                entity0_credit: "",
                entity1: {
                    decoded: "",
                    editsPending: false,
                    entityType: "url",
                    gid: "",
                    name: relationship.url,
                    id: relationshipEditor.getRelationshipStateId(null),
                    last_updated: null,
                    href_url: "",
                    pretty_name: "",
                },
                entity1_credit: "",
            },
            batchSelectionCount: undefined,
            creditsToChangeForSource: "",
            creditsToChangeForTarget: "",
        })

    }
}