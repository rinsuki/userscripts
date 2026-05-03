// ==UserScript==
// @name            MB: Automatically Set Media Type by URL Relationships
// @description     Automatically set the media type based on the relationships of release's URL.
// @namespace       https://rinsuki.net
// @author          rinsuki
// @grant           none
// @match           https://*.musicbrainz.org/release/add*
// @match           https://*.musicbrainz.org/release/*/edit*
// @exclude-match   https://*.musicbrainz.org/release/*/edit-relationships*
// @run-at          document-idle
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

  const LINK_TYPE_GID_RELEASE_FREE_STREAMING = "08445ccf-7b99-4438-9f9a-fb9ac18099ee";
  const LINK_TYPE_GID_RELEASE_PAID_STREAMING = "320adf26-96fa-4183-9045-1f5f32f833cb";
  const LINK_TYPE_GID_RELEASE_PAID_DOWNLOAD = "98e08c20-8402-4163-8970-53504bb6a1e4";

  const MEDIUM_FORMAT_DIGITAL_RELEASE = "12";

  function isMBWithReleaseEditor(mb) {
      return mb.releaseEditor !== undefined;
  }

  const DIGITAL_MEDIA_TYPES = [
      LINK_TYPE_GID_RELEASE_FREE_STREAMING,
      LINK_TYPE_GID_RELEASE_PAID_DOWNLOAD,
      LINK_TYPE_GID_RELEASE_PAID_STREAMING,
  ];
  function estimateMediumType(MB) {
      for (const url of iterate(MB.releaseEditor.externalLinksData())) {
          for (const rel of url.relationships) {
              if (rel.linkTypeID == null)
                  continue;
              const gid = MB.linkedEntities.link_type[rel.linkTypeID]?.gid;
              if (DIGITAL_MEDIA_TYPES.includes(gid)) {
                  return MEDIUM_FORMAT_DIGITAL_RELEASE;
              }
          }
      }
  }
  function doIt(medium, type) {
      if (medium.formatID()?.length < 1) {
          medium.formatID(type);
      }
  }
  function main() {
      const MB = window.MB;
      if (!isMBWithReleaseEditor(MB))
          return console.log("You are not on the release editor page.");
      MB.releaseEditor.rootField.release().mediums.subscribe(m => {
          const type = estimateMediumType(MB);
          if (type == null)
              return;
          for (const medium of m) {
              doIt(medium, type);
          }
      });
      MB.releaseEditor.activeTabID.subscribe(tabID => {
          if (tabID !== "#tracklist")
              return;
          const type = estimateMediumType(MB);
          if (type == null)
              return;
          for (const medium of MB.releaseEditor.rootField.release().mediums()) {
              doIt(medium, type);
          }
      });
  }
  main();

})();
