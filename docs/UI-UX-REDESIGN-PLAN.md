# UI/UX Redesign Plan — Income Review Tracker

**Goal:** Redesign the whole app for a mobile-first experience (primary devices: phone + iPad), keeping drag-and-drop as the core interaction of the jobs board — but making it actually pleasant to use on touch screens.

---

## Current-state audit (what hurts today)

| Area | Problem | Evidence |
|------|---------|----------|
| Navigation | On the **primary device (mobile)** all navigation is hidden behind a hamburger sheet. 2 taps to reach any page. | `Header.tsx`, `Sidebar.tsx` (sidebar is `hidden lg:block`) |
| DnD board (mobile) | The 8 status columns stack **vertically full-width**. Moving a card from "received" to "paid" means long-press-dragging through ~6 screens of vertical scrolling. This is the core feature and it's nearly unusable on a phone. | `JobsDndClient.tsx:545-556` (`flex-col` below `lg`) |
| DnD board (all) | No `DragOverlay` — the card itself is transformed, so it gets clipped by `overflow` containers and there's no drop animation. No way to move a card without dragging (accessibility + speed). | `JobsDndClient.tsx:120-124` |
| Status colors | Duplicated ad-hoc Tailwind class maps (`STATUS_COLUMN_CLASS` in `JobsDndClient.tsx` + `statusBadge.ts`) — no single source of truth. | both files |
| Calendar | `react-big-calendar` month grid is desktop-oriented; tiny touch targets on a phone. | `CalendarClient.tsx` |
| Forms / dialogs | Centered dialogs on mobile (e.g. paid-confirmation dialog) instead of bottom sheets; long forms not sectioned. | `JobsDndClient.tsx:560+`, `JobForm.tsx` |
| Viewport | `100vh`-based heights (`h-[calc(100vh-11rem)]`) break with mobile browser chrome; no safe-area insets anywhere. | `JobsDndClient.tsx:545` |

What's already good and should be kept: shadcn/radix primitives, dark mode (next-themes), Thai-first i18n with Athiti font, existing mobile card view in `JobList.tsx`, 44px drag handle and `TouchSensor` long-press activation, optimistic updates with revert.

---

## Design direction

Based on the ui-ux-pro-max design-system recommendation (productivity / tracker, touch-first flat style) adapted to this project:

- **Style:** Flat, touch-first. No heavy shadows; use color blocking and borders for hierarchy. Press feedback = `active:scale-[0.98]` + opacity, 150ms.
- **Brand color:** Keep the existing pink primary (`oklch(0.65 0.14 350)`) — it's already the identity. Don't switch palettes mid-project.
- **Typography:** Keep **Athiti** (Thai support is mandatory — the recommended Plus Jakarta Sans has no Thai glyphs). Enforce a scale: 16px body minimum on mobile (prevents iOS auto-zoom on inputs), 14px secondary, 20/24px headings, tabular numbers (`tabular-nums`) for all money columns.
- **Spacing:** 4/8px rhythm; min 44×44px touch targets, ≥8px between targets.
- **Status colors → tokens:** one `STATUS_THEME` map (bg / text / border / dot per status, light+dark) consumed by badges, board columns, calendar events, and the new status picker.

---

## Phase 1 — Navigation shell (foundation, ~1 day)

**1.1 Bottom tab bar on mobile/portrait-iPad (`< lg`)** — new `components/layout/BottomNav.tsx`
- 5 items max: **Dashboard · Board · Jobs · Income · More**. The DnD board is the core feature — promote it from a sub-link to a top-level tab.
- "More" opens a sheet with Calendar, Tax, AI Storyline, theme & locale switchers.
- Icon + label on every item (no icon-only), active state with filled icon + primary color.
- `position: fixed` with `padding-bottom: env(safe-area-inset-bottom)`; add matching bottom padding to the page container so content never hides behind it; render Sonner toasts above it.

**1.2 Keep sidebar for `lg+`** (iPad landscape / desktop) — adaptive navigation. Remove the hamburger sheet entirely; header becomes a slim contextual bar (page title + page-level actions only).

**1.3 Viewport hygiene (global)**
- Replace `100vh` → `100dvh` everywhere (`min-h-dvh` shell).
- `touch-action: manipulation` on interactive elements (kill 300ms delay).
- Audit `viewport` meta: `width=device-width, initial-scale=1` (never `user-scalable=no`).

---

## Phase 2 — DnD board redesign (the core, ~2–3 days)

Keep dnd-kit and the drag interaction — redesign the *layout* around it per device class.

### 2.1 Mobile (< 768px): horizontal column pager instead of vertical stack
- Each column = **~88vw wide**, laid out in a horizontal `scroll-snap-type: x mandatory` strip with a peek of the next column (signals swipeability).
- **Status chip bar** at the top: horizontally scrollable chips with status color dot + count, synced two-way with the visible column (tap chip → scroll to column; swipe → active chip follows). Doubles as the board overview for 8 statuses.
- **Cross-column drag still works:** dnd-kit `autoScroll` on the horizontal container — drag a card to the screen edge and the board pages to the adjacent column. Long-press 200ms activation (already in place) + `navigator.vibrate(10)` haptic on lift/drop.
- **Drag alternative (critical UX + a11y rule "gesture-alternative"):** tap a card → bottom sheet with job details + a **status picker** (vertical list of all 8 statuses with color dots; current one highlighted). One tap to move a card 6 statuses forward — faster than any drag. This is the primary mobile flow; drag stays for adjacent-column moves and for the fun of it.

### 2.2 iPad / desktop (≥ 768px): proper multi-column board
- Horizontal board with `snap-x proximity`, columns 280–300px, container `h-[calc(100dvh-<header>)]`, each column scrolls internally with a **sticky column header** (name + count + collapse).
- **Collapsible columns:** collapse to a vertical rail (name + count) to tame 8 columns on iPad portrait; persist collapsed set in `localStorage`. Collapsed rails remain valid drop targets.
- Optional later: drop indicator line + in-column sorting (`@dnd-kit/sortable` is already installed).

### 2.3 dnd-kit mechanics upgrade (shared)
- **`DragOverlay` in a portal** with `dropAnimation` — fixes clipping, gives a polished "card lifts above the board" effect (slight scale 1.03 + shadow while dragging, source card at 40% opacity).
- Keyboard sensor + **`announcements`** (aria-live) for screen readers; cards get `aria-roledescription="draggable job card"`.
- Column highlight on `isOver` stays (ring) — add a subtle background tint from `STATUS_THEME`.

### 2.4 Card redesign (compact, scannable)
- Row 1: title (1 line) — Row 2: payer · amount (tabular) — Row 3: platform badges + **deadline urgency chip** ("D-3" style: red if overdue, amber ≤3 days, muted otherwise). Color never alone — chip has text.
- iPad/desktop: whole card is draggable (`distance: 8` pointer activation already prevents accidental drags); mobile keeps the 44px grip handle + long-press.
- Title link removed from inside the card (conflicts with drag) — tap opens the detail bottom sheet, which links to the full `/jobs/[id]` page.

### 2.5 Paid-confirmation dialog → responsive sheet
- Bottom sheet on mobile (swipe-down dismiss + cancel button), dialog on desktop. Same content (payment date + evidence upload). Confirm-on-dismiss while saving stays.

**Files:** rewrite `JobsDndClient.tsx` into `components/board/` (`Board.tsx`, `BoardColumn.tsx`, `BoardCard.tsx`, `StatusChipBar.tsx`, `JobSheet.tsx`, `StatusPicker.tsx`, `statusTheme.ts`); route `(dashboard)/jobs-dnd/page.tsx` unchanged API-wise (`/api/jobs/board`, PATCH `/api/jobs/[id]`).

---

## Phase 3 — Page-by-page redesign (~2–3 days)

**3.1 Dashboard** (`DashboardSummary.tsx`, `RecentJobsList.tsx`)
- 2-column summary card grid on mobile; money in tabular nums with clear labels.
- "Recent jobs" as tappable cards (whole card = target) reusing the board card + status badge tokens.
- Quick actions row: "+ Add job", "+ Add income", "Open board".

**3.2 Jobs list** (`JobsPageClient.tsx`, `JobList.tsx`, `JobFilters.tsx`)
- Keep card view < lg; align card layout with the new board card.
- Filters move into a **filter bottom sheet** (button with active-filter count badge); applied filters shown as dismissible chips above the list. Search stays inline, sticky under the header.
- **FAB** (bottom-right, above the tab bar) for "Add job" on mobile.

**3.3 Job form** (`JobForm.tsx`, `JobFormFields.tsx`)
- Full-screen sheet on mobile; group fields into sections (Basic / Dates / Money / Files) — progressive disclosure, not one wall of inputs.
- Correct mobile keyboards: `inputMode="decimal"` for amounts, native date inputs; 44px+ input height; validate on blur; error text under the field.

**3.4 Income** (`IncomePageClient.tsx`, `IncomeTable.tsx`)
- Card list on mobile (mirror JobList pattern); sticky month/summary header; FAB to add.

**3.5 Calendar** (`CalendarClient.tsx`)
- Mobile default = **agenda/list view** (grouped by day, status-colored dots) — month grid stays for ≥ md. react-big-calendar supports `views={['month','agenda']}`; if too rigid, custom agenda list from the same events.
- Event tap → same `JobSheet` bottom sheet as the board.

**3.6 Tax & Storyline** — stacked cards, 16px body, sticky period selector on `tax`; verify generated-text readability (line length 35–60 ch) on `storyline`.

---

## Phase 4 — System polish (~1 day)

- **Feedback:** press states everywhere (`active:scale-[0.98]`, 150ms); skeletons match final layout (no CLS); empty states with a CTA (e.g. empty column → "+ Add job here").
- **Motion:** 150–300ms, ease-out enter / ease-in exit; respect `prefers-reduced-motion` (disable drag drop-animation & sheet slide).
- **Dark mode audit:** verify 4.5:1 text contrast for every `STATUS_THEME` pair in dark mode specifically.
- **A11y pass:** focus rings, aria-labels on icon buttons (FAB, grip, chips), heading hierarchy per page.
- **Performance:** months-filter already limits board size; add list virtualization only if columns exceed ~50 cards.

---

## Test matrix (before calling it done)

| Check | Device |
|---|---|
| Board: swipe columns, drag card to adjacent + far column (via edge scroll and via status picker) | 375px phone |
| Board: multi-column drag, collapse columns | iPad portrait (768) + landscape (1024) |
| Bottom nav never overlaps content/toasts; safe-area on notched phones | phone |
| All forms usable with on-screen keyboard open (`dvh`) | phone |
| Dark mode contrast on all status colors | both |
| `prefers-reduced-motion` + keyboard-only drag (sensor announcements) | desktop |

## Suggested order & estimate

1. Phase 1 (nav shell) — unlocks everything, ~1 day
2. Phase 2 (board) — the core, ~2–3 days
3. Phase 3 (pages) — can ship incrementally per page, ~2–3 days
4. Phase 4 (polish) — ~1 day

References: [LogRocket — drag-and-drop UX patterns](https://blog.logrocket.com/ux-design/drag-and-drop-ui-examples/), [Eleken — drag-and-drop UI tips](https://www.eleken.co/blog-posts/drag-and-drop-ui), [SubUX — accessible drag-and-drop](https://subux.pro/guides/article/accessible-drag-and-drop), [Any.do — mobile-first kanban 2026](https://www.any.do/blog/top-kanban-boards-for-mobile-first-workflows-in-2026/)
