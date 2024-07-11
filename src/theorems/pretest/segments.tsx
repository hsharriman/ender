import { Content } from "../../core/diagramContent";
import { Point } from "../../core/geometry/Point";
import { Segment } from "../../core/geometry/Segment";
import { EqualSegments } from "../../core/templates/EqualSegments";
import { ParallelLines } from "../../core/templates/ParallelLines";
import { SVGModes, Vector } from "../../core/types/types";
import { segmentPretestQuestions } from "../../questions/pretestQuestions";

export const segmentContent = () => {
  const coords: [string, Vector, Vector][] = [
    ["A", [0, 4], [5, 5]],
    ["B", [2, 4], [5, 5]],
    ["C", [4, 4], [5, 5]],
    ["D", [0, 3], [5, 5]],
    ["E", [4, 3], [5, 5]],
    ["F", [0, 2], [5, 5]],
    ["G", [4, 2], [5, 5]],
    ["H", [0, 1], [5, 5]],
    ["J", [2, 1], [5, 5]],
    ["M", [0, 0], [5, 5]],
    ["N", [4, 0], [5, 5]],
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

export const P1 = {
  name: "P1",
  questions: segmentPretestQuestions,
  // miniContent: miniContent(),
  segmentContent,
  // givens,
  // proves,
  // steps: [step1, step2, step3, step4, step5, step6, step7],
};
