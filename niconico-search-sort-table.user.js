// ==UserScript==
// @name        ニコニコ動画の検索のソート選択を表にする
// @namespace   rinsuki.net
// @description ニコニコ動画の検索のソート順を選ぶところを表レイアウトにします。
// @match       https://www.nicovideo.jp/tag/*
// @match       https://www.nicovideo.jp/search/*
// @version     1.0
// @author      rinsuki
// @require     https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.production.min.js#sha256=c9486f126615859fc61ac84840a02b2efc920d287a71d99d708c74b2947750fe
// @require     https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.production.min.js#sha256=bc5b7797e8a595e365c1385b0d47683d3a85f3533c58d499659b771c48ec6d25
// ==/UserScript==

(function () {
    'use strict';

    const sort = document.querySelector(".searchOption .sort.optionList");
    sort.style.width = "220px";
    const originalSortList = sort.querySelector(".sortList");
    const links = {};
    for (const anchor of originalSortList.querySelectorAll("a")) {
        const sp = new URLSearchParams(anchor.search);
        const key = `${sp.get("sort")}:${sp.get("order")}`;
        links[key] = [anchor.href, anchor.parentElement.classList.contains("active"), anchor];
    }
    const Link = props => {
        var _a, _b;
        let l = links[props.k];
        if (l == null) {
            (_a = originalSortList.querySelector("li.active")) === null || _a === void 0 ? void 0 : _a.remove();
            return React.createElement("a", { style: { padding: "4px", color: "#fff", background: "#999" }, className: "active" }, props.children);
        }
        else {
            (_b = l[2].parentElement) === null || _b === void 0 ? void 0 : _b.remove();
            return React.createElement("a", { href: l[0], style: { padding: "4px" } }, props.children);
        }
    };
    const Row = props => {
        return React.createElement("tr", null,
            React.createElement("td", { style: { textAlign: "right", padding: "4px" } },
                props.title,
                "\u304C"),
            React.createElement("td", null,
                React.createElement(Link, { k: props.k + ":d" },
                    props.desc,
                    "\u9806")),
            React.createElement("td", null,
                React.createElement(Link, { k: props.k + ":a" },
                    props.asc,
                    "\u9806")));
    };
    const li = document.createElement("li");
    ReactDOM.render(React.createElement("table", null,
        React.createElement(Row, { title: "\u6295\u7A3F\u65E5\u6642", k: "f", desc: "\u65B0\u3057\u3044", asc: "\u53E4\u3044" }),
        React.createElement(Row, { title: "\u518D\u751F\u6570", k: "v", desc: "\u591A\u3044", asc: "\u5C11\u306A\u3044" }),
        React.createElement(Row, { title: "\u30B3\u30E1\u30F3\u30C8\u6570", k: "r", desc: "\u591A\u3044", asc: "\u5C11\u306A\u3044" }),
        React.createElement(Row, { title: "\u3044\u3044\u306D\u6570", k: "likeCount", desc: "\u591A\u3044", asc: "\u5C11\u306A\u3044" }),
        React.createElement(Row, { title: "\u30DE\u30A4\u30EA\u30B9\u30C8\u6570", k: "m", desc: "\u591A\u3044", asc: "\u5C11\u306A\u3044" }),
        React.createElement(Row, { title: "\u30B3\u30E1\u30F3\u30C8", k: "n", desc: "\u65B0\u3057\u3044", asc: "\u53E4\u3044" }),
        React.createElement(Row, { title: "\u518D\u751F\u6642\u9593", k: "l", desc: "\u9577\u3044", asc: "\u77ED\u3044" })), li);
    originalSortList.appendChild(li);

}());
