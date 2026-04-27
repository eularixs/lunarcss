type Listener = () => void

class TinyEmitter {
  private listeners = new Set<Listener>()

  on(fn: Listener): () => void {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }

  off(fn: Listener): void {
    this.listeners.delete(fn)
  }

  emit(): void {
    for (const fn of this.listeners) fn()
  }
}

export const themeEmitter = new TinyEmitter()
