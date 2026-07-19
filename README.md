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
- Requests a grounded Companion explanation for the current step without sending identity, owner context or free text from the Demo.

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
`tokenizart.demo_atelier_message.v1` contract. The Demo emits ready, step,
error, completion, reset and explanation-request events. The Companion returns
only transport acknowledgements; it cannot navigate the machine or execute a
transition.

The bridge requires an allowlisted `return_origin` that matches the referrer
origin, uses an exact `targetOrigin`, checks `event.source`, rejects unknown
fields and fails closed. Messages contain only scenario, flow, step, language
and synthetic fixture IDs, plus an allowlisted error code when needed.

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

Validated staging Worker for the current shared visual contract:
`c4b1b049-520d-402c-b2a5-e0b8c1fa330d`. Production was not changed.

## Source synchronization

The contract snapshot comes from:

`tokenizart-cloudflare-ai/tokenizart-companion-agent/contracts/atelier-manual-native-microsteps.v1.json`

Update the snapshot only after the source contract passes its native asset audit and human visual QA.

Current snapshot: contract `1.13.0`, with 10 onboarding, 9 Smart Wallet, 13 Gallery, 15 Mint, 15 Certify, 26 NFC, 12 Transfer, 6 Privacy and 7 voucher steps
grouped into localized ES/EN/PT phases. States described by the verified manual
without a literal screenshot are rendered as explanatory UI, not fabricated
Atelier captures.

The optional `display_asset_id` keeps the native PPTX-derived `asset_id` as the auditable source while allowing a reviewed, sanitized didactic visual to be rendered when the source crop is truncated or does not explain the intended concept. It never replaces source traceability. Gallery metadata now uses a dedicated `ipfs-metadata-anatomy` display asset with synthetic values; the native source remains linked for audit.

`audit:visual:staging` checks all 163 active visual steps, records deployed image dimensions and payload hashes, flags panoramas, small sources and missing focus hotspots, and writes a filterable local report to `output/visual-qa/index.html`. Editorial decisions are versioned in `src/data/atelier-visual-qa-decisions.v1.json`: automatic geometry flags remain visible, but inspected atomic crops can be accepted without pretending that their original dimensions changed. QA decisions `1.3.0` leave 23 pending and 61 accepted assets, with zero unavailable resources and zero steps without a focus hotspot. Navigation, artwork loading, Gallery, Transfer and Privacy have completed human visual QA; the remaining queue is Mint 5, Certify 8 and NFC 10.

The production build separates React, XState and Lucide into stable vendor chunks. The main JavaScript chunk is 363 kB instead of the previous 605 kB monolith. A staging Chrome trace measured 372 ms LCP, 0.00 CLS and 38 ms TTFB without network throttling; these are lab observations, not field data.
