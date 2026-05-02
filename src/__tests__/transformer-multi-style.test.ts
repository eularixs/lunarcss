// Coverage for STYLE_PROPS_MAP-driven multi-style rewrites and the className
// naming convention (`<x>Style` ↔ `<x>ClassName`).

import { describe, it, expect } from 'vitest'
import {
  transformClassNames,
  classNamePropFor,
  STYLE_PROPS_MAP,
} from '../metro/transform-classnames.js'

describe('classNamePropFor', () => {
  it('maps style → className', () => {
    expect(classNamePropFor('style')).toBe('className')
  })
  it('maps contentContainerStyle → contentContainerClassName', () => {
    expect(classNamePropFor('contentContainerStyle')).toBe('contentContainerClassName')
  })
  it('maps imageStyle → imageClassName', () => {
    expect(classNamePropFor('imageStyle')).toBe('imageClassName')
  })
})

describe('STYLE_PROPS_MAP coverage', () => {
  it('declares ScrollView with style + contentContainerStyle', () => {
    expect(STYLE_PROPS_MAP.ScrollView).toEqual(['style', 'contentContainerStyle'])
  })
  it('declares FlatList and SectionList with content container too', () => {
    expect(STYLE_PROPS_MAP.FlatList).toContain('contentContainerStyle')
    expect(STYLE_PROPS_MAP.SectionList).toContain('contentContainerStyle')
  })
  it('declares ImageBackground with style + imageStyle', () => {
    expect(STYLE_PROPS_MAP.ImageBackground).toEqual(['style', 'imageStyle'])
  })
})

describe('transformClassNames multi-style rewrites', () => {
  it('rewrites ScrollView contentContainerClassName to contentContainerStyle', () => {
    const src = `
      import { ScrollView } from 'react-native'
      export const A = () => (
        <ScrollView className="flex-1" contentContainerClassName="p-4 gap-2" />
      )
    `
    const out = transformClassNames({ src, filename: 'A.tsx' })
    expect(out.code).toContain('style={__lcssTw("flex-1")}')
    expect(out.code).toContain('contentContainerStyle={__lcssTw("p-4 gap-2")}')
    expect(out.code).not.toContain('className="flex-1"')
    expect(out.code).not.toContain('contentContainerClassName="p-4 gap-2"')
  })

  it('rewrites ImageBackground imageClassName to imageStyle', () => {
    const src = `
      import { ImageBackground } from 'react-native'
      export const A = () => (
        <ImageBackground className="flex-1" imageClassName="opacity-50" />
      )
    `
    const out = transformClassNames({ src, filename: 'A.tsx' })
    expect(out.code).toContain('style={__lcssTw("flex-1")}')
    expect(out.code).toContain('imageStyle={__lcssTw("opacity-50")}')
  })

  it('does not touch non-whitelisted components', () => {
    const src = `
      import { Custom } from './x'
      export const A = () => <Custom className="p-4" />
    `
    const out = transformClassNames({ src, filename: 'A.tsx' })
    expect(out.code).toContain('className="p-4"')
    expect(out.code).not.toContain('__lcssTw')
  })

  it('emits a single import even when multiple style props rewrite', () => {
    const src = `
      import { ScrollView } from 'react-native'
      export const A = () => (
        <ScrollView className="flex-1" contentContainerClassName="p-4" />
      )
    `
    const out = transformClassNames({ src, filename: 'A.tsx' })
    const importMatches = out.code.match(/from\s+["']@lunar-kit\/css\/runtime["']/g)
    expect(importMatches?.length).toBe(1)
  })
})
