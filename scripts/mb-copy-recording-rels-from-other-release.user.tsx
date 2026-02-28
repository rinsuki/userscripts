/** @jsx h */
import { h } from "@rinsuki/dom-chef"
import { fetchOkOrThrow } from "./_common/fetch-ok-or-throw"
import { MediumT, RelationshipEditStatusT, ReleaseT } from "typedbrainz/types"
import { isReleaseRelationshipEditor } from "typedbrainz"

defineUserScript({
    name: "MB: [WIP] Copy Recording Relationships from Other Release",
    version: "0.1.0",
    grant: "none",
    namespace: "https://rinsuki.net",
    author: "rinsuki",
    match: [
        "https://*.musicbrainz.org/release/*/edit-relationships*"
    ],
    includeContributionURL: false, // since its wip
})

let abortController: AbortController | null = null

const elm = <div>
    <details style={{border: "1px solid #ccc", margin: "1em 0", padding: "0.5em"}} open>
        <summary style={{ marginBottom: "0.5em" }}>
            <h2 style={{display: "inline" }}>Copy Recording Relationships from Other Release</h2>
        </summary>
        <form action="javascript:" onSubmit={e => {
            e.preventDefault()
            const input = e.currentTarget.querySelector("input[type=text]") as HTMLInputElement
            if (input == null) return
            const mbid = (input.value.match(/(?:^|\/release\/)([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i) ?? [])[1]
            if (!mbid) {
                alert("Invalid MBID or URL")
                return
            }
            if (abortController) {
                abortController.abort()
            }

            abortController = new AbortController()
            fetchReleaseAndShowCopyUI(mbid, abortController, e.currentTarget).catch(err => {
                console.error(err)
                alert(err.message)
            })
        }}>
            <input type="text" placeholder="Release MBID or URL" size={40} />
            <input type="submit" value="Load" />
        </form>
    </details>
</div>

async function fetchReleaseAndShowCopyUI(mbid: string, ac: AbortController, form: HTMLFormElement) {
    const resRaw = await fetchOkOrThrow(`/ws/js/entity/${mbid}`).catch(e => { throw new Error(`failed to fetch release: ${e.message}`, { cause: e })})
    const resJSON: ReleaseT = await resRaw.json().catch(e => { throw new Error(`failed to fetch release (parsing json): ${e.message}`, { cause: e })})
    console.log(resJSON)

    const elm = <div>
        <h3>Copy from {resJSON.name}</h3>
        <form action="javascript:" onSubmit={e => {
            e.preventDefault()
            const input = e.currentTarget.querySelector("select")
            if (input == null) return
            const mediumid = parseInt(input.value, 10)
            if (!Number.isSafeInteger(mediumid)) {
                alert("Invalid medium ID")
                return
            }
            fetchMediumAndShowCopyUI(resJSON.gid, mediumid, ac, e.currentTarget).catch(err => {
                console.error(err)
                alert(err.message)
            })
        }}>
            {
                resJSON.mediums
                    ? <div>
                        <select size={Math.max(Math.min(2, resJSON.mediums?.length), 5)}>
                            {resJSON.mediums.map(medium => {
                                return <option value={medium.id}>{medium.position}. {medium.format?.name ?? "(unknown)"}{medium.name.length ? ": " + medium.name : ""}</option>
                            })}
                        </select>
                    </div>
                    : "(no mediums)"
            }
            <input type="submit" value="Load" />
        </form>
    </div>

    if (ac.signal.aborted) return
    form.nextElementSibling?.remove()
    form.insertAdjacentElement("afterend", elm)
    elm.querySelector("select")?.focus()
}

async function fetchMediumAndShowCopyUI(releasegid: string, mediumid: number, ac: AbortController, form: HTMLFormElement) {
    const resRaw = await fetchOkOrThrow(`/ws/js/medium/${mediumid}?inc=recordings+rels`).catch(e => { throw new Error(`failed to fetch medium: ${e.message}`, { cause: e })})
    const srcMedia: MediumT = await resRaw.json().catch(e => { throw new Error(`failed to fetch medium (parsing json): ${e.message}`, { cause: e })})

    const elm = <div>
        <button onClick={() => {
            if (MB == null) return
            const relEditor = MB.relationshipEditor
            if (MB.tree == null || !isReleaseRelationshipEditor(relEditor)) return
            const dstMedia = MB.tree.iterate(relEditor.state.mediums).toArray()[0]
            let copiedSomeRels = false
            for (let i=0; i<dstMedia[0].tracks!.length; i++) {
                const srcRec = srcMedia.tracks![i].recording!
                const dstRec = dstMedia[0].tracks![i].recording
                for (const rel of srcRec.relationships!) {
                    copiedSomeRels = true
                    relEditor.dispatch({
                        type: "update-relationship-state",
                        sourceEntity: dstRec,
                        oldRelationshipState: null,
                        newRelationshipState: {
                            _lineage: [],
                            _original: null,
                            editsPending: false,
                            _status: 1 as RelationshipEditStatusT,
                            entity0: rel.backward ? rel.target : dstRec,
                            entity1: rel.backward ? dstRec : rel.target,
                            entity0_credit: rel.entity0_credit,
                            entity1_credit: rel.entity1_credit,
                            begin_date: rel.begin_date,
                            end_date: rel.end_date,
                            ended: rel.ended,
                            attributes: MB.tree.fromDistinctAscArray(rel.attributes.map(attribute => {
                                const type = MB!.linkedEntities.link_attribute_type[attribute.type.gid]
                                return {
                                    ...attribute,
                                    type,
                                    typeID: type.id,
                                }
                            })),
                            id: relEditor.getRelationshipStateId(null),
                            linkTypeID: rel.linkTypeID,
                            linkOrder: rel.linkOrder,
                        },
                        batchSelectionCount: undefined,
                        creditsToChangeForSource: "",
                        creditsToChangeForTarget: "",
                    })
                }
            }
            if (copiedSomeRels) {
                let editNote = relEditor.state.editNoteField.value
                if (editNote.length) editNote += "\n"
                editNote += `Relationships Copied from https://musicbrainz.org/release/${releasegid}/disc/${srcMedia.position} (a.k.a. https://musicbrainz.org/medium/${srcMedia.gid} )`
                relEditor.dispatch({ type: "update-edit-note", editNote })
            }
        }}>Copy</button>
    </div>
    if (ac.signal.aborted) return
    form.nextElementSibling?.remove()
    form.insertAdjacentElement("afterend", elm)
}

document.querySelector("#content > div.tabs")?.insertAdjacentElement("afterend", elm)