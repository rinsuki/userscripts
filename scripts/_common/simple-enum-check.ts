export function simpleEnumCheck<A extends [string, ...string[]]>(cases: A, input: string): A[number] {
    if (cases.includes(input)) return input as A[number]
    throw new Error(`${JSON.stringify(input)} isn't our cases (${JSON.stringify(cases)})`)
}