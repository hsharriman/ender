import { PretestAppPageProps } from "../../components/PretestAppPage";
import { Content } from "../../core/diagramContent";
import { Angle } from "../../core/geometry/Angle";
import { Point } from "../../core/geometry/Point";
import { Segment } from "../../core/geometry/Segment";
import { Triangle } from "../../core/geometry/Triangle";
import { EqualAngles } from "../../core/templates/EqualAngles";
import { EqualRightAngles } from "../../core/templates/EqualRightAngles";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { ParallelLines } from "../../core/templates/ParallelLines";
import { RightAngle } from "../../core/templates/RightAngle";
import { fisherYates } from "../../core/testinfra/setupLayout";
import { SVGModes, Vector } from "../../core/types/types";
import {
  anglePretestQuestions,
  segmentPretestQuestions,
  trianglePretestQuestions,
} from "../../questions/pretestQuestions";

const defaultProps = (ctx: Content) => {
  return { ctx: ctx, frame: "given", mode: SVGModes.Focused };
};
const bright: Vector = [5, -18];
const bleft: Vector = [-18, -18];
const b: Vector = [0, -18];
export const segmentContent = () => {
  const coords: [string, Vector, Vector][] = [
    ["A", [0.5, 1], b],
    ["B", [1, 2.5], b],
    ["C", [1.5, 4], b],
    ["D", [3.5, 2.5], b],
    ["E", [6.5, 1.5], b],
    ["F", [3, 4], bright],
    ["G", [7.5, 4], bleft],
    ["H", [5, 0], bright],
    ["J", [8, 0], bleft],
    ["M", [0, -1], b],
    ["N", [3, -0], b],
  ];
  let ctx = new Content();
  const [A, B, C, D, E, F, G, H, J, M, N] = coords.map((c) =>
    // TODO option to make point labels invisible
    ctx.push(
      new Point({
        pt: c[1],
        label: c[0],
        showLabel: true,
        offset: c[2],
        hoverable: false,
        showPoint: true,
      })
    )
  );
  [
    [A, B],
    [B, C],
    [D, E],
    [F, G],
    [H, J],
    [M, N],
  ].forEach((s) => {
    ctx.push(new Segment({ p1: s[0], p2: s[1], hoverable: false }));
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
    ["A", [1, 4], [5, 5]],
    ["B", [0, 3], angbleft],
    ["C", [1.5, 3], angb],
    ["D", [3, 3], angb],
    ["E", [4.5, 3], angbright],
    ["F", [5, 4], [5, 5]],
    ["G", [7, 4], [5, 5]],
    ["H", [8, 3], angbright],
    ["J", [6.5, 3], angb],
    ["K", [0.5, 1.5], [5, 5]],
    ["L", [1, 0.5], bleft],
    ["M", [2.5, 0.5], angb],
    ["N", [5.5, 1.5], [0, 5]],
    ["Q", [5.5, 0.5], angbleft],
    ["P", [6.5, 0.5], angbright],
  ];
  let ctx = new Content();
  const [A, B, C, D, E, F, G, H, J, K, L, M, N, Q, P] = coords.map((c) =>
    // TODO option to make point labels invisible
    ctx.push(
      new Point({
        pt: c[1],
        label: c[0],
        showLabel: true,
        offset: c[2],
        hoverable: false,
        showPoint: true,
      })
    )
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
    const seg = ctx.push(new Segment({ p1: s[0], p2: s[1], hoverable: false }));
    seg.mode("given", SVGModes.Default);
  });
  ctx.push(new Angle({ start: A, center: B, end: C, hoverable: false }));
  ctx.push(new Angle({ start: D, center: E, end: F, hoverable: false }));
  ctx.push(new Angle({ start: G, center: H, end: J, hoverable: false }));
  ctx.push(new Angle({ start: K, center: L, end: M, hoverable: false }));
  ctx.push(new Angle({ start: N, center: Q, end: P, hoverable: false }));

  ctx.addFrame("given");
  EqualAngles.additions(defaultProps(ctx), ["ABC", "GHJ"]);
  EqualAngles.additions(defaultProps(ctx), ["DEF", "KLM"], 2);
  RightAngle.additions(defaultProps(ctx), "NQP");
  return ctx;
};

const baseTriangles = () => {
  const coords: [string, Vector, Vector][] = [
    ["A", [0, -0.5], b],
    ["B", [2.5, 2.5], [0, 5]],
    ["C", [4, -0.5], bleft],
    ["D", [3.5, 1.5], b],
    ["E", [6.5, 4.5], [0, 5]],
    ["F", [7.5, 1.5], bleft],
  ];
  let ctx = new Content();
  const [A, B, C, D, E, F] = coords.map((c) =>
    // TODO option to make point labels invisible
    ctx.push(
      new Point({
        pt: c[1],
        label: c[0],
        showLabel: true,
        offset: c[2],
        hoverable: false,
      })
    )
  );
  ctx.push(
    new Triangle({ pts: [A, B, C], label: "ABC", hoverable: false }, ctx)
  );
  ctx.push(
    new Triangle({ pts: [D, E, F], label: "DEF", hoverable: false }, ctx)
  );

  ctx.addFrame("given");
  ctx.getTriangle("ABC").mode("given", SVGModes.Default);
  ctx.getTriangle("DEF").mode("given", SVGModes.Default);
  return ctx;
};

export const hl = () => {
  const coords: [string, Vector, Vector][] = [
    ["A", [1, -1], b],
    ["B", [1, 1.5], [0, 5]],
    ["C", [4, -1], bleft],
    ["D", [4.5, 1.5], b],
    ["E", [7.5, 4], [0, 5]],
    ["F", [7.5, 1.5], bleft],
  ];
  let ctx = new Content();
  const [A, B, C, D, E, F] = coords.map((c) =>
    // TODO option to make point labels invisible
    ctx.push(
      new Point({
        pt: c[1],
        label: c[0],
        showLabel: true,
        offset: c[2],
        hoverable: false,
      })
    )
  );
  ctx.push(
    new Triangle({ pts: [A, B, C], label: "ABC", hoverable: false }, ctx)
  );
  ctx.push(
    new Triangle({ pts: [D, E, F], label: "DEF", hoverable: false }, ctx)
  );

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
  questions: fisherYates(segmentPretestQuestions),
  ctx: segmentContent().getCtx(),
};

export const P2: PretestAppPageProps = {
  name: "P2",
  questions: fisherYates(anglePretestQuestions),
  ctx: angleContent().getCtx(),
};

export const trianglePretestProofs = fisherYates(
  [sas(), sss(), aas(), asa(), hl()].map((ctx, i) => {
    return {
      name: `P${i + 3}`,
      ctx: ctx.getCtx(),
      questions: trianglePretestQuestions,
    };
  })
);
