# Contributing

This repository holds **input metadata** for [CarsonBot402](https://carsonbot402.dev) experiments. It does not run probes itself.

## Add or update a facilitator

1. Copy the fields from `schema/facilitator.schema.json`.
2. Add or edit `facilitators/<id>.json` (one file per facilitator; `id` must match the filename).
3. Run `pnpm install` and `pnpm validate`.
4. Open a pull request using the PR template.

Use the **Add or update facilitator** issue template if you cannot open a PR.

## Review expectations

Maintainers check that entries include a verifiable public `source`, sensible URLs, and valid JSON. Automated CI runs `pnpm validate` on every PR.

Listing in this registry is **not** an endorsement of any facilitator, token, or network.
