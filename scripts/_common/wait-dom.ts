export function waitDOMByObserve<T>(root: Element, check: () => T | undefined | null, options: { subtree: boolean }): Promise<T> {
    const firstRes = check()
    if (firstRes != null) return Promise.resolve(firstRes)
    return new Promise(resolve => {
        const observer = new MutationObserver(() => {
            const res = check()
            if (res != null) {
                observer.disconnect()
                resolve(res)
            }
        })
        observer.observe(root, {
            childList: true,
            subtree: options.subtree
        })
    })
}