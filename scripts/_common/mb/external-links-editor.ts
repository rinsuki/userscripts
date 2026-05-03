import { LinksEditorActionT } from "typedbrainz/types"
import { getReactFiber } from "../get-react-internals"

export function getStandaloneExternalLinksEditorDispatch(): undefined | ((action: LinksEditorActionT) => void) {
    const editorDom = document.getElementById("external-links-editor")
    if (editorDom == null) return
    const reactFiber = getReactFiber(editorDom)
    if (reactFiber == null) return
    const props = reactFiber.return?.memoizedProps
    if (props == null) return
    if ("dispatch" in props && props.dispatch instanceof Function) return (props.dispatch satisfies Function) as any
}
