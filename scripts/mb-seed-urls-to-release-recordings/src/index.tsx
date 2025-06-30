import { isReleaseRelationshipEditor } from "typedbrainz"
import type { RelationshipEditStatusT } from "typedbrainz/types"

declare var Zod: typeof import("zod")

const zSeedJSON = Zod.object({
    version: Zod.literal(1),
    recordings: Zod.record(
        Zod.string(), // recording id
        Zod.object({
            url: Zod.string().url(),
            types: Zod.array(Zod.string()), // link_type UUID
        }),
    ),
    note: Zod.string(),
}).or(Zod.object({
    version: Zod.literal(2),
    recordings: Zod.record(
        Zod.string(), // recording id
        Zod.array(Zod.object({ // NOTE: you cannot have multiple *same domain* URLs for a recording at once!
            url: Zod.string().url(),
            types: Zod.array(Zod.string()), // link_type UUID
        })),
    ),
    note: Zod.string(),
}))

const zSeedJSONFallback = Zod.object({
    version: Zod.number(),
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
        relationshipEditor.dispatch({
            type: "update-edit-note",
            editNote: (relationshipEditor.state.editNoteField.value + "\n" + json.note + "\n''Powered by \"" + GM_info.script.name + "\" script''").trim(),
        })
        for (const medium of relationshipEditor.state.entity.mediums) {
            console.log(medium)
            for (const track of medium.tracks ?? []) {
                console.log(track)
                if (track.recording.gid in json.recordings) {
                    const rels = json.recordings[track.recording.gid]
                    delete json.recordings[track.recording.gid]
                    const alreadyAddedDomains = new Set<string>()
                    for (const rel of Array.isArray(rels) ? rels : [rels]) {
                        const relUrl = new URL(rel.url)
                        if (alreadyAddedDomains.has(relUrl.hostname)) {
                            errors.push(`You can't add multiple same domain URLs for a recording at once! Skipped ${rel.url} for recording ${track.recording.gid}`)
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
                            // it will be marked as "incomplete" in the UI, but actually working?
                            // @see https://github.com/metabrainz/musicbrainz-server/blob/e214b4d3c13f7ee6b2eb2f9c186ecab310354a5b/root/static/scripts/relationship-editor/components/RelationshipItem.js#L153-L163
                            relationshipEditor.dispatch({
                                type: "update-relationship-state",
                                sourceEntity: track.recording,
                                oldRelationshipState: null,
                                newRelationshipState: {
                                    id: relationshipEditor.getRelationshipStateId(null),
                                    linkOrder: 0,
                                    linkTypeID,
                                    _lineage: ["added"],
                                    _original: null,
                                    _status: 1 as RelationshipEditStatusT,
                                    attributes: null,
                                    begin_date: null, // TODO: support?
                                    end_date: null, // TODO: support?
                                    editsPending: false,
                                    ended: false,
                                    entity0: track.recording,
                                    entity0_credit: "",
                                    entity1: {
                                        decoded: "",
                                        editsPending: false,
                                        entityType: "url",
                                        gid: "",
                                        name: rel.url,
                                        id: relationshipEditor.getRelationshipStateId(null),
                                        last_updated: null,
                                        href_url: "",
                                        pretty_name: "",
                                    },
                                    entity1_credit: "",
                                },
                                batchSelectionCount: undefined,
                                creditsToChangeForSource: "",
                                creditsToChangeForTarget: "",
                            })
                        }
                    }
                }
            }
        }

        for (const remainingRecordingId of Object.keys(json.recordings)) {
            errors.push(`Can't find ${remainingRecordingId}, skipped`)
        }

        if (errors.length === 0) {
            button.textContent = "URLs seeded successfully!"
            button.disabled = true
        } else {
            alert("URLs seeded, but with some errors:\n" + errors.map(x => "* " + x).join("\n"))
        }
    })
    
    const before = document.querySelector("#content > p")!
    before.parentElement!.insertBefore(button, before)
    button.focus()
    console.log("done")
}

main()