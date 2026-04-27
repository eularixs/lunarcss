// Metro transformer. Runs BEFORE Babel — see Risk #1.
// AST-based className → __lcssTw() rewrite with source-map preservation (Risk #8).
// Implementation pending; this stub keeps the package entry stable.

import { parse } from '@babel/parser'
import generate from '@babel/generator'
import traverse from '@babel/traverse'
import * as t from '@babel/types'

export interface TransformInput {
  src: string
  filename: string
}

export interface TransformOutput {
  code: string
  map: ReturnType<typeof generate>['map']
}

const RN_INTRINSICS = new Set([
  'View',
  'Text',
  'Pressable',
  'ScrollView',
  'Image',
  'ImageBackground',
  'TextInput',
  'FlatList',
  'SectionList',
  'TouchableOpacity',
  'TouchableHighlight',
  'TouchableWithoutFeedback',
  'Modal',
  'SafeAreaView',
  'KeyboardAvoidingView',
  'Switch',
])

const HELPER_NAME = '__lcssTw'
const IMPORT_PATH = 'lunarcss/runtime'

export function transformClassNames(input: TransformInput): TransformOutput {
  const { src, filename } = input

  const ast = parse(src, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    sourceFilename: filename,
  })

  let touched = false

  traverse(ast, {
    JSXAttribute(path) {
      const nameNode = path.node.name
      if (!t.isJSXIdentifier(nameNode) || nameNode.name !== 'className') return

      const opening = path.parentPath.node
      if (!t.isJSXOpeningElement(opening)) return
      if (!t.isJSXIdentifier(opening.name)) return
      if (!RN_INTRINSICS.has(opening.name.name)) return

      const value = path.node.value
      let expr: t.Expression | null = null
      if (t.isStringLiteral(value)) {
        expr = t.stringLiteral(value.value)
      } else if (t.isJSXExpressionContainer(value) && t.isExpression(value.expression)) {
        expr = value.expression
      }
      if (!expr) return

      const styleAttr = opening.attributes.find(
        (a): a is t.JSXAttribute =>
          t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === 'style',
      )

      const twCall = t.callExpression(t.identifier(HELPER_NAME), [expr])

      let newStyleValue: t.JSXExpressionContainer
      if (styleAttr && styleAttr.value) {
        const existing = styleAttr.value
        let existingExpr: t.Expression | null = null
        if (t.isJSXExpressionContainer(existing) && t.isExpression(existing.expression)) {
          existingExpr = existing.expression
        }
        if (existingExpr) {
          newStyleValue = t.jsxExpressionContainer(
            t.arrayExpression([twCall, existingExpr]),
          )
        } else {
          newStyleValue = t.jsxExpressionContainer(twCall)
        }
        styleAttr.value = newStyleValue
        path.remove()
      } else {
        newStyleValue = t.jsxExpressionContainer(twCall)
        path.replaceWith(t.jsxAttribute(t.jsxIdentifier('style'), newStyleValue))
      }

      touched = true
    },
  })

  if (touched) {
    const program = ast.program
    const hasImport = program.body.some(
      (node): node is t.ImportDeclaration =>
        t.isImportDeclaration(node) &&
        node.source.value === IMPORT_PATH &&
        node.specifiers.some(
          (s) => t.isImportSpecifier(s) && t.isIdentifier(s.imported) && s.imported.name === HELPER_NAME,
        ),
    )
    if (!hasImport) {
      program.body.unshift(
        t.importDeclaration(
          [t.importSpecifier(t.identifier(HELPER_NAME), t.identifier(HELPER_NAME))],
          t.stringLiteral(IMPORT_PATH),
        ),
      )
    }
  }

  const out = generate(ast, {
    retainLines: true,
    sourceMaps: true,
    sourceFileName: filename,
  })
  return { code: out.code, map: out.map }
}
