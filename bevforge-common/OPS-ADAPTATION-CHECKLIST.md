# OPS Adaptation Checklist

Use this checklist when doing a focused OPS UI/UX modernization pass in this repo.

## 1) Session Setup
- Confirm working directory: `/Users/travispartlow/Projects/BevForge/bevforge-common`
- Read:
- `AGENTS.md`
- `SUITES.md`
- `NAVIGATION-CONTRACT.md`
- `UI-UX-COHERENCE.md`
- `CONTRACTS.md`

## 2) Product Boundary
- Keep OPS in its lane:
- orders
- customer/account workflows
- logistics
- packaged product availability for sale
- shipping / taxable removal execution
- Do not move physical quantity truth or batch execution ownership out of OS.
- OPS may reference OS records and call OS reservation/availability interfaces, but OPS should not redefine OS quantity truth.

## 3) UI/UX Pass Goal
- Use the updated OS work as the coherence target for summary-level UX.
- Reference:
- OS `/os` `Active Production` tile
- OS `/os/batches` tile language
- OS `/os/packaging` tile language
- Keep OPS suite identity through OPS accent color and business/logistics framing, not by inventing a separate layout language.

## 4) Dashboard & Summary Tile Rules
- Summary tiles should behave as:
- quick look
- quick filter
- quick access to the relevant queue/page
- Preferred tile anatomy:
- eyebrow label
- strong count or state
- short title
- short subtitle
- contained icon treatment
- subtle accent line/glow
- Avoid:
- dead-end metric cards
- decorative-only cards
- long explanatory copy inside top summary tiles

## 5) Flow Expectations
- OPS pages should make the next action obvious:
- what is ready
- what needs attention
- what is blocked
- what should be opened next
- If a page is mixing overview, queue management, detail editing, and compliance context:
- break it into clearer sections
- use tiles, tabs, dialogs, or filter states
- keep the first screen lightweight

## 6) Inventory/Availability Framing
- OPS should treat finished packaged product differently from upstream production inputs.
- OPS-facing language should emphasize:
- available to sell
- reserved
- staged
- shipped / removed
- tax/compliance implications after removal
- If OPS is displaying inventory-like data, the page should make it clear whether the operator is seeing:
- OS physical truth
- OPS sellable availability
- shipment/removal state

## 7) Compliance & Guidance
- OPS can guide the operator, warn, and surface readiness.
- OPS should not hard-block on requirements that are contextual or conditional unless the rule is truly required for the action being attempted.
- Use warnings, readiness states, and follow-up flags before using enforcement.

## 8) Deliverable Report
- Pages reviewed
- Pages changed
- UX problems identified
- What was improved in summary tiles / filters / page flow
- What still needs a deeper functional pass
