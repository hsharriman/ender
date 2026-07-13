import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { UNIMPLEMENTED_REASONS } from "checker/checker/fillDeps/depsFromConclusion";
import { solveProof } from "../solver";

const TESTS_DIR = join(__dirname, "../../checker/proofs/tests");

/** Fixtures that fail the plain checker today (pre-existing) — not solvable. */
const SKIP_FILES = new Set(["reg1.txt", "reg1v2.txt", "transversal_test.txt"]);

const SOLVE_OPTIONS = { timeLimitMs: 10000, maxSolutions: 3 };
const PER_PROOF_MS = 15000;
const CHECKER_CALL_BUDGET = 10000;

function collectTxtFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      results.push(...collectTxtFiles(full));
    } else if (entry.endsWith(".txt")) {
      results.push(full);
    }
  }
  return results;
}

const passingProofs = collectTxtFiles(TESTS_DIR).filter((f) => {
  if (SKIP_FILES.has(f.split("/").pop()!)) return false;
  return readFileSync(f, "utf-8").split("\n")[0].trim() === "// pass";
});

const STEP_RE = /^\[(\d+)\]\s*(\w+)\(([^)]*)\)\s*->\s*(.*)$/;

interface ParsedStep {
  num: number;
  reason: string;
  args: string[];
  conclusion: string;
}

/** Split a passing proof into its premises text and parsed step lines. */
const splitProof = (
  text: string,
): { premises: string; steps: ParsedStep[] } => {
  const lines = text.split("\n");
  const stepsIdx = lines.findIndex((l) => l.trim() === "steps:");
  const steps: ParsedStep[] = [];
  for (const line of lines.slice(stepsIdx + 1)) {
    const m = line.trim().match(STEP_RE);
    if (!m) continue;
    steps.push({
      num: parseInt(m[1], 10),
      reason: m[2],
      args: m[3]
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      conclusion: m[4].trim(),
    });
  }
  return { premises: lines.slice(0, stepsIdx).join("\n").trimEnd(), steps };
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Drop one step and rebuild well-formed proof text: remaining steps renumber
 * consecutively; refs to the dropped step point at a nonexistent step, so the
 * citing step is invalid input the solver must drop from its seed and
 * re-derive.
 */
const ablate = (
  premises: string,
  steps: ParsedStep[],
  dropIdx: number,
): string => {
  const remaining = steps.filter((_, i) => i !== dropIdx);
  const renumber = new Map<number, number>();
  remaining.forEach((s, i) => renumber.set(s.num, i + 1));
  const lines = remaining.map((s, i) => {
    const args = s.args.map((a) =>
      /^\d+$/.test(a) ? String(renumber.get(parseInt(a, 10)) ?? 99) : a,
    );
    return `[${pad2(i + 1)}] ${s.reason}(${args.join(", ")}) -> ${s.conclusion}`;
  });
  return `${premises}\n\nsteps:\n${lines.join("\n")}\n`;
};

interface AblationCase {
  label: string;
  file: string;
  dropIdx: number;
}

const ablationCases: AblationCase[] = [];
for (const file of passingProofs) {
  const { steps } = splitProof(readFileSync(file, "utf-8"));
  steps.forEach((step, i) => {
    if (step.reason === "given") return;
    // The solver deliberately refuses to use placeholder-checked reasons.
    if (UNIMPLEMENTED_REASONS.has(step.reason)) return;
    const rel = file.slice(TESTS_DIR.length + 1);
    ablationCases.push({
      label: `${rel} drop [${pad2(step.num)}] ${step.reason}`,
      file,
      dropIdx: i,
    });
  });
}

describe("solver ablation harness (drop one step, re-derive)", () => {
  test.each(ablationCases.map((c) => [c.label, c] as const))(
    "%s",
    (_label, c) => {
      const { premises, steps } = splitProof(readFileSync(c.file, "utf-8"));
      const partial = ablate(premises, steps, c.dropIdx);
      const result = solveProof(partial, SOLVE_OPTIONS);
      expect(result.error).toBeUndefined();
      expect(result.ok).toBe(true);
      expect(result.solutions.length).toBeGreaterThanOrEqual(1);
      expect(result.solutions.every((s) => s.verified)).toBe(true);
      expect(result.stats.totalMs).toBeLessThan(PER_PROOF_MS);
      expect(result.stats.checkerCalls).toBeLessThan(CHECKER_CALL_BUDGET);
    },
    30000,
  );
});

describe("solver full synthesis (all steps removed)", () => {
  const synthesize = (name: string) => {
    const file = join(TESTS_DIR, "examples", name);
    const { premises } = splitProof(readFileSync(file, "utf-8"));
    return solveProof(`${premises}\n\nsteps:\n`, SOLVE_OPTIONS);
  };

  test(
    "tutorial.txt from premises alone",
    () => {
      const result = synthesize("tutorial.txt");
      expect(result.ok).toBe(true);
      expect(result.solutions[0].verified).toBe(true);
      expect(result.stats.totalMs).toBeLessThan(PER_PROOF_MS);
    },
    30000,
  );

  test(
    "s1c1.txt from premises alone, with multiple distinct solutions",
    () => {
      const result = synthesize("s1c1.txt");
      expect(result.ok).toBe(true);
      expect(result.solutions.length).toBeGreaterThanOrEqual(2);
      const keys = result.solutions.map((s) =>
        s.steps.map((st) => st.text).join("\n"),
      );
      expect(new Set(keys).size).toBe(keys.length);
      expect(result.stats.totalMs).toBeLessThan(PER_PROOF_MS);
    },
    30000,
  );

  test.each(["s1c2.txt", "s1c3.txt", "s2c1.txt", "s2c2.txt"])(
    "%s from premises alone",
    (name) => {
      const result = synthesize(name);
      expect(result.error).toBeUndefined();
      expect(result.ok).toBe(true);
      expect(result.solutions.every((s) => s.verified)).toBe(true);
      expect(result.stats.totalMs).toBeLessThan(PER_PROOF_MS);
      expect(result.stats.checkerCalls).toBeLessThan(CHECKER_CALL_BUDGET);
    },
    30000,
  );
});

describe("solver on already-complete proofs", () => {
  test(
    "reuses the existing valid steps of s1c1",
    () => {
      const file = join(TESTS_DIR, "examples", "s1c1.txt");
      const result = solveProof(readFileSync(file, "utf-8"), SOLVE_OPTIONS);
      expect(result.ok).toBe(true);
      expect(result.seed.existingStepsSeeded).toBeGreaterThan(0);
      expect(result.seed.droppedInvalidSteps).toHaveLength(0);
    },
    30000,
  );
});
