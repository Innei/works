import type { CSSProperties } from 'react'

import type { Project } from '../data/projects'
import { useUI } from '../store'
import { Reveal, useBeatDelay } from './Reveal'

const pad = (n: number) => String(n).padStart(2, '0')

export function ProjectSection({ project, index, total }: { project: Project; index: number; total: number }) {
  const shown = useUI((s) => s.active === index)
  const base = useBeatDelay(shown)
  const { color } = project
  const right = project.side === 'right'

  return (
    <section
      tabIndex={-1}
      aria-labelledby={`${project.id}-title`}
      className={`relative flex h-svh snap-start snap-always items-end px-6 pb-20 outline-none md:items-center md:px-16 md:pb-0 lg:px-24 ${right ? 'md:justify-end' : ''}`}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-ink via-ink/80 to-transparent md:hidden" />
      <div className="relative w-full max-w-xl">
        <Reveal base={base} shown={shown} i={0}>
          <div className="flex items-center gap-3 font-mono text-[11px] tracking-[0.22em] text-white/45 uppercase">
            <span className="tabular-nums">
              {pad(index)} / {pad(total)}
            </span>
            <span className="h-px w-8 bg-white/20" />
            <span>{project.category}</span>
            {project.wip && (
              <span className="rounded-full border px-2 py-0.5 tracking-[0.14em]" style={{ borderColor: `${color}66`, color }}>
                In progress
              </span>
            )}
          </div>
        </Reveal>

        <Reveal base={base} shown={shown} i={1} className="mt-7 flex items-center gap-4">
          {project.logo ? (
            <img
              src={project.logo}
              alt=""
              width={52}
              height={52}
              className="size-13 rounded-[14px] object-cover shadow-[0_0_40px_-8px_var(--c)] outline outline-1 -outline-offset-1 outline-white/10"
              style={{ '--c': color } as CSSProperties}
            />
          ) : (
            <span
              aria-hidden
              className="grid size-13 place-items-center rounded-[14px] font-display text-2xl outline outline-1 -outline-offset-1 outline-white/10"
              style={{ color, background: `${color}14` }}
            >
              {project.name[0]}
            </span>
          )}
          {project.nativeName && (
            <span lang="ja" className="font-jp text-lg font-light tracking-[0.3em]" style={{ color }}>
              {project.nativeName}
            </span>
          )}
        </Reveal>

        <Reveal base={base} shown={shown} i={2}>
          <h2 id={`${project.id}-title`} className="mt-5 font-display text-[clamp(3.25rem,8.5vw,7.5rem)] leading-[0.9] tracking-[-0.02em] text-balance">
            {project.name}
          </h2>
        </Reveal>

        <Reveal base={base} shown={shown} i={3}>
          <p className="mt-5 font-display text-2xl text-white/85 italic md:text-[1.75rem]">{project.tagline}</p>
        </Reveal>

        <Reveal base={base} shown={shown} i={4}>
          <p className="mt-4 line-clamp-4 max-w-md text-[15px] leading-relaxed text-pretty text-white/55 md:line-clamp-none">
            {project.description}
          </p>
        </Reveal>

        {project.libraries ? (
          <Reveal base={base} shown={shown} i={5}>
            <ul className="mt-7 max-w-md divide-y divide-white/8 border-y border-white/8">
              {project.libraries.map((lib) => (
                <li key={lib.name}>
                  <a href={lib.href} target="_blank" rel="noreferrer" className="group flex items-baseline justify-between gap-6 py-3.5">
                    <span>
                      <span className="block font-mono text-sm text-white/90 transition-colors group-hover:text-white">{lib.name}</span>
                      <span className="mt-1 block text-[13px] leading-snug text-white/45">{lib.description}</span>
                    </span>
                    <span aria-hidden className="text-white/30 transition-transform duration-300 ease-out-expo group-hover:translate-x-1 group-hover:text-white">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </Reveal>
        ) : (
          <Reveal base={base} shown={shown} i={5}>
            <ul className="mt-6 flex flex-wrap gap-2">
              {project.stack.map((s) => (
                <li key={s} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-mono text-[11px] text-white/60">
                  {s}
                </li>
              ))}
            </ul>
          </Reveal>
        )}

        {project.links.length > 0 && (
          <Reveal base={base} shown={shown} i={6} className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {project.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="group inline-flex items-center gap-1.5 text-sm text-white/80 transition-colors hover:text-white"
              >
                <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 ease-out-expo group-hover:bg-[length:100%_1px]">
                  {link.label}
                </span>
                <span aria-hidden className="transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5" style={{ color }}>
                  ↗
                </span>
              </a>
            ))}
          </Reveal>
        )}
      </div>
    </section>
  )
}
