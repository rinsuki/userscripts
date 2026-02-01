import { _ExternalLinksEditor } from "typedbrainz/types"

type ReactRef<T> = { current: T | null }

export interface ExternalLinksEditorResult {
    externalLinksEditorRef: ReactRef<_ExternalLinksEditor>
    // root: React root
}
