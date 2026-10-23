import { execSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const SPEC_V1_SUPPORTED =
  "https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v1.md#73-get-supported";
const SPEC_V2_SUPPORTED =
  "https://github.com/x402-foundation/x402/blob/main/specs/x402-specification-v2.md#731-supportedresponse-fields";
const SPEC_CITE = `x402 v1 §7.3 (${SPEC_V1_SUPPORTED}) or v2 §7.3.1 (${SPEC_V2_SUPPORTED})`;

const TIMEOUT_MS = 10_000;
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 500;

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const facilitatorsDir = join(root, "facilitators");

const argv = process.argv.slice(2);
const skipAuthed = argv.includes("--skip-authed");
const changedOnly = argv.includes("--changed");

const schema = JSON.parse(
  readFileSync(join(root, "schema", "facilitator.schema.json"), "utf8"),
);

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

function listFacilitatorFiles() {
  return readdirSync(facilitatorsDir)
    .filter((f) => f.endsWith(".json"))
    .sort();
}

function changedFacilitatorFiles() {
  const base =
    process.env.VALIDATE_BASE_REF?.trim() ||
    (process.env.GITHUB_BASE_REF
      ? `origin/${process.env.GITHUB_BASE_REF}`
      : "origin/main");
  let diff;
  try {
    diff = execSync(`git diff --name-only ${base}...HEAD -- facilitators`, {
      encoding: "utf8",
      cwd: root,
    });
  } catch {
    diff = execSync("git diff --name-only HEAD~1 HEAD -- facilitators", {
      encoding: "utf8",
      cwd: root,
    });
  }
  const files = diff
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("facilitators/") && line.endsWith(".json"))
    .map((line) => basename(line));
  return files.length > 0 ? files : listFacilitatorFiles();
}

function supportedUrl(baseUrl) {
  return `${baseUrl.replace(/\/$/, "")}/supported`;
}

/** CAIP-2 network id (x402 v2 SupportedKind.network). */
function isCaip2Network(network) {
  const match = /^([a-z0-9]+):(.+)$/.exec(network);
  return Boolean(match && match[2].length > 0);
}

function validateSupportedKind(kind, index) {
  const prefix = `kinds[${index}]`;
  if (kind === null || typeof kind !== "object" || Array.isArray(kind)) {
    return `${prefix} must be an object`;
  }
  if (typeof kind.x402Version !== "number" || !Number.isFinite(kind.x402Version)) {
    return `${prefix}.x402Version must be a number`;
  }
  if (kind.x402Version !== 1 && kind.x402Version !== 2) {
    return `${prefix}.x402Version must be 1 or 2`;
  }
  if (typeof kind.scheme !== "string" || kind.scheme.length === 0) {
    return `${prefix}.scheme must be a non-empty string`;
  }
  if (typeof kind.network !== "string" || kind.network.length === 0) {
    return `${prefix}.network must be a non-empty string`;
  }
  if (kind.x402Version === 2 && !isCaip2Network(kind.network)) {
    return `${prefix}.network must be CAIP-2 format when x402Version is 2 (e.g. eip155:8453)`;
  }
  return null;
}

/**
 * Minimum SupportedResponse check: non-empty kinds[]; each kind valid as v1 or v2 (§7.3).
 * Does not require extensions or signers.
 */
function validateSupportedBody(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return "response body must be a JSON object (SupportedResponse)";
  }
  if (!Array.isArray(body.kinds) || body.kinds.length === 0) {
    return `\`kinds\` must be a non-empty array (${SPEC_CITE})`;
  }
  for (let i = 0; i < body.kinds.length; i++) {
    const kindError = validateSupportedKind(body.kinds[i], i);
    if (kindError) {
      return kindError;
    }
  }
  return null;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function probeSupported(entry) {
  const url = supportedUrl(entry.baseUrl);
  let lastError = "unknown error";

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        lastError = `HTTP ${response.status} ${response.statusText} from ${url}`;
        if (attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return { ok: false, reason: lastError };
      }

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("json")) {
        lastError = `expected JSON Content-Type, got "${contentType || "(none)"}" from ${url}`;
        if (attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return { ok: false, reason: lastError };
      }

      let body;
      try {
        body = await response.json();
      } catch {
        lastError = `response from ${url} is not valid JSON`;
        if (attempt < MAX_ATTEMPTS) {
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        return { ok: false, reason: lastError };
      }

      const shapeError = validateSupportedBody(body);
      if (shapeError) {
        return {
          ok: false,
          reason: `${shapeError} — see ${SPEC_CITE}`,
        };
      }

      return { ok: true, kinds: body.kinds.length };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === "AbortError") {
        lastError = `timeout after ${TIMEOUT_MS}ms fetching ${url}`;
      } else {
        lastError = `${err.message} (${url})`;
      }
      if (attempt < MAX_ATTEMPTS) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return { ok: false, reason: lastError };
    }
  }

  return { ok: false, reason: lastError };
}

const allFiles = listFacilitatorFiles();
const probeFiles = new Set(
  changedOnly ? changedFacilitatorFiles() : allFiles,
);

if (allFiles.length === 0) {
  console.error("No facilitator JSON files found in facilitators/");
  process.exit(1);
}

let failed = false;
const probeResults = [];

for (const file of allFiles) {
  const path = join(facilitatorsDir, file);
  const idFromFile = basename(file, ".json");
  let entry;
  try {
    entry = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(`${file}: invalid JSON — ${err.message}`);
    failed = true;
    continue;
  }

  if (entry.id !== idFromFile) {
    console.error(
      `${file}: id "${entry.id}" does not match filename (expected "${idFromFile}")`,
    );
    failed = true;
  }

  if (!validateSchema(entry)) {
    console.error(`${file}:`);
    for (const err of validateSchema.errors ?? []) {
      console.error(`  ${err.instancePath || "/"} ${err.message}`);
    }
    failed = true;
    continue;
  }

  if (!probeFiles.has(file)) {
    continue;
  }

  if (skipAuthed && entry.authRequired === true) {
    console.log(`${entry.id}: probe skipped (authRequired, --skip-authed)`);
    probeResults.push({ id: entry.id, status: "skipped" });
    continue;
  }

  const result = await probeSupported(entry);
  if (result.ok) {
    console.log(
      `${entry.id}: probe ok — GET ${supportedUrl(entry.baseUrl)} (${result.kinds} kind(s))`,
    );
    probeResults.push({ id: entry.id, status: "ok", kinds: result.kinds });
  } else {
    console.error(`${entry.id}: probe failed — ${result.reason}`);
    probeResults.push({ id: entry.id, status: "failed", reason: result.reason });
    failed = true;
  }
}

const probed = probeResults.filter((r) => r.status !== "skipped").length;
const skipped = probeResults.filter((r) => r.status === "skipped").length;

console.log(
  `\nSchema: ${allFiles.length} file(s). Probes: ${probed} run, ${skipped} skipped, ${probeFiles.size} selected${changedOnly ? " (--changed)" : ""}.`,
);

if (failed) {
  process.exit(1);
}
