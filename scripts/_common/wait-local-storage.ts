export function waitLocalStorage(key: string, check: (value: string | null) => boolean = (v) => v != null): Promise<void> {
    if (check(localStorage.getItem(key))) {
        return Promise.resolve()
    }
    return new Promise((resolve) => {
        const callback = (e: StorageEvent) => {
            if (e.key !== key) return
            if (!check(e.newValue)) return
            window.removeEventListener("storage", callback)
            resolve()
        }
        window.addEventListener("storage", callback)
    })
}

export function waitNextLocalStorage(key: string, cb: () => void): Promise<string | null> {
    return new Promise((resolve) => {
        const callback = (e: StorageEvent) => {
            if (e.key !== key) return
            window.removeEventListener("storage", callback)
            resolve(e.newValue)
        }
        window.addEventListener("storage", callback)
        cb()
    })
}