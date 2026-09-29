import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

import { projects } from './src/data/projects'

const SITE = 'https://works.innei.dev/'

function structuredData(): Plugin {
  const products = projects.filter((p) => !p.libraries)
  const libraries = projects.flatMap((p) => p.libraries ?? [])
  const json = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Innei — Selected work, 2026',
    url: SITE,
    author: { '@type': 'Person', name: 'Innei', url: 'https://innei.in', sameAs: ['https://github.com/Innei'] },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: [
        ...products.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'SoftwareApplication',
            name: p.name,
            applicationCategory: p.category,
            description: `${p.tagline} ${p.description}`,
            ...(p.links[0] && { url: p.links[0].href }),
          },
        })),
        ...libraries.map((l, i) => ({
          '@type': 'ListItem',
          position: products.length + i + 1,
          item: { '@type': 'SoftwareSourceCode', name: l.name, description: l.description, codeRepository: l.href },
        })),
      ],
    },
  }
  return {
    name: 'structured-data',
    transformIndexHtml: () => [
      { tag: 'script', attrs: { type: 'application/ld+json' }, children: JSON.stringify(json), injectTo: 'head' },
    ],
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), structuredData()],
})
