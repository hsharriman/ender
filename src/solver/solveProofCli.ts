import { readFileSync } from "fs";
import { pathToFileURL } from "url";
import { solveProof } from "./solver";
import { SolverOptions } from "./solverTypes";

/**
 * CLI: npm run solveProof -- <proof-file> [--max-solutions N] [--time-ms N]
 * Prints the solver result (verified solutions + stats) as JSON, with each
 * solution's proof text included verbatim.
 */
const main = (): void => {
  const args = process.argv.slice(2);
  const file = args.find((a) => !a.startsWith("--"));
  if (!file) {
    console.error(
      "Usage: npm run solveProof -- <proof-file> [--max-solutions N] [--time-ms N]",
    );
    process.exit(1);
  }
  const numFlag = (name: string): number | undefined => {
    const idx = args.indexOf(name);
    if (idx < 0 || idx + 1 >= args.length) return undefined;
    const n = parseInt(args[idx + 1], 10);
    return Number.isNaN(n) ? undefined : n;
  };
  const options: SolverOptions = {};
  const maxSolutions = numFlag("--max-solutions");
  if (maxSolutions !== undefined) options.maxSolutions = maxSolutions;
  const timeLimitMs = numFlag("--time-ms");
  if (timeLimitMs !== undefined) options.timeLimitMs = timeLimitMs;

  const result = solveProof(readFileSync(file, "utf-8"), options);
  console.log(
    JSON.stringify(
      {
        ok: result.ok,
        error: result.error,
        goal: result.goalText,
        seed: result.seed,
        stats: result.stats,
        solutions: result.solutions.map((s) => ({
          verified: s.verified,
          steps: s.steps.map((st) => st.text),
        })),
        treeFacts: result.tree.facts.length,
      },
      null,
      2,
    ),
  );
  if (result.ok && result.solutions[0]) {
    console.log("\n--- first solution proof text ---\n");
    console.log(result.solutions[0].proofText);
  }
  process.exitCode = result.ok ? 0 : 1;
};

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
