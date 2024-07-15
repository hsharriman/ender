import { PretestAppPageProps } from "../../components/PretestAppPage";
import { Content } from "../../core/diagramContent";
import { Angle } from "../../core/geometry/Angle";
import { Point } from "../../core/geometry/Point";
import { Segment } from "../../core/geometry/Segment";
import { EqualAngles } from "../../core/templates/EqualAngles";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { ParallelLines } from "../../core/templates/ParallelLines";
import { RightAngle } from "../../core/templates/RightAngle";
import { SVGModes, Vector } from "../../core/types/types";
import {
  anglePretestQuestions,
  segmentPretestQuestions,
} from "../../questions/pretestQuestions";

const bl: Vector = [5, -18];
const br: Vector = [-18, -18];
const b: Vector = [0, -18];
export const segmentContent = () => {
  const coords: [string, Vector, Vector][] = [
    ["A", [0, 4], bl],
    ["B", [4, 4], b],
    ["C", [8, 4], br],
    ["D", [0, 3], bl],
    ["E", [8, 3], br],
    ["F", [0, 2], bl],
    ["G", [8, 2], br],
    ["H", [0, 1], bl],
    ["J", [4, 1], br],
    ["M", [0, 0], bl],
    ["N", [8, 0], br],
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
  ].map((s) => {
    ctx.push(new Segment({ p1: s[0], p2: s[1], hoverable: false }));
  });

  const defaultProps = { ctx: ctx, frame: "given", mode: SVGModes.Default };
  ctx.addFrame("given");
  EqualSegments.additions(defaultProps, ["AB", "BC"]);
  EqualSegments.additions(defaultProps, ["DE", "MN"], 2);
  ParallelLines.additions(defaultProps, ["FG", "HJ"]);
  return ctx;
};

export const angleContent = () => {
  const coords: [string, Vector, Vector][] = [
    ["A", [3, 3.5], [5, 5]],
    ["B", [1, 3], [5, 5]],
    ["C", [4, 3], [5, 5]],
    ["D", [3, 2.5], [5, 5]],
    ["E", [1, 2], [5, 5]],
    ["F", [4, 2], [5, 5]],
    ["G", [4, 2], [5, 5]],
    ["H", [0, 1], [5, 5]],
    ["J", [2, 1], [5, 5]],
    ["K", [2, 1], [5, 5]],
    ["L", [2, 1], [5, 5]],
    ["M", [0, 0], [5, 5]],
    ["N", [4, 0], [5, 5]],
    ["Q", [2, 1], [5, 5]],
    ["P", [2, 1], [5, 5]],
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
  ].map((s) => {
    const seg = ctx.push(new Segment({ p1: s[0], p2: s[1], hoverable: false }));
    seg.mode("given", SVGModes.Default);
  });
  ctx.push(new Angle({ start: A, center: B, end: C, hoverable: false }));
  ctx.push(new Angle({ start: D, center: E, end: F, hoverable: false }));
  ctx.push(new Angle({ start: G, center: H, end: J, hoverable: false }));
  ctx.push(new Angle({ start: K, center: L, end: M, hoverable: false }));
  ctx.push(new Angle({ start: N, center: Q, end: P, hoverable: false }));

  const defaultProps = { ctx: ctx, frame: "given", mode: SVGModes.Default };
  ctx.addFrame("given");
  EqualAngles.additions(defaultProps, ["ABC", "KLM"]);
  EqualAngles.additions(defaultProps, ["DEF", "GHJ"], 2);
  RightAngle.additions(defaultProps, "NQP");
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
