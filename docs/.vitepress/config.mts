import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  vite: {
    plugins: [],
  },
  title: "Memory Backup",
  description: "ylq's knowledge system",
  srcDir: "docs",
  lastUpdated: true,
  cleanUrls: true,
  head: [["link", { rel: "icon", href: "/favicon.ico" }]],
  /* markdown 配置 */
  markdown: {
    lineNumbers: true,
  },
  themeConfig: {
    search: {
      provider: "local",
    },
    lastUpdatedText: "最后更新",
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: "Java",
        items: [
          {
            text: "语言基础",
            items: [
              {
                text: "基础数据类型与封装类",
                link: "/java/语言基础/基础数据类型与封装类",
              },
            ],
          },
        ],
      },
      {
        text: "运维",
        items: [
          {
            text: "网络",
            items: [
              { text: "获取用户真实IP", link: "/ops/network/获取用户真实IP" },
            ],
          },
        ],
      },
    ],

    // sidebar: [
    //   {
    //     text: 'Examples',
    //     items: [
    //       { text: 'Markdown Examples', link: '/markdown-examples' },
    //       { text: 'Runtime API Examples', link: '/api-examples' }
    //     ]
    //   }
    // ],

    outline: {
      level: "deep",
      label: "目录",
    },
    socialLinks: [{ icon: "github", link: "https://github.com/ALVIN-YANG" }],
    footer: {
      message: "京ICP备18053850号",
      copyright: "Copyright © 2024-present Luqing Yang",
    },
  },
});
