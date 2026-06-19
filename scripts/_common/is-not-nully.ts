export function isNotNully<T>(input: T | null | undefined): input is T {
    return input != null
}
