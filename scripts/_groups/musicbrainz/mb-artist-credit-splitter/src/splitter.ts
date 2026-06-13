export function splitCredit(input: string) {
    const RE = /([ 　]*((?:CV|cv)[.:．：] *|[\(（]((?:CV|cv)[.:．：] *)?(?=[^)]{3,})|(?<=[^(]{3})[\)）]\/?|[、,\/／［］\[\]]|(?: & |＆)| feat[.: ．：　] *)[ 　]*)+/g
    const splittedCredits = [] as [string, string][]
    let lastIndex = 0
    for (const match of input.matchAll(RE)) {
        splittedCredits.push([input.slice(lastIndex, match.index), match[0]])
        lastIndex = match.index! + match[0].length
    }
    if (input.slice(lastIndex).length > 0) splittedCredits.push([input.slice(lastIndex), ""])
    return splittedCredits
}