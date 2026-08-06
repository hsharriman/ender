import {
  VerifiedCheckReport,
  VerifiedStepReport,
} from "checker/verified/presentationTypes";

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
  const detail = step.diagnostics.length
    ? step.diagnostics.map((d) => d.message).join("\n")
    : "The verified reason kernel did not accept this step.";
  return `${head}\n${detail}`;
}

export function buildAnnotatedLines(
  text: string,
  stepsByNumber: Map<string, VerifiedStepReport>,
): Array<{
  text: string;
  tooltip?: string;
  status?: VerifiedStepReport["status"];
}> {
  return text.split("\n").map((line) => {
    const m = line.match(/^\s*\[(\d+)\]/);
    if (!m) return { text: line };
    const step = stepsByNumber.get(String(parseInt(m[1], 10)));
    if (!step || step.status === "accepted") return { text: line };
    return { text: line, status: step.status, tooltip: describeStep(step) };
  });
}
