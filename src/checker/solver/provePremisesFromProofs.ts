/**
 * Run solver on premises-only inputs extracted from checker proof fixtures.
 *
 *   npx tsx src/checker/solver/provePremisesFromProofs.ts
 *   npx tsx src/checker/solver/provePremisesFromProofs.ts --unsolved-only
 *
 * Writes one report per proof under src/checker/solver/proved/ (overwrites on re-run).
 *
 * `--unsolved-only` skips fixtures whose existing `.log` already has status `solved`.
 */
import * as fs from "fs";
import * as path from "path";
import { runProofCheckerFromText } from "../proofChecker";
import {
  buildSingleProofReport,
  DEFAULT_DETAILED_LOG_ROWS,
  type StatsLogRow,
} from "./generateStatsLog";
import { solve } from "./solver";

const PROOFS_DIR = path.join(__dirname, "../proofs");
export const PROVED_DIR = path.join(__dirname, "proved");

export type ProvePremisesCliOpts = {
  /** When true, only run proofs with no prior log or a non-`solved` status. */
  unsolvedOnly?: boolean;
};

/** Path to the per-fixture report written by this script. */
export const provedLogPathForProof = (proofFileName: string): string =>
  path.join(PROVED_DIR, `${proofFileName}.log`);

const STATS_TABLE_HEADER = "test\tbackward_reasons_tried";

/**
 * Reads the `status` column from an existing proved log, if present.
 * Returns `undefined` when the file is missing or unparsable.
 */
export const priorSolveStatusFromLog = (logPath: string): string | undefined => {
  if (!fs.existsSync(logPath)) return undefined;
  const lines = fs.readFileSync(logPath, "utf8").split(/\r?\n/);
  const headerIdx = lines.findIndex((line) =>
    line.startsWith(STATS_TABLE_HEADER),
  );
  if (headerIdx === -1) return undefined;
  const dataLine = lines[headerIdx + 1];
  if (!dataLine) return undefined;
  const cols = dataLine.split("\t");
  return cols[3];
};

/** Whether this fixture should be proved under the given CLI options. */
export const shouldProveFixture = (
  proofFileName: string,
  opts: ProvePremisesCliOpts = {},
): boolean => {
  if (!opts.unsolvedOnly) return true;
  const status = priorSolveStatusFromLog(provedLogPathForProof(proofFileName));
  return status !== "solved";
};

const parseCliArgs = (): ProvePremisesCliOpts => ({
  unsolvedOnly:
    process.argv.includes("--unsolved-only") ||
    process.argv.includes("--only-unsolved"),
});

/** Options for batch-proving premises fixtures from `checker/proofs/`. */
export const provePremisesSolveOpts = {
  maxDepth: 20,
  maxPlans: 25_000,
  maxCandidatesPerStep: 1000,
  stopAfterFirstPlan: false,
  logBackwardChains: DEFAULT_DETAILED_LOG_ROWS,
} as const;

/** Strip end-of-line // comments (proof fixtures use them). */
const stripLineComment = (line: string) => line.replace(/\s*\/\/.*$/, "");

/**
 * Build a solver-ready proof text: title + premises block + goal + empty steps.
 */
export const premisesProofTextFromFile = (fileContent: string): string => {
  const lines = fileContent.split(/\r?\n/).map(stripLineComment);
  const start = lines.findIndex(
    (line) => /^title:/i.test(line.trim()) || /^premises:/i.test(line.trim()),
  );
  if (start === -1) {
    throw new Error("No title: or premises: block found");
  }
  const goalIdx = lines.findIndex(
    (line, index) => index >= start && /^->\s*\S/.test(line.trim()),
  );
  if (goalIdx === -1) {
    throw new Error("No goal line (-> ...) found after premises");
  }
  const block = lines
    .slice(start, goalIdx + 1)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
  return `${block.join("\n")}\n\nsteps:\n`;
};

const listProofFiles = (): string[] =>
  fs
    .readdirSync(PROOFS_DIR)
    .filter((name) => name.endsWith(".txt"))
    .sort((left, right) => left.localeCompare(right))
    .map((name) => path.join(PROOFS_DIR, name));

const runOne = (
  proofPath: string,
): { row: StatsLogRow; premisesText: string; proofText?: string } => {
  const name = path.basename(proofPath);
  const raw = fs.readFileSync(proofPath, "utf8");
  const premisesText = premisesProofTextFromFile(raw);
  const checked = runProofCheckerFromText(premisesText);
  if (checked.graph.incorrectSteps.size !== 0) {
    throw new Error(
      `Invalid premises fixture: ${[...checked.graph.incorrectSteps].join(", ")}`,
    );
  }
  const started = Date.now();
  const res = solve(checked.proof, provePremisesSolveOpts);
  const elapsed = Date.now() - started;
  return {
    premisesText,
    proofText: res.status === "solved" ? res.proofText : undefined,
    row: {
      test: name,
      backwardReasonsTried: res.stats.backwardReasonsTried,
      forwardStepAttempts: res.stats.forwardStepAttempts,
      status: res.status,
      note: res.stats.cpctcRetryUsed
        ? `${elapsed}ms; cpctc-retry`
        : `${elapsed}ms`,
      detailedLog: {
        testName: name,
        result: res,
        proof: checked.proof,
      },
    },
  };
};

const main = () => {
  const cli = parseCliArgs();
  fs.mkdirSync(PROVED_DIR, { recursive: true });
  const allFiles = listProofFiles();
  const files = cli.unsolvedOnly
    ? allFiles.filter((proofPath) =>
        shouldProveFixture(path.basename(proofPath), cli),
      )
    : allFiles;
  const skipped = allFiles.length - files.length;

  process.stderr.write(
    cli.unsolvedOnly
      ? `Proving ${files.length} unsolved of ${allFiles.length} fixtures from ${PROOFS_DIR}` +
          (skipped ? ` (${skipped} already solved, skipped)` : "") +
          "\n"
      : `Proving ${files.length} fixtures from ${PROOFS_DIR}\n`,
  );

  for (const proofPath of files) {
    const name = path.basename(proofPath);
    const outPath = provedLogPathForProof(name);
    const started = Date.now();
    process.stderr.write(`  ${name}... `);
    try {
      const { row, premisesText, proofText } = runOne(proofPath);
      const body = buildSingleProofReport(name, row, {
        sourcePath: path.relative(path.join(__dirname, "../.."), proofPath),
        premisesText,
        proofText:
          proofText ??
          (row.detailedLog?.result.status !== "solved"
            ? `(solver status: ${row.detailedLog?.result.status})`
            : undefined),
      });
      fs.writeFileSync(outPath, body, "utf8");
      process.stderr.write(
        `${row.status} backward=${row.backwardReasonsTried} forward=${row.forwardStepAttempts} (${Date.now() - started}ms)\n`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const body = buildSingleProofReport(
        name,
        {
          test: name,
          backwardReasonsTried: "—",
          forwardStepAttempts: "—",
          status: "error",
          note: `${message}; ${Date.now() - started}ms`,
        },
        {
          sourcePath: path.relative(path.join(__dirname, "../.."), proofPath),
          premisesText: (() => {
            try {
              return premisesProofTextFromFile(
                fs.readFileSync(proofPath, "utf8"),
              );
            } catch {
              return "(could not parse premises)";
            }
          })(),
        },
      );
      fs.writeFileSync(outPath, body, "utf8");
      process.stderr.write(`error (${Date.now() - started}ms): ${message}\n`);
    }
  }

  if (files.length === 0) {
    console.log(
      cli.unsolvedOnly
        ? `No unsolved fixtures to run (${skipped} already solved in ${PROVED_DIR})`
        : `No fixtures to run`,
    );
  } else {
    console.log(`Wrote ${files.length} reports to ${PROVED_DIR}`);
  }
};

if (process.argv[1]?.includes("provePremisesFromProofs")) {
  main();
}
