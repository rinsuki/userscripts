import { RecordingT, RelationshipEditStatusT } from "typedbrainz/types"
import { CompleteReleaseRelationshipEditor } from "../../_common/mb/get-release-relationship-editor-or-throw"

export type PreparedRelationship = {
    recording: RecordingT,
    url: string,
    linkTypeID: number,
}

export function applyRelationships(
    relationships: PreparedRelationship[],
    editNote: string,
    relationshipEditor: CompleteReleaseRelationshipEditor
): void {
    relationshipEditor.dispatch({
        type: "update-edit-note",
        editNote: (relationshipEditor.state.editNoteField.value + "\n" + editNote + "\n''Powered by \"" + GM_info.script.name + "\" script (" + GM_info.script.version + ")''").trim(),
    })
    for (const relationship of relationships) {
        // it will be marked as "incomplete" in the UI, but actually working?
        // @see https://github.com/metabrainz/musicbrainz-server/blob/e214b4d3c13f7ee6b2eb2f9c186ecab310354a5b/root/static/scripts/relationship-editor/components/RelationshipItem.js#L153-L163
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
                ended: false,
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