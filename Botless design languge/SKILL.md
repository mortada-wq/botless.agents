---
name: botless-design
description: Use this skill to generate well-branded interfaces and assets for Botless.Chat (the Stealth Hospital / Agent Factory studio that turns product photos into 3D-animated chat agents), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation
- **Aesthetic:** Stealth Hospital / Agent Factory — black + dark grey + dark teal. Glassmorphism, blueprint floor, surgical lighting. Cool and engineering-led, never warm or neon.
- **Tokens:** `colors_and_type.css` — drop in via `<link>` and use the CSS variables.
- **Type:** Inter (UI) + JetBrains Mono (status, IDs, code). No serifs.
- **Logos:** `assets/logo-wordmark.svg` (full) and `assets/logo-mark.svg` (B-mark / favicon). Both go on obsidian only.
- **Icons:** Lucide, 1.5px stroke, line-only. No emoji in chrome.
- **UI Kit:** `ui_kits/studio/` — components.jsx exports Topbar, WardSidebar, OperatingTable, VitalsPanel, Composer, StatusBar, StatusPill. The `index.html` is a working clickable prototype.

## Brand pillars
Recognizable · Subtle · Warm · Intentional · Delightful. The product is always first; chrome never competes with the character on stage.

## Hard rules
- No warm tones (no oranges, no purples, no SaaS blue). Teal is the only accent.
- Color is signal, not decoration. Reserve teal for active state, focus rings, and the agent-thinking pulse.
- No emoji in chrome, marketing, agent replies, or docs.
- No serifs. Inter only.
- All easing uses `cubic-bezier(0.4, 0, 0.2, 1)` — the sliding glass door.
