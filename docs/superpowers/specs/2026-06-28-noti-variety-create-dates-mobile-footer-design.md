# Design — Noti variety, optional create dates, mobile footer safe-area

Date: 2026-06-28
Status: Approved-pending (brainstorm)

Three small, independent UX fixes requested from a phone:

1. Push notifications all look identical → add varied copy.
2. Quick-create form only captures the received date → optionally capture more dates.
3. The mobile bottom nav is clipped by the iPhone frame → add safe-area spacing.

---

## 1. Varied push notification copy

**File:** `src/app/api/cron/reminders/route.ts`

Today every reminder of a given kind uses one fixed title, so a day with several
deadlines produces a stack of identical-looking notifications (see the user's
screenshot: three rows that all read "⏰ เดดไลน์รีวิววันนี้").

**Approach:** keep `body` (job title / invoice id) and `tag` unchanged; vary only
the **title** by picking from a small pool of Thai phrases. Selection is
**deterministic from a hash of a stable key** (job id, or invoice id) so:

- the same job always renders the same phrasing (idempotent across cron re-runs;
  the OS `tag` collapse behaviour stays predictable), and
- different jobs on the same day get different phrasings.

Add one reusable helper in the route file:

```ts
/** Stable, deterministic pick from `pool` keyed by `id` (FNV-1a-ish hash). */
function pickStable<T>(pool: readonly T[], id: string): T {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return pool[Math.abs(h) % pool.length];
}
```

Apply to **all three** notification kinds (decision: ทำทุกประเภท). Phrase pools
(emoji intentionally varied):

- **Deadline — today** (`due === "วันนี้"`):
  `⏰ เดดไลน์รีวิววันนี้` · `🔥 วันนี้ครบกำหนดรีวิว` · `📌 รีวิวนี้ต้องส่งวันนี้` · `⚡ อย่าลืม! รีวิววันนี้`
- **Deadline — tomorrow** (`due === "พรุ่งนี้"`):
  `⏳ พรุ่งนี้ถึงเดดไลน์รีวิว` · `📅 อีกวันครบกำหนดรีวิว` · `🔔 เตรียมตัว! รีวิวพรุ่งนี้`
- **Publish today:**
  `📅 วันนี้ถึงกำหนดโพสต์` · `📣 ได้เวลาโพสต์รีวิวแล้ว` · `🚀 วันนี้ปล่อยโพสต์`
- **Invoice overdue:**
  `💸 Invoice เลยกำหนดชำระ` · `⚠️ Invoice ค้างชำระ` · `🧾 ตามจ่าย Invoice`
- **Invoice due today:**
  `💸 Invoice ครบกำหนดวันนี้` · `🧾 วันนี้ครบกำหนด Invoice`

Keys: deadline/publish use `job.id`; invoice uses `inv.id`. Because the deadline
pool depends on `due`, the today/tomorrow pools are separate so the chosen tone
matches the timing.

**Out of scope:** changing tags, bodies, scheduling, or the cron heartbeat.

---

## 2. Optional extra dates in quick-create

**Decision:** add **review deadline + publish date** only (no payment date).

**Files:**
- `src/lib/schemas/reviewJob.ts` — extend `reviewJobQuickCreateSchema`
- `src/components/jobs/QuickCreateForm.tsx` — UI
- `src/components/ui/collapsible.tsx` — new primitive (none exists today)

### Schema
Add to `reviewJobQuickCreateSchema`:
```ts
reviewDeadline: z.string().optional().nullable(),
publishDate: z.string().optional().nullable(),
```
No cross-field refinement needed in the schema itself (these are optional); the
chained min-date UX is enforced in the form (below) consistent with
`CoreDateFields`. The server `createJob` already accepts and persists
`reviewDeadline` / `publishDate`, and `handleCreate` in `JobsPageClient` forwards
the whole form object to `POST /api/jobs` — so no controller change is required.

> **Verify during implementation:** confirm the `POST /api/jobs` route validates
> the body with a schema that includes these optional fields (quick-create vs.
> full create schema). If it validates against `reviewJobQuickCreateSchema`, the
> additions above are sufficient; otherwise widen accordingly.

### UI
A collapsed-by-default disclosure titled **"เพิ่มวันอื่น ๆ (optional)"** placed
after the existing grid. When expanded it renders two `DateField`s reusing the
chained `min` rules from `CoreDateFields`:
- `reviewDeadline` with `min = receivedDate`
- `publishDate` with `min = reviewDeadline || receivedDate`

`DateField` already supports `clearable` (default true) so both stay optional and
clearable.

### New primitive: `Collapsible`
Thin wrapper over `@radix-ui/react-collapsible` (matches the existing shadcn-style
primitives e.g. `sheet`, `popover`). If that package is not already a dependency,
fall back to a native `<details>/<summary>` styled to match — decided at
implementation time based on what's installed. Exposes `Collapsible`,
`CollapsibleTrigger`, `CollapsibleContent`.

---

## 3. Mobile bottom nav — escape the iPhone frame

**File:** `src/components/layout/BottomNav.tsx`

**Problem (user):** "กรอบของ iphone มันบัง เพิ่ม space ข้างๆกับด้านล่าง" — the home
indicator (bottom) and the rounded corners / side insets clip the nav.

**Current:** `<nav className="... pb-[env(safe-area-inset-bottom)] ...">` — only a
bare bottom inset, no side insets, no minimum bottom gap.

**Change** the `<nav>` padding to:
- **Bottom:** a small base padding **plus** the safe-area inset, e.g.
  `pb-[calc(0.5rem+env(safe-area-inset-bottom))]`, so labels clear the home
  indicator instead of butting against it.
- **Sides:** `pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]` so
  the first/last tab isn't hidden under rounded corners / a landscape notch.

The dashboard layout's `main` already reserves `pb-[calc(9rem+...)]`; bumping the
nav's bottom padding stays within that reserve, so no layout change is needed
there. The "More" sheet is unaffected (Radix sheet handles its own insets).

**Out of scope:** restructuring the nav, hide-on-scroll, or bringing the desktop
`Footer` to mobile.

---

## Testing / verification

- **Noti:** unit-test `pickStable` (deterministic + in-range); spot-check that
  the same id maps to the same phrase and varied ids spread across the pool.
  Manually trigger `GET /api/cron/reminders` with `CRON_SECRET` in a dev/staging
  context and inspect payload titles. No DB writes change.
- **Create dates:** create a job with the section collapsed (dates omitted) and
  with it expanded (dates set); confirm both persist and min-date chaining works.
- **Footer:** check on an iPhone-with-notch viewport (Safari responsive / device)
  that tabs clear the home indicator and aren't clipped at the sides.

## Non-goals

No DB migration. No changes to tax, money handling, scheduling, or auth. Each of
the three changes is independent and can land/revert separately.
