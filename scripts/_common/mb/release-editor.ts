import { Computed, Observable, ObservableArray } from "knockout"
import { ArtistCreditNameT, LabelT, LinkMapT } from "typedbrainz/types"
import { ExternalLinksEditorResult } from "./external-links-editor"

declare class EditorMedium {
    tracks: ObservableArray<EditorTrack>
}

declare class EditorTrack {
    name: Observable<string>
    medium: EditorMedium
    artistCredit: Observable<{
        names: ArtistCreditNameT[]
    }>
    recording: Observable<{
        artistCredit: {
            names: ArtistCreditNameT[]
        }
    }>
}

// https://github.com/metabrainz/musicbrainz-server/blob/8ff871e17729fec9d032cd54b9a563660b728e63/root/static/scripts/release-editor/fields.js#L1054
declare class EditorBarcode {
    value: Computed<string>
}

declare class EditorReleaseLabel {
    label: Observable<{ name: string } | LabelT>
    catalogNumber: Observable<string>
}

// https://github.com/metabrainz/musicbrainz-server/blob/8ff871e17729fec9d032cd54b9a563660b728e63/root/static/scripts/release-editor/fields.js#L1110
declare class EditorRelease {
    name: Observable<string>
    statusID: Observable<string>
    languageID: Observable<string>
    scriptID: Observable<string>
    packagingID: Observable<string>
    labels: ObservableArray<EditorReleaseLabel>
    barcode: EditorBarcode
    artistCredit: Observable<{
        names: ArtistCreditNameT[]
    }>
    releaseGroup: Observable<{
        artistCredit?: {
            names: ArtistCreditNameT[]
        }
    }>

    allTracks: () => Iterable<EditorTrack>
}

export interface MBReleaseEditor {
    rootField: {
        release: Observable<EditorRelease>
        editNote: Observable<string>
    }
    externalLinks: ExternalLinksEditorResult
    externalLinksEditData: Observable<{
        allLinks: LinkMapT,
        newLinks: LinkMapT,
        oldLinks: LinkMapT,
    }>
}

export type MBWithReleaseEditor = typeof window.MB & {
    releaseEditor: MBReleaseEditor
}
