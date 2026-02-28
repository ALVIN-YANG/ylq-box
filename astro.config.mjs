// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://ilovestudy.club',
  integrations: [
    starlight({
      title: 'YLQ Box 2.0',
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
      sidebar: [
        {
          label: 'Java',
          autogenerate: { directory: 'java' },
        },
        {
          label: 'Ops',
          autogenerate: { directory: 'ops' },
        },
        {
          label: 'Blog',
          autogenerate: { directory: 'blog' },
        },
      ],
    }),
  ],
});
