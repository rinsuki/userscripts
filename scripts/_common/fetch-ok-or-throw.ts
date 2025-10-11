export class HTTPError extends Error {
    constructor(public response: Response, public text: string) {
        super(`HTTP-${response.status}: ${text}`)
    }
}

export async function fetchOkOrThrow(...args: Parameters<typeof fetch>): Promise<Response> {
    const res = await fetch(...args)
    if (!res.ok) {
        throw new HTTPError(res, await res.text())
    }
    return res
}