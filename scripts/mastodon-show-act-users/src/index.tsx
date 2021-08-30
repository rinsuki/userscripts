import { List } from "./components/list"
import { SectionHeader } from "./components/section-header"

(function() {
    'use strict';

    // Mastodonかどうかを確かめる
    const regex = /^\/@[A-Za-z0-9_]+\/(\d+)/
    const matchedUrl = regex.exec(location.pathname)
    if (matchedUrl == null) return // URLがそれっぽくない
    // これログインしてるとひっかかることに気づいたので無効化
    // if (document.querySelector('a[href="https://joinmastodon.org/#getting-started"]') == null) return // Mastodonっぽくなさそう
    if (document.querySelector('a[href^="/interact/"]') == null) return // 新しいMastodonを使え

    const statusId = matchedUrl[1]

    const statusMetaDiv = document.querySelector(".detailed-status__meta")
    if (statusMetaDiv == null) return // UIを出すところがないので帰る
    const boostButton = parent(document.querySelector('a[href^="/interact/"] > .detailed-status__reblogs'))
    const favButton = parent(document.querySelector('a[href^="/interact/"] > .detailed-status__favorites'))
    const isNicoru = favButton && favButton.querySelector(".fa-nicoru--status")

    // ReactでUIを作る

    const Root: React.FC = () => {
        const [active, setActive] = React.useState<"favourite" | "reblog" | undefined>(undefined)
        React.useEffect(() => {
            if (boostButton) {
                boostButton.addEventListener("click", e => {
                    e.preventDefault()
                    e.stopPropagation()
                    setActive("reblog")
                })
            }
            if (favButton) {
                favButton.addEventListener("click", e => {
                    e.preventDefault()
                    e.stopPropagation()
                    setActive("favourite")
                })
            }
        }, [])
        if (active == null) return <div>
            <i className="fa fa-retweet" /> か {isNicoru ? <i className="fa fa-nicoru--status" /> : <i className="fa fa-star" />} をクリックするとブーストした/ふぁぼったユーザーが表示されます
        </div>
        const [name, icon] = ({
            "favourite": isNicoru ? ["ニコる", "nicoru"] : ["ふぁぼ", "star"],
            "reblog": ["ブースト", "retweet"]
        } as const)[active]
        return <div style={{margin: "15px -15px -15px"}}>
            <SectionHeader icon={icon} name={name} />
            <div>
                <List type={active} key={active} statusId={statusId}/>
            </div>
            <SectionHeader icon="reply" name="返信" />
        </div>
    }

    function parent(dom: HTMLElement | null): HTMLElement | null {
        if (dom == null) return dom
        return dom.parentElement
    }
    // Reactをマウント
    const myDiv = document.createElement("div")
    const component = ReactDOM.render(<Root />, myDiv)
    statusMetaDiv.appendChild(myDiv)
})();