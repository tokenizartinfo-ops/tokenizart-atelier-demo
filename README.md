# Tokenizart Atelier Demo

Public, synthetic and multilingual simulator for learning Atelier without using a real account or executing Tokenizart actions.

## What it does

- Exposes 12 approved Atelier flows and the verified native microsteps from Manual Atelier 2026.
- Supports Spanish, English and Portuguese.
- Simulates account activation, Smart Wallet, artwork preload, Mint, Certify, NFC, transfer, privacy, vouchers and public traceability.
- Shows controlled failure scenarios and recovery guidance.
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
