#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const catalogPath = join(root, "src/checker/grammar/defs/reasons.defs.ts");
const proofsPath = join(root, "src/checker/proofs");
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
]);
// perp_con_ang: con_right conclusions only; con_ang needs nondegenerate rays
const partial = new Set(["reflex", "perp_con_ang"]);
const priorityOne = new Set([
  "rhl",
  "midpt_conv",
  "def_ang_bisect",
  "ang_bisect_conv",
  "third_angle",
]);
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
        ? "GeoCoq Perp_at definition and l8_2"
      : reason === "def_midpt"
        ? "GeoCoq Midpoint definition"
      : reason === "vert_ang"
        ? "GeoCoq l11_14 (vertical angles)"
      : reason === "given" || reason === "reflex"
        ? "logical/equality infrastructure"
        : "to determine from the weakest supporting GeoCoq theorem";
  const note =
    reason === "reflex"
      ? "Segment conclusion verified; ref_ang remains fail-closed pending nondegenerate rays."
      : reason === "perp_con_ang"
        ? "con_right conclusion verified; con_ang remains fail-closed pending nondegenerate rays."
      : status === "verified"
        ? "Parsed, checked, and covered by the kernel soundness proof."
        : priority === 3
          ? "Deferred: semantic design, circle/arc machinery, or higher-complexity dependency."
          : "No executable Rocq rule yet; fail-closed."
  return { reason, status, priority, axioms, fixtures: reasonFiles.get(reason) ?? [], note };
});

const checker = process.env.ENDER_CHECKER ?? "ender-checker";
const parity = files.map((file) => {
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
  const partialConclusions = {
    reflex: ["ref_seg"],
    perp_con_ang: ["con_right"],
  };
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
  const category =
    report.verdict === "failed_to_parse_problem"
      ? "parse-failure"
      : unsupported.length > 0
        ? "unsupported-reason"
        : report.verdict === "accepted"
          ? "accepted"
          : "rejected-supported-slice";
  return {
    file: relative(root, file),
    verdict: report.verdict,
    category,
    reasons,
    unsupported,
  };
});

const summary = Object.fromEntries(
  ["accepted", "rejected-supported-slice", "unsupported-reason", "parse-failure"].map(
    (category) => [category, parity.filter((item) => item.category === category).length],
  ),
);

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
  process.stdout.write(JSON.stringify({ summary, parity, entries }, null, 2) + "\n");
} else {
  console.log(`Reason catalog: ${entries.length}`);
  console.log(
    `Coverage: ${entries.filter((x) => x.status === "verified").length} verified, ` +
      `${entries.filter((x) => x.status === "partial").length} partial, ` +
      `${entries.filter((x) => x.status === "unimplemented").length} unimplemented`,
  );
  for (const [category, count] of Object.entries(summary))
    console.log(`${category}: ${count}`);
  if (!process.argv.includes("--summary")) {
    console.log("\nUnsupported-reason fixtures:");
    for (const item of parity.filter((x) => x.category === "unsupported-reason"))
      console.log(`- ${item.file}: ${item.unsupported.join(", ")}`);
  }
  if (process.argv.includes("--write")) console.log("\nUpdated docs/reason-coverage.json");
}
