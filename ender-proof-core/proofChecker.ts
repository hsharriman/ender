import { readFileSync } from "fs";
import { basename } from "path";
import {
  buildProofGraph,
  detectCycles,
  findUnusedSteps,
} from "./checker/graph";
import { buildPremises } from "./checker/premises";
import {
  checkGeometricObjects,
  checkGoalMatch,
  checkSequentialStepNumbers,
  findDuplicateSteps,
} from "./checker/validators";
import {
  logDebug,
  logError,
  LogLevel,
  setLogLevel,
} from "./errors/errorConstants";
import { ProofParser } from "./grammar/lezerParser";
import { loadReasonDefinitions } from "./grammar/reasonParser";
import { loadStatementDefinitions } from "./grammar/stmtParser";
import { ProofObj } from "./types/checkerTypes";

// Parse a proof file
const parseProof = (filePath: string): ProofObj => {
  const content = readFileSync(filePath, "utf-8");
  const parser = new ProofParser();
  return parser.parse(content) as unknown as ProofObj;
};

// Extract goal from steps or title (returns Stmt)
const extractGoal = (proof: ProofObj) => {
  const goalStep = proof.steps.find((step) => step.type === "goal");
  if (goalStep && goalStep.statement) return goalStep.statement;
  return proof.goal;
};

// Main proof checker function
const checkProof = (filePath: string): void => {
  console.log(`\n🔍 Checking proof: ${basename(filePath)}\n`);

  try {
    // Load definitions
    const reasonDefs = loadReasonDefinitions();
    const stmtDefs = loadStatementDefinitions();

    logDebug("📚 Parsing statement definitions...");

    // Parse proof
    const proof = parseProof(filePath);
    const goal = extractGoal(proof);

    // Check geometric objects are well-formed before creating context
    const geometricObjectErrors = checkGeometricObjects(proof);
    if (geometricObjectErrors.length > 0) {
      console.log("❌ Geometric object errors found:");
      geometricObjectErrors.forEach((error) => {
        console.log(`   • ${error}`);
      });
      throw new Error("Proof has geometric object errors");
    }

    const ctx = buildPremises(proof);

    console.log("checking angle overlaps");
    ctx.checkAngleOverlaps();

    // Build proof graph
    logDebug("Building proof graph...");
    const graph = buildProofGraph(proof, reasonDefs, stmtDefs, ctx);

    // Detect cycles
    graph.cycles = detectCycles(graph);

    // Find unused steps
    // Find the last proof step (not goal step) to use as the goal step number
    const lastProofStep = proof.steps
      .slice()
      .reverse()
      .find((step) => step.type === "proof");
    const lastStepNum = lastProofStep?.stepNumber?.replace(/\[|\]/g, "");

    graph.unusedSteps = findUnusedSteps(graph, lastStepNum);

    // Check for duplicate steps
    const duplicateSteps = findDuplicateSteps(proof);

    // Check for sequential step numbers
    const stepNumberErrors = checkSequentialStepNumbers(proof);

    // Check goal match
    const goalMatchResult = checkGoalMatch(proof, goal);

    // Pretty print results (always displayed)
    console.log("📋 Proof Analysis Results:");
    console.log("=".repeat(50));

    console.log(`\n📝 Title: ${proof.title || "No title"}`);
    if (goal) {
      console.log(`🎯 Goal: ${goal}`);
      console.log(`✅ Goal Match: ${goalMatchResult.matches ? "YES" : "NO"}`);
      console.log(`📋 Goal Details: ${goalMatchResult.details}`);
    }

    console.log(`\n📊 Statistics:`);
    console.log(
      `   • Total Steps: ${proof.steps.filter((s) => s.type !== "goal").length}`
    );
    console.log(
      `   • Given Statements: ${
        proof.steps.filter((s) => s.type === "given").length
      }`
    );
    console.log(
      `   • Proof Steps: ${
        proof.steps.filter((s) => s.type === "proof").length
      }`
    );

    if (graph.incorrectSteps.size > 0) {
      logError.proofChecker.incorrectSteps(graph.incorrectSteps.size);
      Array.from(graph.incorrectSteps)
        .sort()
        .forEach((step) => {
          const depFail = graph.dependencyFailureSteps?.has(step);
          if (depFail) {
            console.log(
              `   • Step ${step} (fails due to dependency on incorrect step)`
            );
          } else {
            console.log(`   • Step ${step}`);
          }
        });
    }

    console.log(`\n🚫 Unused Steps: ${graph.unusedSteps.size}`);
    if (graph.unusedSteps.size > 0) {
      Array.from(graph.unusedSteps)
        .sort()
        .forEach((step) => {
          console.log(`   • Step ${step}`);
        });
    }

    console.log(`\n🔄 Cycles: ${graph.cycles.length}`);
    if (graph.cycles.length > 0) {
      graph.cycles.forEach((cycle, index) => {
        console.log(
          `   • Cycle ${index + 1}: ${cycle.join(" → ")} → ${cycle[0]}`
        );
      });
    }

    console.log(`\n🔄 Duplicate Steps: ${duplicateSteps.length}`);
    if (duplicateSteps.length > 0) {
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

    console.log(
      `\n🔷 Geometric Object Errors: ${geometricObjectErrors.length}`
    );
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
  } catch (error) {
    logError.proofChecker.errorCheckingProof(error);
  }
};

// Export for use in other modules
export { checkProof };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  // Parse command line arguments
  let proofFile: string | null = null;
  let logLevel = LogLevel.WARN; // Default to warnings and errors

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--log-level" || arg === "-l") {
      const levelArg = args[i + 1];
      if (!levelArg) {
        console.error(
          "Error: --log-level requires a value (debug, info, warn, error)"
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
            `Error: Invalid log level '${levelArg}'. Use: debug, info, warn, error`
          );
          process.exit(1);
      }
      i++; // Skip the next argument since we consumed it
    } else {
      proofFile = arg;
    }
  }

  if (!proofFile) {
    console.log(
      "Usage: npm run check-proof [--log-level <level>] <proof-file>"
    );
    console.log("Log levels: debug, info, warn, error (default: warn)");
    process.exit(1);
  }

  // Set the log level
  setLogLevel(logLevel);

  checkProof(proofFile);
}
