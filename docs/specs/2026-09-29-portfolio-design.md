# Innei 2026 Portfolio — Design (rev 2)

## Goal

Single-page portfolio showcasing Innei's 2026 work. Screen 1 is an overview; every following screen is one project, snapped with CSS scroll snap. Motion quality bar: Apple / Linear product pages. Cinematic dark tone.

Rev 2 replaces the per-project mesh scenes with **one unified fluid** and the ambient pad with **per-project beat-synced grooves**. Layout, copy, scroll logic and navigation from rev 1 stay.

## Stack

- Location: `innei-repo/portfolio/`
- Vite + React 19 + TypeScript 6.0 + Tailwind CSS v4
- `@react-three/fiber`, `@react-three/postprocessing`, `motion`, `zustand`
- Static build; deployment out of scope

## Screens (11)

| # | id | Fluid state | Shading mode | BPM | Groove |
|---|----|-------------|--------------|-----|--------|
| 0 | overview | Nebula mixing all project colors, slow layering | ink | 90 | Soft kick on 1 & 3 (heartbeat), pad |
| 1 | yohaku | Warm-white ink diffusing slowly, ~70% empty space | ink | 72 | No drums; sparse plucks on beat 1 |
| 2 | mx-space | Deep-blue liquid metal, streams converging to center | gloss | 118 | Soft four-on-the-floor kick, off-beat hat, pulsing bass |
| 4 | afilmory | Warm-orange film light leak, grain, burn halation | ink + grain | 84 | Lo-fi: swung hats, vinyl crackle, dusty kick/snare |
| 5 | yoake | Dawn light-fog; flow grades from log-gray to color | ink | 96 | Kick enters gradually, filter opens (sunrise) |
| 6 | lody | Teal bioluminescence, soft breathing pulse | gloss | 100 | Soft bubbly bass, pad sidechained to kick |
| 7 | musubicho (WIP) | Two pink streams wrapping and merging | silk | 110 | Two interlocking arps, clap |
| 8 | kagura | Vermilion and gold silk | silk | 124 | Taiko-like low toms, syncopated, shaker |
| 9 | torrent-vibe | Green fast turbulence broken into fragments | ink | 128 | Fast 16th arp with stutters |
| 10 | kansoku | Cold-blue fluid rendered as contour lines | contour | 120 | Minimal techno: tight clicks, sub bass, metallic ping |
| 11 | libraries | Monochrome liquid glass with chromatic refraction | gloss | 90 | Calm; glass chimes |

Libraries screen lists Haklex, electron-sparkle-updater, ChatKit, Tsuki (Haklex moved here in rev 3: it is a library, no screenshot). Excluded: LobeHub iOS, Shun, IslandToast, message-engine, expo-ota.

## Icons

Use each app's real icon, 256px PNG in `public/logos/`:

| Project | Source |
|---|---|
| Yohaku | `Yohaku/yohaku-oss/apps/mobile/assets/images/icon.png` |
| Mix Space | `mx-core/apps/ios/Space/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png` |
| Afilmory | `afilmory/apps/mobile/Afilmory/Resources/Assets.xcassets/AppIcon.appiconset/AppIcon.png` |
| Yoake | `dji-lut/public/android-chrome-512x512.png` |
| Lody | `lody-ios/apps/mobile/ios/Lody/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png` |
| Musubicho | `accounting-ios/App/Resources/LedgerCat.icon`: boarding-pass cat layer at 81.7% on `rgb(215,71,50)` |
| Kagura | `slack-cc-bot/assets/logo.png` |
| Torrent Vibe | `Torrent-Vibe/resources/icon.png` |
| Kansoku | `kansoku-workspace/repos/kansoku/apps/desktop/build/icon.png` |

## Fluid renderer

One fixed full-screen R3F `<Canvas>`; no per-project meshes.

### Simulation (interactive layer)

- 2D incompressible fluid, GPU ping-pong half-float render targets (Stable Fluids approach): advect velocity → vorticity confinement → divergence → pressure Jacobi (~20 iterations) → gradient subtract → advect dye.
- Velocity grid 128² (64² on mobile), dye 512² (256² on mobile).
- Splats: pointer movement injects velocity + dye (dye color from the current palette); each kick injects a splat at a point inside the fluid's focal area.
- Dissipation per project (`dissipation` param) so Yohaku trails fade fast and Kagura's linger.

### Composite shader (look layer)

- Base field: domain-warped fbm, sampled at `uv - velocity * warpK` so pointer stirring bends the base, plus the dye texture.
- Focal mask: fluid mass is concentrated right of center on wide screens (text sits left), upper half on narrow screens; `density` param controls coverage (Yohaku lowest).
- Shading modes computed from the same field, blended by a `vec4 modeWeights` uniform; modes with weight 0 are skipped:
  - **ink**: density → palette ramp, soft edges.
  - **gloss**: normal from field gradient, specular + fresnel highlight, subtle chromatic offset.
  - **silk**: anisotropic stretched highlights along the flow direction (laminar filaments).
  - **contour**: iso-lines of the field (`fract(field * n)`), anti-aliased with `fwidth`.
- Grain overlay (`grain` param; Afilmory high), audio/beat pulse boosts brightness.

### Per-project parameters

`fluid` record per project in `data/projects.ts`: `palette: [c0, c1, c2]`, `modeWeights`, `warp`, `speed`, `scale`, `density`, `dissipation`, `grain`. JS blends params of the two nearest sections by scroll progress each frame (colors in linear space), so transitions morph continuously. Special cases handled by params only (Yoake gray→color uses a `saturation` param that animates with time; Haklex "re-settle" uses high `dissipation` with silk rows from an anisotropic fbm).

### Post

Bloom (mipmap), vignette; film grain in composite (not postprocessing Noise), so reduced motion can freeze it.

## Product screenshots (rev 3)

Visitors must see what each app is. Each project has one hero screenshot that **emerges from the fluid**:

- Rendered inside the composite shader as a rounded card in the focal area, sized to the image aspect (portrait phone / landscape desktop), max ~42% viewport width and ~70% height.
- Enter: a dissolve mask driven by the fluid field condenses the image in from the fluid edges. Leave: melts back while the next one condenses.
- At rest the fluid displacement on the card decays to 0: the screenshot is fully sharp and readable. Pointer stirring refracts it (velocity-driven UV offset) and it heals within ~1 s.
- Canvas DPR raised to 1.5 for screenshot sharpness (measure frame time; fall back to 1.25 if needed).
- Sourcing order: README images → live-site capture (headless) → local dev environment capture. Projects needing private credentials or `.env` are skipped and listed for the owner. Stored as WebP in `public/shots/`.

## Layout sides (rev 3)

- Each project has a fixed `side: 'left' | 'right'` for its copy, in an irregular pattern (not re-randomized per visit). The fluid focus and screenshot card sit on the opposite side; focus x blends between sections with scroll.
- Desktop scrim gradient follows the copy side. Mobile layout is unchanged (copy bottom, visual top).

## Audio — groove engine

All synthesized in Web Audio; no audio files.

### Transport

- Look-ahead scheduler: 25 ms timer schedules 16th-note steps up to 100 ms ahead on `AudioContext` time.
- One groove active at a time. Scroll to a new section sets `pending`; the switch happens at the next bar boundary (step 0). BPM changes at that boundary.
- Scheduled beat events (`{ time, kind: 'kick' | 'snare' | 'hat' | 'accent' }`) go into a queue; each animation frame drains events whose `time <= ctx.currentTime` and sets `live.kick`, `live.hat` pulses (decaying 1 → 0).

### Groove data

`data/grooves.ts`, one per section: `bpm`, `swing`, 16-step patterns per voice (string like `'x...x...x...x...'`), `bass` (per-step MIDI or null), `arp` (per-step MIDI or null), `pad` chord (3–4 notes), and flags (`crackle`, `sidechain`, `filterRise`).

### Instruments

kick (sine pitch drop), snare (noise + tone), hat (high-passed noise), clap (triple noise burst), tom (low sine drop), shaker, pluck, bass (saw → lowpass), pad (detuned saws → LFO lowpass), chime (FM bell), ping (high sine), crackle (sparse noise clicks). Master → compressor → analyser → out; shared reverb + delay sends.

### Visual sync

- `live.kick` → fluid splat + brightness pulse; `live.hat` → subtle shimmer.
- Section copy reveal starts on the next beat after arrival when sound is on.
- When sound is off, no beat events: the fluid flows ambiently.

### Toggle behavior (fixes from rev-1 review)

- Off by default; preference in localStorage (try/catch).
- Stored "on" resumes on the first `click` / `keydown` anywhere except the toggle itself (touch `pointerdown` is not a user gesture).
- `start`/`stop` guarded by a generation counter so a stop during `await ctx.resume()` wins; `start` clears any pending suspend timer; chord/groove read after the await.
- Spectrum bars read the analyser directly; their rAF loop runs only while sound is on.

## Layout, navigation, accessibility (from rev 1, with review fixes)

- `<main>` scroll-snap container, sections `100svh`; `progress = scrollTop / clientHeight`; `activeIndex` / `sceneWeight` in `lib/progress.ts` (tested).
- Copy left on desktop with left scrim; bottom with scrim on mobile. DotNav hidden on mobile.
- Keyboard `↑/↓`, `j/k`, PageUp/PageDown, Home/End; rapid presses step from a pending target, not the settled index.
- Sections are `tabIndex={-1}` and receive focus (`preventScroll`) after keyboard/DotNav navigation.
- `prefers-reduced-motion` (listened, not read once): fluid renders a slowly-evolving still (time frozen), no pointer splats, no grain animation, no reveal motion.
- WebGL: probe context is released after the check; `<Stage>` wrapped in an error boundary rendering the CSS gradient fallback; `webglcontextlost` switches to the fallback.

## Testing

- `lib/progress.test.ts`: index/weight math.
- `lib/params.test.ts`: param blending between sections (endpoints, midpoint, clamping).
- `audio/sequencer.test.ts`: pattern parsing, step timing incl. swing, bar-boundary switching (pure functions, no AudioContext).
- Typecheck + lint on changed files; headless-browser screenshots of every section (desktop 1440×900, mobile 390×844) plus analyser-level check with sound on.

## Out of scope

Per-project detail pages, CMS, i18n, analytics, deployment config, real screenshots, audio files.
