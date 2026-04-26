# OS Reporting Checklist

Use this checklist with:

`docs/OS-REPORTING-GUARDRAILS.md`

## Build Checklist

- [ ] Confirm the report belongs in OS, not OPS
- [ ] Confirm the schedule maps to an official agency requirement or a direct readiness dependency
- [ ] Confirm every displayed number comes from real OS source records
- [ ] Confirm missing facts are shown as readiness gaps instead of guessed values
- [ ] Confirm the page uses tabs, dialogs, and pickers where they improve clarity
- [ ] Confirm the page avoids duplicated or noisy top-level data
- [ ] Confirm export output matches the visible schedule

## Data Checklist

- [ ] Batch quantities and states come from OS batch records
- [ ] Packaged output comes from package lots and/or packaging runs
- [ ] Transfer activity comes from transfer runs
- [ ] Taxable removals come from removal / ship records, not internal moves
- [ ] Compliance details come from stored packaging snapshots
- [ ] Revenue or sales-tax numbers are not pulled into OS reporting

## Compliance Checklist

- [ ] TTB operations support includes produced, used/transferred, packaged, losses, and bulk position
- [ ] TTB excise support uses taxable removals only
- [ ] Hard cider grouping stays reviewable when qualification facts are incomplete
- [ ] COLA / formula readiness is visible per packaged lot or SKU
- [ ] California ABC annual production aligns with the same production pool used for TTB support
- [ ] California CDTFA removals stay removal-based
- [ ] California CRV readiness does not guess container material or filing role

## Validation Checklist

- [ ] Review the selected date range on-screen before trusting the schedule
- [ ] Run a targeted type check on touched reporting files
- [ ] Manually verify one real batch, one transfer, and one packaging run against the rendered schedules
- [ ] Confirm exported CSV / print output opens cleanly
