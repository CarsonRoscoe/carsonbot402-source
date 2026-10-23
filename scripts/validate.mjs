import { readFileSync, readdirSync } from "node:fs";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const root = join(fileURLToPath(new URL("..", import.meta.url)));
const facilitatorsDir = join(root, "facilitators");
const schema = JSON.parse(
  readFileSync(join(root, "schema", "facilitator.schema.json"), "utf8"),
);

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const files = readdirSync(facilitatorsDir).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.error("No facilitator JSON files found in facilitators/");
  process.exit(1);
}

let failed = false;

for (const file of files.sort()) {
  const path = join(facilitatorsDir, file);
  const idFromFile = basename(file, ".json");
  let data;
  try {
    data = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.error(`${file}: invalid JSON — ${err.message}`);
    failed = true;
    continue;
  }

  if (data.id !== idFromFile) {
    console.error(
      `${file}: id "${data.id}" does not match filename (expected "${idFromFile}")`,
    );
    failed = true;
  }

  if (!validate(data)) {
    console.error(`${file}:`);
    for (const err of validate.errors ?? []) {
      console.error(`  ${err.instancePath || "/"} ${err.message}`);
    }
    failed = true;
  }
}

if (failed) {
  process.exit(1);
}

console.log(`Validated ${files.length} facilitator file(s).`);
