import { isMBWithReleaseEditor } from "./_common/mb/release-editor"

defineUserScript({
    name: "MB: Clear Tracklist Artist",
    namespace: "https://rinsuki.net",
    match: [
        "https://*musicbrainz.org/release/add",
        "https://*musicbrainz.org/release/*/edit"
    ],
    grant: "none",
    author: "rinsuki",
})

function main() {
    const tracklist = document.getElementById("tracklist")
    if (tracklist == null) return
    const button = document.createElement("button")
    button.textContent = "Clear Tracklist Artist"
    button.addEventListener("click", () => {
        const MB = window.MB
        if (!isMBWithReleaseEditor(MB)) return alert("You are not on the release editor page.")
        if (!confirm("Are you sure you want to clear the tracklist artist?")) return
        for (const track of MB.releaseEditor.rootField.release().allTracks()) {
            track.artistCredit({ names: [] })
        }
    })
    tracklist.prepend(button)
}

main()