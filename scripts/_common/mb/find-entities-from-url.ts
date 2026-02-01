import { LinkedEntitiesT } from "typedbrainz/types"
import { z } from "zod"

const entityTypes = {
    label: {
        inc: "label-rels",
        scheme: z.object({
            label: z.object({
                id: z.string(),
            })
        }).transform(d => ({target: d.label.id})),
    }
} as const

export async function findEntitiesFromUrl<K extends keyof typeof entityTypes>(type: K, urls: string[]): Promise<Map<string, LinkedEntitiesT[K][keyof LinkedEntitiesT[K]][]>> {
    if (urls.length === 0) return new Map()
    const entityType = entityTypes[type]

    const apiUrl = new URL("/ws/2/url?fmt=json&inc=" + entityType.inc, location.href)
    for (const url of urls) {
        apiUrl.searchParams.append("resource", url)
    }
    const res = await fetch(apiUrl.href)
    if (res.status === 404) return new Map()
    const data = await res.json()
    const parsed = z.array(z.object({
        resource: z.string(),
        relations: z.array(z.object({}).and(entityType.scheme)),
    })).parse("urls" in data ? data.urls : [data])

    const ids = Array.from(new Set<string>(
        parsed
            .flatMap(p => p.relations)
            .map(r => r.target)
    ))

    const jsApi: {
        results: Record<string, LinkedEntitiesT[K][keyof LinkedEntitiesT[K]]>
    } = await fetch(`/ws/js/entities/${type}/${ids.join("+")}`).then(r => r.json())

    return new Map<string, LinkedEntitiesT[K][keyof LinkedEntitiesT[K]][]>(
        urls.map(url => {
            const p = parsed.filter(p => p.resource === url)
            const entities = p
                .flatMap(p => p.relations)
                .map(r => jsApi.results[r.target])
            return [url, entities]
        })
    )
}
