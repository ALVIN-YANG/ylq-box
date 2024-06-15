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
    displayAllHeaders: true,
    search: {
      provider: "local",
    },
    lastUpdated: { text: "最后更新"},
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
                link: "/java/1-base/基础数据类型与封装类",
              },
            ],
          },
        ],
      },
      {
        text: "运维",
        items: [
          {
            text: "1-网络",
            items: [
              { text: "获取用户真实IP", link: "/ops/1-network/1-获取用户真实IP" },
            ],
          },
          {
            text: "DevOps工具",
            items: [
              {text: "k8s", link: '/ops/2-k8s/1-k8s概览与相关索引'}
            ],
          },
        ],
      },
    ],

    sidebar: {
      '/ops/2-k8s/': [
        {
          text: '1-k8s概览与相关索引',
          link: '/ops/2-k8s/1-k8s概览与相关索引',
        },
        {
          text: '2-k8s资源对象定义',
          items: [
            {text: 'k8s资源对象定义', link: '/ops/2-k8s/2-k8s资源对象定义/2-k8s资源对象定义'}
          ]
        }
      ],
    },

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
