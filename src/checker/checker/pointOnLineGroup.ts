import {
  ParseDiagramStmt,
  ProofGraph,
  ProofObj,
  StatementGroup,
} from "../types/checkerTypes";

/**
 * `point_on_line` group: `on_line` is the base; `midpt` may substitute on diagram slots
 * (e.g. `def_perp`). `midpt_conv` is stricter: proof `con_seg` + diagram `on_line` only
 * (declared `midpt` in givens is separate — not a stand-in for `on_line` there).
 */
export const POINT_ON_LINE_GROUP = "point_on_line";

export const isPointOnLineGroup = (
  key: string,
  groups: Map<string, StatementGroup>,
): boolean => groups.get(key)?.name === POINT_ON_LINE_GROUP;

/** Enough diagram structure to satisfy a `point_on_line` diagram dependency. */
export const proofHasPointOnLineDiagram = (proof: ProofObj): boolean =>
  proof.premises.diagramStatements.some((d) => {
    const fn = d.statement.function;
    return fn === "on_line" || fn === "midpt" || fn === "intersect_seg";
  });

/** Whether a diagram premise row satisfies a `point_on_line` diagram slot (standard group). */
export const diagramSatisfiesPointOnLineGroup = (
  diag: ParseDiagramStmt,
): boolean => {
  const fn = diag.statement.function;
  return fn === "on_line" || fn === "intersect_seg" || fn === "midpt";
};

export const proofGraphHasPointOnLineDiagram = (
  proofGraph: ProofGraph,
): boolean =>
  Array.from(proofGraph.diagramPremises.values()).some((d) =>
    diagramSatisfiesPointOnLineGroup(d),
  );

/** Diagram rows for standard `point_on_line` slots (`def_perp`, etc.): `on_line` or `midpt`. */
export const filterDiagramsForPointOnLineGroup = (
  proofGraph: ProofGraph,
): ParseDiagramStmt[] =>
  Array.from(proofGraph.diagramPremises.values()).filter(
    (d) =>
      d.statement.function === "on_line" || d.statement.function === "midpt",
  );

/**
 * Diagram rows for `midpt_conv` only: `on_line` (including synthetic rows from
 * `intersect_seg`). Declared `midpt` givens are not used as a substitute here.
 */
export const filterOnLineDiagramsForMidptConv = (
  proofGraph: ProofGraph,
): ParseDiagramStmt[] =>
  Array.from(proofGraph.diagramPremises.values()).filter(
    (d) => d.statement.function === "on_line",
  );
