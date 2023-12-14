import Component from './Component.hsty'
import source from './Component.hsty?raw'
import { compile } from '../../compiler.js'

export function App() {
  const compiled = compile(source)
  return (
    <main className="mx-auto max-w-3xl mt-12 px-4">
      <pre className="border rounded-md p-2 bg-gray-50 mb-10">{source}</pre>
      <pre className="border rounded-md p-2 bg-gray-50 mb-10 overflow-x-auto">
        {compiled}
      </pre>
      <Component />
    </main>
  )
}
