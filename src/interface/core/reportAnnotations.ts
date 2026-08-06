import {
  VerifiedCheckReport,
  VerifiedStepReport,
} from "checker/verified/presentationTypes";

/**
 * One line summarizing the whole report: the verdict, then the two things the
 * reader most often wants next -- which step the goal was reached at, and
 * which steps nothing depends on.
 */
export function summarizeReport(report: VerifiedCheckReport): string {
  const verdict =
    report.verdict === "accepted"
      ? "Accepted by the verified checker."
      : report.verdict === "failed_to_parse_problem"
        ? "The problem could not be parsed."
        : "Rejected by the verified checker.";
  const parts: string[] = [];
  if (report.goal.provedBy !== null) {
    parts.push(`goal reached at step ${report.goal.provedBy}`);
  }
  const firstRejected = report.steps.find((s) => s.status === "rejected");
  if (firstRejected) parts.push(`first failure at step ${firstRejected.number}`);
  if (report.graph.unusedSteps.length) {
    parts.push(`nothing uses step ${report.graph.unusedSteps.join(", ")}`);
  }
  if (report.duplicates.length) {
    parts.push(
      `${report.duplicates.length} fact${
        report.duplicates.length === 1 ? "" : "s"
      } derived twice`,
    );
  }
  return parts.length ? `${verdict} (${parts.join("; ")})` : verdict;
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
