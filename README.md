![Two phone screens from Zola: an inclusive design scenario and the about page](public/og-image.png)

# About

Build more accessible products. Each card describes a real person's experience and needs, which your design should accommodate. [Read more about it here](https://www.jackbush.github.io/zola/about/).

# Contributing

This project needs a breadth of lived experience. Want this to be as easy as possible, with everybody welcome to get involved.

### Non-technical contributions

Trying to make creative use of the [Issues Tracker](https://github.com/jackbush/zola/issues) so people can contribute content improvements, ideas, feedback and bug reports, and get involved in discussion, without writing code or running anything locally. If you have a GitHub account (free), you can create and post here.

### Technical contributions

Anybody is welcome to [submit a pull request (PR)](https://github.com/jackbush/zola/pulls). Just ask that any PR references an issue and includes a clear description of what it is.

# Accessibility

It's intended to reach the [WCAG 2.2 AAA standard](https://www.w3.org/TR/WCAG22/). If you spot anything falling short, please report and/or submit a fix.

# Writing scenarios

Only submit a scenario if it comes from real experience — your own, someone you know, or observations from user research or testing sessions you've run. Don't fabricate. The value of this collection is that it reflects things designers would otherwise miss; invented scenarios defeat that purpose.

Scenarios are written in first person.

**Human, not clinical.** Use common names for conditions (chemo brain, lazy eye, gamer's thumb). When a clinical term is necessary, explain it immediately after — "It's called chemo brain" — rather than assuming familiarity.

**Situation first, consequence second.** Each scenario has two parts: what is happening to this person, and how it affects their use of the web or technology. The consequence doesn't have to be stated explicitly — a behavioural detail can carry it — but the cause-and-effect chain should always be present.

**No generalisations.** Concrete detail is what makes a scenario stick. Not "a person with motor difficulties" but the exact situation: fell running to close car windows in the rain, served on a lightship in the North Atlantic, has a grabby child in one arm. These details aren't decorative — they produce the immediacy that makes the reader feel the friction.

**No pity or inspiration.** State conditions matter-of-factly. Describe coping strategies with the same neutrality as the conditions themselves. Avoid the tragedy narrative and the inspiration narrative equally.

**No longer than necessary.** We want these to be memorable, so length should follow complexity. A one-sentence scenario is fine if it says everything. Three sentences are fine if there are multiple distinct implications to convey.

**What to avoid.** Don't moralize or state the design lesson explicitly — imply it. Don't use euphemisms or describe the person purely by their condition; most scenarios establish profession, history, or personality alongside it. Don't overclaim emotional states unless they're a specific, functional consequence of the condition.

# Running locally

Built with [Astro](https://astro.build/). No database or CMS — scenarios are Markdown files in `src/content/scenarios/`.

```
npm start     # dev server with hot reload
npm run build # production build → dist/
```

To add a scenario, create a new `.md` file in `src/content/scenarios/` with a descriptive filename (used as the URL slug) and a `title` in the frontmatter.
