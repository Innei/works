import { projects } from '../data/projects'
import { scrollToSection, useUI } from '../store'

const items = [{ id: 'overview', name: 'Overview', color: '#ecebe7' }, ...projects]

export function DotNav() {
  const active = useUI((s) => s.active)
  return (
    <nav aria-label="Sections" className="fixed top-1/2 right-6 z-20 hidden -translate-y-1/2 md:block">
      <ul className="flex flex-col items-end gap-1">
        {items.map((item, i) => (
          <li key={item.id}>
            <button
              type="button"
              aria-label={item.name}
              aria-current={active === i ? 'true' : undefined}
              onClick={() => scrollToSection(i)}
              className="group flex h-5 items-center gap-3 pl-3"
            >
              <span className="pointer-events-none hidden translate-x-1 font-mono text-[10px] tracking-[0.18em] text-white/0 uppercase transition-all duration-300 group-hover:translate-x-0 group-hover:text-white/70 md:block">
                {item.name}
              </span>
              <span
                className="block w-[3px] rounded-full transition-all duration-500 ease-out-expo"
                style={{
                  height: active === i ? 20 : 6,
                  background: active === i ? item.color : 'rgb(255 255 255 / 0.28)',
                }}
              />
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
