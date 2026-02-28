import { LINK_TYPE_GID_RELEASE_FREE_STREAMING, LINK_TYPE_GID_RELEASE_PAID_DOWNLOAD, LINK_TYPE_GID_RELEASE_PAID_STREAMING } from "./_common/mb/gid"
import { MEDIUM_FORMAT_DIGITAL_RELEASE } from "./_common/mb/medium-format-id"
import { type EditorMedium, type EditorRelease, isMBWithReleaseEditor, MBWithReleaseEditor } from "./_common/mb/release-editor"

defineUserScript({
    name: "MB: Automatically Set Media Type by URL Relationships",
    description: "Automatically set the media type based on the relationships of release's URL.",
    namespace: "https://rinsuki.net",
    author: "rinsuki",
    grant: "none",
    match: [
        "https://*.musicbrainz.org/release/add*",
        "https://*.musicbrainz.org/release/*/edit*"
    ],
    excludeMatch: [
        "https://*.musicbrainz.org/release/*/edit-relationships*"
    ],
    runAt: "document-idle",
    includeContributionURL: true,
})

const DIGITAL_MEDIA_TYPES = [
    LINK_TYPE_GID_RELEASE_FREE_STREAMING,
    LINK_TYPE_GID_RELEASE_PAID_DOWNLOAD,
    LINK_TYPE_GID_RELEASE_PAID_STREAMING,
]

function estimateMediumType(MB: MBWithReleaseEditor) {
    for (const url of MB.releaseEditor.externalLinks?.externalLinksEditorRef.current?.state.links ?? []) {
        if (url.type == null) continue
        const gid = MB.linkedEntities.link_type[url.type]?.gid
        if (DIGITAL_MEDIA_TYPES.includes(gid)) {
            return MEDIUM_FORMAT_DIGITAL_RELEASE
        }
    }
}

function doIt(medium: EditorMedium, type: string) {
    if (medium.formatID()?.length < 1) {
        medium.formatID(type)
    }
}

function main() {
    const MB = window.MB
    if (!isMBWithReleaseEditor(MB)) return console.log("You are not on the release editor page.")
    MB.releaseEditor.rootField.release().mediums.subscribe(m => {
        const type = estimateMediumType(MB)
        if (type == null) return
        for (const medium of m) {
            doIt(medium, type)
        }
    })
    MB.releaseEditor.activeTabID.subscribe(tabID => {
        if (tabID !== "#tracklist") return
        const type = estimateMediumType(MB)
        if (type == null) return
        for (const medium of MB.releaseEditor.rootField.release().mediums()) {
            doIt(medium, type)
        }
    })
}

main()