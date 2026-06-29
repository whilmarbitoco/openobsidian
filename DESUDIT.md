# OpenObsidian — UI/UX Design Audit & Improvement Spec

## Current State Summary
OpenObsidian is a working Next.js 15 app with dark theme. It has all pages (dashboard, note editor, graph, search, insights, settings) but the visual design is functional/developer-grade, not product-grade. The shadcn defaults are largely untouched — there's no distinctive visual identity, no craft.

## Reference Points (from design skill)
OpenObsidian should feel like: **Linear meets Obsidian meets Raycast** — precise dark UI, subtle depth, fast-feeling, keyboard-first, information-dense but calm. NOT gradient-heavy, NOT glassmorphism, NOT generic SaaS.

Specific visual references:
- **Linear.app**: Ultra-minimal dark mode, purple accent, precise spacing, no visual noise
- **Obsidian**: Deep blacks, purple/violet accents, information density, file-first
- **Raycast**: Command palette, fast interactions, subtle backdrop blur, action-oriented

## Problems to Fix

### 1. No visual identity / personality
The app looks like shadcn defaults — which says "I scaffolded this, not I designed this."

**Fix:**
- Set strong opinionated defaults in globals.css (already partially done with #0a0a0f / #f59e0b)
- Replace #f59e0b (amber) with a more sophisticated accent — warm violet/indigo (#8b5cf6 or #7c3aed) for primary, keep amber/rose for semantic states
- Add subtle noise texture or gradient mesh to the background (CSS only, not an image) — gives depth
- Typography: Inter is fine but configure it better — tighter tracking on headings, slightly increased line-height for body, use tabular-nums for stats

### 2. Dashboard is just a list
Currently: stats cards + recent notes list. Feels like an admin panel, not a thinking tool.

**Fix:**
- Hero section with current date, greeting ("Good evening"), quick stats in a more visual way (sparkline-style or just cleaner number display)
- Notes grid instead of list — card preview for each note (first 2 lines of content, tags, last edited)
- "Quick actions" row: New Note, Search (Cmd+K), Graph, Insights
- Subtle empty state illustration (CSS/SVG, not image)

### 3. Editor page too plain
Currently: CodeMirror on one side, preview on other. Works but sterile.

**Fix:**
- More polished split-pane with subtle divider and collapse toggle
- Top bar with note title (editable), breadcrumb path, save indicator, word count
- Typography in preview should be beautiful: proper heading hierarchy, code blocks with syntax highlighting feel, blockquotes styled
- Backlink panel (show notes linking TO this note)
- Tag input/autocomplete UI at bottom or top

### 4. Graph page needs more impact
Currently: D3 graph with basic styling. The "wow" factor isn't there.

**Fix:**
- More dramatic nodes: subtle glow on hover, connected nodes highlight, unconnected dim
- Gradient edges instead of solid lines
- Node clusters visually grouped
- Mini-map or legend
- Floating search overlay (not a separate input field)
- "Focus mode" — hide sidebar, full-screen graph with subtle vignette

### 5. Command palette is hidden
Currently: Cmd+K but it's not obvious or inviting.

**Fix:**
- When vault has no path or on initial load, show a subtle prompt: "Press ⌘K to search"
- Command palette should have backdrop blur (subtle, not glassmorphism)
- Categories in palette: Notes, Tags, Actions, Pages
- Recent items at top
- Fuzzy match with highlighted matches

### 6. No micro-interactions
The app feels static.

**Fix:**
- Notes cards lift on hover (translate-y: -1px + shadow)
- Sidebar items have active indicator (left border or background shift)
- Buttons have subtle press state
- Graph node hover should feel responsive (< 50ms)
- Toast slide-in from top-right (sonner handles this, just configure position)
- Playing is smoother at 150ms easing

### 7. Empty states are text-only
"No notes yet" is dead real estate.

**Fix:**
- Each empty state gets an SVG icon/illustration
- Helpful action button (not just text)
- Warm tone: "Your vault is quiet. Let's change that →" not "No notes found"

### 8. Settings page is basic form
Could be more inviting.

**Fix:**
- Sections with icons
- Vault picker shows selected path human-truncationally (ellipsis in middle)
- Connection status has animation (pulsing dot when connecting, solid when connected)
- Danger zone for "clear index"

## Design Tokens (CSS Variables to add/modify)

```
--accent: #8b5cf6 (violet-500) — primary action color
--accent-soft: rgba(139, 92, 246, 0.1) — accent at 10% for hover states
--accent-glow: rgba(139, 92, 246, 0.3) — for focus rings, glows
--danger: #ef4444
--success: #22c55e
--surface-elevated: #14141f
--surface-overlay: rgba(10, 10, 15, 0.8) — for modals
--shadow-elevated: 0 4px 12px rgba(0,0,0,0.4), 0 1px 3px rgba(139,92,246,0.1)
--radius-card: 12px (not 10px)
```

## Fonts
- Inter for body (already loaded)
- Add JetBrains Mono for code blocks, file paths, tags, command palette
  → import from Google Fonts via next/font/google

## Page-by-Page Priorities (in order)

1. **globals.css** — design tokens, font setup, background texture, selection color, scrollbar styling
2. **layout.tsx** — nothing major, maybe metadata
3. **command-palette.tsx** — this is the "hero" interaction, make it gorgeous
4. **dashboard/page.tsx** — first thing users see, make it count (grid cards, better stats)
5. **note/[id]/page.tsx** — editor chrome, better preview typography, backlinks
6. **graph/page.tsx** — better node/edge styling, glow effects, floating controls
7. **sidebar.tsx** — active states, better hierarchy, connection indicator
8. **insights/page.tsx** — card layouts, insight visual hierarchy
9. **settings/page.tsx** — sections, vault picker polish
10. **Empty states** — every page that can be empty gets a real empty state

## What NOT to do
- No gradients as the visual centerpiece (they're allowed as accents)
- No images or external assets (pure CSS/SVG)
- No glassmorphism (no backdrop-blur-xl everywhere)
- No over-animation (every animation must have purpose)
- No changing the layout structure dramatically (improve what exists)
- No new features — this is polish only

## Implementation Rules
1. Use existing shadcn components — add new ones only if needed via `npx shadcn@latest add`
2. All SVG icons from lucide-react
3. Dark mode is the ONLY mode — remove theme toggle or keep it hidden (dark by default, light mode can be broken)
4. Keep strict (npx tsc --noEmit must pass)
5. Tailwind v4 syntax (already configured)

## Verification
After all UI work:
1. npx tsc --noEmit — zero errors
2. npx vitest run — all 42 tests still pass
3. Running dev server responds on localhost:3000/3001
4. Visual inspection: each page should look intentional, crafted, distinctive
