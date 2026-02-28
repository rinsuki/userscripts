import { isMBWithReleaseEditor } from "./_common/mb/release-editor"

defineUserScript({
    name: "MB: Split or Merge Medium (WIP!!)",
    namespace: "https://rinsuki.net",
    grant: "none",
    match: [
        "https://*.musicbrainz.org/release/*/edit",
        "https://*.musicbrainz.org/release/add",
    ],
    includeContributionURL: false, // still wip
})

function main() {
    const MB = window.MB
    if (MB == null) return
    if (!isMBWithReleaseEditor(MB)) return

    const tracklist = document.getElementById("tracklist")
    if (tracklist == null) return

    const splitButton = document.createElement("button")
    splitButton.textContent = "Split Medium"
    splitButton.addEventListener("click", () => {
        if (MB.releaseEditor.rootField.release().mediums().length < 2) {
            alert("There must be at least 2 mediums to split (src and dst).")
            return
        }
        const srcMediumIndex = prompt(
            [
                "Choose source medium:",
                "",
                ...Array.from(MB.releaseEditor.rootField.release().mediums().map((m, i) => [
                    `${i + 1}: `,
                    m.name(),
                    ` (${m.tracks().length} tracks)`
                ].join("")))
            ].join("\n")
        )
        if (srcMediumIndex == null) return
        const index = parseInt(srcMediumIndex, 10) - 1
        if (isNaN(index) || index < 0 || index >= MB.releaseEditor.rootField.release().mediums().length) {
            alert("Invalid medium index.")
            return
        }
        const srcMedium = MB.releaseEditor.rootField.release().mediums()[index]
        
        const dstMediumIndex = prompt([
            "Choose destination medium:",
            "",
            ...Array.from(MB.releaseEditor.rootField.release().mediums().map((m, i) => [
                `${i + 1}: `,
                m.name(),
                ` (${m.tracks().length} tracks)`
            ].join("")))
        ].join("\n"))
        if (dstMediumIndex == null) return
        const dstIndex = parseInt(dstMediumIndex, 10) - 1
        if (isNaN(dstIndex) || dstIndex < 0 || dstIndex >= MB.releaseEditor.rootField.release().mediums().length) {
            alert("Invalid medium index.")
            return
        }
        const dstMedium = MB.releaseEditor.rootField.release().mediums()[dstIndex]

        const trackNumber = prompt([
            `Please enter the track number to move from "${srcMedium.position()}. ${srcMedium.name()}" to "${dstMedium.position()}. ${dstMedium.name()}".`,
            "",
            ...Array.from(srcMedium.tracks().map((t, i) => [
                `${i + 1}: `,
                t.name()
            ].join("")))
        ].join("\n"))

        if (trackNumber == null) return
        const trackIndex = parseInt(trackNumber, 10) - 1
        if (isNaN(trackIndex) || trackIndex < 0 || trackIndex >= srcMedium.tracks().length) {
            alert("Invalid track number.")
            return
        }

        dstMedium.tracks.unshift(
            ...srcMedium.tracks.splice(trackIndex)
        )
        alert("Moved!")
    })
    tracklist.insertAdjacentElement("afterbegin", splitButton)
}

main()