# carsonbot402-source

Public, crowdsourced **input registry** for [CarsonBot402](https://carsonbot402.dev) — the x402 Q&A assistant.

CarsonBot402’s weekly experiments read the facilitator entries in this repository to:

- Probe facilitator HTTP surfaces such as `/supported`, `/verify`, and `/settle` (where applicable)
- Exercise Bazaar-style discovery where documented
- Generate ecosystem documentation that the Q&A bot indexes for answers

This repo contains **metadata only** (no experiment runners, no example apps). The canonical shape is `facilitators/<id>.json`, validated by `schema/facilitator.schema.json`.

## Listing is not endorsement

Entries are contributed by operators and the community. Inclusion means “here is public information CarsonBot402 may use as input,” not a recommendation, security review, or partnership.

## Add your facilitator

1. Read [CONTRIBUTING.md](./CONTRIBUTING.md).
2. Add `facilitators/<id>.json` following the schema (see existing files).
3. Run `pnpm install` and `pnpm validate`.
4. Open a pull request (or file an issue using **Add or update facilitator**).

Required fields include `id`, `name`, `baseUrl`, `supportedPath` (default `/supported`), `source` (public docs link), and `addedAt`. Optional fields cover operator, website, docs, claimed networks/assets, open-source repo, and contact.

## Validation

```bash
pnpm install
pnpm validate
```

GitHub Actions runs the same check on every pull request.

## Related links

- [x402 facilitator overview](https://docs.x402.org/dev-tools/facilitators)
- [GET /supported (x402 v2 spec)](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md#73-get-supported)
