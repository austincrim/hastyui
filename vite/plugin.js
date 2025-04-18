import { compile } from "../compiler/compiler"
import { transform } from "esbuild"

let extRegex = /\.(hsty)$/
export default function hasty() {
  /** @type {import('vite').Plugin} */
  let plugin = {
    name: "vite-plugin-hastyui",

    async transform(src, id) {
      if (extRegex.test(id)) {
        let jsx = compile(src)
        let js = await transform(jsx, {
          loader: "jsx",
          jsx: "automatic"
        })
        return {
          code: js.code
        }
      }
    }
  }

  return plugin
}
