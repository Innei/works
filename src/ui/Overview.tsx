import { projects } from '../data/projects'
import { live, scrollToSection, useUI } from '../store'
import { Reveal, useBeatDelay } from './Reveal'

export function Overview() {
  const shown = useUI((s) => s.active === 0)
  const base = useBeatDelay(shown)

  return (
    <section tabIndex={-1} aria-labelledby="overview-title" className="relative flex h-svh snap-start outline-none snap-always flex-col justify-between px-6 pt-24 pb-8 md:px-16 md:pt-28 lg:px-24">
      <div>
        <Reveal base={base} shown={shown} i={0}>
          <p className="font-mono text-[11px] tracking-[0.22em] text-white/45 uppercase">Selected work — 2026</p>
        </Reveal>
        <Reveal base={base} shown={shown} i={1}>
          <h1 id="overview-title" className="mt-6 font-display text-[clamp(3.4rem,10vw,9.5rem)] leading-[0.86] tracking-[-0.025em]">
            A year of
            <br />
            <em className="text-white/70">making things.</em>
          </h1>
        </Reveal>
        <Reveal base={base} shown={shown} i={2}>
          <p className="mt-7 max-w-md text-[15px] leading-relaxed text-pretty text-white/55">
            Nine products and a handful of libraries, built in 2026. Native apps, publishing tools, imaging, and AI
            workflows. Scroll through, or jump straight to one.
          </p>
        </Reveal>
      </div>

      <Reveal base={base} shown={shown} i={3}>
        <ol className="grid grid-cols-2 gap-x-6 border-t border-white/10 sm:grid-cols-3 lg:grid-cols-6" onMouseLeave={() => (live.hover = -1)}>
          {projects.map((p, i) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => scrollToSection(i + 1)}
                onMouseEnter={() => (live.hover = i + 1)}
                onFocus={() => (live.hover = i + 1)}
                onBlur={() => (live.hover = -1)}
                className="group flex w-full items-baseline gap-3 border-b border-white/10 py-3 text-left"
              >
                <span className="font-mono text-[10px] text-white/35 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-sm text-white/70 transition-colors group-hover:text-white">{p.name}</span>
                <span
                  aria-hidden
                  className="ml-auto size-1.5 translate-y-[-2px] rounded-full opacity-40 transition-[opacity,transform] duration-300 group-hover:scale-150 group-hover:opacity-100"
                  style={{ background: p.color }}
                />
              </button>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  )
}
