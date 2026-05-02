// Metro source-level rewriter. Runs BEFORE Babel — see Risk #1.
// AST-based className → __lcssTw() rewrite with source-map preservation.
//
// Each whitelisted RN component declares the *style* prop names it supports.
// Per pair (styleProp ↔ classNameProp), classNameProp = styleProp − "Style"
// + "ClassName" (special-case: bare `style` ↔ bare `className`). Examples:
//   View                 :  style                 ↔ className
//   ScrollView           :  style                 ↔ className
//                         contentContainerStyle  ↔ contentContainerClassName
//   ImageBackground      :  style                 ↔ className
//                         imageStyle             ↔ imageClassName
//
// On web, the Metro entry skips this entire file — see metro/transformer.ts.
// __lcssTw on web is a no-op (returns {}); className passes through to the
// DOM untouched so Tailwind CSS can match it.

import { parse } from '@babel/parser'
import generateImport from '@babel/generator'
import traverseImport from '@babel/traverse'
import * as t from '@babel/types'
import { classNamePropFor } from '../runtime/class-name-pair.js'

// CJS interop normalization — see metro/transformer.ts for rationale.
type TraverseFn = typeof traverseImport
type GenerateFn = typeof generateImport
const traverse: TraverseFn =
  typeof traverseImport === 'function'
    ? traverseImport
    : ((traverseImport as unknown as { default: TraverseFn }).default)
const generate: GenerateFn =
  typeof generateImport === 'function'
    ? generateImport
    : ((generateImport as unknown as { default: GenerateFn }).default)

export interface TransformInput {
  src: string
  filename: string
}

export interface TransformOutput {
  code: string
  map: ReturnType<typeof generate>['map']
}

// Map RN component name → list of style prop names it accepts.
// Each style prop name has a corresponding className prop computed by
// classNamePropFor(styleProp).
export const STYLE_PROPS_MAP: Readonly<Record<string, readonly string[]>> = {
  View: ['style'],
  Text: ['style'],
  Image: ['style'],
  ImageBackground: ['style', 'imageStyle'],
  ScrollView: ['style', 'contentContainerStyle'],
  FlatList: ['style', 'contentContainerStyle'],
  SectionList: ['style', 'contentContainerStyle'],
  VirtualizedList: ['style', 'contentContainerStyle'],
  TextInput: ['style'],
  TouchableOpacity: ['style'],
  TouchableHighlight: ['style'],
  TouchableWithoutFeedback: ['style'],
  Pressable: ['style'],
  SafeAreaView: ['style'],
  Modal: ['style'],
  ActivityIndicator: ['style'],
  KeyboardAvoidingView: ['style'],
  Switch: ['style'],
}

export { classNamePropFor }

const HELPER_NAME = '__lcssTw'
const IMPORT_PATH = '@lunar-kit/css/runtime'

export function transformClassNames(input: TransformInput): TransformOutput {
  const { src, filename } = input

  const ast = parse(src, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
    sourceFilename: filename,
  })

  let touched = false

  traverse(ast, {
    JSXOpeningElement(path) {
      const nameNode = path.node.name
      if (!t.isJSXIdentifier(nameNode)) return
      const styleProps = STYLE_PROPS_MAP[nameNode.name]
      if (!styleProps) return

      for (const styleProp of styleProps) {
        const cnProp = classNamePropFor(styleProp)
        if (rewritePair(path.node, cnProp, styleProp)) {
          touched = true
        }
      }
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

// Rewrite one className-style pair on a JSXOpeningElement. Returns true when
// a rewrite happened. If both attrs exist, merges as `[__lcssTw(cls), style]`.
function rewritePair(
  opening: t.JSXOpeningElement,
  cnProp: string,
  styleProp: string,
): boolean {
  const cnIndex = opening.attributes.findIndex(
    (a): a is t.JSXAttribute =>
      t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === cnProp,
  )
  if (cnIndex === -1) return false
  const cnAttr = opening.attributes[cnIndex] as t.JSXAttribute

  const value = cnAttr.value
  let expr: t.Expression | null = null
  if (t.isStringLiteral(value)) {
    expr = t.stringLiteral(value.value)
  } else if (t.isJSXExpressionContainer(value) && t.isExpression(value.expression)) {
    expr = value.expression
  }
  if (!expr) return false

  const twCall = t.callExpression(t.identifier(HELPER_NAME), [expr])
  const styleAttr = opening.attributes.find(
    (a): a is t.JSXAttribute =>
      t.isJSXAttribute(a) && t.isJSXIdentifier(a.name) && a.name.name === styleProp,
  )

  if (styleAttr && styleAttr.value) {
    const existing = styleAttr.value
    let existingExpr: t.Expression | null = null
    if (t.isJSXExpressionContainer(existing) && t.isExpression(existing.expression)) {
      existingExpr = existing.expression
    }
    if (existingExpr) {
      styleAttr.value = t.jsxExpressionContainer(
        t.arrayExpression([twCall, existingExpr]),
      )
    } else {
      styleAttr.value = t.jsxExpressionContainer(twCall)
    }
    opening.attributes.splice(cnIndex, 1)
  } else {
    // Replace classNameProp with styleProp={__lcssTw(...)} in place.
    opening.attributes[cnIndex] = t.jsxAttribute(
      t.jsxIdentifier(styleProp),
      t.jsxExpressionContainer(twCall),
    )
  }
  return true
}
