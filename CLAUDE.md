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
npm run og         # build, then regenerate public/og-image.png (needs Chrome installed)
                   # add `-- --cover <path>` to also write a 2× copy there
```

A post-commit hook (`.githooks/post-commit`; enable with `git config core.hooksPath .githooks`) runs `npm run og` after any commit touching `src/` or the script, writing the 2× cover into `../jackbush.github.io` when that checkout exists. The regenerated images are left uncommitted.

No test or lint commands exist in this project.

## Architecture

**Framework**: Astro 5, static output, no JS framework (pure `.astro` components).

**Content**: Astro Content Collection — one `.md` file per scenario in `src/content/scenarios/`. Frontmatter has only `title: string`. The filename is the slug and the sole stable identifier. To add a scenario, create a new file with a descriptive slug — no letter/index needed.

**Routing**:
- `src/pages/index.astro` — injects all slugs at build time, client-side JS redirects to a random `/scenarios/[slug]`
- `src/pages/scenarios/[slug].astro` — `getStaticPaths` from the collection; each page has a "Show another scenario" button which filters out the current slug then navigates to a random other
- `src/pages/all.astro` (every scenario, alphabetical), `src/pages/about.astro`, `src/pages/404.astro`

**Layout**: `src/layouts/Layout.astro` — HTML shell, nav (wordmark is "zola" in braille dots, drawn as SVG and hidden from screen readers, then the word), Google Fonts (Space Grotesk), favicon. All pages import this.

**Components**: `src/components/Icon.astro` renders a decorative Phosphor icon (`@phosphor-icons/core`, bold weight, `?raw` import). `src/components/NewTabLink.astro` — use for every `target="_blank"` link; adds the visible icon and the "(opens in new tab)" text for screen readers.

**Styles**: `src/styles/global.css` (Swiss/bold, mobile-first, `clamp()` typography with `rem` bounds so the browser's text size setting applies), imported by Layout.

**Deployment**: GitHub Pages at `https://jackbush.github.io/zola/` — `astro.config.mjs` sets `site` and `base`. Always use `import.meta.env.BASE_URL` for internal links (not hardcoded paths).

## Key Conventions

- **Adding a scenario**: create `src/content/scenarios/your-slug.md` with `title` frontmatter + body text. Everything else (routing, random selection) adapts automatically.
- **Internal links**: prefix with `import.meta.env.BASE_URL` (available in `.astro` frontmatter) or pass as `define:vars` to client scripts.
- **Scenario text styling**: the `<article>` on the scenario page uses `:global(p)` to style the rendered Markdown paragraph at display size.
- **No letter/index references** — the collection was originally A–Z but is now open-ended. Slugs are the only identifiers.

## Accessibility conventions

Decisions from the AAA audit; keep them when changing the design.

- **Pink is never a text colour** (1.7:1 on light). Use it as a block behind dark text (`.eyebrow--highlight`) or as an underline via `--link-line`.
- **Text is at least 16px** (`1rem`); sizes are in `rem` so browser text settings apply.
- **Targets are at least 44px**, padded out with matching negative margins so the layout doesn't move.
- **Dark-mode text is #e0e0e0, not white**, to avoid halation; `prefers-contrast: more` gets #f0f0f0 and turns muted and pink text to full strength.
- **The nav must fit 200% text plus WCAG 1.4.12 spacing.** A container query swaps the wordmark for a house "Home" link when it doesn't; re-measure its `em` threshold if nav content changes.
- **Under 480px tall**, the nav and CTA scroll with the page instead of being fixed.
- **Icons are decorative** (`Icon.astro`, `aria-hidden`); the visible text must carry the meaning and match the accessible name.

## Writing scenarios

Follow the style guide in the `# Writing scenarios` section of README.md. Additionally:

**Research first.** Always search for first-person accounts online before drafting. Base each scenario in described lived experience — don't write from assumption. Useful sources include Reddit (r/disability, r/autism, r/ChronicPain, etc.), condition-specific forums, and first-person blogs.

**When research is thin.** If strong first-person accounts can't be found, flag this before drafting rather than falling back on assumption.

**Grounding vs. fabrication.** Use research to establish the condition and its real effects. You can invent the person — their job, backstory, situation — but don't invent the experience itself. Derive the condition's impact from what people actually describe.

**Plain language (WCAG AAA).** Spell out abbreviations on first use (3.1.4) and aim for a reading level of US grade 9 or below (3.1.5). Existing scenarios still to fix: ME, MD, CVV, RSI and BSL are unexpanded, and six scenarios read above grade 10.
