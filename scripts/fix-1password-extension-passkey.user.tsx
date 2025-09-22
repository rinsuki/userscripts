defineUserScript({
    name: "1Password Extension Passkey Fix",
    namespace: "rinsuki.net",
    version: "1.0",
    match: ["https://accounts.nintendo.com/*"],
    grant: "none",
});

(() => {
    const origPublicKeyCredential = window.PublicKeyCredential
    window.PublicKeyCredential = new Proxy(origPublicKeyCredential, {
        get(...args) {
            if (args[1] === Symbol.hasInstance) {
                return (instance: unknown) => {
                    if (typeof instance !== "object") return false
                    if (instance == null) return false
                    if (!("type" in instance)) return false
                    if (instance.type !== "public-key") return false
                    if (!("id" in instance)) return false
                    if (typeof instance.id !== "string") return false
                    return true
                }
            }
            return Reflect.get(...args)
        }
    })
})()