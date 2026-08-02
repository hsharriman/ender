#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const catalogPath = join(root, "src/checker/grammar/defs/reasons.defs.ts");
const proofsPath = join(root, "src/checker/proofs");
// The bundled fixtures are mostly one-reason unit tests; the textbook corpus
// in the geo-proof-dataset submodule is the representative sample.  Run
// `git submodule update --init` to populate it; until then only fixture
// parity is reported.
const datasetPath = join(root, "geo-proof-dataset/proofs");
const catalog = [
  ...readFileSync(catalogPath, "utf8").matchAll(/^  ([a-zA-Z0-9_]+): \{/gm),
].map((match) => match[1]);

const implemented = new Set([
  "given",
  "sas",
  "sss",
  "asa",
  "aas",
  "cpctc",
  "con_seg_transitive",
  "con_ang_transitive",
  "con_tri_transitive",
  "def_con_right",
  "def_midpt",
  "vert_ang",
  "def_ang_bisect",
  "rhl",
  "midpt_conv",
  "third_angle",
  "def_con_tri",
  "def_isosceles",
  "base_angle",
  "base_angle_conv",
  "def_equilateral",
  "def_equiangular",
  "equilat_equiang",
  "equiang_equilat",
  "con_supplements",
  "con_supplements_same",
  "def_perp",
  "perp_con_ang",
]);
// reflex: segment reflexivity only; ref_ang needs nondegenerate rays, and the
// kernel does not yet read the `ang:` declarations that would supply them.
const partial = new Set(["reflex"]);
const priorityOne = new Set(["ang_bisect_conv"]);
const defer = /arc|sim_|_sim|inscribed|tangent|chord|radius|incenter|circumcenter|square|csstp|rect_para_right_opp/;

const files = [];
const walk = (directory) => {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (name.endsWith(".txt")) files.push(path);
  }
};
walk(proofsPath);
const fixtureCount = files.length;
let datasetFiles = [];
try {
  datasetFiles = readdirSync(datasetPath)
    .filter((name) => name.endsWith(".txt"))
    .map((name) => join(datasetPath, name))
    .sort();
} catch {
  datasetFiles = [];
}

const reasonFiles = new Map(catalog.map((reason) => [reason, []]));
const applicationsIn = (source) => {
  const steps = source.split(/^steps:\s*$/m)[1] ?? "";
  return [
    ...steps.matchAll(
      /^\s*\[[0-9]+\]\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^\n]*?\)\s*->\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/gm,
    ),
  ].map((match) => ({ reason: match[1], conclusion: match[2] }));
};
const reasonsIn = (source) => applicationsIn(source).map(({ reason }) => reason);
for (const file of files) {
  const used = new Set(reasonsIn(readFileSync(file, "utf8")));
  for (const reason of used) reasonFiles.get(reason)?.push(relative(root, file));
}

const entries = catalog.map((reason) => {
  const status = implemented.has(reason)
    ? "verified"
    : partial.has(reason)
      ? "partial"
      : "unimplemented";
  const priority =
    status === "verified" ? 0 : priorityOne.has(reason) ? 1 : defer.test(reason) ? 3 : 2;
  const axioms =
    ["sas", "sss", "asa", "aas", "cpctc"].includes(reason)
      ? "GeoCoq neutral Tarski geometry"
      : ["con_seg_transitive", "con_ang_transitive", "con_tri_transitive"].includes(
            reason,
          )
        ? "GeoCoq congruence transitivity and symmetry"
      : reason === "def_con_right"
        ? "GeoCoq l11_16 (congruence of right angles)"
      : reason === "perp_con_ang"
        ? "GeoCoq Perp_at definition, l8_2, and l11_16"
      : reason === "def_midpt"
        ? "GeoCoq Midpoint definition"
      : reason === "vert_ang"
        ? "GeoCoq l11_14 (vertical angles)"
      : reason === "def_ang_bisect"
        ? "audited AngleBisector meaning"
      : reason === "rhl"
        ? "GeoCoq cong2_per2__cong_3 (neutral geometry)"
      : reason === "midpt_conv"
        ? "GeoCoq l7_20 (unique equidistant point on a line)"
      : reason === "third_angle"
        ? "GeoCoq Tarski_euclidean via Playfair; the only Euclidean rule"
      : ["base_angle", "base_angle_conv", "equilat_equiang", "equiang_equilat"].includes(
            reason,
          )
        ? "GeoCoq l11_44_1 (pons asinorum, both directions)"
      : ["def_isosceles", "def_equilateral", "def_equiangular", "def_con_tri"].includes(
            reason,
          )
        ? "audited meaning plus declared-triangle nondegeneracy"
      : ["con_supplements", "con_supplements_same"].includes(reason)
        ? "GeoCoq suppa2__conga123 and conga2_suppa__suppa"
      : reason === "def_perp"
        ? "GeoCoq per_perp_in and perp_in_col_perp_in"
      : reason === "given" || reason === "reflex"
        ? "logical/equality infrastructure"
        : "to determine from the weakest supporting GeoCoq theorem";
  const note =
    reason === "reflex"
      ? "Segment conclusion verified; ref_ang remains fail-closed pending nondegenerate rays."
      : status === "verified"
        ? "Parsed, checked, and covered by the kernel soundness proof."
        : priority === 3
          ? "Deferred: semantic design, circle/arc machinery, or higher-complexity dependency."
          : "No executable Rocq rule yet; fail-closed."
  return { reason, status, priority, axioms, fixtures: reasonFiles.get(reason) ?? [], note };
});

const checker = process.env.ENDER_CHECKER ?? "ender-checker";
const classify = (file) => {
  const source = readFileSync(file, "utf8");
  const applications = applicationsIn(source);
  const reasons = [...new Set(reasonsIn(source))];
  let report;
  try {
    report = JSON.parse(execFileSync(checker, ["--report", file], { encoding: "utf8" }));
  } catch (error) {
    const stdout = error?.stdout?.toString();
    if (!stdout) throw error;
    report = JSON.parse(stdout);
  }
  // Partially implemented reasons only count as supported for the conclusion
  // forms their verified rule can actually produce.
  const partialConclusions = { reflex: ["ref_seg"] };
  const unsupported = [
    ...new Set(
      applications
        .filter(
          ({ reason, conclusion }) =>
            (!implemented.has(reason) && !partial.has(reason)) ||
            (partial.has(reason) &&
              !partialConclusions[reason].includes(conclusion)),
        )
        .map(({ reason, conclusion }) =>
          partial.has(reason) ? `${reason}(${conclusion})` : reason,
        ),
    ),
  ];
  // Acceptance is the ground truth; the reason labels only explain rejections.
  const category =
    report.verdict === "accepted"
      ? "accepted"
      : report.verdict === "failed_to_parse_problem"
        ? "parse-failure"
        : unsupported.length > 0
          ? "unsupported-reason"
          : "rejected-supported-slice";
  return {
    file: relative(root, file),
    verdict: report.verdict,
    category,
    reasons,
    unsupported,
  };
};
const parity = files.map(classify);
const datasetParity = datasetFiles.map(classify);

const categories = [
  "accepted",
  "rejected-supported-slice",
  "unsupported-reason",
  "parse-failure",
];
const tally = (items) =>
  Object.fromEntries(
    categories.map((category) => [
      category,
      items.filter((item) => item.category === category).length,
    ]),
  );
const summary = tally(parity);
const datasetSummary = tally(datasetParity);

const manifestPath = join(root, "docs/reason-coverage.json");
const manifestText =
  JSON.stringify({ generatedFrom: "src/checker/grammar/defs/reasons.defs.ts", entries }, null, 2) + "\n";
if (process.argv.includes("--write")) writeFileSync(manifestPath, manifestText);
if (
  process.argv.includes("--check") &&
  readFileSync(manifestPath, "utf8") !== manifestText
) {
  console.error("docs/reason-coverage.json is stale; run npm run reasonCoverage -- --write");
  process.exitCode = 1;
}

if (process.argv.includes("--json")) {
  process.stdout.write(
    JSON.stringify(
      { summary, parity, datasetSummary, datasetParity, entries },
      null,
      2,
    ) + "\n",
  );
} else {
  console.log(`Reason catalog: ${entries.length}`);
  console.log(
    `Coverage: ${entries.filter((x) => x.status === "verified").length} verified, ` +
      `${entries.filter((x) => x.status === "partial").length} partial, ` +
      `${entries.filter((x) => x.status === "unimplemented").length} unimplemented`,
  );
  console.log(`\nBundled fixtures (${fixtureCount}):`);
  for (const [category, count] of Object.entries(summary))
    console.log(`  ${category}: ${count}`);
  if (datasetFiles.length) {
    console.log(`\nTextbook corpus (${datasetFiles.length}):`);
    for (const [category, count] of Object.entries(datasetSummary))
      console.log(`  ${category}: ${count}`);
  } else {
    console.log(
      "\nTextbook corpus: geo-proof-dataset submodule is empty; run" +
        " `git submodule update --init` to include it",
    );
  }
  if (!process.argv.includes("--summary")) {
    console.log("\nUnsupported-reason fixtures:");
    for (const item of parity.filter((x) => x.category === "unsupported-reason"))
      console.log(`- ${item.file}: ${item.unsupported.join(", ")}`);
  }
  if (process.argv.includes("--write")) console.log("\nUpdated docs/reason-coverage.json");
}
