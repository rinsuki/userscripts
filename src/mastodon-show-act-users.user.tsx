// ==UserScript==
// @name          Mastodon Show act users in /@xxx/12345
// @namespace     https://rinsuki.net
// @version       0.3.0
// @description   Mastodonの投稿詳細画面でBT/favしたユーザー一覧を見れるようにする
// @author        rinsuki
// @include       /^https:\/\/[^/]*\/@[A-Za-z0-9_]+\/[0-9]+([?#].*)?$/
// @exclude-match https://*/@*/*/embed
// @exclude-match https://*.tiktok.com/*
// @require       https://cdn.jsdelivr.net/npm/react@16.13.1/umd/react.production.min.js#sha256=c9486f126615859fc61ac84840a02b2efc920d287a71d99d708c74b2947750fe
// @require       https://cdn.jsdelivr.net/npm/react-dom@16.13.1/umd/react-dom.production.min.js#sha256=bc5b7797e8a595e365c1385b0d47683d3a85f3533c58d499659b771c48ec6d25
// ==/UserScript==

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
    const boostButton = parent(document.querySelector('a[href^="/interact/"] > .fa-retweet'))
    const favButton = parent(document.querySelector('a[href^="/interact/"] > .detailed-status__favorites'))
    const isNicoru = favButton && favButton.querySelector(".fa-nicoru--status")

    // ReactでUIを作る

    interface MastodonUser {
        id: string
        display_name: string
        acct: string
        url: string
        avatar_static: string
    }

    const SectionHeader: React.FC<{icon: string, name: string}> = ({icon, name}) => {
        return <div style={{
            backgroundColor: document.body.style.backgroundColor || "#17191f",
            fontSize: 16,
            padding: 15,
            color: "white",
        }}>
            <i className={`fa fa-${icon}`} style={{marginRight: 5}}/>
            {name}
        </div>
    }

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
                <List type={active} key={active}/>
            </div>
            <SectionHeader icon="reply" name="返信" />
        </div>
    }

    const List: React.FC<{type: "favourite" | "reblog"}> = ({type}) => {
        const [loading, setLoading] = React.useState(false)
        const [users, setUsers] = React.useState<MastodonUser[]>([])
        const [error, setError] = React.useState<Error | undefined>(undefined)

        React.useEffect(() => ((async () => {
            setLoading(true)
            try {
                const res = await fetch(`${location.origin}/api/v1/statuses/${statusId}/${type === "favourite" ? "favourited_by" : "reblogged_by"}`)
                const text = await res.text()
                try {
                    const json = JSON.parse(text)
                    const error = json.error
                    if (error) throw new Error(`API: ${error}`)
                    setError(undefined)
                    setUsers(json)
                } catch(e) {
                    throw new Error(`HTTP ${res.status} ${res.statusText} - ${text}`)
                }
            } catch(e) {
                console.log(e)
                setError(e)
            } finally {
                setLoading(false)
            }
        })(), undefined), [])

        const centeringStyle: React.CSSProperties = {
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            padding: "30px 15px"
        }
        if (error) {
            return <div style={centeringStyle}>
                <span style={{color: "hsl(0, 100%, 60%)", whiteSpace: "pre-wrap"}}>
                    {error.stack}
                </span>
            </div>
        } else if (loading) {
            return <div style={centeringStyle}>
                <span>Loading...</span>
            </div>
        } else {
            return <div>
                {users.map(user => <User user={user} key={user.id}/>)}
            </div>
        }
    }

    const User: React.FC<{user: MastodonUser}> = ({user}) => {
        return <div style={{backgroundColor: "#282c37", marginBottom: 1, display: "flex"}}>
            <a href={user.url} style={{padding: 10, display: "flex", textDecoration: "none"}}>
                <img src={user.avatar_static} style={{width: 36, height: 36, paddingRight: 10}}/>
                <div style={{flex: 1, display: "flex", flexDirection: "column"}}>
                    <bdi style={{flex: 1, color: "#ffffff"}}>{user.display_name}</bdi>
                    <span style={{flex: 1, color: "#ffffff9f"}}>@{user.acct}</span>
                </div>
            </a>
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