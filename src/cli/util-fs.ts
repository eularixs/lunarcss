import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'

export interface WriteResult {
  path: string
  status: 'created' | 'unchanged' | 'updated' | 'skipped-existing'
}

export function writeFileIfMissing(path: string, content: string): WriteResult {
  if (existsSync(path)) return { path, status: 'skipped-existing' }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, 'utf8')
  return { path, status: 'created' }
}

export function writeFileChanged(path: string, content: string): WriteResult {
  if (existsSync(path)) {
    const prev = readFileSync(path, 'utf8')
    if (prev === content) return { path, status: 'unchanged' }
    writeFileSync(path, content, 'utf8')
    return { path, status: 'updated' }
  }
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, content, 'utf8')
  return { path, status: 'created' }
}

// Append a labeled section to a line-based file (e.g. .gitignore). Idempotent:
// if the section sentinel is already present, skip.
export function appendSection(
  path: string,
  sectionHeader: string,
  body: string,
): WriteResult {
  const normalizedBody = body.endsWith('\n') ? body : `${body}\n`
  const block = `\n${sectionHeader}\n${normalizedBody}`

  if (!existsSync(path)) {
    mkdirSync(dirname(path), { recursive: true })
    // First write skips the leading blank line.
    writeFileSync(path, `${sectionHeader}\n${normalizedBody}`, 'utf8')
    return { path, status: 'created' }
  }

  const prev = readFileSync(path, 'utf8')
  if (prev.includes(sectionHeader)) {
    return { path, status: 'unchanged' }
  }
  const next = prev.endsWith('\n') ? `${prev}${block}` : `${prev}\n${block}`
  writeFileSync(path, next, 'utf8')
  return { path, status: 'updated' }
}
