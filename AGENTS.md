# ylq-box — Agent Guide

Personal tech site of Alvin Yang, built with Astro 5 + Starlight, deployed on Vercel (https://ilovestudy.club). Repo: https://github.com/ALVIN-YANG/ylq-box.

## Project

- **Framework**: Astro 5.x (`astro`, ESM, `type: "module"`).
- **Theme**: `@astrojs/starlight`.
- **Entry point**: `astro.config.mjs` defines site, sidebar, Starlight components and PWA config.
- **Content**: Markdown/MDX in `src/content/docs/` loaded via `src/content.config.ts` (`docsLoader()` + `docsSchema()`).
- **PWA**: `@vite-pwa/astro` with 10MB cache limit for local LLM JS bundle; `manifest.webmanifest` in `public/`.
- **Notable components**: `CustomHeader.astro`, `Footer.astro`, `Sidebar.astro`, `Hero.astro`, `ThemeToggle.astro`, `RecentNotes.astro`, `WebTerminal.astro`.
- **Notable deps**: `@mlc-ai/web-llm` (Model Arena), `@xterm/xterm` + `@xterm/addon-fit` (WebTerminal), `sharp`.

## Commands

```bash
npm run dev           # astro dev
npm run start         # alias for astro dev
npm run build         # astro build → dist/
npm run preview       # astro preview
npm run astro         # astro CLI passthrough
npm run news:daily    # node scripts/fetch-ai-news.mjs --daily
npm run news:weekly   # node scripts/fetch-ai-news.mjs --weekly
```

## Architecture

1. **Astro config** (`astro.config.mjs`) — site metadata, integrations, Starlight options, PWA config, sidebar.
2. **Content collection** (`src/content.config.ts`) — `docs` collection via Starlight loader/schema.
3. **Site content** (`src/content/docs/`) — all Markdown/MDX, organized by category.
4. **Starlight overrides** (`src/components/`) — custom Header, Footer, Sidebar, Hero, ThemeSelect.
5. **Styles** (`src/styles/custom.css`) — global theme, CJK typography, Markdown bold overrides.
6. **AI News automation** (`scripts/fetch-ai-news.mjs`) — RSS + GitHub Trending + release watch, writes to `src/content/docs/ai-news/`.
7. **Static assets** (`public/`) — icons, PWA manifest, article images (`public/images/<category>/`).

## Conventions

- **Language**: Chinese (Simplified) content; keep technical terms in English (e.g. prompt engineering, inference, orchestration).
- **Lock file**: `package-lock.json` is authoritative; `yarn.lock` is gitignored. Use `npm`.
- **New article**: create `.md` or `.mdx` in the correct `src/content/docs/<category>/`.
- **New category**: create folder, then register `autogenerate: { directory: 'category' }` in `astro.config.mjs` sidebar.
- **Images**: store under `public/images/<category>/`; prefer SVG for diagrams; WebP/PNG for photos.
- **AI News**: do not manually edit `src/content/docs/ai-news/*`; they are overwritten by the script. Fix the script, not the output.
- **Global styles**: only edit `src/styles/custom.css`; avoid inline styles in content.
- **Components**: override Starlight components via `astro.config.mjs` `components` map; custom Astro files live in `src/components/`.
- **Gitignore**: never commit `dist/`, `.astro/`, `node_modules/`, `.env*`, `.idea/`, `.opencode/`, `run.log`, `dev.log`, or `/docs/` (root-local docs only; site content is `src/content/docs/`).
- **Deployment**: push to `main` on GitHub; Vercel auto-builds and deploys. `netlify.toml` also exists but is not the primary deploy target.

## Notes


