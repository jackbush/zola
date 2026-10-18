# Zola

Build more accessible products. Each card describes a real person's experience and needs, which your design should accommodate. [Read more about it here](https://www.jackbush.github.io/zola/about/).

![Two phone screens from Zola: an inclusive design scenario and the about page](public/og-image.png)

## Submitting scenarios

Only submit a scenario if it comes from real experience: can be your own, someone you know, or primary research.

### Do
- **Human, not clinical.** Use common names for conditions. When a clinical term is necessary, explain it.
- **Situation then consequence.** What is happening to this person, then how it affects their use of technology.
- **No generalisations.** Concrete detail is vital, it lets the user visualise the situation.
- **No pity or inspiration narratives.** State conditions and coping strategies neutrally. Don't moralise.
- **No longer than necessary.** We want these to be memorable, so length should follow complexity.
- **Use the first person.** To keep things evenly weighted and consistent.

### Don't 
- Don't state the design lesson explicitly, imply it from situation and consequence.
- Don't claim emotional states unless they're a specific, functional consequence of the condition.
- Don't use euphemisms, stick to direct and neutral language.

## Accessibility

We target [WCAG 2.2 AAA](https://www.w3.org/TR/WCAG22/) but it hasn't been widely tested. If you find a bug, please [raise an issue here](https://github.com/jackbush/zola/issues).

## Running locally

Built with [Astro](https://astro.build/). No database or CMS — scenarios are Markdown files in `src/content/scenarios/`.

```
npm start     # dev server with hot reload
npm run build # production build → dist/
```

To add a scenario, create a new `.md` file in `src/content/scenarios/` with a descriptive filename (used as the URL slug) and a `title` in the frontmatter.
