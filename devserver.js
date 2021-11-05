// @ts-check
const http = require("http")
const fs = require("fs")

http.createServer(async (req, res) => {
    if (req.method !== "GET") {
        res.writeHead(405)
        res.end()
        return
    }
    const path = new URL(req.url, `http://example.com`).pathname
    if (path === "/") {
        console.log("[DEVSERVER]", new Date().toISOString(), req.socket.remoteAddress, req.method, path)
        res.setHeader("Content-Type", "text/html")
        res.writeHead(200)
        res.write("<!DOCTYPE html><html lang=ja><h1>scripts</h1><ul>")
        for (const script of await fs.promises.readdir(__dirname+"/dist/")) {
            if (!script.endsWith(".user.js")) continue
            res.write(`<li><a href="/dist/${script}">${script}</a></li>`)
        }
        res.write("</ul><h1>simple-scripts</h1><ul>")
        for (const script of await fs.promises.readdir(__dirname+"/simple-scripts/")) {
            if (!script.endsWith(".user.js")) continue
            res.write(`<li><a href="/simple-scripts/${script}">${script}</a></li>`)
        }
        res.write("</ul>")
        res.end()
        return
    } else if (/^\/(dist|simple-scripts)\/[a-z0-9\.\-]+\.user\.js$/.test(path)) {
        const stat = await fs.promises.stat(__dirname+path)
        const etag = `"${stat.mtimeMs}"`
        if (req.headers["if-none-match"] === etag) {
            res.writeHead(304)
            res.end()
            return
        }
        console.log("[DEVSERVER]", new Date().toISOString(), req.socket.remoteAddress, req.method, path)
        res.setHeader("ETag", etag)
        res.setHeader("Content-Type", "application/javascript")
        fs.createReadStream(__dirname+path).pipe(res)
        return
    }
    console.log("[DEVSERVER]", new Date().toISOString(), req.socket.remoteAddress, req.method, path)
    res.setHeader("Content-Type", "text/plain")
    res.writeHead(404)
    res.write("Not Found")
    res.end()
}).listen(9191, "localhost", () => {
    console.log("listen at http://localhost:9191")
})