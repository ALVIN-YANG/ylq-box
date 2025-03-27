import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'YLQ Box',
  tagline: 'Memery Backup',
  favicon: 'img/favicon.ico',

  url: 'https://your-docusaurus-site.example.com',
  baseUrl: '/',

  organizationName: 'luqing.yang', // Usually your GitHub org/user name.
  projectName: 'ylq-box', // Usually your repo name.

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  customFields: {
  },
  plugins: [
    "docusaurus-plugin-sass",
    [
      "@docusaurus/plugin-ideal-image",
      {
        quality: 85,
        max: 2000,
        min: 500,
        steps: 4,
        disableInDev: false,
      },
    ],
  ],
  i18n: {
    defaultLocale: "zh-CN",
    locales: ["zh-CN"],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: 'docs',
          path: 'docs',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
        },
        theme: {
          customCss: './src/css/custom.scss',
        },
      } satisfies Preset.Options,
    ],
  ],
  themeConfig: {
    // Replace with your project's social card
    image: "img/logo-small.png",
    navbar: {
      title: 'YLQ Box',
      logo: {
        alt: 'YLQ Box Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          label: "Java",
          position: "left",
          to: "docs/java/SpringBoot/SpringBoot-Relaxed-Binding",
        },
        {
          label: "运维",
          position: "left",
          to: "docs/ops/k8s/k8s-overview",
        },
      ],
    },
    footer: {
      style: 'light',
      links: [
        {
          title: 'Connect',
          items: [
            {
              label: 'Email me',
              href: 'mailto:ylq.win@gmail.com',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()}-present Luqing Yang. \n京ICP备18053850号`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
