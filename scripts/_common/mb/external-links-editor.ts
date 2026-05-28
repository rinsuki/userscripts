import { LinksEditorActionT } from "typedbrainz/types"
import { getReactFiber } from "../get-react-internals"
import { MBWithReleaseEditor } from "./release-editor"

export function getStandaloneExternalLinksEditorDispatch(): undefined | ((action: LinksEditorActionT) => void) {
    const editorDom = document.getElementById("external-links-editor")
    if (editorDom == null) return
    const reactFiber = getReactFiber(editorDom)
    if (reactFiber == null) return
    const props = reactFiber.return?.memoizedProps
    if (props == null) return
    if ("dispatch" in props && props.dispatch instanceof Function) return (props.dispatch satisfies Function) as any
}

export async function addReleaseUrlRelationship(MB: MBWithReleaseEditor, url: string, linkTypeID: number) {
    const externalLinksEditorDispatch = getStandaloneExternalLinksEditorDispatch()
    if (externalLinksEditorDispatch == null) throw new TypeError("Failed to get external links editor dispatch")
    for (let tried = 0; tried < 10; tried++) {
        await new Promise(r => requestIdleCallback(r));
        link_loop: for (const link of MB.tree.iterate(MB.releaseEditor.externalLinksData() ?? MB.tree.empty)) {
            if (link.url === "") { // no url
                externalLinksEditorDispatch({
                    type: "handle-url-change",
                    rawUrl: url,
                    link,
                })
                break
            }
            if (link.rawUrl !== url) continue
            if (!link.isSubmitted && link.duplicateOf == null) {
                externalLinksEditorDispatch({
                    type: "submit-link",
                    link,
                })
                break
            }
            for (const rel of link.relationships) {
                if (rel.linkTypeID === linkTypeID) {
                    // DONE
                    if (rel.error?.blockMerge && link.duplicateOf != null) {
                        // 完全に duplicated なものを作ってしまった (がURL正規化の都合で検知できなかった) ものの後始末
                        externalLinksEditorDispatch({
                            type: "toggle-remove-link",
                            link,
                        })
                        return
                    }
                    return link
                }
                if (rel.linkTypeID == null) {
                    externalLinksEditorDispatch({
                        type: "set-type",
                        link,
                        relationship: rel,
                        linkTypeID,
                    })
                    break link_loop
                }
            }
            if (link.relationships.length) {
                // 一致するやつがなかった
                externalLinksEditorDispatch({
                    type: "add-relationship",
                    link,
                })
                break
            } else {
                console.log("awaiting", link)
                // ないならちょい待ち
            }
        }
    }
}
