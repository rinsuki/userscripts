import React from "react"
import ReactDOM from "react-dom"

const sort = document.querySelector(".searchOption .sort.optionList")! as HTMLElement
sort.style.width="220px"
const originalSortList = sort.querySelector(".sortList")!

const links: {[key: string]: undefined | [string, boolean, HTMLElement]} = {}

for (const anchor of originalSortList.querySelectorAll("a")) {
    const sp = new URLSearchParams(anchor.search)
    const key = `${sp.get("sort")}:${sp.get("order")}`
    links[key] = [anchor.href, anchor.parentElement!.classList.contains("active"), anchor]
}

const Link: React.FC<{
    k: string,
}> = props => {
    let l = links[props.k]
    if (l == null) {
        originalSortList.querySelector("li.active")?.remove()
        return <a style={{padding: "4px", color: "#fff", background: "#999"}} className="active">{props.children}</a>
    } else {
        l[2].parentElement?.remove()
        return <a href={l[0]} style={{padding: "4px"}}>{props.children}</a>
    }
}

const Row: React.FC<{
    title: string,
    k: string,
    desc: string,
    asc: string,
}> = props => {
    return <tr>
        <td style={{textAlign: "right", padding: "4px"}}>{props.title}が</td>
        <td><Link k={props.k+":d"}>{props.desc}順</Link></td>
        <td><Link k={props.k+":a"}>{props.asc}順</Link></td>
    </tr>
}

const li = document.createElement("li")
ReactDOM.render(<table>
    <Row title="投稿日時" k="f" desc="新しい" asc="古い" />
    <Row title="再生数" k="v" desc="多い" asc="少ない" />
    <Row title="コメント数" k="r" desc="多い" asc="少ない" />
    <Row title="いいね数" k="likeCount" desc="多い" asc="少ない" />
    <Row title="マイリスト数" k="m" desc="多い" asc="少ない" />
    <Row title="コメント" k="n" desc="新しい" asc="古い" />
    <Row title="再生時間" k="l" desc="長い" asc="短い" />
</table>, li)
originalSortList.appendChild(li)