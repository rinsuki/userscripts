import { isReleaseRelationshipEditor } from "typedbrainz"
import { zSeedJSON, zSeedJSONFallback } from "./schema"
import { applyRelationships, PreparedRelationship } from "./apply-relationships"

defineUserScript({
    name: "MusicBrainz: Seed URLs to Release Recordings",
    namespace: "https://rinsuki.net",
    version: "0.2.1",
    description: "Import recording-url relationship to release's recordings.",
    author: "rinsuki",
    match: [
        "https://musicbrainz.org/release/*/edit-relationships",
        "https://*.musicbrainz.org/release/*/edit-relationships",
    ],
    grant: "none",
    includeContributionURL: true,
})

async function main() {
    // check hash
    const urlParams = new URLSearchParams(location.hash.slice(1))
    const rawJson = urlParams.get("seed-urls-v1")
    if (rawJson == null) return
    while (window.MB?.relationshipEditor?.state == null) {
        console.log("Waiting for window.MB.relationshipEditor?.state to be defined...")
        await new Promise(resolve => setTimeout(resolve, 100))
    }
    console.log("!", window.MB.relationshipEditor)
    if (!isReleaseRelationshipEditor(window.MB.relationshipEditor)) {
        return
    }

    const { linkedEntities, relationshipEditor } = window.MB
    const button = document.createElement("button")
    button.textContent = "Seed URLs to Recordings"
    button.style.zoom = "2"
    button.addEventListener("click", () => {
        const anyJSON = JSON.parse(rawJson)
        const baseJSON = zSeedJSONFallback.parse(anyJSON)
        if (![1, 2].includes(baseJSON.version)) {
            alert(`Unsupported version: ${baseJSON.version}, please update the script (or contact the seeder's developer)`)
            return
        }
        const json = zSeedJSON.parse(anyJSON)
        const errors: string[] = []
        const preparedRelationships: PreparedRelationship[] = []
        for (const track of relationshipEditor.state.entity.mediums.flatMap(m => m.tracks ?? [])) {
            if (!(track.recording.gid in json.recordings)) continue
            const rels = json.recordings[track.recording.gid]
            delete json.recordings[track.recording.gid]

            const alreadyAddedDomains = new Set<string>()
            for (const rel of Array.isArray(rels) ? rels : [rels]) {
                const relUrl = new URL(rel.url)
                if (alreadyAddedDomains.has(relUrl.hostname)) {
                    errors.push(`You can't add multiple same domain URLs for a recording at once! URL: ${rel.url} Recording: ${track.recording.gid}`)
                    continue
                }
                alreadyAddedDomains.add(relUrl.hostname)
                for (const relType of rel.types) {
                    let linkTypeID: number | undefined
                    if (relType in linkedEntities.link_type && linkedEntities.link_type[relType].type0 === "recording" && linkedEntities.link_type[relType].type1 === "url") {
                        linkTypeID = linkedEntities.link_type[relType].id
                    }
                    if (linkTypeID == null) {
                        for (const lt of Object.values(linkedEntities.link_type)) {
                            if (lt.type0 !== "recording") continue
                            if (lt.type1 !== "url") continue
                            console.log(lt)
                            if (lt.name === relType) {
                                linkTypeID = lt.id
                                break
                            }
                        }
                    }
                    if (linkTypeID == null) {
                        errors.push(`Failed to find link type ${JSON.stringify(relType)} for recording ${track.recording.gid}`)
                        continue
                    }
                    preparedRelationships.push({
                        recording: track.recording,
                        url: rel.url,
                        linkTypeID,
                    })
                }
            }
        }

        for (const remainingRecordingId of Object.keys(json.recordings)) {
            errors.push(`Failed to find recording: ${remainingRecordingId}, you might be need to expand mediums before press seed button.`)
        }

        if (errors.length === 0) {
            applyRelationships(preparedRelationships, json.note, relationshipEditor)
            button.textContent = "URLs seeded successfully!"
            button.disabled = true
        } else {
            alert("Failed to seed urls:\n" + errors.map(x => "* " + x).join("\n"))
        }
    })
    
    const before = document.querySelector("#content > p")!
    before.parentElement!.insertBefore(button, before)
    button.focus()
    console.log("done")
}

main()