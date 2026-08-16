# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An Astro static site presenting accessibility personas to stress-test design inclusivity. Users cycle through scenarios via stable slug-based URLs (`/scenarios/[slug]`); the home page randomly redirects to one on load.

Accessibility target: **WCAG 2.2 AAA**.

## Commands

```bash
npm run dev        # astro dev (hot reload)
npm run build      # astro build → dist/
npm run preview    # preview production build locally
npm run deploy     # astro build && gh-pages -d dist
```

No test or lint commands exist in this project.

## Architecture

**Framework**: Astro 5, static output, no JS framework (pure `.astro` components).

**Content**: Astro Content Collection — one `.md` file per scenario in `src/content/scenarios/`. Frontmatter has only `title: string`. The filename is the slug and the sole stable identifier. To add a scenario, create a new file with a descriptive slug — no letter/index needed.

**Routing**:
- `src/pages/index.astro` — injects all slugs at build time, client-side JS redirects to a random `/scenarios/[slug]`
- `src/pages/scenarios/[slug].astro` — `getStaticPaths` from the collection; each page has "Give me another one" which filters out the current slug then navigates to a random other
- `src/pages/about.astro`, `src/pages/404.astro`

**Layout**: `src/layouts/Layout.astro` — HTML shell, nav, Google Fonts (Space Grotesk), favicon. All pages import this.

**Styles**: `src/styles/global.scss` (Swiss/bold redesign, mobile-first, `clamp()` typography). `src/styles/normalize.scss` is the CSS reset. Both imported by Layout.

**Deployment**: GitHub Pages at `https://jackbush.github.io/zola/` — `astro.config.mjs` sets `site` and `base`. Always use `import.meta.env.BASE_URL` for internal links (not hardcoded paths).

## Key Conventions

- **Adding a scenario**: create `src/content/scenarios/your-slug.md` with `title` frontmatter + body text. Everything else (routing, random selection) adapts automatically.
- **Internal links**: prefix with `import.meta.env.BASE_URL` (available in `.astro` frontmatter) or pass as `define:vars` to client scripts.
- **Scenario text styling**: the `<article>` on the scenario page uses `:global(p)` to style the rendered Markdown paragraph at display size.
- **No letter/index references** — the collection was originally A–Z but is now open-ended. Slugs are the only identifiers.

## Writing scenarios

Follow the style guide in the `# Writing scenarios` section of README.md. Additionally:

**Research first.** Always search for first-person accounts online before drafting. Base each scenario in described lived experience — don't write from assumption. Useful sources include Reddit (r/disability, r/autism, r/ChronicPain, etc.), condition-specific forums, and first-person blogs.

**When research is thin.** If strong first-person accounts can't be found, flag this before drafting rather than falling back on assumption.

**Grounding vs. fabrication.** Use research to establish the condition and its real effects. You can invent the person — their job, backstory, situation — but don't invent the experience itself. Derive the condition's impact from what people actually describe.
