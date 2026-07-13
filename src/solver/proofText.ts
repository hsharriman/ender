import { Obj, ParseObj } from "geometry-object";
import { Stmt } from "checker/types/checkerTypes";
import { SolutionStep } from "./solverTypes";

/** Serialize one statement argument back to proof-file syntax. */
export const argToText = (arg: ParseObj): string => {
  switch (arg.type) {
    case Obj.Angle:
      return `a_${arg.v}`;
    case Obj.Triangle:
      return `t_${arg.v}`;
    case Obj.Quadrilateral:
      return `q_${arg.v}`;
    case Obj.Circle:
      return `c_${arg.v}`;
    default:
      return arg.v;
  }
};

export const stmtToText = (stmt: Stmt): string =>
  `${stmt.function}(${stmt.arguments.map(argToText).join(", ")})`;

export const pad2 = (n: number): string => String(n).padStart(2, "0");

/** Everything before the `steps:` section, i.e. title + premises + goal. */
export const premisesSection = (proofText: string): string => {
  const match = proofText.match(/^[ \t]*steps:[ \t]*$/m);
  if (!match || match.index === undefined) return proofText.trimEnd();
  return proofText.slice(0, match.index).trimEnd();
};

export const buildProofText = (
  premisesText: string,
  steps: SolutionStep[],
): string => {
  const lines = steps.map((s) => s.text);
  return `${premisesText}\n\nsteps:\n${lines.join("\n")}\n`;
};
