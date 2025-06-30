declare var Zod: typeof import("zod")

export const zSeedJSON = Zod.object({
    version: Zod.literal(1),
    recordings: Zod.record(
        Zod.string(), // recording id
        Zod.object({
            url: Zod.string().url(),
            types: Zod.array(Zod.string()), // link_type UUID
        }),
    ),
    note: Zod.string(),
}).or(Zod.object({
    version: Zod.literal(2),
    recordings: Zod.record(
        Zod.string(), // recording id
        Zod.array(Zod.object({ // NOTE: you cannot have multiple *same domain* URLs for a recording at once!
            url: Zod.string().url(),
            types: Zod.array(Zod.string()), // link_type UUID
        })),
    ),
    note: Zod.string(),
}))

export const zSeedJSONFallback = Zod.object({
    version: Zod.number(),
})