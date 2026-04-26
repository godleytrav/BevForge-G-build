# Calendar Contracts

This contract set defines the universal calendar projection shared across suites.

## Purpose
- Provide one calendar UX across OS/OPS/LAB/FLOW/CONNECT.
- Keep event ownership in the source suite.
- Keep scheduling data portable via JSON-on-disk feeds.

## Authority Model
- OS owns production, batch, automation, and brewhouse execution events.
- OPS owns order, delivery, visit, and compliance schedule events.
- CONNECT owns employee and driver schedule events.
- LAB owns recipe planning/testing events.
- FLOW owns taproom/tap-service schedule events.
- Universal calendar is a projection/read-model. It does not transfer ownership.

## Schemas
- `calendar-event.schema.json`
- `calendar-feed.schema.json`

## UX Template
- `CALENDAR-UX-TEMPLATE.md` is the canonical cross-suite calendar UI/UX reference.
- Suite builders should mirror that template first, then apply allowed suite-specific adaptations.

## Canonical UI Behavior
- Day cell interactions:
- single click = select day
- double click (desktop) = open create-event modal
- long press (mobile) = open create-event modal
- Suite summary tiles are route links:
- all suites: `/calendar`
- suite-specific: `/calendar?suite=os|ops|lab|flow|connect`
- Right slideout contains event key + filters (suite, status, type).

## API Contract
### `GET /api/calendar/events`
Returns calendar projection for current query window and filters.

Supported query params:
- `from` ISO datetime
- `to` ISO datetime
- `suite` csv (`os,ops,lab,flow,connect`)
- `statuses` csv (`planned,in_progress,completed,canceled,blocked`)
- `types` csv (`production,inventory,order,delivery,compliance,schedule,maintenance,task,note`)
- `siteId`
- `search`

Response shape:
- `success: boolean`
- `data.events: CalendarEvent[]`
- `data.summary.total`
- `data.summary.bySuite`
- `data.summary.byStatus`

### `POST /api/calendar/events`
Creates a suite-owned event in that suite feed.

Minimum create payload:
- `title`
- `startAt` (ISO datetime)
- `sourceSuite` (`os|ops|lab|flow|connect`)

Recommended payload fields:
- `type`, `status`, `priority`, `endAt`, `siteId`, `description`
- `sourceRecordId`
- `links.openPath` or `links.openUrl`
- `metadata`

Validation expectations:
- `title` required.
- `startAt` must be valid ISO datetime.
- `endAt` must be >= `startAt` if provided.

Idempotency + retry expectations:
- Client should provide a stable `id` for create requests.
- Duplicate create with same `id` must be treated as idempotent success (no duplicate event record).
- Clients may queue transient failures and replay later with the same `id`.
- Permanent validation errors should not be retried indefinitely.

## Operational Boundary (Required)
- Calendar write path must not directly execute operational side-effects.
- Calendar events can reference executable objects by ID/path.
- Execution remains in suite-owned services (OS/OPS/CONNECT/LAB/FLOW).

## Commissioning Storage (JSON-on-disk)
Per-suite feed files:
- `commissioning/os/calendar-events.json`
- `commissioning/ops/calendar-events.json`
- `commissioning/connect/calendar-events.json`
- `commissioning/lab/calendar-events.json`
- `commissioning/flow/calendar-events.json`

Feed shape:
- `schemaVersion`
- `id`
- `updatedAt`
- `events[]`

## Builder Checklist (All Suite Bots)
- Add header calendar icon link to `/calendar`.
- Use shared event/feed schemas.
- Preserve `sourceSuite` ownership on create/update flows.
- Include deep-link context (`sourceRecordId`, `links`) for edit/open actions.
- Keep event-type mapping consistent with schema enum.
- Keep filtering UI based on event projection (not local disconnected state).
- Add failed-sync queue handling for transient create failures.
- Replay queued creates on next successful create and on startup.

## Integration Notes For OPS Bot
- OPS calendar should consume `GET /api/calendar/events` projection.
- OPS event create should call `POST /api/calendar/events` with `sourceSuite: "ops"`.
- OPS business workflows remain in OPS APIs; calendar entries are schedule pointers, not execution logic.
