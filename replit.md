# botless.agents

A platform for building and managing AI-powered agents with video avatars, voice interaction, and intelligent conversation.

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend/Database**: Convex (real-time serverless backend)
- **State Management**: TanStack Query + Convex
- **UI**: Radix UI primitives, Lucide React icons, Motion (Framer Motion)
- **Routing**: React Router DOM v7
- **Authentication**: OIDC via `react-oidc-context` (local dev: `scripts/local-oidc.mjs`)
- **AI Providers**: OpenAI, Anthropic, SiliconFlow
- **Package Manager**: pnpm
- **Node.js**: 22

## Project Structure

- `src/` — React frontend application
  - `pages/` — Route-based pages (dashboard, agent, embed, marketplace)
  - `components/` — Reusable UI components and providers
  - `hooks/` — Custom React hooks
  - `lib/` — Utility functions and media processing
- `convex/` — Backend schema, queries, mutations, actions
- `scripts/` — Development scripts (local OIDC provider)
- `public/` — Static assets
- `Botless design languge/` — Design system preview and assets

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- `VITE_CONVEX_URL` — Convex deployment URL (from `npx convex dev`)
- `VITE_OIDC_AUTHORITY` — OIDC authority URL
- `VITE_OIDC_CLIENT_ID` — OIDC client ID

Optional:
- `OPENAI_API_KEY` — For LLM chat fallback (set on Convex via `npx convex env set`)

## Development

1. Start local OIDC: `pnpm local:oidc`
2. Start Convex: `npx convex dev`
3. Start frontend: `pnpm dev` (runs on port 5000)

## Deployment

Configured as a static site (Vite SPA):
- Build: `pnpm run build`
- Public dir: `dist`
