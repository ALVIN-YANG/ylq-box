// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://ilovestudy.club',
  integrations: [
    starlight({
      title: 'Alvin Yang',
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
      },
      sidebar: [
        {
          label: 'AI',
          autogenerate: { directory: 'ai' },
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
          label: 'Java',
          autogenerate: { directory: 'java' },
          collapsed: true,
        },
        {
          label: 'Ops',
          autogenerate: { directory: 'ops' },
          collapsed: true,
        },
        {
          label: 'Network',
          autogenerate: { directory: 'network' },
          collapsed: true,
        },
        {
          label: 'Blog',
          autogenerate: { directory: 'blog' },
          collapsed: true,
        },
      ],
    }),
  ],
});
