import { readFileSync } from "fs";
import { basename } from "path";
import {
  logError,
  LogLevel,
  setLogLevel,
} from "./errors/errorConstants";
import { ProofParser } from "./grammar/lezerParser";
import { ProofCheckerResult, runProofChecker } from "./proofChecker";
import { ProofObj } from "./types/checkerTypes";

const parseProof = (filePath: string): ProofObj => {
  const content = readFileSync(filePath, "utf-8");
  const parser = new ProofParser();
  return parser.parse(content) as unknown as ProofObj;
};

const printProofResult = (result: ProofCheckerResult): void => {
  const {
    proof,
    goal,
    graph,
    duplicateSteps,
    stepNumberErrors,
    geometricObjectErrors,
    goalMatchResult,
  } = result;

  console.log("📋 Proof Analysis Results:");
  console.log("=".repeat(50));

  console.log(`\n📝 Title: ${proof.title || "No title"}`);
  if (goal) {
    console.log(`🎯 Goal: ${goal}`);
    console.log(`✅ Goal Match: ${goalMatchResult.matches ? "YES" : "NO"}`);
    console.log(`📋 Goal Details: ${goalMatchResult.details}`);
    if (!goalMatchResult.matches) {
      proof.errors.push({
        type: "goal_not_reached",
        data: {
          details: goalMatchResult.details,
        },
      });
    }
  }

  console.log(`\n📊 Statistics:`);
  console.log(
    `   • Total Steps: ${proof.steps.filter((s) => s.type !== "goal").length}`,
  );
  console.log(
    `   • Given Statements: ${
      proof.steps.filter((s) => s.type === "given").length
    }`,
  );
  console.log(
    `   • Proof Steps: ${proof.steps.filter((s) => s.type === "proof").length}`,
  );

  if (graph.incorrectSteps.size > 0) {
    logError.proofChecker.incorrectSteps(graph.incorrectSteps.size);
    Array.from(graph.incorrectSteps)
      .sort()
      .forEach((step) => {
        const depFail = graph.dependencyFailureSteps?.has(step);
        if (depFail) {
          console.log(
            `   • Step ${step} (fails due to dependency on incorrect step)`,
          );
        } else {
          console.log(`   • Step ${step}`);
        }
      });
  }

  console.log(`\n🚫 Unused Steps: ${graph.unusedSteps.size}`);
  if (graph.unusedSteps.size > 0) {
    proof.errors.push({
      type: "unused_step",
      data: {
        steps: Array.from(graph.unusedSteps),
      },
    });
    Array.from(graph.unusedSteps)
      .sort()
      .forEach((step) => {
        console.log(`   • Step ${step}`);
      });
  }

  console.log(`\n🔄 Cycles: ${graph.cycles.length}`);
  if (graph.cycles.length > 0) {
    proof.errors.push({
      type: "cycle",
      data: {
        steps: graph.cycles,
      },
    });
    graph.cycles.forEach((cycle, index) => {
      console.log(
        `   • Cycle ${index + 1}: ${cycle.join(" → ")} → ${cycle[0]}`,
      );
    });
  }

  console.log(`\n🔄 Duplicate Steps: ${duplicateSteps.length}`);
  if (duplicateSteps.length > 0) {
    proof.errors.push({
      type: "duplicate_step",
      data: {
        steps: duplicateSteps,
      },
    });
    duplicateSteps.forEach(([step1, step2]) => {
      logError.parser.duplicateSteps(step1, step2);
    });
  }

  console.log(`\n📝 Step Number Errors: ${stepNumberErrors.length}`);
  if (stepNumberErrors.length > 0) {
    stepNumberErrors.forEach((error) => {
      console.log(`   • ${error}`);
    });
  }

  console.log(`\n🔷 Geometric Object Errors: ${geometricObjectErrors.length}`);
  if (geometricObjectErrors.length > 0) {
    geometricObjectErrors.forEach((error) => {
      console.log(`   • ${error}`);
    });
  }

  console.log(`\n🎯 Overall Assessment:`);
  const hasErrors =
    graph.incorrectSteps.size > 0 ||
    graph.unusedSteps.size > 0 ||
    graph.cycles.length > 0 ||
    duplicateSteps.length > 0 ||
    stepNumberErrors.length > 0 ||
    geometricObjectErrors.length > 0 ||
    !goalMatchResult.matches;

  if (!hasErrors) {
    console.log("✅ Proof is CORRECT!");
  } else {
    logError.proofChecker.proofHasIssues();
  }
};

const checkProof = (filePath: string): void => {
  console.log(`\n🔍 Checking proof: ${basename(filePath)}\n`);

  try {
    const proof = parseProof(filePath);
    const result = runProofChecker(proof);

    if (result.geometricObjectErrors.length > 0) {
      console.log("❌ Geometric object errors found:");
      result.geometricObjectErrors.forEach((error) => {
        console.log(`   • ${error}`);
      });
      throw new Error("Proof has geometric object errors");
    }

    printProofResult(result);
  } catch (error) {
    logError.proofChecker.errorCheckingProof(error);
  }
};

export { checkProof };

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  let proofFile: string | null = null;
  let logLevel = LogLevel.WARN;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--log-level" || arg === "-l") {
      const levelArg = args[i + 1];
      if (!levelArg) {
        console.error(
          "Error: --log-level requires a value (debug, info, warn, error)",
        );
        process.exit(1);
      }

      switch (levelArg.toLowerCase()) {
        case "debug":
          logLevel = LogLevel.DEBUG;
          break;
        case "info":
          logLevel = LogLevel.INFO;
          break;
        case "warn":
          logLevel = LogLevel.WARN;
          break;
        case "error":
          logLevel = LogLevel.ERROR;
          break;
        default:
          console.error(
            `Error: Invalid log level '${levelArg}'. Use: debug, info, warn, error`,
          );
          process.exit(1);
      }
      i++;
    } else {
      proofFile = arg;
    }
  }

  if (!proofFile) {
    console.log(
      "Usage: npm run check-proof [--log-level <level>] <proof-file>",
    );
    console.log("Log levels: debug, info, warn, error (default: warn)");
    process.exit(1);
  }

  setLogLevel(logLevel);

  checkProof(proofFile);
}
