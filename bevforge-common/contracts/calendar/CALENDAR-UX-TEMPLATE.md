# Calendar UX Template (Universal)

This is the canonical UI/UX template for calendar pages across all BevForge suites.

Use this as the default reference for:
- OS
- OPS
- LAB
- FLOW
- CONNECT

If a suite needs customization, keep this base structure and only adapt allowed suite-specific fields.

## Canonical Reference Implementation
- Base implementation file:
- `apps/os-ui/src/pages/CalendarPage.tsx`

All suite calendar pages should mirror this structure and interaction model unless explicitly approved otherwise.

## Shared UX Goals
- One familiar calendar experience across all suites.
- Fast scan of cross-suite events.
- Clear event ownership by suite.
- Minimal clicks for create/filter/navigation.
- Mobile and desktop parity for core actions.

## Page Structure (Required)
1. Header and status row
- Page title: `Universal Calendar`
- Subtitle describing projection/ownership model
- Refresh action

2. Search + range controls card
- Search input
- Time window selector (e.g. 14/30/60/90 days)

3. Suite summary tile row (link tiles)
- Tile set:
- `Visible Events` (all suites)
- `OS`, `OPS`, `LAB`, `FLOW`, `CONNECT`
- Tiles are links, not static counters:
- all suites: `/calendar`
- suite scoped: `/calendar?suite=<suite>`

4. Full month calendar grid
- Month navigation controls
- Day cells show event previews
- Selected day state

5. Selected day event list
- Chronological list for selected date
- Event badges for suite/status/type
- Deep-link to source record when available

6. Right slideout panel with handle
- Event key + filtering controls
- Sections:
- Suites
- Status
- Event Types
- Source window summary

## Interaction Contract (Required)
- Single click/tap on day cell: select day.
- Double click (desktop) on day cell: open create-event modal.
- Long press (mobile, ~450ms) on day cell: open create-event modal.
- Slideout handle toggles right filter panel open/close.

## Create Event Modal (Required)
- Opens prefilled for selected day.
- Required fields:
- `title`
- `startAt` (derived from date/time fields)
- `sourceSuite`
- Recommended fields:
- `type`, `status`, `priority`, `endAt`, `siteId`, `description`
- Optional linkage:
- `sourceRecordId`
- `links.openPath` or `links.openUrl`
- `metadata`
- Submit path:
- `POST /api/calendar/events`

## Data + API Contract (Required)
- Read path:
- `GET /api/calendar/events`
- Write path:
- `POST /api/calendar/events`
- Calendar is projection/scheduling surface.
- Operational execution remains in owning suite services.
- Do not embed suite-specific workflow execution logic in calendar UI.

## Reliability Contract (Required)
- Calendar create uses idempotent event IDs:
- client provides stable `id` per create intent
- duplicate `POST /api/calendar/events` with same `id` is success, not duplicate write
- Maintain a small persistent failed-sync queue for transient create failures.
- Replay queue:
- on app startup
- after next successful create
- Retry only transient failures (network/timeout/429/5xx).
- Do not endlessly retry validation failures (4xx non-transient).

## Visual Consistency Rules
- Keep layout and component hierarchy consistent across suites.
- Keep card sizing, spacing, and section order aligned with canonical OS implementation.
- Use suite theme tokens for accents only; do not redesign base structure per suite.
- Preserve right slideout behavior and handle placement.

## Accessibility Baseline
- Tile links and day cells must be keyboard reachable.
- Day cell controls must include clear focus states.
- Modal must trap focus and support escape/close controls.
- Filter toggles must have visible labels and state.

## Mobile Baseline
- Long press to create event must work on touch devices.
- Slideout must remain reachable with touch and not block core page actions.
- Calendar and event list should remain readable at narrow widths.

## Allowed Suite-Specific Adaptation
- `currentSuite` visual context.
- Default `sourceSuite` in create modal payload.
- Suite-specific event type defaults or labels (must map to shared schema values).
- Suite-specific deep-link defaults in `links`.

## Not Allowed Without Explicit Approval
- Removing suite tile links.
- Replacing full month calendar with list-only layout.
- Removing right slideout filter panel.
- Changing single/double/long-press interaction contract.
- Writing calendar events directly into non-owner suite feeds.

## Builder Hand-off Checklist
- Route present and wired to `/calendar`.
- Header calendar icon routes to `/calendar`.
- UI matches canonical structure in this document.
- Create modal posts to `POST /api/calendar/events`.
- Suite ownership persisted via `sourceSuite`.
- Deep-links use `sourceRecordId`/`links`.
- Filters operate on projection data, not disconnected local-only state.
