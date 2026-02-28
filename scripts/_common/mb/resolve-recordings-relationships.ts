import { RecordingT } from "typedbrainz/types";

export async function resolveRecordingsRelationships(recordings: RecordingT[], parent: HTMLElement) {
    // とりあえず愚直な実装 (TODO: appearsOnを使ってmediumで引くとかもできるはず)
    const progressBar = document.createElement("progress")
    progressBar.max = recordings.length
    progressBar.value = 0
    parent.appendChild(progressBar)
    recordings.sort((a, b) => {
        if (a.relationships != null && b.relationships == null) return -1
        if (a.relationships == null && b.relationships != null) return 1
        return 0
    })
    for (const recording of recordings) {
        if (recording.relationships != null) {
            progressBar.value += 1
            continue
        }
        const res = await fetch("/ws/js/entity/" + recording.gid + "?inc=rels")
        if (!res.ok) {
            alert(`Failed to fetch recording ${recording.gid}: ${res.status} ${await res.text()}`)
        }
        const freshRecording = await res.json() as RecordingT
        Object.assign(recording, {
            relationships: freshRecording.relationships,
        })
        progressBar.value += 1
    }
    progressBar.remove()
}