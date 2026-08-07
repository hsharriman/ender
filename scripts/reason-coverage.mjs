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
  "ang_bisect_conv",
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
  "con_complements",
  "con_complements_same",
  "def_linear_pair",
  "def_perp",
  "perp_con_ang",
  "reflex",
  "def_parallelogram",
  "pgram_opp_sides",
  "pgram_opp_angs",
  "pgram_consec_angs",
  "pgram_opp_sides_conv",
  "pgram_consec_angs_conv",
  "kite_opp_con_ang",
  "rect_pgram_ang",
  "pgram_opp_side_para",
  "rectangle_pgram",
  "rhombus_pgram",
  "rhombus_consec_sides",
  "rhombus_opp_bisect",
  "rect_diag_con",
  "rhombus",
  "rectangle",
  "altint",
  "altext",
  "corresp_ang",
  "sameside_ang",
  "altint_conv",
  "altext_conv",
  "corresp_ang_conv",
  "sameside_ang_conv",
  "para_transitive",
  "def_radius",
  "inscribed_semi",
  "con_chords_intersect_arcs",
  "tangent_perp",
]);
const partial = new Set();
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
      : reason === "ang_bisect_conv"
        ? "audited AngleBisector meaning; syntactic shared-ray schema"
      : reason === "def_linear_pair"
        ? "GeoCoq neutral angle theory (bet__suppa and ray transport)"
      : reason === "rhl"
        ? "GeoCoq cong2_per2__cong_3 (neutral geometry)"
      : reason === "midpt_conv"
        ? "GeoCoq l7_20 (unique equidistant point on a line)"
      : reason === "third_angle"
        ? "GeoCoq Tarski_euclidean via Playfair"
      : ["def_parallelogram", "rectangle_pgram", "rhombus_pgram"].includes(reason)
        ? "audited meanings plus declared-quadrilateral nondegeneracy (neutral)"
      : ["pgram_opp_sides", "rhombus_consec_sides"].includes(reason)
        ? "Tarski_euclidean via Playfair alternate interior angles; ASA along the diagonal"
      : reason === "rhombus"
        ? "audited IsRhombus congruence chain (neutral)"
      : reason === "rhombus_opp_bisect"
        ? "GeoCoq l11_51 (SSS angles) over the audited rhombus side chain (neutral)"
      : reason === "rect_diag_con"
        ? "SAS between two right corners over the Euclidean opposite-sides theorem"
      : reason === "pgram_consec_angs"
        ? "GeoCoq consecutive_interior_angles_postulate, Playfair-derived"
      : reason === "pgram_opp_sides_conv"
        ? "SSS along the diagonal, then GeoCoq l12_21_b (neutral)"
      : reason === "pgram_consec_angs_conv"
        ? "the supplement continued past its corner, then l12_21_b (neutral)"
      : reason === "kite_opp_con_ang"
        ? "SSS across the diagonal the congruent sides meet at (neutral)"
      : reason === "rect_pgram_ang"
        ? "the opposite and consecutive corner theorems, plus l11_17 and l11_18_1"
      : reason === "rectangle"
        ? "audited IsRectangle corners; opposite sides via Euclidean parallelogram theorem"
      : reason === "pgram_opp_side_para"
        ? "GeoCoq par_cong_mid_ts; the audited crossing diagonals supply its TS"
      : ["altint", "altext", "corresp_ang", "sameside_ang"].includes(reason)
        ? "Tarski_euclidean via Playfair over the audited transversal configuration"
      : ["altint_conv", "altext_conv", "corresp_ang_conv", "sameside_ang_conv"].includes(
            reason,
          )
        ? "GeoCoq l12_21_b (neutral) with the audited sidedness"
      : reason === "para_transitive"
        ? "Tarski_euclidean via Playfair; CopR-free re-proof of par_trans"
      : reason === "def_radius"
        ? "the audited OnCircle congruence (neutral, sphere-safe)"
      : reason === "inscribed_semi"
        ? "Thales via existential-triangle-to-rah, axiom-free (Euclidean, sphere-safe)"
      : reason === "con_chords_intersect_arcs"
        ? "SAS at the centers from ArcCongruent's radii and central angles (neutral, sphere-safe)"
      : reason === "tangent_perp"
        ? "the audited IsTangent Per plus the def_perp realignment machinery (neutral, sphere-safe)"
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
      : ["con_complements", "con_complements_same"].includes(reason)
        ? "GeoCoq sams2_suma2__conga123 over the audited SAMS conjunct"
      : reason === "def_perp"
        ? "GeoCoq per_perp_in and perp_in_col_perp_in"
      : reason === "given"
        ? "logical/equality infrastructure"
      : reason === "reflex"
        ? "reflexivity of congruence; ref_ang needs a declared angle"
        : "to determine from the weakest supporting GeoCoq theorem";
  const note =
    status === "verified"
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
  const partialConclusions = {};
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
