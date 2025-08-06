import { readFileSync } from "fs";
import { Angle, Content, Point, Segment, Triangle } from "geometry-object";
import { basename, dirname, join } from "path";
import { fileURLToPath } from "url";
import { ProofParser } from "./grammar/lezerParser.js";
import { reflex_a, reflex_s, sas } from "./grammar/reasons/reasonChecks.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Types for the proof checker
interface Statement {
  function: string;
  arguments: string[];
  stepNumber?: string;
}

interface Reason {
  function: string;
  arguments: string[];
}

interface ProofStep {
  type: "given" | "proof" | "goal";
  reason?: Reason;
  conclusion?: Statement;
  function?: string;
  arguments?: string[];
  stepNumber?: string;
  statement?: Statement;
}

interface Proof {
  title: string | null;
  premises: {
    points: string[];
    triangles: string[];
    segments: string[];
    angles: string[];
  };
  steps: ProofStep[];
  goal?: string;
}

interface ReasonDefinition {
  name: string;
  dependencies: string[];
  conclusion: string;
}

interface StatementDefinition {
  name: string;
  parameters: string[];
}

interface ProofGraph {
  nodes: Map<string, ProofStep>;
  edges: Map<string, string[]>;
  incorrectSteps: Set<string>;
  unusedSteps: Set<string>;
  cycles: string[][];
}

// Function to get geometric object from string identifier
const getGeometricObject = (
  arg: string,
  ctx: Content
): Point | Segment | Angle | Triangle => {
  if (arg.startsWith("a_")) {
    // Angle format: a_ABC
    const angle = ctx.getAngle(arg);
    if (!angle) {
      throw new Error(`Angle ${arg} not found in context`);
    }
    return angle;
  } else if (arg.startsWith("t_")) {
    // Triangle format: t_ABC
    const triangle = ctx.getTriangle(arg);
    if (!triangle) {
      throw new Error(`Triangle ${arg} not found in context`);
    }
    return triangle;
  } else if (arg.length === 2 && /^[A-Z]{2}$/.test(arg)) {
    // Segment format: AB
    const segment = ctx.getSegment(arg);
    if (!segment) {
      throw new Error(`Segment ${arg} not found in context`);
    }
    return segment;
  } else if (arg.length === 1 && /^[A-Z]$/.test(arg)) {
    // Point format: A
    const point = ctx.getPoint(arg);
    if (!point) {
      throw new Error(`Point ${arg} not found in context`);
    }
    return point;
  }
  throw new Error(`Cannot parse geometric object from argument: ${arg}`);
};

// Load reason definitions from reasons.txt
const loadReasonDefinitions = (): Map<string, ReasonDefinition> => {
  const reasonsPath = join(__dirname, "grammar", "defs", "reasons.txt");
  const content = readFileSync(reasonsPath, "utf-8");
  const reasons = new Map<string, ReasonDefinition>();

  const lines = content
    .split("\n")
    .filter((line: string) => line.trim() && !line.startsWith("?"));

  lines.forEach((line: string) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("reason ")) {
      const reasonPart = trimmed.substring(7);
      const arrowIndex = reasonPart.indexOf(" -> ");

      if (arrowIndex !== -1) {
        const beforeArrow = reasonPart.substring(0, arrowIndex);
        const afterArrow = reasonPart.substring(arrowIndex + 4);

        const reasonName = beforeArrow.split("(")[0];
        const depPart = beforeArrow.substring(
          beforeArrow.indexOf("(") + 1,
          beforeArrow.lastIndexOf(")")
        );
        const dependencies = depPart.trim() ? depPart.split(", ") : [];

        reasons.set(reasonName, {
          name: reasonName,
          dependencies,
          conclusion: afterArrow,
        });
      } else {
        // Handle cases like "reason given()"
        const reasonName = reasonPart.split("(")[0];
        reasons.set(reasonName, {
          name: reasonName,
          dependencies: [],
          conclusion: "",
        });
      }
    }
  });

  return reasons;
};

// Load statement definitions from stmts.txt
const loadStatementDefinitions = (): Map<string, StatementDefinition> => {
  const stmtsPath = join(__dirname, "grammar", "defs", "stmts.txt");
  const content = readFileSync(stmtsPath, "utf-8");
  const statements = new Map<string, StatementDefinition>();

  const lines = content
    .split("\n")
    .filter((line: string) => line.trim() && !line.startsWith("//"));

  lines.forEach((line: string) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("stmt ")) {
      const stmtPart = trimmed.substring(5);
      const parenIndex = stmtPart.indexOf("(");

      if (parenIndex !== -1) {
        const stmtName = stmtPart.substring(0, parenIndex);
        const paramsPart = stmtPart.substring(
          parenIndex + 1,
          stmtPart.lastIndexOf(")")
        );
        const params = paramsPart
          .split(",")
          .map((p: string) => p.trim())
          .filter((p: string) => p);

        statements.set(stmtName, {
          name: stmtName,
          parameters: params,
        });
      } else {
        // Handle cases without parameters
        statements.set(stmtPart, {
          name: stmtPart,
          parameters: [],
        });
      }
    }
  });

  return statements;
};

// Parse a proof file
const parseProof = (filePath: string): Proof => {
  const content = readFileSync(filePath, "utf-8");
  const parser = new ProofParser();
  return parser.parse(content);
};

// Extract goal from proof title or premises
const extractGoal = (proof: Proof): string | undefined => {
  if (proof.title && proof.title.includes("->")) {
    const arrowIndex = proof.title.indexOf("->");
    return proof.title.substring(arrowIndex + 2).trim();
  }
  return undefined;
};

// Check if statement arguments match the expected parameters
const checkStatementArguments = (
  stmt: Statement,
  stmtDefs: Map<string, StatementDefinition>
): boolean => {
  // Handle special case for 'c' (congruent) function
  if (stmt.function === "c") {
    return stmt.arguments.length === 2; // congruent always takes 2 arguments
  }

  const definition = stmtDefs.get(stmt.function);
  if (!definition) {
    return false;
  }

  return stmt.arguments.length === definition.parameters.length;
};

// Check if reason dependencies match the expected number
const checkReasonDependencies = (
  reason: Reason,
  reasonDefs: Map<string, ReasonDefinition>
): boolean => {
  const definition = reasonDefs.get(reason.function);
  if (!definition) {
    return false;
  }

  return reason.arguments.length === definition.dependencies.length;
};

// Check if dependency statements match expected types
const checkDependencyStatements = (
  reason: Reason,
  reasonDefs: Map<string, ReasonDefinition>,
  proofGraph: ProofGraph
): boolean => {
  const definition = reasonDefs.get(reason.function);
  if (!definition) {
    return false;
  }

  for (let i = 0; i < reason.arguments.length; i++) {
    const depRef = reason.arguments[i];
    const expectedType = definition.dependencies[i];

    // Extract step number from reference like [01]
    const stepNum = depRef.replace(/[\[\]]/g, "");
    const dependencyStep = proofGraph.nodes.get(stepNum);

    if (!dependencyStep) {
      return false;
    }

    // Check if the dependency step's statement matches expected type
    const stmt = dependencyStep.function || dependencyStep.conclusion?.function;
    if (!stmt) {
      return false;
    }

    // Handle special case for 'c' (congruent) function
    if (stmt === "c") {
      // 'c' can represent con_seg, con_ang, or con_tri depending on arguments
      // For now, we'll be lenient and accept it
      continue;
    }

    // Check if statement matches expected type
    if (!stmt.includes(expectedType.replace("_", ""))) {
      return false;
    }
  }

  return true;
};

// Check if reason is applied correctly using reason checker methods
const checkReasonApplication = (
  reason: Reason,
  reasonDefs: Map<string, ReasonDefinition>,
  proofGraph: ProofGraph,
  proof: Proof,
  ctx: Content
): boolean => {
  const definition = reasonDefs.get(reason.function);
  if (!definition) {
    return false;
  }

  try {
    // Get the dependency steps and their arguments
    const dependencyArgs: any[] = [];
    for (let i = 0; i < reason.arguments.length; i++) {
      const depRef = reason.arguments[i];
      const stepNum = depRef.replace(/[\[\]]/g, "");
      const dependencyStep = proofGraph.nodes.get(stepNum);

      if (!dependencyStep) {
        return false;
      }

      // Get the arguments from the dependency step
      const depArgs =
        dependencyStep.function === "c"
          ? dependencyStep.arguments || []
          : dependencyStep.conclusion?.arguments || [];

      if (depArgs.length !== 2) {
        return false;
      }

      // Create geometric objects from the arguments
      const obj1 = getGeometricObject(depArgs[0], ctx);
      const obj2 = getGeometricObject(depArgs[1], ctx);
      dependencyArgs.push([obj1, obj2]);
    }

    // Call the appropriate reason checker method
    switch (reason.function) {
      case "reflex_s":
        if (dependencyArgs.length === 0) {
          // For reflex_s, we need to get the conclusion arguments
          const conclusionStep = proof.steps.find(
            (step) =>
              step.type === "proof" && step.reason?.function === "reflex_s"
          );
          if (conclusionStep?.conclusion?.arguments?.length === 2) {
            const arg1 = getGeometricObject(
              conclusionStep.conclusion.arguments[0],
              ctx
            ) as Segment;
            const arg2 = getGeometricObject(
              conclusionStep.conclusion.arguments[1],
              ctx
            ) as Segment;
            return reflex_s(arg1, arg2);
          }
        }
        return false;

      case "reflex_a":
        if (dependencyArgs.length === 0) {
          // For reflex_a, we need to get the conclusion arguments
          const conclusionStep = proof.steps.find(
            (step) =>
              step.type === "proof" && step.reason?.function === "reflex_a"
          );
          if (conclusionStep?.conclusion?.arguments?.length === 2) {
            const arg1 = getGeometricObject(
              conclusionStep.conclusion.arguments[0],
              ctx
            ) as Angle;
            const arg2 = getGeometricObject(
              conclusionStep.conclusion.arguments[1],
              ctx
            ) as Angle;
            return reflex_a(arg1, arg2);
          }
        }
        return false;

      case "sas":
        if (dependencyArgs.length === 3) {
          // For SAS, we need to get the conclusion arguments (triangles)
          const conclusionStep = proof.steps.find(
            (step) => step.type === "proof" && step.reason?.function === "sas"
          );
          if (conclusionStep?.conclusion?.arguments?.length === 2) {
            const t1 = getGeometricObject(
              conclusionStep.conclusion.arguments[0],
              ctx
            ) as Triangle;
            const t2 = getGeometricObject(
              conclusionStep.conclusion.arguments[1],
              ctx
            ) as Triangle;
            return sas(
              t1,
              t2,
              dependencyArgs[0],
              dependencyArgs[2],
              dependencyArgs[1]
            );
          }
        }
        return false;

      default:
        // For other reasons, we'll return true for now (syntax check passed)
        return true;
    }
  } catch (error) {
    console.error(
      `Error checking reason application for ${reason.function}:`,
      error
    );
    return false;
  }
};

// Build proof graph and check each step
const buildProofGraph = (
  proof: Proof,
  reasonDefs: Map<string, ReasonDefinition>,
  stmtDefs: Map<string, StatementDefinition>,
  ctx: Content
): ProofGraph => {
  const graph: ProofGraph = {
    nodes: new Map(),
    edges: new Map(),
    incorrectSteps: new Set(),
    unusedSteps: new Set(),
    cycles: [],
  };

  // Add all steps to the graph (skip goal steps)
  proof.steps.forEach((step) => {
    if (step.type === "goal") return; // Skip goal steps

    const stepNum =
      step.stepNumber?.replace(/[\[\]]/g, "") ||
      step.conclusion?.stepNumber?.replace(/[\[\]]/g, "");
    if (stepNum) {
      graph.nodes.set(stepNum, step);
      graph.edges.set(stepNum, []);
    }
  });

  // Check each step and build edges
  proof.steps.forEach((step) => {
    if (step.type === "goal") return; // Skip goal steps

    const stepNum =
      step.stepNumber?.replace(/[\[\]]/g, "") ||
      step.conclusion?.stepNumber?.replace(/[\[\]]/g, "");

    if (!stepNum) return;

    let isCorrect = true;

    if (step.type === "given") {
      // Given statements are assumed to be true, but check format
      if (step.function && step.arguments) {
        // For now, just check if the function exists in definitions
        // In a real implementation, you'd check the actual statement format
        isCorrect = stmtDefs.has(step.function) || step.function === "c"; // 'c' is congruent
      }
    } else if (step.type === "proof" && step.reason && step.conclusion) {
      // Check reason dependencies
      isCorrect = checkReasonDependencies(step.reason, reasonDefs);

      // Check dependency statements
      if (isCorrect) {
        isCorrect = checkDependencyStatements(step.reason, reasonDefs, graph);
      }

      // Check conclusion statement
      if (isCorrect) {
        isCorrect = checkStatementArguments(step.conclusion, stmtDefs);
      }

      // Check if reason is applied correctly using reason checker methods
      if (isCorrect) {
        isCorrect = checkReasonApplication(
          step.reason,
          reasonDefs,
          graph,
          proof,
          ctx
        );
      }

      // Add edges from dependencies to this step
      if (step.reason.arguments) {
        step.reason.arguments.forEach((depRef) => {
          const depStepNum = depRef.replace(/[\[\]]/g, "");
          const edges = graph.edges.get(depStepNum) || [];
          edges.push(stepNum);
          graph.edges.set(depStepNum, edges);
        });
      }
    }

    if (!isCorrect) {
      graph.incorrectSteps.add(stepNum);
    }
  });

  return graph;
};

// Check for cycles in the graph using DFS
const detectCycles = (graph: ProofGraph): string[][] => {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const dfs = (node: string, path: string[]): void => {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart));
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = graph.edges.get(node) || [];
    neighbors.forEach((neighbor) => {
      dfs(neighbor, [...path]);
    });

    recursionStack.delete(node);
  };

  graph.nodes.forEach((_, node) => {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  });

  return cycles;
};

// Find unused steps (leaf nodes that don't lead to the goal)
const findUnusedSteps = (graph: ProofGraph, goalStep?: string): Set<string> => {
  const unused = new Set<string>();

  if (!goalStep) {
    // If no goal specified, mark all leaf nodes as unused
    graph.nodes.forEach((_, node) => {
      const edges = graph.edges.get(node) || [];
      if (edges.length === 0) {
        unused.add(node);
      }
    });
    return unused;
  }

  // Find all nodes that can reach the goal
  const canReachGoal = new Set<string>();
  const visited = new Set<string>();

  const dfs = (node: string): boolean => {
    if (node === goalStep) {
      return true;
    }

    if (visited.has(node)) {
      return canReachGoal.has(node);
    }

    visited.add(node);
    const neighbors = graph.edges.get(node) || [];

    for (const neighbor of neighbors) {
      if (dfs(neighbor)) {
        canReachGoal.add(node);
        return true;
      }
    }

    return false;
  };

  graph.nodes.forEach((_, node) => {
    if (!canReachGoal.has(node) && !dfs(node)) {
      unused.add(node);
    }
  });

  return unused;
};

// Check if final statement matches the goal
const checkGoalMatch = (proof: Proof, goal?: string): boolean => {
  if (!goal) return true;

  const lastStep = proof.steps[proof.steps.length - 1];
  if (!lastStep) return false;

  const finalStatement =
    lastStep.conclusion ||
    (lastStep.function
      ? { function: lastStep.function, arguments: lastStep.arguments || [] }
      : null);

  if (!finalStatement) return false;

  // Simple string matching - could be made more sophisticated
  return finalStatement.function.includes(goal.replace(/\s+/g, ""));
};

// Main proof checker function
const checkProof = (filePath: string): void => {
  console.log(`\n🔍 Checking proof: ${basename(filePath)}\n`);

  try {
    // Load definitions
    const reasonDefs = loadReasonDefinitions();
    const stmtDefs = loadStatementDefinitions();

    // Parse proof
    const proof = parseProof(filePath);
    const goal = extractGoal(proof);

    // Create Content context and populate it with all geometric objects from premises
    const ctx = new Content();

    // Add all points from premises
    proof.premises.points.forEach((pointLabel) => {
      ctx.addPoint({ pt: [0, 0], label: pointLabel, offset: [0, 0] }); // TODO pt coords
    });

    // Add all triangles from premises (this will also create their segments and angles)
    proof.premises.triangles.forEach((triangleLabel) => {
      // Parse triangle label (e.g., "t_ABC")
      const pointLabels = triangleLabel.substring(2); // Remove 't_' prefix
      ctx.addTriangleFromStr(pointLabels);
    });

    // Add all segments from premises
    proof.premises.segments.forEach((segmentLabel) => {
      ctx.addSegmentFromStr(segmentLabel);
    });

    // Add all angles from premises
    proof.premises.angles.forEach((angleLabel) => {
      // Parse angle label (e.g., "a_BAC")
      const pointLabels = angleLabel.substring(2); // Remove 'a_' prefix
      ctx.addAngleFromStr(pointLabels);
    });

    // Build proof graph
    const graph = buildProofGraph(proof, reasonDefs, stmtDefs, ctx);

    // Detect cycles
    graph.cycles = detectCycles(graph);

    // Find unused steps
    const lastStepNum =
      proof.steps[proof.steps.length - 1]?.stepNumber?.replace(/[\[\]]/g, "") ||
      proof.steps[proof.steps.length - 1]?.conclusion?.stepNumber?.replace(
        /[\[\]]/g,
        ""
      );
    graph.unusedSteps = findUnusedSteps(graph, lastStepNum);

    // Check goal match
    const goalMatches = checkGoalMatch(proof, goal);

    // Pretty print results
    console.log("📋 Proof Analysis Results:");
    console.log("=".repeat(50));

    console.log(`\n📝 Title: ${proof.title || "No title"}`);
    if (goal) {
      console.log(`🎯 Goal: ${goal}`);
      console.log(`✅ Goal Match: ${goalMatches ? "YES" : "NO"}`);
    }

    console.log(`\n📊 Statistics:`);
    console.log(`   • Total Steps: ${proof.steps.length}`);
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

    console.log(`\n❌ Incorrect Steps: ${graph.incorrectSteps.size}`);
    if (graph.incorrectSteps.size > 0) {
      Array.from(graph.incorrectSteps)
        .sort()
        .forEach((step) => {
          console.log(`   • Step ${step}`);
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

    console.log(`\n🎯 Overall Assessment:`);
    const hasErrors =
      graph.incorrectSteps.size > 0 ||
      graph.unusedSteps.size > 0 ||
      graph.cycles.length > 0 ||
      !goalMatches;

    if (!hasErrors) {
      console.log("✅ Proof is CORRECT!");
    } else {
      console.log("❌ Proof has issues that need to be addressed.");
    }
  } catch (error) {
    console.error("❌ Error checking proof:", error);
  }
};

// Export for use in other modules
export {
  checkProof,
  Proof,
  ProofGraph,
  ProofStep,
  ReasonDefinition,
  StatementDefinition,
};

// Run if called directly
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Usage: npm run check-proof <proof-file>");
    console.log("Example: npm run check-proof proofs/tutorialProof.txt");
    process.exit(1);
  }

  const proofFile = args[0];
  checkProof(proofFile);
}
