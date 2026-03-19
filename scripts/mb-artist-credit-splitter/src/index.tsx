import { getReactProps } from "../../_common/get-react-internals";
import { getArtistCreditClipboard, setArtistCreditClipboard } from "../../_common/mb/artist-credit-clipboard";
import { waitDOMByObserve } from "../../_common/wait-dom";
import { splitCredit } from "./splitter";

defineUserScript({
    name: "MB: Artist Credit Splitter",
    namespace: "https://rinsuki.net/",
    version: "1.0.2",
    description: "いい感じに MusicBrainz のアーティストクレジットを分割します (失敗することもあります)",
    author: "rinsuki",
    match: "https://*.musicbrainz.org/*",
    grant: "none",
    includeContributionURL: true,
});

async function whenBubbleHappens(bubble: HTMLElement) {
    const buttons = await waitDOMByObserve(bubble, () => bubble.querySelector(".buttons"), { subtree: false });
    const button = document.createElement("button")
    button.type = "button"
    button.style.float = "left"
    button.textContent = "USERJS: Split Automatically"
    button.addEventListener("click", async () => {
        const props = getReactProps(bubble) as {
            children: [{
                props: {
                    children: {
                        props: {
                            dispatch: (action: { type: "copy" | "paste"}) => void;
                        }
                    }
                }
            }]
        }
        console.log(props)
        if (props == null) return alert("Failed to get React container")
        const tbody = bubble.querySelector("tbody")
        if (tbody == null) return alert("Failed to get tbody")
        const dispatch = props.children[0].props.children.props.dispatch
        dispatch({ type: "copy" })
        await new Promise(resolve => requestAnimationFrame(resolve))
        const currentCredit = getArtistCreditClipboard()?.names.map(name => name.name + (name.joinPhrase ?? "")).join("") ?? ""
        const splittedCredits = splitCredit(currentCredit)
        if (!confirm("次のように指定します。よろしいですか？\n\n" + JSON.stringify(splittedCredits, null, 4))) return
        let i = 0
        // localStorage.removeItem(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT)
        // let p = waitLocalStorage(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT)
        // props.copyArtistCredit()
        // await p
        // const stubArtistCredit = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT)!)
        setArtistCreditClipboard({names: splittedCredits.map(([name, joinPhrase], i) => {
            return {
                joinPhrase,
                name,
                artist: null,
                // artist: {
                //     entityType: "artist",
                //     uniqueID: stubArtistCredit[i].artist.uniqueID,
                //     name,
                // }
            }
        })})
        dispatch({type: "paste" })
        alert("finish!")
    })
    buttons.appendChild(button)
}

const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
            if (!(node instanceof HTMLElement)) continue
            if (node.dataset.floatingUiPortal == null) continue
            const bubble = node.querySelector("#artist-credit-bubble")
            if (bubble != null && bubble instanceof HTMLElement) whenBubbleHappens(bubble)
        }
    }
})

observer.observe(document.body, { childList: true, subtree: false })
