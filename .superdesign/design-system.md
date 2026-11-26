# appTracker — Refined Precision Design System (Linear / Things 3 Mobile)

## 1. Product Context & Architecture
- **Product**: `appTracker` — Offline-first personal productivity app for daily time-block routines, nested task folders, subscription billing reminders, and personal diary reflections (0 ms local SQLite write + background cloud sync).
- **UI Language**: Bahasa Melayu (Malay). Preserve all domain terminology (`Hari Ini`, `Tugasan`, `Langganan`, `Diari`, `Synced` / `Syncing...` / `Offline`).
- **Platform**: Mobile portrait app (390×844 viewport) built with Expo + React Native + NativeWind (Tailwind CSS), also responsive on web.

---

## 2. Visual Direction — Mature Information-Dense Minimalism (Linear / Things 3 Mobile)

Calm, ultra-clean, high-signal product design. Zero generic AI gradients, zero loud purple hero banners, zero heavy warning card washes, and zero floating bloated card gaps. Hierarchy is built through subtle neutral surface elevation (`#0A0A0B` → `#141416`), `1px` hairline borders (`#242428`), grouped lists with `divide-y divide-white/5`, crisp typography, and restrained micro-indicators (`6px` status dots and `4px` progress bars).

### Color Palette

#### Default Mode: Neutral Graphite Dark (Linear Dark)
- **App Canvas Background (`bg-canvas`)**: `#0A0A0B`
- **Card / Grouped Container Surface (`bg-surface`)**: `#141416`
- **Elevated / Hover / Active Row (`bg-elevated`)**: `#1C1C1F`
- **Input / Chip Subtle Well (`bg-well`)**: `#101012`
- **Primary Hairline Border (`border-subtle`)**: `#242428` (`1px solid`)
- **Grouped Row Divider (`divide-subtle`)**: `rgba(255, 255, 255, 0.05)` (`divide-white/5`)
- **Bottom Nav Translucent Surface**: `rgba(10, 10, 11, 0.80)` (`bg-[#0A0A0B]/80 backdrop-blur-md`) with `1px solid rgba(255,255,255,0.07)` top border
- **Primary Text (`text-primary`)**: `#F4F4F5` (Zinc 100 — crisp, low-glare white)
- **Secondary Text (`text-secondary`)**: `#A1A1AA` (Zinc 400)
- **Muted / Meta Text (`text-muted`)**: `#71717A` (Zinc 500)
- **Harmonized Active Accent (`accent`)**: `#E4E4E7` (crisp soft white) or muted slate-blue `#8B95A5` / `#6E7BF2` at low saturation for subtle interactive links and active tab state — never loud neon or oversaturated indigo/blue
- **Progress / Synced / Completed (`status-emerald`)**: `#10B981` (emerald 500) or clean `#F4F4F5` white fill on `#242428` track
- **Urgent Due Today (`status-red`)**: `#EF4444` (`6px` dot / subtle muted text or pill `bg-red-500/10 text-red-400 border-red-500/20`)
- **Upcoming 1–7 Days (`status-amber`)**: `#F59E0B` (`6px` dot / subtle pill `bg-amber-500/10 text-amber-400 border-amber-500/20`)

#### Secondary Mode: Crisp Paper Light (Things 3 Light)
- **App Canvas Background**: `#F7F7F8`
- **Card / Grouped Container Surface**: `#FFFFFF`
- **Elevated / Hover**: `#F1F1F3`
- **Primary Hairline Border**: `#E4E4E7` (`1px solid`)
- **Grouped Row Divider**: `rgba(0, 0, 0, 0.05)` (`divide-black/5`)
- **Bottom Nav Translucent Surface**: `rgba(255, 255, 255, 0.82)` (`backdrop-blur-md`)
- **Primary Text**: `#18181B`
- **Secondary Text**: `#52525B`
- **Muted Text**: `#71717A`

---

## 3. Typography
- **UI & Body Font**: `'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif` — clean, native-feeling UI sans-serif with tight optical tracking (`-0.015em` on headings).
  - Screen Title: `18px`, `600`, `#F4F4F5`, tracking `-0.02em`.
  - Section Header: `12px`–`13px`, `500`–`600`, `#A1A1AA`, clean sentence/title case or subtle tracked label, paired with understated right action link (`text-xs text-zinc-400 hover:text-zinc-200`).
  - List Row Title: `14px`, `500`, `#F4F4F5`.
  - Meta / Subtitle: `12px`, `400`, `#71717A`.
- **Monospace / Tabular Font**: `'JetBrains Mono', 'SF Mono', ui-monospace, monospace` with `font-variant-numeric: tabular-nums`.
  - Used cleanly for right-aligned time blocks (`08:00 – 09:00`), dates (`26-11-2026`), task ratios (`0/2`), and currency amounts (`RM 20.00`).

---

## 4. Component & Density Rules
1. **Compact Radius & Padding**:
   - All cards and grouped containers use `rounded-lg` (`8px`) or `rounded-xl` (`10px–12px`) — NEVER `rounded-2xl` or `rounded-3xl`.
   - List rows use compact `py-3 px-4` vertical/horizontal padding for mature information density.
2. **Fokus Harian Summary Card (Neutral, No Purple Banner)**:
   - Surface `#141416` on `#0A0A0B` canvas, `1px solid #242428` border, `rounded-xl` (`12px`), compact `p-4`.
   - Displays title/label `Fokus Harian`, clean count `0 / 2 Tugasan Siap` (or compact radial ring + count), and a sleek `4px` (`h-1`) progress bar (`bg-[#242428]` track with `#10B981` or `#F4F4F5` fill).
   - **No inline technical brag text**: `'Semua data disimpan terus ke SQLite tempatan (0 ms)'` is removed from the card body and tucked into a subtle tooltip/popover on the top `Synced` status pill (`Synced · SQLite 0 ms`).
3. **Grouped Lists (`divide-y divide-white/5`)**:
   - Schedule (`Jadual Blok Masa Hari Ini`) and Subscription Reminders (`Amaran Langganan`) each render inside **one unified container** (`bg-[#141416] border border-[#242428] rounded-xl overflow-hidden divide-y divide-white/5`) instead of separate floating boxes.
   - Time blocks (`08:00 – 09:00`) sit cleanly on the **right side** of each task row in `JetBrains Mono` `tabular-nums` (`text-xs text-zinc-400`).
4. **Refined Subscription Warnings (No Yellow/Brown Card Wash)**:
   - Rows keep the exact same neutral `#141416` background as the rest of the app.
   - Urgency is communicated solely via a crisp `6px` status dot (`bg-red-500` for `Hari ini`, `bg-amber-500` for `2–7 hari lagi`) or a compact subtle badge (`px-1.5 py-0.5 rounded text-[11px]`), paired with tabular `RM` amount on the right.
5. **Minimalist Translucent Bottom Navigation**:
   - `backdrop-blur-md bg-[#0A0A0B]/80`, `1px` subtle top border (`border-white/[0.07]`), muted inactive items (`#71717A`), and a calm, low-saturation active state (soft off-white `#F4F4F5` or muted slate-indigo `#939BF5` with subtle icon stroke contrast — no loud electric blue).
