import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";
import { pathToFileURL } from "url";
import {
  collectProofCheckerIssues,
  runProofCheckerFromText,
} from "../src/checker/proofChecker";
import { ProofStep } from "../src/checker/types/checkerTypes";

/**
 * Runs the checker over every `.txt` in a directory tree and reports one JSON
 * line per file. Use it to prove that a checker change leaves an external proof
 * corpus (e.g. `geo-proof-dataset`) unaffected, or to see exactly what moved.
 *
 * Capture a baseline before the change, then compare after it. Pass `--silent`
 * to npm, or its banner lands in the .jsonl:
 *
 *   git stash
 *   npm run --silent scanProofs -- ../geo-proof-dataset > /tmp/before.jsonl
 *   git stash pop
 *   npm run scanProofs -- ../geo-proof-dataset --compare /tmp/before.jsonl
 *
 * `--compare` writes a human-readable summary to stderr and exits non-zero when
 * any file changed, so it also works as a CI gate.
 */

export type ScanRow = {
  /** Path relative to the scanned root. */
  f: string;
  /** True when the proof produced no issues at all. */
  ok: boolean;
  /** Issue count, or -1 when the checker threw. */
  n: number;
  /** Sorted unique error codes from every step, for a stable comparison. */
  codes: string[];
};

const collectTxtFiles = (dir: string): string[] => {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === ".git" || entry === "node_modules") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectTxtFiles(full));
    else if (entry.endsWith(".txt")) out.push(full);
  }
  return out;
};

export const scanFile = (root: string, file: string): ScanRow => {
  const f = relative(root, file);
  try {
    const result = runProofCheckerFromText(readFileSync(file, "utf-8"));
    const codes = [
      ...result.graph.nodes.values(),
      ...(result.proof?.steps ?? []),
    ]
      .flatMap((step: ProofStep) => step.errors ?? [])
      .map((e) => e.code)
      .concat(result.errors.map((e) => e.code));
    return {
      f,
      ok: collectProofCheckerIssues(result).length === 0,
      n: collectProofCheckerIssues(result).length,
      codes: Array.from(new Set(codes)).sort(),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return { f, ok: false, n: -1, codes: [`__threw__:${msg}`] };
  }
};

export const scanDirectory = (root: string): ScanRow[] =>
  collectTxtFiles(root)
    .sort()
    .map((file) => scanFile(root, file));

/** Reports every file whose verdict or error codes differ from the baseline. */
export const compareToBaseline = (rows: ScanRow[], baselinePath: string) => {
  const baseline = new Map<string, ScanRow>();
  for (const line of readFileSync(baselinePath, "utf-8").split("\n")) {
    if (!line.trim()) continue;
    const row = JSON.parse(line) as ScanRow;
    baseline.set(row.f, row);
  }

  const changed: string[] = [];
  for (const row of rows) {
    const before = baseline.get(row.f);
    if (!before) {
      changed.push(`  added    ${row.f}  ok=${row.ok} [${row.codes}]`);
      continue;
    }
    if (before.ok !== row.ok || before.codes.join() !== row.codes.join()) {
      changed.push(
        `  changed  ${row.f}\n` +
          `             before: ok=${before.ok} [${before.codes}]\n` +
          `             after:  ok=${row.ok} [${row.codes}]`,
      );
    }
  }
  const seen = new Set(rows.map((r) => r.f));
  for (const f of baseline.keys()) {
    if (!seen.has(f)) changed.push(`  removed  ${f}`);
  }

  console.error(`scanned ${rows.length} files, ${changed.length} changed`);
  if (changed.length) console.error(changed.join("\n"));
  return changed.length;
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [root, ...rest] = process.argv.slice(2);
  if (!root) {
    console.error(
      "Usage: npm run scanProofs -- <dir> [--compare <baseline.jsonl>]",
    );
    process.exit(1);
  }
  const compareIdx = rest.indexOf("--compare");
  const rows = scanDirectory(root);

  if (compareIdx === -1) {
    for (const row of rows) console.log(JSON.stringify(row));
  } else {
    const baselinePath = rest[compareIdx + 1];
    if (!baselinePath) {
      console.error("--compare needs a baseline .jsonl path");
      process.exit(1);
    }
    process.exitCode = compareToBaseline(rows, baselinePath) === 0 ? 0 : 1;
  }
}
