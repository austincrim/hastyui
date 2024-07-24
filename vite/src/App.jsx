import { useEffect, useState } from 'react'
import { format } from 'prettier'
import babel from 'prettier/plugins/babel.mjs'
import estree from 'prettier/plugins/estree.mjs'
import Component from './Component.hsty'
import source from './Component.hsty?raw'
import { compile } from '../../compiler/compiler.js'

export function App() {
  let compiled = compile(source)
  let [formatted, setFormatted] = useState('')
  useEffect(() => {
    format(compiled, {
      parser: 'babel',
      plugins: [babel, estree],
    }).then((f) => setFormatted(f))
  })
  return (
    <main className="mx-auto max-w-3xl mt-12 px-4">
      <p>Source</p>
      <pre className="mt-2 border rounded-md p-2 bg-gray-50 mb-10">
        {source}
      </pre>
      <p>Compiled</p>
      <pre className="mt-2 border rounded-md p-2 bg-gray-50 mb-10 overflow-x-auto">
        {formatted}
      </pre>
      <p>Rendered</p>
      <Component />
    </main>
  )
}
