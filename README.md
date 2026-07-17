# Tokenizart Atelier Demo

Public, synthetic and multilingual simulator for learning Atelier without using a real account or executing Tokenizart actions.

## What it does

- Exposes 12 approved Atelier flows and the verified native microsteps from Manual Atelier 2026.
- Supports Spanish, English and Portuguese.
- Simulates account activation, Smart Wallet, artwork preload, Mint, Certify, NFC, transfer, privacy, vouchers and public traceability.
- Shows controlled failure scenarios and recovery guidance.
- Lets the user configure a synthetic Certify actor, supported fact, evidence and owner/public visibility, then renders the completed provenance state.
- Teaches the three NFC readings, the mobile scan, voucher/signature gates and the final linked-tag receipt without touching a physical tag.
- Keeps state only in browser `sessionStorage`.
- Deep-links the current step to Tokenizart Companion.

## What it never does

- No real Atelier, gestion, wallet, Gnosis, IPFS or voucher mutation.
- No real user files, emails, passwords, keys or owner context.
- No LLM-controlled state transitions.

## Architecture

The UI is a React/Vite SPA. XState owns deterministic transitions. A Cloudflare Worker serves the SPA and proxies allowlisted sanitized images from the existing `tokenizart-rag-assets` R2 bucket.

```text
Manual contract -> XState engine -> React UI -> sessionStorage
Sanitized R2 assets -> read-only Worker route -> React UI
Current IDs -> Companion deep link / A2UI integration
```

## Phase 2 status

Specialized actor/result verticals are available for `Certify`, `Mint` and `NFC`.

`Certify` includes:

- Synthetic owner/artist, expert and gallery/museum actors.
- Authenticity, condition, exhibition and additional-report evidence types.
- Public or owner-only visibility.
- Deterministic voucher consumption and idempotent completion.
- Final receipt and provenance timeline in Spanish, English and Portuguese.

`Mint` includes:

- Synthetic owner/artist and authorized-manager actors.
- Single artwork and two-artwork batch modes.
- Explicit review, voucher, and simulated-signature gates.
- Deterministic Gnosis, token, transaction, and IPFS references that are clearly marked as simulations.
- Idempotent voucher consumption and a final digital-identity timeline in Spanish, English and Portuguese.

`NFC` includes:

- Synthetic owner/artist and authorized-certifier actors.
- Explicit `Ready to link`, already-linked artwork and non-Tokenizart tag readings.
- Mobile-scan, voucher and simulated-wallet-signature gates.
- Deterministic tag, Certify, token and transaction references.
- Idempotent voucher consumption and a final physical/digital-link timeline in Spanish, English and Portuguese.

Transfer still uses its generic deterministic completion state and will receive the same actor/result treatment incrementally.

## Local development

```bash
npm install
npm run dev
npm test
npm run test:ui
npm run smoke:assets:staging
```

Local Vite does not have the R2 binding, so the interface remains usable but manual images return 404. Use Wrangler or the deployed staging Worker to verify R2 visuals.

## Deploy

```bash
npm run deploy:dry-run
npm run deploy:staging
```

Expected staging host: `https://demo-atelier-staging.tokenizart.info`.

## Source synchronization

The contract snapshot comes from:

`tokenizart-cloudflare-ai/tokenizart-companion-agent/contracts/atelier-manual-native-microsteps.v1.json`

Update the snapshot only after the source contract passes its native asset audit and human visual QA.
