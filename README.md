# Tokenizart Atelier Demo

Public, synthetic and multilingual simulator for learning Atelier without using a real account or executing Tokenizart actions.

## What it does

- Exposes 12 approved Atelier flows and the verified native microsteps from Manual Atelier 2026.
- Supports Spanish, English and Portuguese.
- Simulates account activation, Smart Wallet, artwork preload, Mint, Certify, NFC, transfer, privacy, vouchers and public traceability.
- Shows controlled failure scenarios and recovery guidance.
- Lets the user configure a synthetic Certify actor, supported fact, evidence and owner/public visibility, then renders the completed provenance state.
- Teaches four verified NFC readings, the mobile scan, voucher/signature gates and the final linked-tag receipt without touching a physical tag.
- Lets an owner compare Level 4 and visitor Level 5 views before simulating Gallery, technical-sheet and per-Certify visibility.
- Shows the dated public Shop snapshot, who consumes each voucher, and a synthetic credit receipt without performing a purchase.
- Keeps state only in browser `sessionStorage`.
- Opens through a Companion bridge that keeps the current synthetic step synchronized with an A2UI card.
- Shows a deterministic local explanation on every step and requests an optional grounded Companion expansion without sending identity, owner context or free text from the Demo.
- Uses the `Atelier first` layout: flow rail plus one framed practice surface, with screen, synthetic controls and current-step guidance in the same journey.
- Applies the verified Tokenizart identity from `Aplicaciones_Marca_tokenizart.pdf`: Montserrat, the real fingerprint symbol, and restrained cyan, magenta and coral accents.
- Uses native action icons from Manual Atelier 2026 and changes the practice controls with the current step instead of repeating one form throughout the flow.
- Applies that focused practice pattern to the complete 163-step visual contract, including navigation, public Gallery traceability and the six-action map, with at most one contextual decision cluster per step.

## What it never does

- No real Atelier, gestion, wallet, Gnosis, IPFS or voucher mutation.
- No real user files, emails, passwords, keys or owner context.
- No LLM-controlled state transitions.

## Architecture

The UI is a React/Vite SPA. XState owns deterministic transitions. A Cloudflare Worker serves the SPA and proxies allowlisted sanitized images from the existing `tokenizart-rag-assets` R2 bucket.

```text
Manual contract -> XState engine -> React UI -> sessionStorage
Sanitized R2 assets -> read-only Worker route -> React UI
Allowlisted synthetic IDs -> exact-origin postMessage -> Companion A2UI bridge
```

## Companion bridge

`/demo-atelier` on the Companion embeds this app and validates the versioned
`tokenizart.demo_atelier_message.v1` contract, currently version `1.1.0`.
The Demo emits ready, step, synthetic-practice-selection, error, completion,
reset and explanation-request events. The Companion returns
transport acknowledgements and a grounded explanation-available signal; it
cannot navigate the machine or execute a transition. The bridge automatically
refreshes the Companion explanation when the synthetic step changes, cancels
stale requests and caches expansions per language, flow, step, fixture and
allowlisted practice selection.

The bridge requires an allowlisted `return_origin` that matches the referrer
origin, uses an exact `targetOrigin`, checks `event.source`, rejects unknown
fields and fails closed. Messages contain only scenario, flow, step, language
and synthetic fixture IDs, plus an allowlisted error code or a closed
`practice_state` for a navigation filter, Gallery endpoint or action focus.
No free text, identity, owner context or real asset reference crosses the
bridge.

## Phase 2 status

Specialized actor/result verticals are available for `Certify`, `Mint`, `NFC`, `Transfer`, `Privacy` and `Vouchers`.

`Certify` includes:

- Synthetic owner/artist, expert and gallery/museum actors.
- Authenticity, condition, exhibition and additional-report evidence types.
- Public or owner-only visibility.
- Deterministic voucher consumption and idempotent completion.
- Final receipt and provenance timeline in Spanish, English and Portuguese.

`Mint` includes:

- Synthetic owner/artist and authorized-manager actors.
- Single artwork and two-artwork batch modes.
- Fifteen verified visual microsteps from selection and review through result verification.
- Localized phases for selection, authorization, processing, recovery and batch result.
- Five explicit Mint states: ready, processing, minted, error and uncertain confirmation.
- Explicit review, voucher, and simulated-signature gates.
- Deterministic Gnosis, token, transaction, and IPFS references that are clearly marked as simulations.
- Idempotent voucher consumption and a final digital-identity timeline in Spanish, English and Portuguese.

`NFC` includes:

- Synthetic owner/artist and authorized-certifier actors.
- Explicit `Ready to link`, already-linked artwork, non-Tokenizart/unencoded tag and incompatible-encoding readings.
- Mobile-scan, voucher and simulated-wallet-signature gates.
- Deterministic tag, Certify, token and transaction references.
- Idempotent voucher consumption and a final physical/digital-link timeline in Spanish, English and Portuguese.

`Transfer` includes:

- Synthetic Tokenizart-user and external-wallet destinations.
- Recipient, external-boundary and simulated-signature confirmations.
- Twelve native visual steps grouped into selection, authorization, processing, verification and recovery phases.
- Explicit recipient-ready, processing, transferred, unresolved-recipient, external-wallet and uncertain-confirmation states.
- Previous owner, new owner, destination wallet, token and transaction references.
- Explicit zero-voucher behavior and an Atelier-management boundary.
- A final ownership timeline in Spanish, English and Portuguese without implying a sale, price, payment, physical delivery or copyright assignment.

`Privacy` includes:

- A side-by-side audience model for the authenticated owner (Level 4) and public visitor (Level 5).
- Six native visual steps grouped into visibility decision, owner configuration and audience-result phases.
- Explicit public, owner-complete, hidden-artwork, partial-public and future-owner states.
- An artwork-level Gallery control plus technical-sheet and individual Certify visibility.
- Explicit owner confirmation before applying the synthetic policy.
- A deterministic receipt that distinguishes public Certify records from owner-only records.
- A clear rule that hiding information does not delete it from the owner environment and that a future owner controls visibility after transfer.

`Vouchers` includes:

- Dated public Shop prices verified on `2026-07-14`, with a direct link to the official Shop for live confirmation.
- Starter Kit, Mint, Certify and Chip products with explicit synthetic balance effects.
- A consumption matrix: the executing actor consumes Mint, Certify or NFC; transfer consumes none.
- Explicit separation between vouchers, gas, money, cryptocurrency, physical chips and real owner balances.
- An idempotent synthetic credit receipt; no payment, order, assignment, delivery, refund or real credit occurs.

All six action verticals expose specialized deterministic completion states.

## Local development

```bash
npm install
npm run dev
npm test
npm run test:ui
npm run eval:human-journeys:staging
npm run audit:visual:staging
npm run smoke:assets:staging
```

Local Vite does not have the R2 binding, so the interface remains usable but manual images return 404. Use Wrangler or the deployed staging Worker to verify R2 visuals.

## Deploy

```bash
npm run deploy:dry-run
npm run deploy:staging
```

Expected staging host: `https://demo-atelier-staging.tokenizart.info`.

Validated staging Worker for the current `Atelier first` layout:
`bf8d7c63-95d9-4f52-8f23-aaec7d1d56e8`. Production was not changed.

## Source synchronization

The contract snapshot comes from:

`tokenizart-cloudflare-ai/tokenizart-companion-agent/contracts/atelier-manual-native-microsteps.v1.json`

Update the snapshot only after the source contract passes its native asset audit and human visual QA.

Current snapshot: contract `1.14.0`, with 10 onboarding, 9 Smart Wallet, 13 Gallery, 15 Mint, 15 Certify, 26 NFC, 12 Transfer, 6 Privacy and 7 voucher steps
grouped into localized ES/EN/PT phases. States described by the verified manual
without a literal screenshot are rendered as explanatory UI, not fabricated
Atelier captures.

The optional `display_asset_id` keeps the native PPTX-derived `asset_id` as the auditable source while allowing a reviewed, sanitized didactic visual to be rendered when the source crop is truncated or does not explain the intended concept. It never replaces source traceability. Gallery metadata now uses a dedicated `ipfs-metadata-anatomy` display asset with synthetic values; the native source remains linked for audit.

`audit:visual:staging` checks all 163 active visual steps, records deployed image dimensions and payload hashes, flags panoramas, small sources and missing focus hotspots, and writes a filterable local report to `output/visual-qa/index.html`. Editorial decisions are versioned in `src/data/atelier-visual-qa-decisions.v1.json`: automatic geometry flags remain visible, but inspected atomic crops can be accepted without pretending that their original dimensions changed. QA decisions `1.6.0` leave zero pending and 84 accepted assets, with zero unavailable resources and zero steps without a focus hotspot. All active visual flows have completed human visual QA; geometry flags remain observable but no longer represent unresolved editorial work.

`eval:human-journeys:staging` walks all twelve active flows from start to finish on desktop and mobile. It verifies all 326 rendered states for image availability, step/practice alignment, adjacent explanation continuity, critical font sizes, horizontal overflow and more than one contextual practice action per step. The 2026-07-22 staging run passed with zero failures in every category.

The production build separates React, XState and Lucide into stable vendor chunks. The main JavaScript chunk is 363 kB instead of the previous 605 kB monolith. A staging Chrome trace measured 372 ms LCP, 0.00 CLS and 38 ms TTFB without network throttling; these are lab observations, not field data.
