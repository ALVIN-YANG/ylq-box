// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import AstroPWA from '@vite-pwa/astro';
import sitemap from '@astrojs/sitemap';
import mermaid from 'astro-mermaid';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.mlxb.cc',
  prefetch: true,
  integrations: [
    mermaid({
      theme: 'default',
      autoTheme: true,
    }),
    sitemap(),
    starlight({
      title: 'Alvin Yang',
      favicon: '/favicon.png',
      description: '关于 AI Agent、软件架构与工程实践的技术文章',
      locales: {
        root: { label: '简体中文', lang: 'zh-CN' },
      },
      tableOfContents: {
        minHeadingLevel: 2,
        maxHeadingLevel: 2,
      },
      head: [
        {
          tag: 'link',
          attrs: { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
        },
        {
          tag: 'meta',
          attrs: { name: 'theme-color', content: '#f7f8fa' },
        },
        {
          tag: 'link',
          attrs: { rel: 'manifest', href: '/manifest.webmanifest' },
        },
        {
          tag: 'script',
          attrs: { src: '/registerSW.js', defer: true },
        },
        {
          tag: 'script',
          attrs: { src: '/mermaid-zoom.js', defer: true },
        },
      ],
      customCss: [
        // Path to your custom CSS file
        './src/styles/custom.css',
      ],
      social: [
        {
          label: 'GitHub',
          href: 'https://github.com/ALVIN-YANG/alvin-notes',
          icon: 'github'
        }
      ],
      components: {
        Head: './src/components/Head.astro',
        Header: './src/components/CustomHeader.astro',
        Footer: './src/components/Footer.astro',
        Sidebar: './src/components/Sidebar.astro',
        Hero: './src/components/Hero.astro',
        PageTitle: './src/components/PageTitle.astro',
        ThemeSelect: './src/components/ThemeToggle.astro',
      },
      sidebar: [
        {
          label: 'Projects',
          autogenerate: { directory: 'projects' },
        },
        {
          label: 'AI Agent',
          autogenerate: { directory: 'ai' },
        },
        {
          label: 'AI 工作流',
          autogenerate: { directory: 'ai-workflow' }
        },
        {
          label: 'OpenClaw',
          autogenerate: { directory: 'claw/openclaw' }
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
          label: '算法',
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
          label: '网络',
          autogenerate: { directory: 'network' },
        },
        {
          label: '安全',
          autogenerate: { directory: 'security' },
        },
        {
          label: 'Ops',
          items: [
            {
              label: '运维与基础设施',
              autogenerate: { directory: 'ops' },
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
      includeAssets: ['favicon.png'],
      registerType: 'autoUpdate',
      manifest: {
        name: 'Alvin Yang',
        short_name: 'Alvin',
        description: '技术博客 — AI、架构与实践',
        theme_color: '#f7f8fa',
        background_color: '#f7f8fa',
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
