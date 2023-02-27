import { getReactContainer } from "../../_common/get-react-internals";
import { inputToTextfield } from "../../_common/input-to-textfield";
import { waitDOMByObserve } from "../../_common/wait-dom";
import { waitLocalStorage } from "../../_common/wait-local-storage";
import { splitCredit } from "./splitter";

const LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT = "copiedArtistCredit";

(async () => {
    const bubble = await waitDOMByObserve(document.body, () => document.querySelector("#artist-credit-bubble"), { subtree: false });
    const buttons = await waitDOMByObserve(bubble, () => bubble.querySelector(".buttons"), { subtree: false });
    const button = document.createElement("button")
    button.type = "button"
    button.style.float = "left"
    button.textContent = "USERJS: Split Automatically"
    button.addEventListener("click", async () => {
        const container = getReactContainer(bubble)
        if (container == null) return alert("Failed to get React container")
        const tbody = bubble.querySelector("tbody")
        if (tbody == null) return alert("Failed to get tbody")
        const props = container.memoizedState.element.props as {
            artistCredit: {
                names: {
                    name: string,
                    joinPhrase: string,
                }[]
            },
            addName: () => void,
            copyArtistCredit: () => void,
            pasteArtistCredit: () => void,
        }
        console.log(props)
        const currentCredit = props.artistCredit.names.map(name => name.name + (name.joinPhrase ?? "")).join("")
        const splittedCredits = splitCredit(currentCredit)
        if (!confirm("次のように指定します。よろしいですか？\n\n" + JSON.stringify(splittedCredits, null, 4))) return
        for (let i=props.artistCredit.names.length; i<splittedCredits.length; i++) {
            props.addName()
            await waitDOMByObserve(tbody, () => tbody.childNodes.item(i), { subtree: false })
        }
        let i = 0
        // localStorage.removeItem(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT)
        // let p = waitLocalStorage(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT)
        // props.copyArtistCredit()
        // await p
        // const stubArtistCredit = JSON.parse(localStorage.getItem(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT)!)
        localStorage.setItem(LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT, JSON.stringify(splittedCredits.map(([name, joinPhrase], i) => {
            return {
                joinPhrase,
                name,
                // artist: {
                //     entityType: "artist",
                //     uniqueID: stubArtistCredit[i].artist.uniqueID,
                //     name,
                // }
            }
        })))
        props.pasteArtistCredit()
        alert("finish!")
    })
    buttons.appendChild(button)
})()
