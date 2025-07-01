import { isReleaseRelationshipEditor } from "typedbrainz";

export function getReleaseRelationshipEditorOrThrow() {
    const relEditor = window.MB?.relationshipEditor;
    if (relEditor == null || !isReleaseRelationshipEditor(relEditor)) {
        throw new Error("window.MB.relationshipEditor is not a ReleaseRelationshipEditor");
    }
    return relEditor;
}

export type CompleteReleaseRelationshipEditor = ReturnType<typeof getReleaseRelationshipEditorOrThrow>;