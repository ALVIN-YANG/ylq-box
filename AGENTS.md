# ylqMemoryBackup (ylq-box) — Agent Guide

Personal tech site of Alvin Yang. Built with Astro + Starlight, deployed on Vercel.

- **Live URL**: https://ilovestudy.club
- **Repo**: https://github.com/ALVIN-YANG/ylq-box
- **Deploy**: GitHub → Vercel (push-to-deploy)

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | [Astro](https://astro.build) 5.x |
| Docs Theme | [Starlight](https://starlight.astro.build) |
| Content | Markdown / MDX in `src/content/docs/` |
| Collections | `src/content.config.ts` using `docsLoader()` |
| Styling | `src/styles/custom.css` (global theme, CJK typography, Markdown bold) |
| PWA | `@vite-pwa/astro` with `manifest.webmanifest` |
| Images | `sharp` for optimization; prefer SVG for diagrams |
| Sitemap | `@astrojs/sitemap` |

### Notable Integrations

- `@mlc-ai/web-llm` — in-browser LLM inference (Model Arena)
- `@xterm/xterm` + `@xterm/addon-fit` — WebTerminal component
- Custom Starlight components: `CustomHeader`, `Footer`, `Sidebar`, `Hero`, `ThemeToggle`

---

## Project Structure

```
ylqMemoryBackup/
├── astro.config.mjs          # Site config, sidebar, PWA, Starlight options
├── src/
│   ├── content.config.ts     # Astro content collections (docs schema)
│   ├── content/docs/         # All site content (Markdown/MDX)
│   │   ├── index.mdx         # Homepage
│   │   ├── about.mdx         # About page
│   │   ├── ai/               # AI topics
│   │   ├── ai-workflow/      # OMO, superpowers, AI Coding workflows
│   │   ├── ai-news/          # Auto-generated daily/weekly AI news
│   │   ├── architecture/     # System architecture
│   │   ├── projects/         # Side projects & demos
│   │   ├── claw/             # Claw column (openclaw, zeroclaw)
│   │   ├── java/             # Java notes
│   │   ├── algorithms/       # Algorithm solutions
│   │   ├── ops/              # DevOps & infrastructure
│   │   ├── network/          # Networking
│   │   ├── blog/             # General blog posts
│   │   └── opencode/         # Opencode-related
│   ├── components/           # Astro components
│   │   ├── CustomHeader.astro
│   │   ├── Footer.astro
│   │   ├── Sidebar.astro
│   │   ├── Hero.astro / HeroAnimation.astro
│   │   ├── ThemeToggle.astro
│   │   ├── RecentNotes.astro
│   │   └── WebTerminal.astro
│   └── styles/custom.css     # Global styles, CJK fonts
├── public/                   # Static assets
│   └── images/ai/            # AI article images (prefer SVG)
├── scripts/
│   └── fetch-ai-news.mjs     # AI News automation script
└── dist/                     # Build output (gitignored)
```

### Sidebar Configuration

The sidebar is defined in `astro.config.mjs` under the `starlight.sidebar` array. Content directories are auto-generated via `autogenerate: { directory: 'folder-name' }`. If you add a new top-level content category, register it there.

---

## Build & Dev Commands

```bash
# Development
npm run dev          # astro dev

# Build
npm run build        # astro build → dist/
npm run preview      # astro preview

# AI News automation
npm run news:daily   # node scripts/fetch-ai-news.mjs --daily
npm run news:weekly  # node scripts/fetch-ai-news.mjs --weekly
```

Dependency lock file: `package-lock.json` (do not commit `yarn.lock`).

---

## Content Conventions

### Language & Tone

- **Primary language**: Chinese (Simplified)
- **Technical terms**: Keep English (e.g., "prompt engineering", "inference", "orchestration")
- **Tone**: Personal, reflective, hands-on. Write as if explaining to a peer over coffee.
- **Purpose**: Personal thinking, retrospectives, side-project showcases.

### File Organization

- Place new articles under the correct `src/content/docs/<category>/` directory.
- Use `index.mdx` for category landing pages when needed.
- AI News entries follow the naming pattern: `YYYY-MM-DD-daily.md` or `YYYY-MM-DD-weekly.md`.

### Frontmatter

Starlight uses standard frontmatter. Common fields:

```yaml
---
title: "Article Title"
description: "Short summary for SEO and previews"
---
```

### Images

- Store article images in `public/images/<category>/`.
- **Prefer SVG** for diagrams and schematics.
- Use `sharp`-friendly formats (WebP, PNG) for photos.

### AI News Automation

The `scripts/fetch-ai-news.mjs` script generates daily/weekly AI news pages. Do not manually edit auto-generated `ai-news/*` files; they will be overwritten on the next run. If the script breaks, fix the script, not the output.

---

## Customization Rules

- **Global styles**: Only edit `src/styles/custom.css`. Avoid inline styles in content.
- **Starlight components**: Override via `astro.config.mjs` `components` map. Custom components live in `src/components/`.
- **PWA config**: Adjust in `astro.config.mjs` under the `AstroPWA()` integration. Manifest theme color is `#2563eb`.

---

## Deployment

1. Push to the `main` branch on GitHub.
2. Vercel auto-builds and deploys.
3. Verify at https://ilovestudy.club.

No manual Vercel CLI or build uploads needed.

---

## Common Tasks

| Task | How |
|------|-----|
| Add a new article | Create `.md` or `.mdx` in `src/content/docs/<category>/` |
| Add a new category | Create folder + register in `astro.config.mjs` sidebar |
| Update site theme | Edit `src/styles/custom.css` |
| Update header/footer | Edit `src/components/CustomHeader.astro` / `Footer.astro` |
| Regenerate AI news | Run `npm run news:daily` or `npm run news:weekly` |
| Add a new component | Create `.astro` in `src/components/`, reference in config or content |

---

## Gotchas

- `/docs/` at repo root is **gitignored** (local docs). Site content is in `src/content/docs/`.
- `yarn.lock` is gitignored; use `npm` and `package-lock.json`.
- PWA cache limit is raised to 10MB to accommodate the local LLM engine JS bundle.
- Do not commit `dist/`, `.idea/`, `.opencode/`, or log files.
