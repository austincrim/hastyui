/**
 * based on Jamie Kyle's [the-super-tiny-compiler](https://github.com/jamiebuilds/the-super-tiny-compiler)
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

    if (char === '{') {
      tokens.push({
        type: 'bracket',
        value: '{',
      })

      current++
      continue
    }

    if (char === '}') {
      tokens.push({
        type: 'bracket',
        value: '}',
      })

      current++
      continue
    }

    if (char === '(') {
      tokens.push({
        type: 'paren',
        value: '(',
      })

      current++
      continue
    }

    if (char === ')') {
      tokens.push({
        type: 'paren',
        value: ')',
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
      let value = ''
      char = code[++current]

      while (char !== '"') {
        value += char
        char = code[++current]
      }

      char = code[++current]

      tokens.push({ type: 'string', value })
      continue
    }

    let LETTERS = /[a-z]/i
    if (LETTERS.test(char)) {
      let value = ''

      while (LETTERS.test(char)) {
        value += char
        char = code[++current]
      }

      tokens.push({ type: 'name', value })
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

    if (token.type === 'string') {
      current++
      return {
        type: 'StringLiteral',
        value: token.value,
      }
    }

    if (
      token.type === 'name' &&
      (isOpeningBracket(tokens[current + 1]) ||
        isOpeningParen(tokens[current + 1]))
    ) {
      let node = {
        type: 'CallExpression',
        name: token.value,
        params: [],
      }
      token = tokens[++current]
      if (isOpeningParen(token)) {
        token = tokens[++current]
        while (
          token.type !== 'paren' ||
          (token.type === 'paren' && token.value !== ')')
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
          token.type !== 'bracket' ||
          (token.type === 'bracket' && token.value !== '}')
        ) {
          node.params.push(walk())
          token = tokens[current]
        }
        current++

        return node
      }
    }

    throw new TypeError(token.type)
  }

  let ast = {
    type: 'Program',
    body: [],
  }

  while (current < tokens.length) {
    ast.body.push(walk())
  }

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
      case 'Program': {
        traverseArray(node.body, node)
        break
      }
      case 'CallExpression': {
        traverseArray(node.params, node)
        break
      }
      case 'NumberLiteral':
      case 'StringLiteral':
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
    type: 'Program',
    body: [],
  }
  ast._context = newAst.body

  traverser(ast, {
    NumberLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'NumberLiteral',
          value: node.value,
        })
      },
    },

    StringLiteral: {
      enter(node, parent) {
        parent._context.push({
          type: 'StringLiteral',
          value: node.value,
        })
      },
    },

    CallExpression: {
      enter(node, parent) {
        let expression = {
          type: 'CallExpression',
          callee: {
            type: 'Identifier',
            name: node.name,
          },
          arguments: [],
        }

        node._context = expression.arguments

        if (parent.type !== 'CallExpression') {
          expression = {
            type: 'ExpressionStatement',
            expression: expression,
          }
        }

        parent._context.push(expression)
      },
    },
  })

  return newAst
}

const ComponentMap = {
  HStack: {
    tag: 'div',
    attributes: `className='flex items-center'`,
  },
  VStack: {
    tag: 'div',
    attributes: `className='flex flex-col items-center'`,
  },
  Text: {
    tag: 'p',
  },
}
function generator(node) {
  switch (node.type) {
    case 'Program': {
      return `export default function Component() {
  return (
    ${node.body.map(generator).join('\n')}
  )
}`
    }

    case 'ExpressionStatement': {
      return generator(node.expression)
    }

    case 'CallExpression': {
      let comp = ComponentMap[node.callee.name]
      if (!comp) throw new TypeError('no component defined for ' + node.callee)

      return `<${
        comp.tag + (comp.attributes ? ' ' + comp.attributes : '')
      }>${node.arguments.map(generator).join('')}</${comp.tag}>`
    }

    case 'Identifier':
      return node.name

    case 'NumberLiteral':
      return node.value

    case 'StringLiteral':
      return node.value

    default:
      throw new TypeError(node.type)
  }
}

function isOpeningParen(node) {
  return node.type === 'paren' && node.value === '('
}
function isOpeningBracket(node) {
  return node.type === 'bracket' && node.value === '{'
}
