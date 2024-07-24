/**
 * based on Jamie Kyle's [the-super-tiny-compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)
 *
 * TODOs:
 * handle
 * `struct SomeComponent {
 *  var body : some View {
 *
 *  }
 * }`
 */
export function compile(code) {
  let tokens = tokenize(code)
  let ast = parse(tokens)
  let newAst = transformer(ast)
  let output = generator(newAst)
  return output
}

function tokenize(code) {
  let current = 0
  let tokens = []

  while (current < code.length) {
    let char = code[current]

    if (char === "{") {
      tokens.push({
        type: "bracket",
        value: "{"
      })

      current++
      continue
    }

    if (char === "}") {
      tokens.push({
        type: "bracket",
        value: "}"
      })

      current++
      continue
    }

    if (char === "(") {
      tokens.push({
        type: "paren",
        value: "("
      })

      current++
      continue
    }

    if (char === ")") {
      tokens.push({
        type: "paren",
        value: ")"
      })

      current++
      continue
    }

    let WHITESPACE = /\s/
    if (WHITESPACE.test(char)) {
      current++
      continue
    }

    if (char === '"') {
      let value = ""
      // skip opening quote
      char = code[++current]

      while (char !== '"') {
        value += char
        char = code[++current]
      }

      // skip closing quote
      char = code[++current]

      tokens.push({ type: "string", value })
      continue
    }

    let LETTERS = /[a-z]/i
    if (LETTERS.test(char)) {
      let value = ""

      while (LETTERS.test(char)) {
        value += char
        char = code[++current]
      }

      tokens.push({ type: "name", value })
      continue
    }

    let NUMBERS = /[0-9]/
    if (NUMBERS.test(char)) {
      let value = ""

      while (NUMBERS.test(char)) {
        value += char
        char = code[++current]
      }

      tokens.push({ type: "number", value })
      continue
    }

    if (char === "@") {
      // skip @
      char = code[++current]
      let value = ""

      while (LETTERS.test(char)) {
        value += char
        char = code[++current]
      }

      tokens.push({ type: "directive", value })
      continue
    }

    if (char === "=") {
      tokens.push({ type: "operator", value: "=" })

      current++
      continue
    }

    throw new TypeError("I don't know this character: " + char)
  }

  return tokens
}

function parse(tokens) {
  let current = 0

  function walk() {
    let token = tokens[current]

    if (token.type === "string") {
      current++
      return {
        type: "StringLiteral",
        value: token.value
      }
    }

    if (token.type === "number") {
      current++
      return {
        type: "NumberLiteral",
        value: token.value
      }
    }

    if (token.type === "name") {
      // if name followed by bracket or paren
      if (
        isOpeningBracket(tokens[current + 1]) ||
        isOpeningParen(tokens[current + 1])
      ) {
        let node = {
          type: "CallExpression",
          name: token.value,
          params: []
        }
        // skip name
        token = tokens[++current]

        if (isOpeningParen(token)) {
          token = tokens[++current]
          while (
            token.type !== "paren" ||
            (token.type === "paren" && token.value !== ")")
          ) {
            node.params.push(walk())
            token = tokens[current]
          }
          current++

          return node
        }

        if (isOpeningBracket(token)) {
          token = tokens[++current]
          while (
            token.type !== "bracket" ||
            (token.type === "bracket" && token.value !== "}")
          ) {
            node.params.push(walk())
            token = tokens[current]
          }
          current++

          return node
        }
      } else {
        current++
        return {
          type: "Identifier",
          name: token.value
        }
      }
    }

    if (token.type === "directive") {
      if (token.value === "State") {
        let name = tokens[++current]
        // skip =
        current++
        let value = tokens[++current]

        current++
        return {
          type: "StateDeclaration",
          name: name.value,
          value: value.value
        }
      }
      throw new TypeError(`Unsupported directive: ${token}`)
    }

    throw new TypeError(
      `I don't understand this token: ${token.type}: ${token.value}`
    )
  }

  let ast = {
    type: "Program",
    body: []
  }

  while (current < tokens.length) {
    ast.body.push(walk())
  }

  console.log(JSON.stringify(ast, null, 2))

  return ast
}

function traverser(ast, visitor) {
  function traverseArray(array, parent) {
    array.forEach((child) => {
      traverseNode(child, parent)
    })
  }
  function traverseNode(node, parent) {
    let methods = visitor[node.type]

    if (methods && methods.enter) {
      methods.enter(node, parent)
    }

    switch (node.type) {
      case "Program": {
        traverseArray(node.body, node)
        break
      }
      case "CallExpression": {
        traverseArray(node.params, node)
        break
      }
      case "StateDeclaration":
      case "NumberLiteral":
      case "StringLiteral":
      case "Identifier":
        break
      default:
        throw new TypeError(node.type)
    }

    if (methods && methods.exit) {
      methods.exit(node, parent)
    }
  }

  traverseNode(ast, null)
}

function transformer(ast) {
  let newAst = {
    type: "Program",
    body: []
  }
  ast._context = newAst.body

  traverser(ast, {
    NumberLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: "NumberLiteral",
          value: node.value
        })
      }
    },

    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: "StringLiteral",
          value: node.value
        })
      }
    },

    Identifier: {
      enter(node, parent) {
        parent._context.push({
          type: "Identifier",
          name: node.name
        })
      }
    },

    StateDeclaration: {
      enter(node, parent) {
        parent._context.push({
          type: "StateDeclaration",
          name: node.name,
          value: node.value
        })
      }
    },

    CallExpression: {
      enter(node, parent) {
        let expression = {
          type: "CallExpression",
          callee: {
            type: "Identifier",
            name: node.name
          },
          arguments: []
        }

        node._context = expression.arguments

        if (parent.type !== "CallExpression") {
          expression = {
            type: "ExpressionStatement",
            expression: expression
          }
        }

        parent._context.push(expression)
      }
    }
  })

  return newAst
}

const ComponentMap = {
  HStack: {
    tag: "div",
    attributes: `className='flex items-center'`
  },
  VStack: {
    tag: "div",
    attributes: `className='flex flex-col items-center'`
  },
  Text: {
    tag: "p"
  },
  Button: {
    tag: "button",
    attributes: `className='px-2 py-1 border'`
  }
}
function generator(node, context = {}) {
  switch (node.type) {
    case "Program": {
      let states = node.body.filter((n) => n.type === "StateDeclaration")
      if (states.length > 0) {
        return `
import {useState} from 'react'
export default function Component() {
    ${states.map(generator).join("\n")}
    return (
      ${node.body
        .filter((n) => n.type !== "StateDeclaration")
        .map((n) => generator(n, { inRender: true }))
        .join("\n")}
    )
  }`
      }
      return `export default function Component() {
  return (
    ${node.body.map((n) => generator(n, { inRender: true })).join("\n")}
  )
}`
    }

    case "ExpressionStatement": {
      return generator(node.expression, context)
    }

    case "StateDeclaration": {
      let name = node.name
      let capitalized = name[0].toUpperCase() + name.slice(1)
      let def = node.value

      return `const [${name}, set${capitalized}] = useState(${def})`
    }

    case "CallExpression": {
      let comp = ComponentMap[node.callee.name]
      if (!comp) throw new TypeError("no component defined for " + node.callee)

      return `<${
        comp.tag + (comp.attributes ? " " + comp.attributes : "")
      }>${node.arguments.map((n) => generator(n, context)).join("")}</${
        comp.tag
      }>`
    }

    case "Identifier":
      return context.inRender ? `{${node.name}}` : node.name

    case "NumberLiteral":
    case "StringLiteral":
      return node.value

    default:
      throw new TypeError(node.type)
  }
}

function isOpeningParen(node) {
  return node.type === "paren" && node.value === "("
}
function isOpeningBracket(node) {
  return node.type === "bracket" && node.value === "{"
}
