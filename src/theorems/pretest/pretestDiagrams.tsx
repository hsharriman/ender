import { PretestAppPageProps } from "../../components/procedure/pages/PretestAppPage";
import { Content } from "../../core/diagramContent";
import { ShowPoint } from "../../core/geometry/Point";
import { EqualAngles } from "../../core/reasons/EqualAngles";
import { EqualRightAngles } from "../../core/reasons/EqualRightAngles";
import { EqualSegments } from "../../core/reasons/EqualSegments";
import { ParallelLines } from "../../core/reasons/ParallelLines";
import { RightAngle } from "../../core/reasons/RightAngle";
import {
  anglePretestQuestions,
  segmentPretestQuestions,
  trianglePretestQuestions,
} from "../../core/testinfra/questions/pretestQuestions";
import { SVGModes, Vector } from "../../core/types/types";

const defaultProps = (ctx: Content) => {
  return { ctx: ctx, frame: "given", mode: SVGModes.Default };
};
const bright: Vector = [5, -18];
const bleft: Vector = [-18, -18];
const b: Vector = [0, -18];
export const segmentContent = () => {
  const coords: [string, Vector, Vector][] = [
    ["A", [2.5, 6], b],
    ["B", [3, 7.5], b],
    ["C", [3.5, 9], b],
    ["D", [5.5, 7.5], b],
    ["E", [8.5, 6.5], b],
    ["F", [5, 9], bright],
    ["G", [9.5, 9], bleft],
    ["H", [7, 5], bright],
    ["J", [10, 5], bleft],
    ["M", [2, 4], b],
    ["N", [5, 5], b],
  ];
  let ctx = new Content();
  const [A, B, C, D, E, F, G, H, J, M, N] = coords.map((c) =>
    ctx.addPoint({
      pt: c[1],
      label: c[0],
      offset: c[2],
      showPoint: ShowPoint.Always,
    })
  );
  [
    [A, B],
    [B, C],
    [D, E],
    [F, G],
    [H, J],
    [M, N],
  ].forEach((s) => {
    ctx.addSegment({ p1: s[0], p2: s[1] });
  });

  ctx.addFrame("given");
  EqualSegments.additions(defaultProps(ctx), ["AB", "BC"]);
  EqualSegments.additions(defaultProps(ctx), ["DE", "MN"], 2);
  ParallelLines.additions(defaultProps(ctx), ["FG", "HJ"]);
  return ctx;
};

const angbleft: Vector = [-15, -15];
const angbright: Vector = [5, -15];
const angb: Vector = [0, -15];
export const angleContent = () => {
  const coords: [string, Vector, Vector][] = [
    ["A", [2.5, 9], [5, 5]],
    ["B", [1.5, 8], angbleft],
    ["C", [3, 8], angb],
    ["D", [5, 8], angb],
    ["E", [6.5, 8], angbright],
    ["F", [7, 9], [5, 5]],
    ["G", [9, 9], [5, 5]],
    ["H", [10, 8], angbright],
    ["J", [8.5, 8], angb],
    ["K", [2.5, 5.5], [5, 5]],
    ["L", [3, 4.5], bleft],
    ["M", [4.5, 4.5], angb],
    ["N", [7.5, 5.5], [0, 5]],
    ["Q", [7.5, 4.5], angbleft],
    ["P", [8.5, 4.5], angbright],
  ];
  let ctx = new Content();
  const [A, B, C, D, E, F, G, H, J, K, L, M, N, Q, P] = coords.map((c) =>
    ctx.addPoint({
      pt: c[1],
      label: c[0],
      offset: c[2],
      showPoint: ShowPoint.Always,
    })
  );
  [
    [A, B],
    [B, C],
    [D, E],
    [E, F],
    [G, H],
    [H, J],
    [K, L],
    [L, M],
    [N, Q],
    [Q, P],
  ].forEach((s) => {
    const seg = ctx.addSegment({ p1: s[0], p2: s[1] });
    seg.mode("given", SVGModes.Default);
  });
  ctx.addAngles([
    { start: A, center: B, end: C },
    { start: D, center: E, end: F },
    { start: G, center: H, end: J },
    { start: K, center: L, end: M },
    { start: N, center: Q, end: P },
  ]);

  ctx.addFrame("given");
  EqualAngles.additions(defaultProps(ctx), ["ABC", "GHJ"]);
  EqualAngles.additions(defaultProps(ctx), ["DEF", "KLM"], 2);
  RightAngle.additions(defaultProps(ctx), "NQP");
  return ctx;
};

const baseTriangles = () => {
  const coords: [string, Vector, Vector][] = [
    ["A", [1.5, 3.5], b],
    ["B", [4, 6.5], [0, 5]],
    ["C", [5.5, 3.5], bleft],
    ["D", [5.5, 6.5], b],
    ["E", [8.5, 9.5], [0, 5]],
    ["F", [9.5, 6.5], bleft],
  ];
  let ctx = new Content();
  const [A, B, C, D, E, F] = coords.map((c) =>
    ctx.addPoint({
      pt: c[1],
      label: c[0],
      offset: c[2],
    })
  );
  ctx.addTriangle({ pts: [A, B, C] });
  ctx.addTriangle({ pts: [D, E, F] });

  ctx.addFrame("given");
  ctx.getTriangle("ABC").mode("given", SVGModes.Default);
  ctx.getTriangle("DEF").mode("given", SVGModes.Default);
  return ctx;
};

export const hl = () => {
  const coords: [string, Vector, Vector][] = [
    ["A", [2, 3.5], b],
    ["B", [2, 6], [0, 5]],
    ["C", [5, 3.5], bleft],
    ["D", [5.5, 6], b],
    ["E", [8.5, 8.5], [0, 5]],
    ["F", [8.5, 6], bleft],
  ];
  let ctx = new Content();
  const [A, B, C, D, E, F] = coords.map((c) =>
    ctx.addPoint({
      pt: c[1],
      label: c[0],
      offset: c[2],
    })
  );
  ctx.addTriangles([{ pts: [A, B, C] }, { pts: [D, E, F] }]);

  ctx.addFrame("given");
  ctx.getTriangle("ABC").mode("given", SVGModes.Default);
  ctx.getTriangle("DEF").mode("given", SVGModes.Default);
  EqualRightAngles.additions(defaultProps(ctx), ["BAC", "DFE"]);
  EqualSegments.additions(defaultProps(ctx), ["AB", "EF"]);
  EqualSegments.additions(defaultProps(ctx), ["BC", "DE"], 2);
  return ctx;
};

export const sas = () => {
  const ctx = baseTriangles();
  EqualSegments.additions(defaultProps(ctx), ["AB", "DE"]);
  EqualSegments.additions(defaultProps(ctx), ["BC", "EF"], 2);
  EqualAngles.additions(defaultProps(ctx), ["ABC", "DEF"]);
  return ctx;
};

export const sss = () => {
  const ctx = baseTriangles();
  EqualSegments.additions(defaultProps(ctx), ["AB", "DE"]);
  EqualSegments.additions(defaultProps(ctx), ["BC", "EF"], 2);
  EqualSegments.additions(defaultProps(ctx), ["AC", "DF"], 3);
  return ctx;
};

export const aas = () => {
  const ctx = baseTriangles();
  EqualSegments.additions(defaultProps(ctx), ["AB", "DE"]);
  EqualAngles.additions(defaultProps(ctx), ["ABC", "DEF"]);
  EqualAngles.additions(defaultProps(ctx), ["ACB", "DFE"], 2);
  return ctx;
};

export const asa = () => {
  const ctx = baseTriangles();
  EqualSegments.additions(defaultProps(ctx), ["BC", "FE"]);
  EqualAngles.additions(defaultProps(ctx), ["ABC", "DEF"]);
  EqualAngles.additions(defaultProps(ctx), ["ACB", "DFE"], 2);
  return ctx;
};

export const P1: PretestAppPageProps = {
  name: "P1",
  questions: segmentPretestQuestions,
  ctx: segmentContent().getCtx(),
};

export const P2: PretestAppPageProps = {
  name: "P2",
  questions: anglePretestQuestions,
  ctx: angleContent().getCtx(),
};

export const trianglePretestProofs = [sas(), sss(), aas(), asa(), hl()].map(
  (ctx, i) => {
    return {
      name: `P${i + 3}`,
      ctx: ctx.getCtx(),
      questions: trianglePretestQuestions,
    };
  }
);
