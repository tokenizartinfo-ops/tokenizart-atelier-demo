# Tokenizart Atelier Demo Agent Instructions

This repository owns the public, synthetic Atelier simulator.

## Authority

- Obsidian/GitHub remain the editable source of truth.
- Manual Atelier 2026 and its verified microstep contracts define product flow.
- This app is a simulation, never evidence of a real Tokenizart operation.

## Guardrails

- Never call real Atelier owner, gestion, wallet, blockchain, IPFS mutation or voucher endpoints.
- Never request or store real passwords, private keys, seed phrases, wallet addresses or user files.
- Use only synthetic fixtures and sanitized R2 assets.
- Every state transition must be deterministic and testable.
- LLMs may explain a step but cannot decide or execute a transition.
- Slides 100 and 101 of Manual Atelier 2026 are excluded.

## Runtime

- React/Vite SPA on Cloudflare Workers Static Assets.
- XState owns session transitions.
- Browser `sessionStorage` is the MVP persistence boundary.
- R2 is read-only and allowlisted by asset id.

