import { compile } from "./compiler.js"
let component = `
VStack {
  Text("Hello from HastyUI!")
  HStack {
    Text(count)
  }
}
`

let jsx = compile(component)

console.log({ jsx })
