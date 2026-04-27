import { Particles } from './particles'

export function DocsBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Purple blur orb — top right */}
      <div className="absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-fuchsia-500/15 blur-3xl opacity-15" />
      {/* Smaller deep accent orb behind it */}
      <div className="absolute -right-16 -top-16 h-[280px] w-[280px] rounded-full bg-gradient-to-br from-indigo-500/25 to-violet-700/15 blur-2xl" />
      {/* Particle layer confined to top-right region */}
      <div className="absolute right-0 top-0 h-[600px] w-[600px]">
        <Particles density={35} linkDistance={110} speed={0.15} />
      </div>
    </div>
  )
}
