# carsonbot402-source

Public, crowdsourced **input registry** for [CarsonBot402](https://carsonbot402.dev). Weekly experiments read curated lists from this repository to probe live services and generate documentation the Q&A bot indexes.

This repository holds metadata and validation only — no experiment runners or sample apps.

## Sources

Input lists are grouped by experiment type:

### Facilitators

x402 facilitator operators and public `baseUrl` values used to probe `GET /supported` and related facilitator APIs.

See **[facilitators/README.md](./facilitators/README.md)** for entry format, listing requirements, and how to add or update a facilitator.

_(Additional source types may be added here as new CarsonBot402 experiments are introduced.)_

## Validation

```bash
pnpm install
pnpm validate              # schema + live /supported probes (all entries)
pnpm validate --skip-authed  # skip entries with authRequired: true
```

Pull request CI runs `pnpm validate --skip-authed --changed`. See [CONTRIBUTING.md](./CONTRIBUTING.md).
