import type { FluidParams } from '../lib/params'

export type SceneKey =
  | 'overview'
  | 'yohaku'
  | 'mx-space'
  | 'afilmory'
  | 'yoake'
  | 'lody'
  | 'musubicho'
  | 'kagura'
  | 'torrent-vibe'
  | 'kansoku'
  | 'libraries'

export interface Link {
  label: string
  href: string
}

export interface Library {
  name: string
  description: string
  href: string
}

export interface Project {
  id: SceneKey
  name: string
  nativeName?: string
  category: string
  tagline: string
  description: string
  stack: string[]
  links: Link[]
  color: string
  fluid: FluidParams
  side: 'left' | 'right'
  shot?: string
  logo?: string
  wip?: boolean
  libraries?: Library[]
}

const gh = (repo: string): Link => ({ label: 'GitHub', href: `https://github.com/${repo}` })

export const overview: { color: string; fluid: FluidParams } = {
  color: '#e9e4da',
  fluid: { palette: ['#1d1540', '#b4508a', '#8fd8ff'], modes: [1, 0, 0, 0], warp: 1.2, speed: 0.5, scale: 1.4, density: 0.75, dissipation: 0.97, grain: 0.05, saturation: 1, stretch: 1 },
}

export const projects: Project[] = [
  {
    id: 'yohaku',
    shot: '/shots/yohaku.webp',
    side: 'left',
    fluid: { palette: ['#1a1712', '#8a7f6c', '#f3eadb'], modes: [1, 0, 0, 0], warp: 0.8, speed: 0.25, scale: 1.1, density: 0.3, dissipation: 0.92, grain: 0.04, saturation: 1, stretch: 1 },
    name: 'Yohaku',
    nativeName: '余白',
    category: 'Publishing',
    tagline: 'White space is part of the writing.',
    description:
      'A cross-platform publishing product for personal writing. Posts, notes, thoughts and timelines on the web and native iOS, from one content backend. The interface steps back so the words can lead.',
    stack: ['Next.js', 'Lexical', 'Swift', 'UIKit'],
    links: [
      { label: 'Live', href: 'https://innei.in' },
      { label: 'Design system', href: 'https://yohaku.innei.dev' },
      gh('Innei/Yohaku'),
    ],
    color: '#e6d9c3',
    logo: '/logos/yohaku.png',
  },
  {
    id: 'mx-space',
    shot: '/shots/mx-space.webp',
    side: 'right',
    fluid: { palette: ['#0a1238', '#3a64ff', '#cfe0ff'], modes: [0.2, 1, 0, 0], warp: 1.4, speed: 0.6, scale: 1.3, density: 0.7, dissipation: 0.97, grain: 0.04, saturation: 1, stretch: 1 },
    name: 'Mix Space',
    category: 'Personal CMS',
    tagline: 'The engine behind every word.',
    description:
      'The personal-CMS stack in one monorepo: core server, admin dashboard, native iOS client, a privacy-preserving push relay, telemetry, and the shared SDKs that bind them together.',
    stack: ['NestJS', 'MongoDB', 'React', 'Swift'],
    links: [gh('mx-space/core')],
    color: '#7f9dff',
    logo: '/logos/mx-space.png',
  },
  {
    id: 'afilmory',
    shot: '/shots/afilmory.webp',
    side: 'left',
    fluid: { palette: ['#2a0e05', '#ff7a2e', '#ffe2b8'], modes: [1, 0, 0, 0], warp: 1.1, speed: 0.4, scale: 1.2, density: 0.7, dissipation: 0.96, grain: 0.35, saturation: 1, stretch: 1 },
    name: 'Afilmory',
    category: 'Photography',
    tagline: 'Auto focus, aperture, film, memory.',
    description:
      'A modern, high-performance photo gallery platform for photographers. Self-host it, or go live in minutes on the SaaS with a live CMS, custom domains and EXIF-rich browsing.',
    stack: ['React', 'Vite', 'WebGL', 'SaaS'],
    links: [{ label: 'afilmory.art', href: 'https://afilmory.art' }, gh('Afilmory/afilmory')],
    color: '#ffb46b',
    logo: '/logos/afilmory.png',
  },
  {
    id: 'yoake',
    side: 'right',
    fluid: { palette: ['#1b1030', '#ff7a59', '#ffe0a3'], modes: [1, 0, 0, 0], warp: 0.9, speed: 0.35, scale: 1.0, density: 0.75, dissipation: 0.96, grain: 0.06, saturation: 0.15, stretch: 1 },
    name: 'Yoake',
    nativeName: '夜明け',
    category: 'Imaging',
    tagline: 'Develop the dawn.',
    description:
      'A local-only web darkroom for DJI D-Log M footage. Apply the official LUT, dial in exposure, and export ISO 21496-1 Ultra HDR stills that bloom in macOS Photos and on iPhone. Nothing leaves the browser.',
    stack: ['WebGL2', 'Mediabunny', 'Ultra HDR', 'React'],
    links: [gh('Innei/yoake')],
    color: '#ff8f5e',
    logo: '/logos/yoake.png',
  },
  {
    id: 'lody',
    shot: '/shots/lody.webp',
    side: 'left',
    fluid: { palette: ['#021a17', '#1fd1a8', '#c9fff1'], modes: [0.4, 0.8, 0, 0], warp: 1.0, speed: 0.45, scale: 1.2, density: 0.65, dissipation: 0.97, grain: 0.04, saturation: 1, stretch: 1 },
    name: 'Lody iOS',
    category: 'Native app',
    tagline: 'Your AI sessions, in your pocket.',
    description:
      'An independent native iOS client for Lody, the AI collaboration and session companion. CRDT sync with Loro and Flock, Live Activities, and a Swift native kit under a React Native shell.',
    stack: ['Expo SDK 57', 'React Native', 'Swift', 'Loro'],
    links: [
      { label: 'TestFlight', href: 'https://testflight.apple.com/join/1rR6Ku8f' },
      gh('Innei/lody-ios'),
    ],
    color: '#5ee8c9',
    logo: '/logos/lody.png',
  },
  {
    id: 'musubicho',
    shot: '/shots/musubicho.webp',
    side: 'left',
    fluid: { palette: ['#2a0a17', '#ff5c93', '#ffd0c2'], modes: [0.3, 0, 1, 0], warp: 1.3, speed: 0.55, scale: 1.3, density: 0.65, dissipation: 0.97, grain: 0.04, saturation: 1, stretch: 1.4 },
    name: 'Musubicho',
    category: 'Native app',
    tagline: 'Split the bill, keep the friendship.',
    description:
      'An AI-assisted ledger for shared expenses and AA splits. Local-first, UIKit on iOS 26, with an on-device agent runtime running on JavaScriptCore.',
    stack: ['UIKit', 'SwiftUI', 'JavaScriptCore', 'Local-first'],
    links: [],
    color: '#ff7eab',
    logo: '/logos/musubicho.png',
    wip: true,
  },
  {
    id: 'kagura',
    shot: '/shots/kagura.webp',
    side: 'right',
    fluid: { palette: ['#2a0503', '#e8392b', '#ffcf6b'], modes: [0.2, 0.2, 1, 0], warp: 1.5, speed: 0.7, scale: 1.3, density: 0.75, dissipation: 0.985, grain: 0.05, saturation: 1, stretch: 1.8 },
    name: 'Kagura',
    nativeName: '神楽',
    category: 'AI agents',
    tagline: 'Every thread a stage.',
    description:
      'Claude Agent SDK and Codex CLI, running natively in Slack. Every thread becomes an agent session with memory, live progress and a read-only diff review surface.',
    stack: ['Claude Agent SDK', 'Codex', 'Slack', 'SQLite'],
    links: [gh('Innei/slack-cc-bot')],
    color: '#ff5a4e',
    logo: '/logos/kagura.png',
  },
  {
    id: 'torrent-vibe',
    shot: '/shots/torrent-vibe.webp',
    side: 'left',
    fluid: { palette: ['#03170c', '#22c55e', '#d6ffe6'], modes: [1, 0, 0, 0], warp: 2.2, speed: 1.3, scale: 2.2, density: 0.6, dissipation: 0.93, grain: 0.05, saturation: 1, stretch: 1 },
    name: 'Torrent Vibe',
    category: 'Desktop app',
    tagline: 'qBittorrent, reimagined.',
    description:
      'A modern client for qBittorrent. A fast, elegant desktop app that also ships as a drop-in alternative Web UI, designed for desktop and mobile alike.',
    stack: ['Electron', 'React', 'Vite', 'Tailwind'],
    links: [gh('Torrent-Vibe/Torrent-Vibe')],
    color: '#45e08c',
    logo: '/logos/torrent-vibe.png',
  },
  {
    id: 'kansoku',
    shot: '/shots/kansoku.webp',
    side: 'right',
    fluid: { palette: ['#020c1a', '#2f8fd8', '#c7ecff'], modes: [0.08, 0, 0, 1], warp: 0.9, speed: 0.35, scale: 1.3, density: 0.8, dissipation: 0.97, grain: 0.03, saturation: 1, stretch: 1 },
    name: 'Kansoku',
    nativeName: '観測',
    category: 'Desktop app',
    tagline: 'AI market watch. Every claim has receipts.',
    description:
      'A macOS app where AI watches the market with you. Quotes from your own brokerage account, indicators computed locally, and every conclusion archived with its full evidence chain, then scored against what actually happened.',
    stack: ['Electron', 'TypeScript', 'Sparkle', 'Local-first'],
    links: [gh('kansoku-trade/kansoku')],
    color: '#56c4ff',
    logo: '/logos/kansoku.png',
  },
  {
    id: 'libraries',
    side: 'left',
    fluid: { palette: ['#0c0d10', '#8a8f99', '#f2f4f8'], modes: [0, 1, 0, 0], warp: 0.9, speed: 0.35, scale: 1.1, density: 0.55, dissipation: 0.97, grain: 0.03, saturation: 1, stretch: 1 },
    name: 'Libraries',
    category: 'Open source',
    tagline: 'The pieces that fell out along the way.',
    description: 'Small, sharp tools extracted from the products above.',
    stack: [],
    links: [],
    color: '#c9ced8',
    libraries: [
      {
        name: 'Haklex',
        description: 'AI-agent-native rich text on Lexical. Edit, static render, SSR and server-side parse from one schema.',
        href: 'https://github.com/Innei/haklex',
      },
      {
        name: 'electron-sparkle-updater',
        description: 'Sparkle auto-updates for Electron on macOS, with bounded multi-hop delta updates.',
        href: 'https://github.com/Innei/electron-sparkle-updater',
      },
      {
        name: 'ChatKit',
        description: 'UIKit chat primitives extracted from Lody. iOS 26, Swift 6.',
        href: 'https://github.com/Innei/ChatKit',
      },
      {
        name: 'Tsuki',
        description: 'TypeScript libraries for enterprise-grade server applications on Hono.',
        href: 'https://github.com/Innei/Tsuki',
      },
    ],
  },
]

export const sectionCount = projects.length + 1

export const sections = [{ id: 'overview' as const, ...overview }, ...projects]
