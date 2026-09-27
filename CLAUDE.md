# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

Fresh `create-next-app` scaffold (single initial commit) — `app/page.tsx` is still template content. No tests, no test runner, no data layer yet.

## Commands

- `npm run dev` — dev server at http://localhost:3000 (also regenerates the Next.js block in `AGENTS.md`)
- `npm run build` — production build; also the type-check (no separate `tsc` script)
- `npm run lint` — ESLint 9 flat config (`eslint.config.mjs`: next core-web-vitals + typescript)

## Stack

- Next.js 16.3 App Router (`app/`), React 19.2, TypeScript strict
- Next.js 16 differs from training data: check `node_modules/next/dist/docs/` (`01-app/`, `index.md`) before using Next APIs. E.g. layouts use the global generated `LayoutProps<"/">` type (from `.next/types`), not hand-written props.
- Tailwind CSS v4 via `@tailwindcss/postcss` — no `tailwind.config.*`; theme tokens live in `app/globals.css` under `@theme inline`, light/dark via CSS vars + `prefers-color-scheme`.
- Path alias `@/*` → project root.
- Fonts: Geist / Geist Mono via `next/font/google` in `app/layout.tsx`.

## Repo layout

The git repo is `viaje-mamas/`. The parent folder (`Viaje_mamas/`) holds installed agent skills (`.agents/skills/`: `frontend-design`, `ui-ux-pro-max`, tracked in `skills-lock.json`) — use them for UI work.
