import { useEffect, useState } from "react"
import { format } from "prettier"
import babel from "prettier/plugins/babel.mjs"
import estree from "prettier/plugins/estree.mjs"
import Component from "./Component.hsty"
import source from "./Component.hsty?raw"
import { compile } from "../../compiler/compiler.js"

export function App() {
  let compiled = compile(source)
  let [formatted, setFormatted] = useState("")
  useEffect(() => {
    format(compiled, {
      parser: "babel",
      plugins: [babel, estree]
    }).then((f) => setFormatted(f))
  })
  return (
    <main className="mx-auto max-w-5xl mt-6 p-4">
      <div className="flex gap-12">
        <div>
          <h2 className="font-bold">Source</h2>
          <pre className="mt-2 border rounded-md p-2 bg-gray-50 mb-10">
            {source}
          </pre>
        </div>
        <div>
          <h2 className="font-bold mb-2">Rendered</h2>
          <Component />
        </div>
      </div>
      <h2 className="font-bold">Compiled</h2>
      <pre className="mt-2 border rounded-md p-2 bg-gray-50 mb-10 overflow-x-auto">
        {formatted}
      </pre>
    </main>
  )
}
