// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://ilovestudy.club',
  integrations: [
    starlight({
      title: 'YLQ Box',
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
      },
      sidebar: [
        {
          label: 'AI',
          autogenerate: { directory: 'ai' },
        },
        {
          label: 'AI News',
          autogenerate: { directory: 'ai-news' },
        },
        {
          label: 'Java',
          autogenerate: { directory: 'java' },
        },
        {
          label: 'Ops',
          autogenerate: { directory: 'ops' },
        },
        {
          label: 'Network',
          autogenerate: { directory: 'network' },
        },
        {
          label: 'Blog',
          autogenerate: { directory: 'blog' },
        },
      ],
    }),
  ],
});
