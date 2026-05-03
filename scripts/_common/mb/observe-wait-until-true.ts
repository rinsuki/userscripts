import { Subscribable } from "knockout";

export async function observeWaitUntilNotNull<I, O>(
    value: Subscribable<I>,
    transform: (value: I) => O | null | undefined,
): Promise<O> {
    {
        const firstTry = transform(value())
        if (firstTry != null) return firstTry
    }
    return new Promise(resolve => {
        const observer = value.subscribe(value => {
            const transformed = transform(value)
            if (transformed != null) {
                observer.dispose()
                resolve(transformed)
            }
        })
    })
}
