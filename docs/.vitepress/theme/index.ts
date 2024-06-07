// https://vitepress.dev/guide/custom-theme
import { h } from 'vue'
import Theme from 'vitepress/theme';
// import Theme from 'vitepress/theme'
import GiscusComment from './components/GiscusComment.vue';
import './style.css'

export default {
  ...Theme,
  Layout: () => {
    return h(Theme.Layout, null, {
      // https://vitepress.dev/guide/extending-default-theme#layout-slots
      'doc-after': () => h(GiscusComment),
    })
  },
  enhanceApp({ app, router, siteData }) {
    // ...
  }
} 
