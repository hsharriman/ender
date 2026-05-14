import type { Stmt } from "../types/checkerTypes";
import { Obj } from "../../geometry-object";
import { runProofCheckerFromText } from "../proofChecker";
import { buildProofDag, canonicalFactId } from "./proofDag";

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

test("canonicalFactId merges symmetric con_seg", () => {
  const a = {
    function: "con_seg",
    arguments: [
      { type: Obj.Segment, v: "AB" },
      { type: Obj.Segment, v: "CD" },
    ],
  } as Stmt;
  const b = {
    function: "con_seg",
    arguments: [
      { type: Obj.Segment, v: "CD" },
      { type: Obj.Segment, v: "AB" },
    ],
  } as Stmt;
  expect(canonicalFactId(a)).toBe(canonicalFactId(b));
});

test("buildProofDag: text premise g_n is not an incoming edge; given(g_n) is", () => {
  const text = `title: "dag given only"
premises:
pt: A (0, 0, b), B (1, 0, b)
[g_1] con_seg(AB, AB)
-> con_seg(AB, AB)

steps:
[01] given(g_1) -> con_seg(AB, AB)
`;
  const { proof } = runProofCheckerFromText(text);
  expect(proof).toBeDefined();
  const dag = buildProofDag(proof);
  const id = canonicalFactId({
    function: "con_seg",
    arguments: [
      { type: Obj.Segment, v: "AB" },
      { type: Obj.Segment, v: "AB" },
    ],
  });
  const node = dag.nodes.get(id);
  expect(node).toBeDefined();
  expect(node!.incoming).toHaveLength(1);
  const edge = node!.incoming[0];
  expect(edge.kind).toBe("inference");
  if (edge.kind === "inference") {
    expect(edge.reasonFn).toBe("given");
    expect(edge.reasonArgs).toEqual(["g_1"]);
  }
});

test("buildProofDag: diagram premise d_n is an incoming premise edge", () => {
  const text = `title: "dag diagram premise"
premises:
pt: A (5, 9, tr), B (10, 2, br), C (1, 3, bl), D (14, 8, tr), M (7.5, 5.5, t)
seg: AB CD
tri: t_ACM t_BDM
[d_01] intersect_seg(AB,CD,M)
[d_02] transversal(A, C, A, B, D, B)
[d_03] transversal(C, A, C, D, B, D)
[g_1] con_seg(AM,BM)
[g_2] con_seg(CM,DM)
-> para(AC,BD)

steps:
[01] given(g_2) -> con_seg(CM,DM)
[02] given(g_1) -> con_seg(AM,BM)
[03] vert_ang() -> con_ang(a_CMA, a_DMB)
`;
  const { proof } = runProofCheckerFromText(text);
  expect(proof).toBeDefined();
  const dag = buildProofDag(proof);
  const intersectDiag = proof.premises.diagramStatements.find(
    (d) => d.statement.function === "intersect_seg",
  );
  expect(intersectDiag).toBeDefined();
  const intersectId = canonicalFactId(intersectDiag!.statement);
  const node = dag.nodes.get(intersectId);
  expect(node).toBeDefined();
  expect(
    node!.incoming.some(
      (e) => e.kind === "premise" && e.ref === intersectDiag!.stepNumber,
    ),
  ).toBe(true);
});
