import type { IncompleteArtistCreditT } from "typedbrainz/types"
const LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT = "copiedArtistCredit";

export function getArtistCreditClipboard(): IncompleteArtistCreditT | undefined {
    const str = localStorage.getItem(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT)
    if (str == null) return undefined
    try {
        return JSON.parse(str)
    } catch(e) {
        console.warn("Failed to parse artist credit clipboard data", e)
        return undefined
    }
}

export function setArtistCreditClipboard(artistCredit: IncompleteArtistCreditT): void {
    localStorage.setItem(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT, JSON.stringify(artistCredit))
}