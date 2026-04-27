import { describe, it, expect, beforeEach } from 'vitest'
import {
  getCached,
  setCached,
  invalidateTokens,
  clearCache,
  configureCache,
} from '../runtime/cache.js'

describe('cache', () => {
  beforeEach(() => {
    clearCache()
    configureCache(1000)
  })

  it('round-trips a value', () => {
    setCached('p-4', { padding: 16 }, ['--spacing'])
    expect(getCached('p-4')).toEqual({ padding: 16 })
  })

  it('returns undefined for missing key', () => {
    expect(getCached('not-here')).toBeUndefined()
  })

  it('invalidates entries by token', () => {
    setCached('p-4', { padding: 16 }, ['--spacing'])
    setCached('bg-primary', { backgroundColor: '#000' }, ['--color-primary'])

    invalidateTokens(['--spacing'])

    expect(getCached('p-4')).toBeUndefined()
    expect(getCached('bg-primary')).toEqual({ backgroundColor: '#000' })
  })

  it('evicts oldest when over LRU max', () => {
    configureCache(2)
    setCached('a', { padding: 1 }, [])
    setCached('b', { padding: 2 }, [])
    setCached('c', { padding: 3 }, [])
    expect(getCached('a')).toBeUndefined()
    expect(getCached('b')).toEqual({ padding: 2 })
    expect(getCached('c')).toEqual({ padding: 3 })
  })
})
