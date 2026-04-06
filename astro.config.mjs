// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import AstroPWA from '@vite-pwa/astro';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://ilovestudy.club',
  prefetch: true,
  integrations: [
    sitemap(),
    starlight({
      title: 'Alvin Yang',
      head: [
        {
          tag: 'link',
          attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
        },
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#2563eb' },
        },
        {
          tag: 'link',
          attrs: { rel: 'manifest', href: '/manifest.webmanifest' },
        },
        {
          tag: 'script',
          attrs: { src: '/registerSW.js', defer: true },
        },
      ],
      customCss: [
        // Path to your custom CSS file
        './src/styles/custom.css',
      ],
      social: [
        {
          label: 'GitHub',
          href: 'https://github.com/ALVIN-YANG/ylq-box',
          icon: 'github'
        }
      ],
      components: {
        Header: './src/components/CustomHeader.astro',
        Footer: './src/components/Footer.astro',
        Sidebar: './src/components/Sidebar.astro',
        Hero: './src/components/Hero.astro',
        ThemeSelect: './src/components/ThemeToggle.astro',
      },
      sidebar: [
        {
          label: 'AI',
          autogenerate: { directory: 'ai' },
        },
        {
          label: 'AI 工作流',
          autogenerate: { directory: 'ai-workflow' }
        },
        {
          label: 'Claw 专栏',
          items: [
            {
              label: 'OpenClaw',
              autogenerate: { directory: 'claw/openclaw' }
            },
            {
              label: 'ZeroClaw',
              autogenerate: { directory: 'claw/zeroclaw' }
            }
          ]
        },
        {
          label: 'Architecture',
          autogenerate: { directory: 'architecture' },
        },
        {
          label: 'AI News',
          autogenerate: { directory: 'ai-news' },
        },
        {
          label: '古法编程',
          items: [
            {
              label: 'Java',
              autogenerate: { directory: 'java' },
            },
            {
              label: '算法题解',
              autogenerate: { directory: 'algorithms' },
            }
          ],
          collapsed: true,
        },
        {
          label: 'Ops',
          items: [
            {
              label: '运维与基础设施',
              autogenerate: { directory: 'ops' },
            },
            {
              label: '网络',
              autogenerate: { directory: 'network' },
            }
          ],
          collapsed: true,
        },
      ],
    }),
    AstroPWA({
      mode: 'production',
      base: '/',
      scope: '/',
      includeAssets: ['favicon.svg'],
      registerType: 'autoUpdate',
      manifest: {
        name: 'Alvin Yang',
        short_name: 'Alvin',
        description: '技术博客 — AI、架构与实践',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{css,js,svg,png,ico,txt,woff2}'],
        navigateFallback: null,
        maximumFileSizeToCacheInBytes: 10485760, // 10MB to allow for local LLM engine JS
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
