# Facilitator input list

CarsonBot402 weekly experiments read one JSON file per facilitator in this directory. Each file describes a public x402 facilitator API origin so experiments can call standard endpoints (starting with **`GET {baseUrl}/supported`**) and build indexed ecosystem documentation.

**Listing here is not an endorsement.** Entries are community-submitted metadata CarsonBot402 may use as input, not a security review, partnership, or recommendation.

## Listing requirements

1. **`baseUrl`** — Public HTTPS API origin with **no trailing slash**.
2. **`GET {baseUrl}/supported`** — Must return **HTTP 200** and JSON with a non-empty `kinds` array. Each kind must be valid under **either** x402 v1 or v2 (mixed arrays are allowed):
   - [x402 v1 §7.3 GET /supported](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v1.md#73-get-supported) — `x402Version` **1**, non-empty `scheme`, v1-style `network` name (for example `base-sepolia`)
   - [x402 v2 §7.3 / §7.3.1 SupportedResponse](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md#731-supportedresponse-fields) — `x402Version` **2**, non-empty `scheme`, `network` in **CAIP-2** form (for example `eip155:8453`)
   - `extensions` and `signers` are **not** required for listing
3. **`source`** — Link to public documentation or an official announcement that describes this facilitator.
4. **Filename** — `facilitators/<id>.json` where `id` matches the `id` field (lowercase kebab-case).

Custom `/supported` paths are not supported in this registry; the path is always `/supported` under `baseUrl`.

Facilitators without a stable public `baseUrl` (for example self-hosted-only integrations) cannot be listed here.

If `/supported` requires authentication, set **`authRequired`: `true`** so maintainers can skip automated probes in CI while still recording the endpoint for authenticated experiments.

## Entry fields

Defined in [`schema/facilitator.schema.json`](../schema/facilitator.schema.json).

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Slug; matches filename |
| `name` | yes | Display name |
| `baseUrl` | yes | Public origin; `{baseUrl}/supported` must work |
| `source` | yes | Public docs URL |
| `addedAt` | yes | `YYYY-MM-DD` first listed in this repo |
| `operator` | no | Organization running the facilitator |
| `website`, `docs` | no | Operator site and facilitator docs |
| `networks`, `assets` | no | Claimed coverage (informational) |
| `openSourceRepo` | no | Source repository if open source |
| `contact` | no | `{ "url" }` or `{ "email" }` |
| `authRequired` | no | `true` when `/supported` needs credentials |

## How to add or update

1. Add or edit `facilitators/<id>.json` (see existing files).
2. Run `pnpm install` and `pnpm validate` locally (full probe run).
3. Open a pull request using the repository PR template, or file an **Add or update facilitator** issue.

Maintainers run the same JSON Schema and live `/supported` checks in CI (`pnpm validate --skip-authed --changed` on pull requests).

## Related

- [x402 facilitators overview](https://docs.x402.org/dev-tools/facilitators)
- [GET /supported (x402 v1 §7.3)](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v1.md#73-get-supported)
- [GET /supported (x402 v2 §7.3)](https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md#73-get-supported)
