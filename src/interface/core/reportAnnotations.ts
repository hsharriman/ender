import { ParseDiagramStmt, ProofObj, Stmt } from "checker/types/checkerTypes";
import {
  parseObject,
  parseStatementText,
} from "checker/verified/presentationAdapter";
import {
  VerifiedCheckReport,
  VerifiedIssue,
  VerifiedStepReport,
} from "checker/verified/presentationTypes";
import { ParseObj } from "geometry-object";
import { StepReadings } from "./diagnosis/criteria";

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
 * which the layout highlights.  The report names a premise by its call text,
 * as the presentation spells it.
 */
export function attachDiagramDependencies(
  proof: ProofObj,
  report: VerifiedCheckReport,
): void {
  const premises = new Map(
    (report.presentation?.diagramPremises ?? []).map(({ call }, i) => [
      `${call.name}(${call.arguments.join(",")})`,
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
      ?.diagramDependencies.map((call) => premises.get(call))
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
  readings: Map<string, StepReadings> = new Map(),
): WrongDependencies => {
  const wrong: WrongDependencies = new Map();
  const add = (step: string, index: number) => {
    const key = String(parseInt(step, 10));
    (wrong.get(key) ?? wrong.set(key, new Set()).get(key)!).add(index);
  };
  for (const mismatch of dependencyMismatches(report)) {
    for (const step of mismatch.steps) add(step, mismatch.index);
  }
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
  /** Single parts the step should have named; drawn in the inconsistent style. */
  neededObjects: ParseObj[];
  /** Single parts the step named wrongly; marked in the editor only. */
  incorrectObjects: ParseObj[];
};

type CorrespondenceMismatch = {
  steps: string[];
  expected?: string;
};

const tryParseObject = (raw: string | undefined): ParseObj | undefined => {
  if (!raw) return undefined;
  try {
    return parseObject(raw);
  } catch {
    return undefined;
  }
};

/**
 * Per step number, the parts the diagram marks for a rejected step: for a
 * criterion, the parts its best reading needed but the step did not cite;
 * for `cpctc`, the part that does correspond and the one the step named.
 */
export const stepHints = (
  report: VerifiedCheckReport,
  readings: Map<string, StepReadings> = new Map(),
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
          neededObjects: [],
          incorrectObjects: [],
        })
        .get(key)!
    );
  };
  const citations = new Map(
    report.steps.map((s) => [String(s.number), s.dependencies.map(String)]),
  );
  for (const [step, stepReadings] of readings) {
    const best = stepReadings[0];
    const cited = citations.get(step) ?? [];
    for (const part of best.parts) {
      if (part.status === "cited") continue;
      // Stated by a step this one cites, only in another slot or under
      // another criterion: the step does rely on it, so it is not missing.
      if (part.status === "known" && part.ref && cited.includes(part.ref))
        continue;
      const stmt = parseStatementText(part.requires);
      if (!stmt) continue;
      if (part.status === "unknown") hintFor(step).unestablished.push(stmt);
      else hintFor(step).missing.push(stmt);
    }
  }
  const conclusions = new Map(
    report.steps.map((s) => [String(s.number), s.conclusion] as const),
  );
  for (const issue of [...report.issues, ...report.errors]) {
    if (issue.code !== "parts_not_corresponding_in_triangles") continue;
    const details = issue.details as CorrespondenceMismatch | undefined;
    if (!details?.steps) continue;
    for (const step of details.steps) {
      const key = String(parseInt(step, 10));
      const conclusion = parseStatementText(conclusions.get(key) ?? "");
      const expected = tryParseObject(details.expected);
      if (expected) hintFor(key).neededObjects.push(expected);
      // The expected part is the partner of the conclusion's first part,
      // so the second is the one named wrongly.
      const named = conclusion?.arguments[1];
      if (named) hintFor(key).incorrectObjects.push(named);
    }
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

/** The span of a step line's reason name, if it has a `[n] reason(` head. */
export const reasonNameSpan = (
  line: string,
): { start: number; end: number } | undefined => {
  const m = line.match(/^(\s*\[\d+\]\s*)([A-Za-z0-9_]+)\s*\(/);
  if (!m) return undefined;
  return { start: m[1].length, end: m[1].length + m[2].length };
};

/** The character span of each of a step line's conclusion arguments. */
export const conclusionArgumentSpans = (
  line: string,
): Array<{ start: number; end: number }> => {
  const arrow = line.indexOf("->");
  if (arrow === -1) return [];
  const open = line.indexOf("(", arrow);
  const close = open === -1 ? -1 : line.indexOf(")", open);
  if (close === -1) return [];
  return argumentSpans(line, open + 1, close);
};

const argumentSpans = (
  line: string,
  open: number,
  close: number,
): Array<{ start: number; end: number }> => {
  const spans: Array<{ start: number; end: number }> = [];
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

export const reasonArgumentSpans = (
  line: string,
): Array<{ start: number; end: number }> => {
  const head = line.match(/^\s*\[\d+\]\s*[A-Za-z0-9_]+\s*\(/);
  if (!head) return [];
  const open = head[0].length;
  const close = line.indexOf(")", open);
  if (close === -1) return [];
  return argumentSpans(line, open, close);
};

export const buildAnnotatedLines = (
  text: string,
  stepsByNumber: Map<string, VerifiedStepReport>,
  report?: VerifiedCheckReport,
  /** The criterion diagnoses of `diagnoseCriteria`, if they were run. */
  readings: Map<string, StepReadings> = new Map(),
): Array<{
  text: string;
  tooltip?: string;
  status?: VerifiedStepReport["status"];
  /** Character spans to underline as wrong. */
  squiggles?: Array<{ start: number; end: number }>;
}> => {
  const wrong = report ? wrongDependencies(report, readings) : new Map();
  const hints = report
    ? stepHints(report, readings)
    : new Map<string, StepHint>();
  return text.split("\n").map((line) => {
    const m = line.match(/^\s*\[(\d+)\]/);
    if (!m) return { text: line };
    const number = String(parseInt(m[1], 10));
    const step = stepsByNumber.get(number);
    if (!step || step.status === "accepted") return { text: line };
    const wrongIndices = wrong.get(number);
    const spans = wrongIndices ? reasonArgumentSpans(line) : [];
    const squiggles = spans.filter((_, i) => wrongIndices?.has(i));
    // A different criterion fits better than the one named: mark the name.
    const stepReadings: StepReadings | undefined = readings.get(number);
    const nameSpan = reasonNameSpan(line);
    if (
      stepReadings &&
      nameSpan &&
      stepReadings[0].reason !== stepReadings.ownReason
    ) {
      squiggles.unshift(nameSpan);
    }
    // A conclusion part named wrongly (cpctc): mark it.
    if (hints.get(number)?.incorrectObjects.length) {
      const second = conclusionArgumentSpans(line)[1];
      if (second) squiggles.push(second);
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
