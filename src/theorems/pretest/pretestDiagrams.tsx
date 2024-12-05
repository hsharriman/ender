import { PretestAppPageProps } from "../../components/procedure/pages/PretestAppPage";
import { Content } from "../../core/diagramContent";
import { Angle } from "../../core/geometry/Angle";
import { Point } from "../../core/geometry/Point";
import { Segment } from "../../core/geometry/Segment";
import { Triangle } from "../../core/geometry/Triangle";
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

// TODO for some reason the bundling order doesn't work if this method isn't defined within this file
/* Helper methods related to randomizing the proof order */
const fisherYates = (arr: any[]) => {
  // shuffle the array with Fisher-Yates algorithm
  const arrCopy = arr.slice();
  for (let i = arrCopy.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arrCopy[i], arrCopy[j]] = [arrCopy[j], arrCopy[i]];
  }
  // return the shuffled array
  return arrCopy;
};

const defaultProps = (ctx: Content) => {
  return { ctx: ctx, frame: "given", mode: SVGModes.Focused };
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
    ["A", [1.5, 3.5], b],
    ["B", [4, 6.5], [0, 5]],
    ["C", [5.5, 3.5], bleft],
    ["D", [5.5, 6.5], b],
    ["E", [8.5, 9.5], [0, 5]],
    ["F", [9.5, 6.5], bleft],
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
    ["A", [2, 3.5], b],
    ["B", [2, 6], [0, 5]],
    ["C", [5, 3.5], bleft],
    ["D", [5.5, 6], b],
    ["E", [8.5, 8.5], [0, 5]],
    ["F", [8.5, 6], bleft],
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
