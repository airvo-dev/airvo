import fs from "node:fs";
import path from "node:path";

const i18nDir = path.resolve("src/i18n");
const baseLang = "en";

function flattenKeys(obj, prefix = "") {
  const out = new Set();
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      for (const nested of flattenKeys(v, key)) out.add(nested);
    } else {
      out.add(key);
    }
  }
  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

const files = fs
  .readdirSync(i18nDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (!files.length) {
  console.error("No i18n JSON files found in src/i18n");
  process.exit(1);
}

const baseFile = `${baseLang}.json`;
if (!files.includes(baseFile)) {
  console.error(`Missing base language file: ${baseFile}`);
  process.exit(1);
}

const baseObj = readJson(path.join(i18nDir, baseFile));
const baseKeys = flattenKeys(baseObj);

let hasErrors = false;

for (const file of files) {
  if (file === baseFile) continue;
  const lang = path.basename(file, ".json");
  const obj = readJson(path.join(i18nDir, file));
  const keys = flattenKeys(obj);

  const missing = [...baseKeys].filter((k) => !keys.has(k));
  const extra = [...keys].filter((k) => !baseKeys.has(k));

  if (missing.length || extra.length) {
    hasErrors = true;
    console.error(`\n[${lang}] key mismatch:`);
    if (missing.length) {
      console.error(`  Missing (${missing.length}): ${missing.join(", ")}`);
    }
    if (extra.length) {
      console.error(`  Extra (${extra.length}): ${extra.join(", ")}`);
    }
  }
}

if (hasErrors) {
  console.error("\ni18n check failed.");
  process.exit(1);
}

console.log(`i18n check passed. ${files.length} language files are in sync with ${baseFile}.`);
