import { MastodonUser } from "../types"

export const User: React.FC<{user: MastodonUser}> = ({user}) => {
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