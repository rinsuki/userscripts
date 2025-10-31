import { ArtistCreditNameT, ArtistT } from "typedbrainz/types"
import { getReleaseRelationshipEditorOrThrow } from "./_common/mb/get-release-relationship-editor-or-throw"
import type { Observable, ObservableArray } from "knockout"

defineUserScript({
    name: "MB: Match Tracklist Credits with Other Credits",
    namespace: "https://rinsuki.net",
    grant: "none",
    match: [
        "https://*musicbrainz.org/release/*/edit",
        "https://*musicbrainz.org/release/add",
    ]
})

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

function doItForSpecificArtistCredit(creditMap: Map<string, ArtistT | null>, artistCredit: Observable<{ names: ArtistCreditNameT[] }>) {
    const names = [...artistCredit().names]
    // ループ中にnamesを書き換えるのであえて for-of を使わない
    for (let i = 0; i < names.length; i++) {
        const name = names[i]
        if (name.artist == null) {
            for (const [knownName, knownArtist] of creditMap) {
                if (knownArtist == null) continue
                if (!name.name.startsWith(knownName)) continue
                const remainName = name.name.slice(knownName.length)
                if (remainName === "") {
                    // 完全一致
                    name.artist = knownArtist
                    break
                }
                name.name = knownName
                name.artist = knownArtist
                name.joinPhrase = remainName + name.joinPhrase
                break
            }
        }
        let firstArtist: null | [number, string, ArtistT] = null
        for (const [knownName, knownArtist] of creditMap) {
            if (knownArtist == null) continue
            const i = name.joinPhrase.indexOf(knownName)
            if (i === -1) continue
            if (firstArtist == null || firstArtist[0] > i) {
                firstArtist = [i, knownName, knownArtist]
            }
        }
        if (firstArtist != null) {
            const [i, knownName, knownArtist] = firstArtist
            const remainName = name.joinPhrase.slice(i + knownName.length)
            name.joinPhrase = name.joinPhrase.slice(0, i)
            const newCreditName: ArtistCreditNameT = {
                name: knownName,
                artist: knownArtist,
                joinPhrase: remainName,
            }
            names.splice(i + 1, 0, newCreditName)
        }
    }
    artistCredit({
        names,
    })
}

async function doItEntirely(withShiftKey: boolean) {
    const MB = window.MB
    if (MB == null) return
    const editor: {
        rootField: {
            release: Observable<{
                artistCredit: Observable<{
                    names: ArtistCreditNameT[]
                }>,
                allTracks: () => Iterable<EditorTrack>,
                releaseGroup: Observable<{
                    artistCredit?: {
                        names: ArtistCreditNameT[]
                    }
                }>,
            }>
        }
    } = (MB as any).releaseEditor

    const currentCredits: ArtistCreditNameT[] = [
        ...editor.rootField.release().releaseGroup().artistCredit?.names ?? [],
        ...editor.rootField.release().artistCredit().names,
        ...Array.from(editor.rootField.release().allTracks()).flatMap(t => [...t.artistCredit().names, ...t.recording().artistCredit.names]),
    ]

    if (withShiftKey) {
        const releaseUrl = prompt("Enter the release URL to copy credits from")
        if (releaseUrl == null || releaseUrl === "") return
        const mbid = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.exec(releaseUrl)?.[0]
        if (mbid == null) {
            alert("Invalid release URL")
            return
        }
        const otherJS = await fetch(`/ws/js/entity/${mbid}`).then(r => r.json())
        if (!("artistCredit" in otherJS)) {
            alert("Could not fetch artist credit data")
            return
        }
        currentCredits.push(...otherJS.artistCredit.names)
    }

    const creditMap = new Map<string, ArtistT | null>()
    for (const credit of currentCredits) {
        if (!creditMap.has(credit.name)) {
            if (credit.artist != null) {
                creditMap.set(credit.name, credit.artist)
            }
        } else {
            if (credit.artist == null) {
                creditMap.set(credit.name, null)
            } else {
                const current = creditMap.get(credit.name)
                if (current == null) continue
                if (current.id !== credit.artist.id) {
                    creditMap.set(credit.name, null)
                }
            }
        }
    }

    console.log(creditMap)

    doItForSpecificArtistCredit(creditMap, editor.rootField.release().artistCredit)
    for (const track of editor.rootField.release().allTracks()) {
        doItForSpecificArtistCredit(creditMap, track.artistCredit)
    }
    
    alert("Done")
}

const button = document.createElement("button")
button.id = "mb-match-tracklist-credits-with-other-credits-button"
document.getElementById(button.id)?.remove()
button.textContent = "Match Tracklist Credits with Other Credits"
button.addEventListener("click", (e) => {
    doItEntirely(e.shiftKey)
})

document.getElementById("release-editor")?.prepend(button)