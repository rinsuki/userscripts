import { getReactFiber } from "#common/get-react-internals"
import { simpleEnumCheck } from "#common/simple-enum-check"
import { IncompleteArtistCreditT } from "typedbrainz/types"

defineUserScript({
    name: "MB: Split artist credit at selection",
    description: "Select text in \"Artist as credited:\" or \"Join phrase:\" field of Artist Credit Editor, then Press (Ctrl or Command) + S to Split!",
    namespace: "https://rinsuki.net",
    grant: "none",
    match: [
        "https://*.musicbrainz.org/*/edit",
        "https://*.musicbrainz.org/*/create",
    ],
    includeContributionURL: true,
})

const LOCALSTORAGE_KEY = "copiedArtistCredit"

type Props = {
    dispatch: (input: { type: "copy" | "paste" }) => void,
}

const RE_AC_ELEMENT_ID = /^ac-(?:source|[0-9]+)-(credited-as|join-phrase)-([0-9]+)$/

async function doing(props: Props) {
    const activeElement = document.activeElement as HTMLInputElement | null
    if (activeElement == null) throw new Error("failed to find selected element!")
    const matched = RE_AC_ELEMENT_ID.exec(activeElement.id)
    if (matched == null) throw new Error(`input id ${JSON.stringify(activeElement.id)} is not expected!`)
    const start = activeElement.selectionStart
    const end = activeElement.selectionEnd
    if (start == null || end == null) throw new Error(`empty selection`)
    const selectedString = activeElement.value.slice(start, end)
    
    localStorage.removeItem(LOCALSTORAGE_KEY)
    props.dispatch({ type: "copy" })
    await new Promise(r => requestIdleCallback(r))
    const iat: IncompleteArtistCreditT | null = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY)!)
    if (iat == null) throw new Error(`failed to take copied data!`)
    const type = simpleEnumCheck(["credited-as", "join-phrase"] as const, matched[1])
    const index = parseInt(matched[2], 10)

    {
        const obj = iat.names[index]
        const k = (type === "credited-as" ? obj.name : obj.joinPhrase).slice(start, end)
        if (k !== selectedString) throw new Error("desync! please retry")
    }
    
    const names = [...iat.names]
    if (type === "credited-as") {
        names.splice(index + 1, 0, {
            artist: null,
            joinPhrase: names[index].joinPhrase,
            name: names[index].name.slice(end),
        })
        names[index].joinPhrase = selectedString
        names[index].name = names[index].name.slice(0, start)
        names[index].artist = null
    } else {
        names.splice(index + 1, 0, {
            artist: null,
            joinPhrase: names[index].joinPhrase.slice(end),
            name: selectedString,
        })
        names[index].joinPhrase = names[index].joinPhrase.slice(0, start)
    }
    
    // remove last name if it is completely empty
    const lastName = names.at(-1)
    if (lastName != null && lastName.name.length === 0 && lastName.joinPhrase.length === 0 && lastName.artist == null) {
        names.pop()
    }

    localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({
        names,
    } satisfies IncompleteArtistCreditT))
    props.dispatch({ type: "paste" })
    await new Promise(r => requestIdleCallback(r))
}

function main() {
    document.addEventListener("keydown", e => {
        if (!(e.ctrlKey || e.metaKey)) return
        if (e.key !== "s") return
        e.preventDefault()
        const artistCreditBubble = document.querySelector("#artist-credit-bubble > form")
        if (artistCreditBubble == null) return alert("failed to find artist-credit-bubble")
        // it should be https://github.com/metabrainz/musicbrainz-server/blob/92c4954da859ecd9e594c70353e0188db4426de5/root/static/scripts/edit/components/ArtistCreditBubble.js#L215
        const old = localStorage.getItem(LOCALSTORAGE_KEY)
        const props = getReactFiber(artistCreditBubble)?.return?.memoizedProps as Props

        doing(props).finally(() => {
            if (old != null) localStorage.setItem(LOCALSTORAGE_KEY, old)
        }).catch(e => {
            console.error(e)
            alert(`Failed!\n\n${e}`)
        })
    })
}

main()