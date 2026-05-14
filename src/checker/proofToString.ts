import { Obj, ParseObj } from "../geometry-object";
import {
  ParseDiagramStmt,
  ParsePointObj,
  ProofObj,
  ProofStep,
  Reason,
  Stmt,
} from "./types/checkerTypes";

const q = (s: string) => `"${s.replace(/"/g, '\\"')}"`;
const num = (n: number) => Number(n.toFixed(6)).toString();
const pad = (ref?: string) =>
  ref && /^\d+$/.test(ref) ? ref.padStart(2, "0") : (ref ?? "");

const withPrefix = (prefix: string, value: string) =>
  value.startsWith(prefix) ? value : `${prefix}${value}`;

export const argToString = (arg: ParseObj): string => {
  switch (arg.type) {
    case Obj.Angle:
      return withPrefix("a_", arg.v);
    case Obj.Triangle:
      return withPrefix("t_", arg.v);
    case Obj.Quadrilateral:
      return withPrefix("q_", arg.v);
    default:
      return arg.v;
  }
};

export const stmtToString = (stmt: Stmt): string =>
  `${stmt.function}(${stmt.arguments.map(argToString).join(", ")})`;

const reasonToString = (reason?: Reason): string =>
  reason ? `${reason.function}(${reason.arguments.join(", ")})` : "";

const pointToString = (point: ParsePointObj): string =>
  `${point.v} (${num(point.pt[0])}, ${num(point.pt[1])}, ${point.offsetCode})`;

const objLine = (label: string, objs: ParseObj[]) =>
  objs.length ? [`${label}: ${objs.map((o) => argToString(o)).join(" ")}`] : [];

const givenLine = (step: ProofStep): string | undefined =>
  step.statement && step.stepNumber
    ? `[${step.stepNumber}] ${stmtToString(step.statement)}`
    : undefined;

const diagramLine = (diag: ParseDiagramStmt): string =>
  `[${diag.stepNumber}] ${stmtToString(diag.statement)}`;

const proofLine = (step: ProofStep): string | undefined => {
  if (!step.statement || !step.reason || !step.stepNumber) return undefined;
  return `[${pad(step.stepNumber)}] ${reasonToString(step.reason)} -> ${stmtToString(
    step.statement,
  )}`;
};

const linesOf = (xs: Array<string | undefined>): string[] =>
  xs.filter((x): x is string => Boolean(x));

export const proofToString = (proof: ProofObj): string => {
  const lines: string[] = [];
  if (proof.title) lines.push(`title: ${q(proof.title)}`);
  lines.push("premises:");
  if (proof.premises.points.length) {
    lines.push(`pt: ${proof.premises.points.map(pointToString).join(", ")}`);
  }
  lines.push(...objLine("seg", proof.premises.segments));
  lines.push(...objLine("ang", proof.premises.angles));
  lines.push(...objLine("tri", proof.premises.triangles));
  lines.push(...objLine("quad", proof.premises.quadrilaterals));
  lines.push(
    ...linesOf(proof.steps.filter((step) => step.type === "given").map(givenLine)),
  );
  lines.push(...proof.premises.diagramStatements.map(diagramLine));
  if (proof.goal) lines.push(`-> ${stmtToString(proof.goal)}`);

  const proofSteps = linesOf(
    proof.steps.filter((step) => step.type === "proof").map(proofLine),
  );
  if (proofSteps.length) {
    lines.push("", "steps:", ...proofSteps);
  }
  return `${lines.join("\n")}\n`;
};
