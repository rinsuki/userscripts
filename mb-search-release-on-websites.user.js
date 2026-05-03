// ==UserScript==
// @name            MusicBrainz: Search Release on Websites
// @namespace       https://rinsuki.net
// @match           https://*.musicbrainz.org/release/*/edit
// @match           https://*.musicbrainz.org/release/add
// @grant           none
// @version         1.1
// @author          rinsuki
// @contributionURL https://github.com/sponsors/rinsuki
// @homepageURL     https://github.com/rinsuki/userscripts
// @supportURL      https://github.com/rinsuki/userscripts/issues
// ==/UserScript==

(function () {
  'use strict';

  //#region node_modules/.pnpm/weight-balanced-tree@0.16.0/node_modules/weight-balanced-tree/src/utility/getSliceArgs.js
  // @flow strict

  /*::
  import type {ImmutableTree} from '../types.js';
  */

  function getSliceArgs(
    tree/*: ImmutableTree<mixed> */,
    start/*: number | void */,
    end/*: number | void */,
  )/*: {+actualStart: number, +actualEnd: number} */ {
    const size = tree.size;
    let actualStart = Math.trunc(+start);
    let actualEnd = end === undefined ? size : Math.trunc(+end);
    if (Number.isNaN(actualStart)) {
      actualStart = 0;
    }
    if (Number.isNaN(actualEnd)) {
      actualEnd = 0;
    }
    actualStart = actualStart < 0
      ? Math.max(size + actualStart, 0)
      : Math.min(actualStart, size);
    actualEnd = actualEnd < 0
      ? Math.max(size + actualEnd, 0)
      : Math.min(actualEnd, size);
    return {actualStart, actualEnd};
  }

  //#endregion

  //#region node_modules/.pnpm/weight-balanced-tree@0.16.0/node_modules/weight-balanced-tree/src/iterate.js
  // @flow strict


  function* iterate/*::<T>*/(
    tree/*: ImmutableTree<T>*/,
    start/*:: ?: number */ = 0,
    end/*:: ?: number */ = tree.size,
  )/*: Generator<T, void, void>*/ {
    const {actualStart, actualEnd} = getSliceArgs(tree, start, end);
    if (actualStart >= actualEnd) {
      return;
    }

    let stack/*: Stack<T> | null */ = null;
    let cursor/*: ImmutableTree<T>*/ = tree;
    let index = actualStart;

    while (cursor.size !== 0) {
      const leftSize = cursor.left.size;
      if (index < leftSize) {
        stack = {node: cursor, next: stack};
        cursor = cursor.left;
      } else if (index === leftSize) {
        break;
      } else {
        index -= (leftSize + 1);
        cursor = cursor.right;
      }
    }

    for (index = actualStart; index < actualEnd; index++) {
      /*:: invariant(cursor.size !== 0); */
      yield cursor.value;
      /*:: invariant(cursor.size !== 0); */
      cursor = cursor.right;
      while (cursor.size !== 0) {
        stack = {node: cursor, next: stack};
        cursor = cursor.left;
      }
      if (stack === null) {
        break;
      }
      cursor = stack.node;
      stack = stack.next;
    }
  }

  //#endregion

  function isMBWithReleaseEditor(mb) {
      return mb.releaseEditor !== undefined;
  }

  (async () => {
      const sites = Object.entries({
          "YouTube Music": {
              domains: ["music.youtube.com"],
              search: "https://music.youtube.com/search?q={query}",
              barcodeSearch: "https://music.youtube.com/search?q=\"{upc}\"",
          },
          "Spotify": {
              domains: ["open.spotify.com"],
              search: "https://open.spotify.com/search/{query}/albums",
              barcodeSearch: "https://open.spotify.com/search/upc:{upc}/albums",
          },
          "Apple Music": {
              domains: ["music.apple.com", "itunes.apple.com"],
              search: "https://music.apple.com/jp/search?term={query}",
          },
          "Apple Music (ISRCeam)": {
              domains: ["music.apple.com", "itunes.apple.com"],
              search: "https://isrceam.rinsuki.net/apple/jp/search?q={query}",
              barcodeSearch: "https://isrceam.rinsuki.net/apple/jp/upc?upc={upc}",
          },
          "OTOTOY": {
              domains: ["ototoy.jp"],
              search: "https://ototoy.jp/find/?q={query}",
          },
          "OTOTOY (Google)": {
              domains: ["ototoy.jp"],
              search: "https://www.google.com/search?client=firefox-b-d&q=site:ototoy.jp+{query}",
          },
          "mora": {
              domains: ["mora.jp"],
              search: "https://mora.jp/search/top?keyWord={query}",
          },
          "Qobuz": {
              domains: ["www.qobuz.com"],
              search: "https://www.qobuz.com/jp-ja/search/albums/{query}",
          },
          "TIDAL": {
              domains: ["tidal.com"],
              search: `https://tidal.com/search/albums?q={query}`,
          },
          "Google": {
              domains: [],
              search: "https://www.google.com/search?client=firefox-b-d&q={query}",
          }
      }).map(e => ({ ...e[1], name: e[0] }));
      let externalLinkEditor;
      while (null == (externalLinkEditor = document.getElementById("external-links-editor"))) {
          await new Promise(r => setTimeout(r, 100));
      }
      const MB = (() => {
          const MB = window.MB;
          if (!isMBWithReleaseEditor(MB))
              throw new Error("window.MB is not ready");
          return MB;
      })();
      const linkList = document.createElement("ul");
      function refresh() {
          linkList.innerHTML = "";
          const links = Array.from(iterate(MB.releaseEditor.externalLinksData()));
          for (const site of sites) {
              let exists = false;
              for (const link of links) {
                  if (link.url === "")
                      continue;
                  const domain = new URL(link.url).hostname;
                  if (site.domains.includes(domain)) {
                      exists = true;
                      break;
                  }
              }
              const link = document.createElement("a");
              if (exists) {
                  link.style.opacity = "0.5";
              }
              const barcodeInput = document.querySelector("input#barcode");
              if (barcodeInput && barcodeInput.value.length > 4 && site.barcodeSearch != null) {
                  // seems barcode
                  const link2 = document.createElement("a");
                  if (exists) {
                      link2.style.opacity = "0.5";
                  }
                  link2.href = site.barcodeSearch.replace("{upc}", encodeURIComponent(barcodeInput.value));
                  link2.textContent = `Search on ${site.name} (by barcode)`;
                  link2.target = "_blank";
                  link2.style.marginRight = "1em";
                  const li2 = document.createElement("li");
                  li2.appendChild(link2);
                  linkList.appendChild(li2);
              }
              const nameInput = document.querySelector(`input#name`);
              if (!nameInput)
                  continue;
              link.href = site.search.replace("{query}", encodeURIComponent(nameInput.value));
              link.textContent = `Search on ${site.name}`;
              link.target = "_blank";
              link.style.marginRight = "1em";
              const li = document.createElement("li");
              li.appendChild(link);
              linkList.appendChild(li);
          }
          const button = document.createElement("button");
          button.textContent = "Refresh";
          button.onclick = refresh;
          const li = document.createElement("li");
          li.appendChild(button);
          linkList.appendChild(li);
      }
      externalLinkEditor.parentElement?.parentElement?.appendChild(linkList);
      refresh();
      MB.releaseEditor.rootField.release().name.subscribe(() => refresh());
      MB.releaseEditor.rootField.release().barcode.value.subscribe(() => refresh());
      MB.releaseEditor.externalLinksData.subscribe(() => refresh());
  })();

})();
