// ==UserScript==
// @name        MB: Artist Credit Splitter
// @version     1.0.2
// @description いい感じに MusicBrainz のアーティストクレジットを分割します (失敗することもあります)
// @namespace   https://rinsuki.net/
// @author      rinsuki
// @match       https://musicbrainz.org/*
// @grant       none
// ==/UserScript==

(function () {
    'use strict';

    function getReactContainer(elem) {
        const properties = Object.getOwnPropertyNames(elem);
        const name = properties.find(x => x.startsWith("__reactContainer$"));
        if (name != null)
            return elem[name];
    }

    function waitDOMByObserve(root, check, options) {
        const firstRes = check();
        if (firstRes != null)
            return Promise.resolve(firstRes);
        return new Promise(resolve => {
            const observer = new MutationObserver(() => {
                const res = check();
                if (res != null) {
                    observer.disconnect();
                    resolve(res);
                }
            });
            observer.observe(root, {
                childList: true,
                subtree: options.subtree
            });
        });
    }

    const LOCALSTORAGE_KEY_COPIED_ARTIST_CREDIT = "copiedArtistCredit";
    (async () => {
        const bubble = await waitDOMByObserve(document.body, () => document.querySelector("#artist-credit-bubble"), { subtree: false });
        const buttons = await waitDOMByObserve(bubble, () => bubble.querySelector(".buttons"), { subtree: false });
        const button = document.createElement("button");
        button.type = "button";
        button.style.float = "left";
        button.textContent = "USERJS: Split Automatically";
        button.addEventListener("click", async () => {
            const container = getReactContainer(bubble);
            if (container == null)
                return alert("Failed to get React container");
            const tbody = bubble.querySelector("tbody");
            if (tbody == null)
                return alert("Failed to get tbody");
            const props = container.memoizedState.element.props;
            console.log(props);
            const currentCredit = props.artistCredit.names.map(name => name.name + name.joinPhrase).join("");
            const RE = /([ 　]*(CV[.:．：] *|\((CV[.:．：] *)?(?=[^)]{3,})|(?<=[^(]{3})\)\/?|、| [&＆] |[\/／]| feat[.: ．：　] *)[ 　]*)+/g;
            let splittedCredits = [];
            let lastIndex = 0;
            for (const match of currentCredit.matchAll(RE)) {
                splittedCredits.push([currentCredit.slice(lastIndex, match.index), match[0]]);
                lastIndex = match.index + match[0].length;
            }
            if (currentCredit.slice(lastIndex).length > 0)
                splittedCredits.push([currentCredit.slice(lastIndex), ""]);
            if (!confirm("次のように指定します。よろしいですか？\n\n" + JSON.stringify(splittedCredits, null, 4)))
                return;
            for (let i = props.artistCredit.names.length; i < splittedCredits.length; i++) {
                props.addName();
                await waitDOMByObserve(tbody, () => tbody.childNodes.item(i), { subtree: false });
            }
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
                };
            })));
            props.pasteArtistCredit();
            alert("finish!");
        });
        buttons.appendChild(button);
    })();

}());
