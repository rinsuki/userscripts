import { Computed, Observable, ObservableArray } from "knockout"
import { ArtistCreditNameT } from "typedbrainz/types"

declare class EditorMedium {
    tracks: ObservableArray<EditorTrack>
}

declare class EditorTrack {
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

// https://github.com/metabrainz/musicbrainz-server/blob/8ff871e17729fec9d032cd54b9a563660b728e63/root/static/scripts/release-editor/fields.js#L1110
declare class EditorRelease {
    name: Observable<string>
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
    }
}
