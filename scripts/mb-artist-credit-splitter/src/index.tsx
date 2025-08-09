import { getReactContainer, getReactFiber, getReactProps } from "../../_common/get-react-internals";
import { inputToTextfield } from "../../_common/input-to-textfield";
import { waitDOMByObserve } from "../../_common/wait-dom";
import { waitLocalStorage, waitNextLocalStorage } from "../../_common/wait-local-storage";
import { splitCredit } from "./splitter";

const LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT = "copiedArtistCredit";

defineUserScript({
    name: "MB: Artist Credit Splitter",
    namespace: "https://rinsuki.net/",
    version: "1.0.2",
    description: "いい感じに MusicBrainz のアーティストクレジットを分割します (失敗することもあります)",
    author: "rinsuki",
    match: "https://musicbrainz.org/*",
    grant: "none",
    includeContributionURL: true,
});

(async () => {
    const bubble = await waitDOMByObserve(document.body, () => document.querySelector("#artist-credit-bubble"), { subtree: false });
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
        const currentCredit = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT) ?? "").names.map(name => name.name + (name.joinPhrase ?? "")).join("")
        const splittedCredits = splitCredit(currentCredit)
        if (!confirm("次のように指定します。よろしいですか？\n\n" + JSON.stringify(splittedCredits, null, 4))) return
        let i = 0
        // localStorage.removeItem(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT)
        // let p = waitLocalStorage(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT)
        // props.copyArtistCredit()
        // await p
        // const stubArtistCredit = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT)!)
        localStorage.setItem(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT, JSON.stringify({names: splittedCredits.map(([name, joinPhrase], i) => {
            return {
                joinPhrase,
                name,
                // artist: {
                //     entityType: "artist",
                //     uniqueID: stubArtistCredit[i].artist.uniqueID,
                //     name,
                // }
            }
        })}))
        dispatch({type: "paste" })
        alert("finish!")
    })
    buttons.appendChild(button)
})()
