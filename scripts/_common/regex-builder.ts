export function varname(capture?: true | string) {
    let source = "[A-Za-z_][A-Za-z_0-9]*"
    if (capture) {
        source = `(${typeof capture === "string" ? `?<${capture}>` : ""}${source})`
    }
    return { source }
}

export function REk(name: string): { source: string} {
    return { source: `\\k<${name}>`}
}

export function REttl(strings: TemplateStringsArray, ...args: ({source: string} | typeof varname|number)[]) {
    let regex = ""
    for (let i=0; i<strings.length; i++) {
        regex += RegExp.escape(strings[i])
        const arg = args[i]
        if (typeof arg === "function") {
            regex += varname().source
        } else if (typeof arg === "number") {
            regex += `\\${arg}`
        } else if (arg != null) {
            regex += arg.source
        }
    }
    return new RegExp(regex)
}

export function REparts(pre: RegExp | null, main: RegExp, post?: RegExp) {
    let regex = ""
    if (pre != null) {
        regex += `(?<=${pre.source})`
    }
    regex += main.source
    if (post != null) {
        regex += `(?=${post.source})`
    }
    return new RegExp(regex)
}