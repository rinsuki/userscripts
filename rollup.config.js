import fs from "fs"
import pluginTypescript from "@rollup/plugin-typescript"
import pluginNodeResolve from "@rollup/plugin-node-resolve"

const files = fs.readdirSync(__dirname+"/scripts")

export default files.map(file => {
    return {
        input: "./scripts/" + file + "/src/index.tsx",
        output: [{
            name: file+".user",
            file: __dirname+"/dist/" + file + ".user.js",
            banner: fs.readFileSync(`${__dirname}/scripts/${file}/banner.js`, { encoding: "utf-8" }),
            format: "iife",
        }],
        plugins: [
            pluginTypescript(),
            pluginNodeResolve({
                browser: true,
            }),
        ]
    }
})