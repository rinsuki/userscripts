import { MastodonUser } from "../types"
import { User } from "./user"

export const List: React.FC<{type: "favourite" | "reblog", statusId: string}> = ({type, statusId}) => {
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