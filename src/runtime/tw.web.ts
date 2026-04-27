// Web entry: passthrough. Tailwind CSS handles rendering via browser engine.
// __lcssTw on web returns the className string wrapped so JSX can spread it.

export function __lcssTw(className: string): { className: string } {
  return { className }
}

export function tw(className: string): { className: string } {
  return __lcssTw(className)
}
