# Botless.Chat — Design System

> The **Stealth Hospital** — a precision factory for living agents.

Botless.Chat (formerly Toolstoy) is an e-commerce platform that transforms static product images into **3D-animated, voice-and-personality-driven characters** — products that wave, point to features, demonstrate functions, and answer customer questions using their own manuals. The product becomes the interface, replacing the chatbot text bubble.

This is the design system for the **Botless Studio** — the merchant-facing factory where products are uploaded, rigged, given a personality, and shipped as embeddable 3D agents.

---

## The Concept

The studio is a **factory** and a **hospital**. Products arrive as 2D photos and leave as living, rigged characters. Inside the studio, agents are "patients" on operating tables: they get scanned (Claude 3 Vision), sutured to a manual (Textract → vector index), animated (Meshy.ai → .glb), and given a personality. The UI mirrors that mental model: blueprint floor, surgical lighting, vitals panels, glass instrumentation.

### Core pillars
- **Recognizable** — the product is always first. Chrome never competes with the character on stage.
- **Subtle** — instrumentation, not decoration. Color is reserved for status and signal.
- **Warm** — surgical, not sterile. The teal accent breathes; the room is dim, not dead.
- **Intentional** — every panel earns its surface. No filler.
- **Delightful** — the agent is alive on stage. Hover bleeds in like a soft radial bloom, never a hard switch.

### Merchant journey
1. Upload 2–3 product photos
2. Upload PDF manuals
3. Choose a personality (Friendly Helper, Professional Expert, …)
4. Embed one line of code

---

## Sources

- **GitHub repo:** [`mortada-wq/botless`](https://github.com/mortada-wq/botless) — FastAPI + React 19 + Neon Postgres, AWS Amplify hosting. The `frontend/` subtree was imported into this project under `frontend/` for reference; `frontend/src/components/*.jsx` and `frontend/src/index.css` are the canonical UI starting point.
- **`design_guidelines.json`** in the repo (full text reproduced below in this folder if you need it) describes an *earlier* organic/terracotta direction. **This system supersedes that** — see "About the pivot" below.
- **`TASKS.md`** in the repo — describes the dark theme + token migration that this system codifies.
- **Logos** — `assets/logo-wordmark.svg` (greyscale gradient "botless" wordmark) and `assets/logo-mark.svg` (the standalone "B" mark) were both supplied by the user.

### About the pivot
The original `design_guidelines.json` proposes an organic, terracotta + bone-white "Light Theme" (Cormorant Garamond + Outfit). Late-cycle direction from the founder pivoted to a **"Stealth Hospital" / Agent Factory** aesthetic — black/dark grey/dark teal, glassmorphism, blueprint grid, **Inter + JetBrains Mono**. This design system implements the pivot. The repo's React components keep their structure (sidebar, AvatarStage, ChatPanel) but get re-skinned with the new tokens.

---

## Index

| File / folder | Purpose |
|---|---|
| `README.md` | You are here. Brand, content, visual foundations, iconography. |
| `colors_and_type.css` | All color + type tokens. Drop-in `<link>` for any artifact. |
| `assets/` | Logos, favicons, brand marks. |
| `fonts/` | (Webfonts are loaded from Google Fonts; see CSS.) |
| `preview/` | Design system cards — small HTML specimens that populate the Design System tab. |
| `ui_kits/studio/` | The Botless Studio — high-fidelity React JSX recreations of the merchant app. |
| `SKILL.md` | Agent-skill manifest, so this folder is portable to Claude Code. |

---

## CONTENT FUNDAMENTALS

### Voice
Botless writes like a **calm engineer who happens to love characters**. Precise, never breathless. The product is doing something genuinely novel — the copy doesn't have to oversell.

- **Person.** "We" for the company, "you" for the merchant, "your agent" for the character. The character itself speaks in the first person inside chat (`first_person: true` on AgentPersonality). Never "I" in marketing copy.
- **Casing.** Sentence case for everything — buttons, headers, nav, toasts. Title Case is reserved for proper-noun product names ("Botless Studio", "Operating Table", "Agent Ward"). All-caps only for overlines and mono labels (`STATUS`, `RIGGING`).
- **Length.** Buttons 1–3 words. Marketing headlines ≤ 8 words. Body paragraphs ≤ 3 sentences. If a sentence has two clauses joined by "and", split it.
- **Specificity.** Numbers over adjectives. Not "lightning fast"; "ready in 90 seconds". Not "lots of personalities"; "12 animation states".

### Tone by surface
| Surface | Tone | Example |
|---|---|---|
| Marketing landing | Confident, slightly poetic. One verb per line. | "Your product, but it talks back." |
| Studio chrome (nav, buttons) | Operational, terse. | "New agent", "Rig model", "Open ward" |
| Status pills | Mono, single word. | `READY`, `RIGGING`, `SYNCING PDF` |
| Chat (agent → customer) | Warm, first-person, helpful. Personality-modulated. | "Hi — I'm Aurora. Want me to show you how I unscrew?" |
| Errors | Honest. State what broke and what to do. | "Couldn't reach Meshy. Retry, or upload a different angle." |
| Empty states | Inviting, never apologetic. | "No agents yet. Drop a product photo to begin." |
| Speaker notes / docs | Plain. Like a senior engineer writing a runbook. | — |

### Specifics
- **No emoji** in product chrome, marketing, or docs. The brand has its own iconography (Lucide). Emoji are allowed *only* in user-authored chat content from the merchant's customers — never in agent replies.
- **No exclamation points** outside of agent chat (where personality permits). Marketing uses periods.
- **No "AI-powered", no "revolutionary", no "seamless"**. We say what the product does, not how disruptive it is.
- **Mono is for facts.** Use JetBrains Mono for IDs, status, file names, latencies, code, and "agent logic" sections — never for prose.
- **Numerals.** Use digits for quantities (`12 states`, `3 photos`). Spell out only "one" when contrasting ("one line of code").

### Example copy (real, from this system)

> **Hero**
> Your product, but it talks back.
> Drop a photo. We'll rig it, give it a voice, and embed it in your store in under 5 minutes.

> **Empty state — no agents**
> No agents on the floor. Upload a product photo to start a new one.

> **Status pills**
> `READY` · `RIGGING` · `SYNCING PDF` · `HEALING` · `OFFLINE`

> **Agent chat (Friendly Helper)**
> Hi — I'm Aurora. I'll show you how I work. Want to start with the lid, or the pump?

> **Agent chat (Professional Expert)**
> I'm the SRX-200. I have three operating modes. Which would you like to see first?

---

## VISUAL FOUNDATIONS

### Palette — the Stealth Hospital
A cool, surgical, high-tech palette. **Strip away every warm tone.** No oranges, no purples, no SaaS blue. The room is obsidian; the instruments glow teal.

| Role | Token | Hex |
|---|---|---|
| Primary background (deepest) | `--bg-obsidian` | `#0A0A0B` |
| App nav / topbar | `--bg-graphite` | `#0F1117` |
| Floors / panels | `--bg-secondary` | `#161B22` |
| Hover surface | `--bg-elevated` | `#1C222C` |
| Inputs / chips | `--bg-tertiary` | `#232A36` |
| Strokes (glass edge) | `--stroke-soft` | `rgba(255,255,255,0.08)` |
| **Accent (medical glow)** | `--teal-400` | `#0A9396` |
| Accent deep (strokes, headers) | `--teal-600` | `#005F73` |
| Status: ready | `--status-ready` | `#2BA697` |
| Status: rigging | `--status-rigging` | `#E8B341` |
| Status: syncing | `--status-syncing` | `#5E9DF2` |
| Ink primary | `--ink-primary` | `#F5F7FA` |
| Ink muted | `--ink-tertiary` | `#8A93A4` |

**Color discipline.** Color is signal, not decoration. Teal appears only on: live accent state (focus, primary CTA, agent "thinking" pulse), status indicators, and active sidebar item. Everything else lives in greyscale + white-strokes.

### Type
- **Inter** — UI, marketing, chat. Weights 300/400/500/600/700.
- **JetBrains Mono** — overlines, status pills, IDs, file names, code, "agent logic" sections. Weights 400/500/600.
- **Display** — `Inter 600`, `-0.02em`. No serifs, no display fonts. We rejected Cormorant Garamond when we pivoted; the brand wants precision, not poetry.
- **Scale.** 11 / 12 / 13 / 14 / 15 / 18 / 24 / 32 / 44. Strict; don't invent sizes.
- **Tracking.** Headlines `-0.02em`. Body `0`. Mono caps `0.12em`.

### Spacing
4px base unit. **Generous padding on glass panels** — never cramped. Studio chrome uses `p-6` to `p-8` for content containers. Status pills tighten to `padding: 4px 10px`.

### Backgrounds
- **The Floor.** A subtle CSS-grid blueprint: minor lines every 20px in faint teal (`rgba(10,147,150,0.05)`), major lines every 100px in faint white (`rgba(255,255,255,0.04)`). Always over `--bg-obsidian`.
- **No imagery in chrome.** No hero photos, no illustrations, no gradients-as-decoration. Imagery only appears as: agent thumbnails (the product itself) and the 3D viewport (the rigged character).
- **No grain, no noise.** The original system had film grain; we removed it. The hospital is clean.
- **Spot lighting.** Glass panels get a `radial-gradient(60% 50% at 50% 0%, rgba(10,147,150,0.10), transparent)` "operating-table light" coming from the top.

### Animation
- **Easing:** `cubic-bezier(0.4, 0, 0.2, 1)` — the "sliding glass door". Use for every panel open/close, every modal, every menu reveal.
- **Durations:** `120ms` (micro), `200ms` (default), `320ms` (panel), `520ms` (page).
- **No bounces, no springs.** Motion is weighted and surgical.
- **Teal pulse** for "thinking" / "healing" / "rigging" — a soft outward radial glow, 2.4s loop. Never harsh.
- **Hover bloom.** When you hover an agent card, the teal accent **bleeds in as a soft radial gradient** (0.35s ease) — never a hard color switch.
- **Avatar states.** Idle = breathe (4s scaleY 1→1.02). Listening = lean (slight 2deg rotate + 1.05 scale). Talking = pulse-ring of teal. Thinking = 3 floating dots above + slight desaturate. Excited = small bounce. Celebrating = teal confetti burst.

### Hover, press, focus
- **Hover (interactive):** lighten background to `--bg-elevated`, OR teal radial bloom on cards. Never opacity changes — those feel cheap.
- **Press:** `transform: scale(0.98)` + drop to a darker bg. Duration 80ms.
- **Focus:** **Always** a 1px teal ring (`--teal-400`) at 2px offset. Never the browser default.
- **Disabled:** 0.4 opacity + `cursor: not-allowed`. No greyscale filter.

### Borders
- Default panel: `1px solid rgba(255,255,255,0.08)` — the "glass edge".
- Cards on dark: `1px solid rgba(255,255,255,0.06)`.
- Active / focused: `1px solid var(--teal-400)`.
- **No double borders, no inset highlights** except inside `.glass-strong` which gets a `0 1px 0 rgba(255,255,255,0.04) inset` to suggest the top edge of glass.

### Shadows
- `--shadow-sm` — `0 1px 2px rgba(0,0,0,0.4)` for chips, pills.
- `--shadow-md` — `0 8px 24px -8px rgba(0,0,0,0.6)` for floating cards.
- `--shadow-lg` — `0 24px 60px -20px rgba(0,0,0,0.7)` for the operating-table panel.
- `--shadow-glass` — combines an inset top-edge highlight with a deep drop. Used on every floating glass surface.
- `--shadow-teal` — reserved. Active CTA, focused agent, "thinking" pulse.

### Transparency & blur
- All floating panels use `rgba(22, 27, 34, 0.62)` + `backdrop-filter: blur(14px)` — the "glass". The strong variant goes to 0.78 + 20px blur.
- Modals and menus = glass-strong over a 60%-opacity obsidian scrim.
- **Never blur over imagery** — the floor is a dark grid, so blur reads as glass, not as background frosting.

### Imagery
- **Mood:** cool, slightly desaturated, top-lit. Like product photography for a precision-instruments catalog.
- **Treatment:** product images on agent cards are placed on `--bg-secondary` with a 1px hairline border. No drop-shadows on product photos themselves; the card carries the elevation.
- **3D viewport:** transparent background; the obsidian floor + grid show through.

### Corner radii
`4 / 6 / 10 / 14 / 20 / 28` and `9999` for pills. Default for cards: `14px`. Default for the "operating table" central panel: `28px`. Inputs: `10px`. Buttons: `10px` for default, `9999px` for pills (status, agent chips).

### Cards
- **Standard card:** `--bg-secondary`, `1px solid rgba(255,255,255,0.06)`, `r-lg` (14px), `--shadow-md` on hover.
- **Glass card (floating panels, vitals):** glass blur, `--shadow-glass`, `r-lg`.
- **The Operating Table (central viewport):** glass-strong, `r-2xl` (28px), spot-light overlay, no other ornament.
- **Agent card (the Ward list):** standard card + status dot top-right + teal-pulse on the dot if status is "rigging" / "syncing".

### Layout rules
- **3-column studio:** Left rail 240px (Ward — agent list), Center fluid (Operating Table + composer), Right rail 320px (Vitals / Personality / Knowledge).
- **Marketing pages:** 1280px max content width, centered. 1px hairline divider every section, no full-bleed backgrounds.
- **Topbar:** 56px tall, glass, sticky.
- **Status bar (footer):** 28px tall, `--bg-graphite`, mono text, shows current job.
- **Z-stack:** floor (0) → cards (10) → glass panels (20) → modals (40) → toasts (50) → tooltips (60).

---

## ICONOGRAPHY

**System:** [`lucide-react`](https://lucide.dev) — the same set the codebase uses (`AppShell.jsx` already imports `LayoutDashboard, Bot, BookOpen, Code2, BarChart3, Settings, Plus, LogOut, ShieldCheck`). Lucide is loaded from CDN in design artifacts via `https://unpkg.com/lucide@latest`. **Stroke weight: 1.5px. Size: 16/18/20/24.** No filled icons; the brand is line-art only.

**Logos.**
- `assets/logo-wordmark.svg` — the full "botless" wordmark, monochrome with a subtle E4E4E4→5D5B5B left-to-right gradient. Use on headers and marketing.
- `assets/logo-mark.svg` — the standalone "B" mark (favicon, app icon, sidebar collapsed state). Has a faint blue-grey gradient that reads as cool charcoal in the dark theme. **Always on `--bg-obsidian`.** Do not place on any teal or near-white surface.

**Brand glyphs / illustrations.** None exist yet. Do **not** invent SVG illustrations or hero blobs. If a surface needs visual interest, use the blueprint floor, glass panels, or the agent itself.

**Emoji.** Not used in product chrome, marketing, agent replies, or docs. The brand reads cool and engineering-led; emoji break that register. The only place emoji legitimately appear is incoming customer chat text rendered as-is — we don't strip them, we just don't author them.

**Unicode glyphs.** Used sparingly for arrows in copy: `→` in CTAs ("Open studio →"), `·` as dot separators in metadata. Never `★`, `✓`, `✗` — those are icons, use Lucide.

**Custom marks for the studio metaphor.** When we need a "factory floor" feel, we use a small set of Lucide icons consistently:
- `Activity` — for "vitals" panels
- `Cpu` / `CircuitBoard` — for "rigging" status
- `BookOpen` / `FileText` — for "manual" / "knowledge"
- `Stethoscope` — for the "ward" sidebar (the metaphorical hospital)
- `Beaker` — for "personality lab"

If a needed icon is genuinely absent from Lucide, **flag it to the user** rather than substitute from another set or hand-roll an SVG.

---

## CAVEATS & FONT NOTES

- **Fonts** are loaded from Google Fonts CDN (Inter, JetBrains Mono) via `colors_and_type.css`. No `.ttf` files are bundled. If you need offline / brand-locked font files, request them from the user.
- **The Cormorant Garamond + Outfit pairing** from the original `design_guidelines.json` is **deliberately abandoned** — flag if anyone reverts to it.
- **No video / animation samples** for the avatar states yet. The avatar viewport is currently CSS-driven; once Meshy.ai .glb output is available, the AvatarStage component will swap to a Three.js canvas.
- **Imagery library** is empty; do not pull from Pexels (those URLs in `design_guidelines.json` belong to the abandoned terracotta direction).
