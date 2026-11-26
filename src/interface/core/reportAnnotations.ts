import { ParseDiagramStmt, ProofObj, Stmt } from "checker/types/checkerTypes";
import {
  parseStatementText,
  STEP_NUMBER,
  stmtText,
} from "checker/grammar/syntax";
import { stmtOf } from "checker/verified/presentationAdapter";
import {
  VerifiedCheckReport,
  VerifiedIssue,
  VerifiedStepReport,
} from "checker/verified/presentationTypes";
import { isOpen, StepReadings } from "./diagnosis/criteria";
import { Diagnoses, readingsOf } from "./diagnosis/steps";

/** One line: the verdict, then where the goal was reached if it was. */
export function summarizeReport(report: VerifiedCheckReport): string {
  const verdict =
    report.verdict === "accepted"
      ? "Accepted by the verified checker."
      : report.verdict === "failed_to_parse_problem"
        ? "The problem could not be parsed."
        : "Rejected by the verified checker.";
  return report.goal.provedBy === null
    ? verdict
    : `${verdict} (goal reached at step ${report.goal.provedBy})`;
}

/**
 * The proof-wide findings, in the order a reader can act on them: what went
 * wrong with the goal, which steps failed, which were left unjudged, and then
 * the structural remarks about the proof as a whole.
 */
export function reportFindings(report: VerifiedCheckReport): string[] {
  const findings: string[] = [];
  for (const diagnostic of report.goal.diagnostics) {
    findings.push(`Goal: ${diagnostic.message}`);
  }
  const listed = (status: VerifiedStepReport["status"]) =>
    report.steps.filter((step) => step.status === status).map((s) => s.number);
  const rejected = listed("rejected");
  if (rejected.length) {
    findings.push(`Rejected step${plural(rejected)}: ${rejected.join(", ")}`);
  }
  const blocked = listed("blocked");
  if (blocked.length) {
    findings.push(
      `Not judged, because a cited step was not accepted: ${blocked.join(", ")}`,
    );
  }
  const incomplete = listed("incomplete");
  if (incomplete.length) {
    findings.push(
      `Incomplete, so skipped: step${plural(incomplete)} ${incomplete.join(", ")}`,
    );
  }
  if (report.graph.cycles.length) {
    findings.push(
      `Cycles: ${report.graph.cycles
        .map((cycle) => cycle.join(" -> "))
        .join(" | ")}`,
    );
  }
  if (report.graph.unusedSteps.length) {
    findings.push(`Unused steps: ${report.graph.unusedSteps.join(", ")}`);
  }
  for (const duplicate of report.duplicates) {
    findings.push(
      `${duplicate.statement} derived twice: ${originText(
        duplicate.first,
      )} and ${originText(duplicate.again)}`,
    );
  }
  return findings;
}

/** Issue codes whose content `reportFindings` already states. */
const SUMMARIZED_ISSUES = new Set([
  "goal_not_reached",
  "unused_step",
  "cycle",
  "duplicate_conclusion",
  "upstream_dep_error",
]);

/** The issues `reportFindings` does not already state, one line each. */
export function otherIssues(report: VerifiedCheckReport): string[] {
  return [...report.issues, ...report.errors]
    .filter((issue) => !SUMMARIZED_ISSUES.has(issue.code))
    .map(issueText);
}

function issueText(issue: VerifiedIssue): string {
  return issue.details === undefined
    ? issue.code
    : `${issue.code}: ${JSON.stringify(issue.details)}`;
}

/**
 * Give each proof step the diagram premises the checker says it consulted,
 * which the layout highlights.  The report names a premise by its statement
 * text.
 */
export function attachDiagramDependencies(
  proof: ProofObj,
  report: VerifiedCheckReport,
): void {
  const premises = new Map(
    (report.presentation?.diagramPremises ?? []).map(({ call: premise }, i) => [
      stmtText(stmtOf(premise)),
      proof.premises.diagramStatements[i],
    ]),
  );
  const steps = new Map(
    report.steps.map((step) => [String(step.number), step] as const),
  );
  for (const step of proof.steps) {
    if (step.type !== "proof" || !step.stepNumber) continue;
    const deps = steps
      .get(step.stepNumber)
      ?.diagramDependencies.map((stmt) => premises.get(stmt))
      .filter((premise): premise is ParseDiagramStmt => premise !== undefined);
    if (deps?.length) step.diagramDeps = deps;
  }
}

function plural(items: unknown[]): string {
  return items.length === 1 ? "" : "s";
}

function originText(
  origin: VerifiedCheckReport["duplicates"][number]["first"],
): string {
  return origin.kind === "premise" ? origin.label : `step ${origin.step}`;
}

/**
 * What the verified checker says about one step.  A blocked step was never
 * judged -- an earlier step failed, so its dependencies were never
 * established -- and saying so is more useful than either silence or a red
 * mark it did not earn.
 */
export function describeStep(step: VerifiedStepReport): string {
  const cites = step.dependencies.length
    ? ` citing ${step.dependencies.join(", ")}`
    : "";
  const head = `Step ${step.number}: ${step.reason ?? "unknown reason"}${cites}`;
  if (step.status === "blocked") {
    return `${head}\nNot checked: an earlier step was rejected, so this step's dependencies were never established.`;
  }
  if (step.status === "incomplete") {
    return `Step ${step.number}: incomplete\nThis step could not be read, so it was skipped. The rest of the proof is still checked; a step that cites this one is not.`;
  }
  const detail = step.diagnostics.length
    ? step.diagnostics.map((d) => d.message).join("\n")
    : "The verified reason kernel did not accept this step.";
  return `${head}\n${detail}`;
}

/**
 * The dependencies the checker says state the wrong kind of fact for their
 * slot, keyed by step number, as 0-based positions in the reason's argument
 * list.
 */
export type WrongDependencies = Map<string, Set<number>>;

type DependencyMismatch = {
  index: number;
  ref: string;
  expectedType: string;
  allowedTypes: string[];
  receivedType: string;
  steps: string[];
};

const dependencyMismatches = (
  report: VerifiedCheckReport,
): DependencyMismatch[] => {
  return [...report.issues, ...report.errors]
    .filter((issue) => issue.code === "reason_dep_type_mismatch")
    .map((issue) => issue.details as DependencyMismatch)
    .filter(
      (details) =>
        details !== undefined &&
        typeof details.index === "number" &&
        Array.isArray(details.steps),
    );
};

export const wrongDependencies = (
  report: VerifiedCheckReport,
  diagnoses: Diagnoses = new Map(),
): WrongDependencies => {
  const wrong: WrongDependencies = new Map();
  const add = (step: string, index: number) => {
    const key = String(parseInt(step, 10));
    (wrong.get(key) ?? wrong.set(key, new Set()).get(key)!).add(index);
  };
  for (const mismatch of dependencyMismatches(report)) {
    for (const step of mismatch.steps) add(step, mismatch.index);
  }
  // Citations an accepted edit of the step changed.
  for (const [step, d] of diagnoses) {
    if (d.kind === "citation") d.slots.forEach((slot) => add(step, slot));
  }
  const readings = readingsOf(diagnoses);
  // A citation every reading of a rejected criterion says does not supply
  // its slot.  Only readings for the reason the step names count: when the
  // best reading is a different criterion, the reason is what is wrong.
  for (const [step, stepReadings] of readings) {
    const own = stepReadings.filter((r) => r.reason === stepReadings.ownReason);
    if (!own.length) continue;
    const slots = own[0].parts.map((p) => p.index);
    for (const slot of slots) {
      if (own.every((r) => r.parts[slot]?.status !== "cited")) add(step, slot);
    }
  }
  return wrong;
};

/** What the diagram should mark for one rejected step. */
export type StepHint = {
  /**
   * Facts the step needed that it did not cite but that are established or
   * one step away; drawn in the inconsistent style.
   */
  missing: Stmt[];
  /** Facts the step needed that nothing before it establishes. */
  unestablished: Stmt[];
  /**
   * The conclusion names the wrong objects: some edit of one of its
   * objects is accepted.  All its objects are drawn red and squiggled.
   */
  wrongConclusion: boolean;
  /**
   * The conclusion is a statement the reason cannot conclude.  All its
   * objects are drawn red, and its statement name is squiggled.
   */
  wrongStatementType: boolean;
};

/** Steps whose conclusion is a statement their reason cannot conclude. */
const statementMismatchSteps = (report: VerifiedCheckReport): string[] =>
  [...report.issues, ...report.errors]
    .filter((issue) => issue.code === "reason_stmt_mismatch")
    .flatMap(
      (issue) =>
        (issue.details as { steps?: string[] } | undefined)?.steps ?? [],
    )
    .map((s) => String(parseInt(s, 10)));

/**
 * Per step number, the parts the diagram marks for a rejected step: for a
 * criterion, the parts its best reading needed but the step did not cite;
 * for a conclusion that names the wrong objects or a statement its reason
 * cannot conclude, the conclusion itself.
 */
export const stepHints = (
  report: VerifiedCheckReport,
  diagnoses: Diagnoses = new Map(),
): Map<string, StepHint> => {
  const hints = new Map<string, StepHint>();
  const hintFor = (step: string) => {
    const key = String(parseInt(step, 10));
    return (
      hints.get(key) ??
      hints
        .set(key, {
          missing: [],
          unestablished: [],
          wrongConclusion: false,
          wrongStatementType: false,
        })
        .get(key)!
    );
  };
  const citations = new Map(
    report.steps.map((s) => [String(s.number), s.dependencies.map(String)]),
  );
  for (const [step, stepReadings] of readingsOf(diagnoses)) {
    const best = stepReadings[0];
    const cited = citations.get(step) ?? [];
    for (const part of best.parts) {
      if (part.status === "cited") continue;
      // Stated by a step this one cites, only in another slot or under
      // another criterion: the step does rely on it, so it is not missing.
      if (part.status === "known" && part.ref && cited.includes(part.ref))
        continue;
      // An argument the figure left open has nothing to draw.
      if (isOpen(part.requires)) continue;
      const stmt = parseStatementText(part.requires);
      if (!stmt) continue;
      if (part.status === "unknown") hintFor(step).unestablished.push(stmt);
      else hintFor(step).missing.push(stmt);
    }
  }
  for (const [step, d] of diagnoses) {
    if (d.kind === "conclusion") hintFor(step).wrongConclusion = true;
  }
  for (const step of statementMismatchSteps(report)) {
    hintFor(step).wrongStatementType = true;
  }
  return hints;
};

/** One line per mismatched dependency of `stepNumber`, for its tooltip. */
const mismatchText = (
  report: VerifiedCheckReport,
  stepNumber: string,
): string[] => {
  return dependencyMismatches(report)
    .filter((m) => m.steps.some((s) => String(parseInt(s, 10)) === stepNumber))
    .map((m) => {
      const expected = [m.expectedType, ...(m.allowedTypes ?? [])]
        .filter((t, i, all) => all.indexOf(t) === i)
        .join(" or ");
      return `Dependency ${m.index + 1} cites step ${m.ref}, which states ${m.receivedType}; this slot needs ${expected}.`;
    });
};

type Span = { start: number; end: number };

/** Each argument's span between the parentheses at `open` and `close`. */
const argumentSpans = (line: string, open: number, close: number): Span[] => {
  const spans: Span[] = [];
  let start = open;
  for (let i = open; i <= close; i++) {
    if (i === close || line[i] === ",") {
      const raw = line.slice(start, i);
      const lead = raw.length - raw.trimStart().length;
      const text = raw.trim();
      if (text)
        spans.push({ start: start + lead, end: start + lead + text.length });
      start = i + 1;
    }
  }
  return spans;
};

/**
 * The name and argument spans of the reason or statement written at `from`,
 * if one is.
 */
const spansFrom = (
  line: string,
  from: number,
): { name: Span; args: Span[] } | undefined => {
  const m = line.slice(from).match(/^(\s*)([A-Za-z0-9_]+)\s*\(/);
  if (!m) return undefined;
  const start = from + m[1].length;
  const open = from + m[0].length;
  const close = line.indexOf(")", open);
  return {
    name: { start, end: start + m[2].length },
    args: close === -1 ? [] : argumentSpans(line, open, close),
  };
};

/** The spans of a step line's reason and conclusion. */
const stepSpans = (line: string) => {
  const head = line.match(STEP_NUMBER);
  const arrow = line.indexOf("->");
  return {
    reason: head ? spansFrom(line, head[0].length) : undefined,
    conclusion: arrow === -1 ? undefined : spansFrom(line, arrow + 2),
  };
};

export const buildAnnotatedLines = (
  text: string,
  stepsByNumber: Map<string, VerifiedStepReport>,
  report?: VerifiedCheckReport,
  /** The diagnoses of `diagnoseSteps`, if they were run. */
  diagnoses: Diagnoses = new Map(),
): Array<{
  text: string;
  tooltip?: string;
  status?: VerifiedStepReport["status"];
  /** Character spans to underline as wrong. */
  squiggles?: Span[];
}> => {
  const wrong = report ? wrongDependencies(report, diagnoses) : new Map();
  const hints = report
    ? stepHints(report, diagnoses)
    : new Map<string, StepHint>();
  const readings = readingsOf(diagnoses);
  return text.split("\n").map((line) => {
    const m = line.match(STEP_NUMBER);
    if (!m) return { text: line };
    const number = String(parseInt(m[1], 10));
    const step = stepsByNumber.get(number);
    if (!step || step.status === "accepted") return { text: line };
    const spans = stepSpans(line);
    const wrongIndices = wrong.get(number);
    const squiggles = (spans.reason?.args ?? []).filter((_, i) =>
      wrongIndices?.has(i),
    );
    // A different criterion fits better than the one named: mark the name.
    const stepReadings: StepReadings | undefined = readings.get(number);
    const nameSpan = spans.reason?.name;
    if (
      stepReadings &&
      nameSpan &&
      stepReadings[0].reason !== stepReadings.ownReason
    ) {
      squiggles.unshift(nameSpan);
    }
    // A conclusion that names the wrong objects: mark every object.
    if (hints.get(number)?.wrongConclusion) {
      squiggles.push(...(spans.conclusion?.args ?? []));
    }
    // A statement the reason cannot conclude: mark its name.
    const statementName = spans.conclusion?.name;
    if (hints.get(number)?.wrongStatementType && statementName) {
      squiggles.push(statementName);
    }
    const reasons = report ? mismatchText(report, number) : [];
    const tooltip = reasons.length
      ? `${describeStep(step).split("\n")[0]}\n${reasons.join("\n")}`
      : describeStep(step);
    return {
      text: line,
      status: step.status,
      tooltip,
      ...(squiggles.length ? { squiggles } : {}),
    };
  });
};
