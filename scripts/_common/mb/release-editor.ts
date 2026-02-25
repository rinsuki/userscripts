import { Computed, Observable, ObservableArray } from "knockout"
import { ArtistCreditNameT, LabelT, LinkMapT, MediumT, TrackT } from "typedbrainz/types"
import { ExternalLinksEditorResult } from "./external-links-editor"

export declare class EditorMedium {
    release: EditorRelease
    formatID: Observable<string>

    position: Observable<number>
    name: Observable<string>
    tracks: ObservableArray<EditorTrack>

    pushTrack(data: Partial<TrackT>): void

    constructor(medium: Partial<MediumT>, release: EditorRelease)
}

export declare class EditorTrack {
    name: Observable<string>
    medium: EditorMedium
    /// milliseconds
    length: Observable<number | null>
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

// https://github.com/metabrainz/musicbrainz-server/blob/8737b40d9619917a0635f1dd70215c8593d18a30/root/static/scripts/release-editor/fields.js#L969
declare class EditorReleaseEvent {
    date: {
        year: Observable<string | null>,
        month: Observable<string | null>,
        day: Observable<string | null>,
    }
    countryID: Observable<string | null>
    hasInvalidDate: Computed<boolean>
}

// https://github.com/metabrainz/musicbrainz-server/blob/8ff871e17729fec9d032cd54b9a563660b728e63/root/static/scripts/release-editor/fields.js#L1110
export declare class EditorRelease {
    name: Observable<string>
    statusID: Observable<string>
    languageID: Observable<string>
    scriptID: Observable<string>
    packagingID: Observable<string>
    labels: ObservableArray<EditorReleaseLabel>
    events: ObservableArray<EditorReleaseEvent>
    barcode: EditorBarcode
    artistCredit: Observable<{
        names: ArtistCreditNameT[]
    }>
    releaseGroup: Observable<{
        artistCredit?: {
            names: ArtistCreditNameT[]
        }
    }>
    mediums: ObservableArray<EditorMedium>

    allTracks: () => Iterable<EditorTrack>
}

export interface MBReleaseEditor {
    rootField: {
        release: Observable<EditorRelease>
        editNote: Observable<string>
    }
    externalLinks?: ExternalLinksEditorResult
    externalLinksEditData: Observable<{
        allLinks: LinkMapT,
        newLinks: LinkMapT,
        oldLinks: LinkMapT,
    }>
    activeTabID: Observable<(string & {}) | "#information" | "#tracklist" | "#recordings" | "#edit-note">
}

export type MBWithReleaseEditor = typeof window.MB & {
    releaseEditor: MBReleaseEditor
}

export function isMBWithReleaseEditor(mb: typeof window.MB): mb is MBWithReleaseEditor {
    return (mb as MBWithReleaseEditor).releaseEditor !== undefined
}
