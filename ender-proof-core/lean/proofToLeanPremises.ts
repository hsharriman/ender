// proofToLeanPremises.ts
// Usage: ts-node lean/proofToLeanPremises.ts path/to/proof.txt

const { ProofParser } = require("../grammar/lezerParser");
const { emitLeanPremises } = require("./emitLeanPremises");
const fs = require("fs");
const { spawnSync } = require("child_process");
const os = require("os");
const path = require("path");
const { logError } = require("../errors/errorConstants");

/**
 * Emit Lean code for the goal statement, assuming all premises are defined.
 * @param parsed The parsed proof object
 * @returns Lean code as a string
 */
function emitLeanGoal(parsed: any): string {
  // Find the goal step (type === 'goal')
  const goalStep = (parsed.steps || []).find((s: any) => s.type === "goal");
  if (!goalStep || !goalStep.statement) return "-- No goal found";
  const stmt = goalStep.statement;
  // Example: c(t_ABC, t_ADC)  ==> CongruentTriangles t_ABC t_ADC
  // Map function names to Lean predicates
  const fnMap: Record<string, string> = {
    c: "CongruentTriangles",
    con_tri: "CongruentTriangles",
    con_seg: "CongruentSegments",
    con_ang: "CongruentAngles",
    collinear: "Collinear",
    // Add more mappings as needed
  };
  const leanFn = fnMap[stmt.function || ""] || stmt.function;
  const args = (stmt.arguments || []).join(" ");
  return `theorem goal : ${leanFn} ${args} :=\n  sorry\n`;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    logError.file.usageProofToLean();
    process.exit(1);
  }
  const proofPath = args[0];
  if (!fs.existsSync(proofPath)) {
    logError.file.fileNotFound(proofPath);
    process.exit(1);
  }
  const proofText = fs.readFileSync(proofPath, "utf-8");

  // Parse the proof using ProofParser
  const parser = new ProofParser();
  const parsed = parser.parse(proofText);

  // Emit Lean premises and goal
  const leanPremises = emitLeanPremises(parsed);
  const leanGoal = emitLeanGoal(parsed);

  // Compose full Lean file
  const leanFile = `import Geometry.EuclideanGeometry\n\nopen EuclideanGeometry\n\n${leanPremises}\n\n${leanGoal}`;

  // Write to a temp file
  const tmpFile = `lean/Geometry/Geometry/tmp_proof_${Date.now()}.lean`;
  fs.writeFileSync(tmpFile, leanFile);

  // Run Lean on the file
  const result = spawnSync("lean --run", [tmpFile], { encoding: "utf-8" });

  // Print Lean code and output
  console.log("--- Lean code ---\n");
  console.log(leanFile);
  console.log("\n--- Lean output ---\n");
  console.log(result.stdout || result.stderr);

  // Clean up temp file
  fs.unlinkSync(tmpFile);
}

if (require.main === module) {
  main();
}
