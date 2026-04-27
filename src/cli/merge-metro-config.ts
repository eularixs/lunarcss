// Idempotent merge: inject `withLunarCSS` into an existing CommonJS
// metro.config.js / .ts. AST-based per Risk #18 — never regex-append.
//
// Two operations performed if (and only if) not already present:
//   1. Add `const { withLunarCSS } = require('lunarcss/metro')` near the top.
//   2. Wrap the right-hand side of `module.exports = X` with `withLunarCSS(X)`.
//
// If the file already references `lunarcss/metro`, the merge is skipped and
// the file is reported as `unchanged`.

import { parse } from '@babel/parser'
import generate from '@babel/generator'
import traverse from '@babel/traverse'
import * as t from '@babel/types'

export interface MergeResult {
  changed: boolean
  reason: 'already-wired' | 'merged' | 'no-module-exports'
  code: string
}

export function mergeMetroConfig(source: string): MergeResult {
  if (source.includes('lunarcss/metro')) {
    return { changed: false, reason: 'already-wired', code: source }
  }

  const ast = parse(source, {
    sourceType: 'unambiguous',
    plugins: ['typescript'],
    allowReturnOutsideFunction: true,
  })

  let wrappedExport = false

  traverse(ast, {
    ExpressionStatement(path) {
      const expr = path.node.expression
      if (!t.isAssignmentExpression(expr)) return
      if (expr.operator !== '=') return
      // module.exports = ...
      if (
        !(
          t.isMemberExpression(expr.left) &&
          t.isIdentifier(expr.left.object, { name: 'module' }) &&
          t.isIdentifier(expr.left.property, { name: 'exports' })
        )
      ) {
        return
      }
      const right = expr.right
      // Skip if already wrapped
      if (
        t.isCallExpression(right) &&
        t.isIdentifier(right.callee, { name: 'withLunarCSS' })
      ) {
        wrappedExport = true
        return
      }
      expr.right = t.callExpression(t.identifier('withLunarCSS'), [right])
      wrappedExport = true
    },
  })

  if (!wrappedExport) {
    return { changed: false, reason: 'no-module-exports', code: source }
  }

  // Insert require near the top: after the last existing top-level
  // `require()`-style declaration, falling back to position 0.
  const program = ast.program
  let insertAt = 0
  for (let i = 0; i < program.body.length; i++) {
    const node = program.body[i]
    if (
      t.isVariableDeclaration(node) &&
      node.declarations.some(
        (d) =>
          t.isCallExpression(d.init ?? null) &&
          t.isIdentifier((d.init as t.CallExpression).callee, { name: 'require' }),
      )
    ) {
      insertAt = i + 1
    }
  }
  const requireDecl = t.variableDeclaration('const', [
    t.variableDeclarator(
      t.objectPattern([
        t.objectProperty(
          t.identifier('withLunarCSS'),
          t.identifier('withLunarCSS'),
          false,
          true,
        ),
      ]),
      t.callExpression(t.identifier('require'), [t.stringLiteral('lunarcss/metro')]),
    ),
  ])
  program.body.splice(insertAt, 0, requireDecl)

  const out = generate(ast, { retainLines: false })
  return { changed: true, reason: 'merged', code: out.code }
}
