// Convention: a style prop ↔ className prop pair.
//   `style`                → `className`
//   `<x>Style`             → `<x>ClassName`
// e.g. `contentContainerStyle` ↔ `contentContainerClassName`,
//       `imageStyle`           ↔ `imageClassName`.
//
// Lives in runtime/ so both the transformer (build time) and styledComponent
// (runtime) share the exact same mapping.

export function classNamePropFor(styleProp: string): string {
  if (styleProp === 'style') return 'className'
  if (!styleProp.endsWith('Style')) return `${styleProp}ClassName`
  const base = styleProp.slice(0, -'Style'.length)
  return `${base}ClassName`
}
