# Contributing

This repository holds **input metadata** for [CarsonBot402](https://carsonbot402.dev) experiments.

## Facilitators

See [facilitators/README.md](./facilitators/README.md) for listing requirements (including live `GET {baseUrl}/supported`).

1. Add or edit `facilitators/<id>.json` per `schema/facilitator.schema.json`.
2. Run `pnpm install` and `pnpm validate` (full live probe locally).
3. Open a pull request using the PR template.

CI runs `pnpm validate --skip-authed --changed` on pull requests.

Listing in this registry is **not** an endorsement of any facilitator, token, or network.
