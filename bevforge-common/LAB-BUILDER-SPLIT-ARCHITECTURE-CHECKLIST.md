# LAB Builder Split Architecture Checklist

Status: active working checklist for LAB Builder restructuring
Owner: LAB suite
Primary route in scope: `/lab/builder-v2`
Last updated: 2026-04-23

## Non-Negotiable Corrections

These points override any accidental drift in the current Builder V2 implementation.

- Beer, cider, and wine must not share one hacked builder surface.
- Beer, cider, and wine must each get their own page and their own solver logic.
- The current mixed Builder V2 should be treated as a temporary transition surface only.
- The builder hub tiles must behave like mini recipe cards with quick-look details from the latest saved recipe in that family.
- Builder UX must become guided:
  - do not dump all fields on one page at once
  - ask the user questions in sequence
  - use modal / popup / step surfaces where they improve clarity
  - start at the beginning of the authoring process and guide the user forward
- Cider must not inherit beer process UI.
- Beer must retain the process depth it needs and must not lose beer-specific controls because of cider work.

## Core Decision

LAB Builder should not keep beer, cider, and wine inside one shared solver surface.

The correct direction is:

- one shared LAB shell and authoring framework
- separate beverage builder tabs/pages
- separate solver logic per beverage family
- separate process models per beverage family
- separate compliance hints per beverage family

That means:

- `Beer Builder` uses beer math and brewhouse process
- `Cider Builder` uses cider concentrate / juice / sugar / carb / compliance logic
- `Wine Builder` uses must / sugar / acid / tannin / fermentation / compliance logic

Hybrid and dynamic systems can remain shared concepts, but they must plug into beverage-specific logic instead of forcing one blended model.

---

## Target End State

LAB Builder becomes a product-family authoring workspace with:

- top-level builder switcher: `Beer | Cider | Wine`
- top-level family cards that show quick looks of the latest recipe for that family
- unique page state and UI for each beverage
- beverage-specific targets, ingredient lanes, process steps, prediction model, and compliance lane
- shared save/export contract into OS
- shared LAB visual identity and global shell
- guided authoring flow instead of a single full-page data dump

---

## Phase 1: Lock The Information Architecture

Goal: stop future churn by defining the correct page split before more UI patching.

### Checklist

- [x] Confirm primary builder routes:
  - [x] `/lab/builder-v2/beer`
  - [x] `/lab/builder-v2/cider`
  - [x] `/lab/builder-v2/wine`
- [x] Keep `/lab/builder-v2` as an entry page or redirect to the last-used beverage builder.
- [x] Define top-level beverage switch UI that is always visible and stable.
- [x] Convert builder-family tiles into mini recipe cards:
  - [x] show latest recipe name
  - [x] show quick stats
  - [ ] show readiness / status
  - [x] open directly into the family builder
- [ ] Confirm whether `mead` is:
  - [ ] a separate page now
  - [ ] deferred until after beer/cider/wine
- [ ] Define what remains shared across all beverage pages:
  - [ ] active recipe card
  - [ ] save/handoff actions
  - [ ] LAB to OS export contract
  - [ ] global suite shell
- [ ] Define what must be beverage-specific:
  - [ ] targets
  - [ ] ingredient picker behavior
  - [ ] solver math
  - [ ] process editor
  - [ ] compliance lens
  - [ ] terminology

### Done When

- [x] Route map is final for the split-builder transition phase.
- [x] Shared vs beverage-specific boundaries are documented.
- [ ] No more mixed “one page does everything” assumptions remain.
- [x] The hub reads like a set of mini recipe cards instead of generic navigation tiles.

---

## Phase 2: Extract Shared Builder Framework

Goal: keep one LAB framework while splitting beverage logic cleanly.

### Checklist

- [x] Extract shared layout frame from `LabBuilderV2Page.tsx`.
- [ ] Create shared builder shell components:
  - [ ] `BuilderSwitcher`
  - [x] `BuilderFamilyCard`
  - [ ] `ActiveRecipeCard`
  - [ ] `AuthoringStatusCard`
  - [ ] `SaveAndHandoffCard`
  - [ ] `PredictionRailShell`
- [ ] Extract shared recipe draft state model separate from beverage solver state.
- [ ] Define a shared builder interface for beverage modules:
  - [ ] recipe identity
  - [ ] target model
  - [ ] ingredient model
  - [ ] process model
  - [ ] prediction output
  - [ ] compliance output
- [ ] Remove direct beverage branching from generic shared cards where possible.
- [ ] Add a shared guided-flow system:
  - [x] start prompt
  - [x] step modal / popup pattern
  - [x] next/back progression
  - [ ] save progress between steps

Current note:

- The guided flow now lives on the dedicated cider route wrapper instead of inside the temporary mixed workspace page.
- The cider route now has dedicated editable planning cards for targets, process, and starter ingredient planning.
- Those route-level cards shape the temporary mixed workspace through a guided handoff instead of forcing all cider editing into shared tables first.
- The next extraction step is moving cider target math and process editing completely out of the temporary mixed workspace and into cider-only modules.

### Done When

- [ ] Shared components do not contain tangled beer/cider/wine logic.
- [ ] Beverage pages can plug into the shared frame without copy-paste.
- [ ] Guided authoring can be reused across beverage pages.

---

## Phase 3: Build Beer Builder As The Beer-Specific Authority

Goal: keep beer strong and stable, but isolate it from cider/wine.

### Checklist

- [ ] Create `Beer Builder` page/module.
- [ ] Move current beer-only targets into beer page:
  - [ ] ABV
  - [ ] IBU
  - [ ] SRM
  - [ ] OG
  - [ ] FG
- [ ] Keep beer equipment and brewhouse concepts only in beer:
  - [ ] mash
  - [ ] sparge
  - [ ] boil
  - [ ] whirlpool
  - [ ] hop timing
- [ ] Keep beer ingredient lanes:
  - [ ] fermentables
  - [ ] hops
  - [ ] yeast
  - [ ] adjuncts
- [ ] Restore full beer process depth:
  - [ ] step timing
  - [ ] durations
  - [ ] hop events
  - [ ] brewhouse progression
- [ ] Keep beer dynamic/hybrid note solver attached only to beer logic.
- [ ] Validate that beer export to OS still maps correctly.

### Done When

- [ ] Beer builder works without cider or wine conditionals leaking into it.

---

## Phase 4: Build Cider Builder As The Production Cider Authority

Goal: make cider usable for real production planning and OS handoff.

### Checklist

- [ ] Create `Cider Builder` page/module.
- [ ] Replace beer-style target blocks with cider-first planning fields:
  - [ ] batch size
  - [ ] unit selection
  - [ ] ABV target
  - [ ] residual sugar target
  - [ ] OG target
  - [ ] FG target
  - [ ] pH target
  - [ ] carbonation target
  - [ ] sweetness / finish intent
- [ ] Build cider base model system:
  - [ ] juice
  - [ ] concentrate
  - [ ] base blend
  - [ ] water dilution
  - [ ] support sugars
  - [ ] specialty fruit additions
- [ ] Make named production bases first-class:
  - [ ] `BSG Select CiderBase`
  - [ ] future cider bases
- [ ] Build cider solver rules:
  - [ ] requested target
  - [ ] achievable base-only result
  - [ ] support gap
  - [ ] recommended support additions
  - [ ] attenuation influence from yeast
  - [ ] carbonation effect on profile/compliance
- [ ] Remove beer-only process concepts from cider:
  - [ ] no mash UI
  - [ ] no boil UI unless explicitly using a specialty cooked process
- [ ] Build cider process lanes:
  - [ ] juice / concentrate preparation
  - [ ] dilution / blending
  - [ ] nutrient / enzyme additions
  - [ ] primary fermentation
  - [ ] conditioning
  - [ ] carbonation / packaging intent
- [ ] Build cider ingredient picker behavior:
  - [ ] base materials
  - [ ] yeast
  - [ ] nutrients
  - [ ] enzymes
  - [ ] fruit additions
  - [ ] flavor / spice / hop review triggers
- [ ] Build cider sensory projection:
  - [ ] aroma
  - [ ] acid perception
  - [ ] body
  - [ ] finish
  - [ ] sweetness impression
  - [ ] carbonation impression
- [ ] Build guided cider authoring flow:
  - [ ] choose base
  - [x] choose target style / profile
  - [x] choose batch plan
  - [x] choose yeast / support additions
  - [ ] review process
  - [ ] review compliance
  - [ ] save / export handoff
- [ ] Keep compliance tied to cider planning:
  - [ ] TTB hard cider threshold checks
  - [ ] FDA vs TTB label path
  - [ ] flavor/fruit/hop review warnings
  - [ ] COLA planning hints

### Done When

- [ ] A user can author a cider recipe from base selection to OS handoff without touching beer concepts.
- [ ] Cider solver clearly shows target vs achievable vs supported result.

---

## Phase 5: Build Wine Builder As The Wine-Specific Authority

Goal: stop wine from being a token option and make it structurally correct.

### Checklist

- [ ] Create `Wine Builder` page/module.
- [ ] Define wine-first target fields:
  - [ ] batch size
  - [ ] Brix / SG
  - [ ] ABV target
  - [ ] pH target
  - [ ] TA target
  - [ ] residual sugar target
  - [ ] tannin/body target
- [ ] Define wine ingredient lanes:
  - [ ] must / juice
  - [ ] concentrate
  - [ ] sugar adjustment
  - [ ] acid adjustment
  - [ ] tannin
  - [ ] yeast
  - [ ] nutrient
  - [ ] fining / stabilization
- [ ] Build wine solver logic separate from cider and beer.
- [ ] Build wine process model:
  - [ ] crush / press if relevant
  - [ ] must prep
  - [ ] inoculation
  - [ ] fermentation
  - [ ] stabilization
  - [ ] aging / conditioning
- [ ] Add wine-specific compliance and label hints.
- [ ] Build guided wine authoring flow:
  - [ ] choose must / fruit base
  - [ ] choose targets
  - [ ] choose fermentation plan
  - [ ] choose cellar / stabilization plan
  - [ ] review compliance
  - [ ] save / export handoff

### Done When

- [ ] Wine no longer inherits beer or cider assumptions.

---

## Phase 6: Build Meaningful Base Systems

Goal: make bases important recipe drivers rather than tiny ingredient rows.

This is critical because you asked for the bases to be meaningful and not small.

### Checklist

- [ ] Add a dedicated `Primary Base` card for each beverage page.
- [ ] Make base selection a first-class workflow step, not just a row in the table.
- [ ] Show large base cards with:
  - [ ] product name
  - [ ] source type
  - [ ] technical specs
  - [ ] usable range
  - [ ] expected contribution
  - [ ] stock / availability
- [ ] For cider, base card should support:
  - [ ] concentrate specs
  - [ ] dilution envelope
  - [ ] must gravity estimate
  - [ ] pH range
  - [ ] package sizes
  - [ ] support gap guidance
- [ ] Base changes should re-drive the solver immediately.
- [ ] Ingredient editor should show the base as protected primary context, not just another row.
- [ ] Base selection should appear early in the guided flow as the first meaningful formulation decision.

### Done When

- [ ] Base selection feels like the start of formulation.
- [ ] Users understand the recipe foundation at a glance.

---

## Phase 7: Split The Solver Layer

Goal: formalize separate solver logic instead of branching inside one file.

### Checklist

- [ ] Create separate solver modules:
  - [ ] `beer-solver`
  - [ ] `cider-solver`
  - [ ] `wine-solver`
- [ ] Define a shared solver contract:
  - [ ] inputs
  - [ ] predicted outputs
  - [ ] warnings
  - [ ] infeasible states
  - [ ] support recommendations
- [ ] Make each solver responsible for its own:
  - [ ] target math
  - [ ] ingredient scaling
  - [ ] process defaults
  - [ ] sensory projection
  - [ ] validation warnings
- [ ] Remove beverage-specific solver branches from the shared page.

### Done When

- [ ] A beverage solver can change without destabilizing the others.

---

## Phase 8: Split The Process Editor Layer

Goal: process editing should match the beverage, not the previous beverage’s assumptions.

### Checklist

- [ ] Build `BeerProcessEditor`
- [ ] Build `CiderProcessEditor`
- [ ] Build `WineProcessEditor`
- [ ] Build beverage-specific timeline rendering
- [ ] Build beverage-specific default steps
- [ ] Build beverage-specific validation messages

### Done When

- [ ] The process section language and controls match the beverage being authored.

---

## Phase 9: Split The Compliance Layer

Goal: compliance guidance should follow beverage family and product facts.

### Checklist

- [ ] Keep shared compliance export contract.
- [ ] Build cider-specific compliance planner module.
- [ ] Build wine-specific compliance planner module.
- [ ] Keep beer-specific compliance separate.
- [ ] Ensure compliance profile snapshot versions with the recipe revision.
- [ ] Ensure publishable/export validation uses beverage-specific requirements.

### Done When

- [ ] LAB can tell the user whether the authored product is ready for OS handoff from a compliance standpoint.

---

## Phase 10: Split The Ingredient Picker Experience

Goal: picker behavior should match the beverage authoring workflow.

### Checklist

- [ ] Keep shared picker shell.
- [ ] Add beverage-specific tabs or filters:
  - [ ] base materials
  - [ ] fermentation inputs
  - [ ] flavor / specialty additions
  - [ ] process aids
- [ ] Show stock state clearly:
  - [ ] in stock
  - [ ] low
  - [ ] out
  - [ ] custom
- [ ] Prevent accidental duplicate rows where merge behavior is expected.
- [ ] Support `Add as primary base` where relevant.
- [ ] Move most ingredient adding into guided modal flows instead of exposing only dense inline tables.

### Done When

- [ ] Adding ingredients feels intentional and beverage-aware.

---

## Phase 11: Improve The Save / Export / OS Handoff Contract

Goal: the split builder still hands off one clean recipe snapshot to OS.

### Checklist

- [ ] Keep LAB as authoring authority only.
- [ ] Keep OS as execution authority only.
- [ ] Save beverage-specific builder state into recipe metadata.
- [ ] Export recipe + compliance snapshot together.
- [ ] Preserve immutable revisioning.
- [ ] Preserve schemaVersion and stable id.
- [ ] Preserve publishable validation before export.

### Done When

- [ ] OS receives clean, beverage-correct recipe authoring data without LAB writing inventory or execution records.

---

## Phase 12: Final UI/UX Pass

Goal: make the split builder feel polished and production-grade.

### Checklist

- [ ] Tighten page density after the split.
- [ ] Ensure no nested scrolling boxes in core authoring areas.
- [ ] Keep action buttons stable and obvious.
- [ ] Make active recipe card product-aware per beverage.
- [ ] Ensure builder family cards look like real recipe quick-look cards.
- [ ] Keep LAB amber/gold formulation identity.
- [ ] Carry universal shell behavior from OS without making LAB look like OS.
- [ ] Test desktop and mobile layouts.

### Done When

- [ ] Builder feels calm, readable, and trustworthy.

---

## Suggested Build Order

Use this exact order to avoid more structural breakage:

1. Phase 1: Lock information architecture
2. Phase 2: Extract shared builder framework
3. Phase 4: Build cider builder first
4. Phase 7: Split solver layer
5. Phase 8: Split process editor layer
6. Phase 10: Split ingredient picker experience
7. Phase 9: Split compliance layer
8. Phase 11: Save/export/handoff validation
9. Phase 3: stabilize beer builder in isolated module
10. Phase 5: build wine builder
11. Phase 12: final UI/UX polish

Reason:

- cider is your immediate production need
- solver separation must happen early
- process and picker must follow the solver split
- beer can be stabilized after the shared framework is clean
- wine can come after the architectural pattern is proven

---

## Immediate Next Step

When you say `next`, resume here:

- [ ] Phase 2: Begin moving cider targets, process, and ingredient-picking out of the temporary mixed workspace and into dedicated cider components under the dedicated cider route.

That next step should produce:

- cider target card component
- cider process card component
- cider ingredient/picker component boundary
- less cider-specific JSX living inside `LabBuilderV2Page.tsx`
