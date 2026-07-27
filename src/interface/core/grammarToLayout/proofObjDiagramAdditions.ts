import { Stmt } from "checker/types/checkerTypes";
import { DiagramContent } from "../builder/DiagramContent";
import { AngleBisector } from "../reasons/AngleBisector";
import { Complementary } from "../reasons/Complementary";
import { CongruentTriangles } from "../reasons/CongruentTriangles";
import { EqualAngles } from "../reasons/EqualAngles";
import { LinearPair } from "../reasons/LinearPair";
import { Supplementary } from "../reasons/Supplementary";
import { EqualRightAngles } from "../reasons/EqualRightAngles";
import { EqualSegments } from "../reasons/EqualSegments";
import { InscribedAngle } from "../reasons/InscribedAngle";
import { Midpoint } from "../reasons/Midpoint";
import { ParallelLines } from "../reasons/ParallelLines";
import { PerpBisector } from "../reasons/PerpBisector";
import { Perpendicular } from "../reasons/Perpendicular";
import { QuadClassification } from "../reasons/QuadClassification";
import { RightAngle } from "../reasons/RightAngle";
import { SegmentBisector } from "../reasons/SegmentBisector";
import { SegmentCircleClassification } from "../reasons/SegmentCircleClassification";
import { SimilarSegments } from "../reasons/SimilarSegments";
import { SimilarTriangles } from "../reasons/SimilarTriangles";
import { Tangent } from "../reasons/Tangent";
import { TriangleClassification } from "../reasons/TriangleClassification";
import { SVGModes } from "../types/diagramTypes";

export type CongruenceTickTracker = {
  segTickByObj: Map<string, number>;
  angTickByObj: Map<string, number>;
  simSegTickByObj: Map<string, number>;
  paraTickByObj: Map<string, number>;
};

const assignTick = (
  map: Map<string, number>,
  a: string,
  b: string,
  nextTick: { value: number },
) => {
  const tick = map.get(a) ?? map.get(b) ?? nextTick.value++;
  map.set(a, tick);
  map.set(b, tick);
};
const canonSeg = (ctx: DiagramContent, l: string) =>
  ctx.getSegment(l)?.obj.label ?? l;
const canonAng = (ctx: DiagramContent, l: string) =>
  ctx.getAngle(l)?.obj.label ?? l;

export const buildCongruenceTickTracker = (
  stmts: Array<Stmt | undefined>,
  ctx: DiagramContent,
): CongruenceTickTracker => {
  const segTickByObj = new Map<string, number>();
  const angTickByObj = new Map<string, number>();
  const simSegTickByObj = new Map<string, number>();
  const paraTickByObj = new Map<string, number>();
  const nextSeg = { value: 1 };
  const nextAng = { value: 1 };
  const nextSimSeg = { value: 1 };
  const nextPara = { value: 1 };

  stmts.forEach((stmt) => {
    if (!stmt || stmt.arguments.length !== 2) return;
    const a = stmt.arguments[0].v;
    const b = stmt.arguments[1].v;
    if (stmt.function === "con_seg" || stmt.function === "ref_seg") {
      assignTick(segTickByObj, canonSeg(ctx, a), canonSeg(ctx, b), nextSeg);
    } else if (stmt.function === "con_ang" || stmt.function === "ref_ang") {
      assignTick(angTickByObj, canonAng(ctx, a), canonAng(ctx, b), nextAng);
    } else if (stmt.function === "sim_seg") {
      assignTick(
        simSegTickByObj,
        canonSeg(ctx, a),
        canonSeg(ctx, b),
        nextSimSeg,
      );
    } else if (stmt.function === "para") {
      assignTick(paraTickByObj, canonSeg(ctx, a), canonSeg(ctx, b), nextPara);
    }
  });

  return { segTickByObj, angTickByObj, simSegTickByObj, paraTickByObj };
};

export const applyStmtAdditions =
  (tracker: CongruenceTickTracker) =>
  (
    ctx: DiagramContent,
    frame: string,
    mode: SVGModes,
    stmt?: Stmt,
    options?: { isRightAngleEquality?: boolean },
  ) => {
    const getNumTicks = (
      trackerMap: Map<string, number>,
      stmt: Stmt,
      type: "s" | "a",
    ) => {
      const stmtStr = stmt.arguments[0].v;
      const label =
        stmtStr === "ref_seg"
          ? "con_seg"
          : stmtStr === "ref_ang"
            ? "con_ang"
            : stmtStr;
      return trackerMap.get(
        type === "s" ? canonSeg(ctx, label) : canonAng(ctx, label),
      );
    };
    if (!stmt) return;
    if (
      (stmt.function === "con_seg" || stmt.function === "ref_seg") &&
      stmt.arguments.length === 2
    ) {
      const numTicks = getNumTicks(tracker.segTickByObj, stmt, "s");
      EqualSegments.additions(
        { ctx, frame, mode },
        [stmt.arguments[0].v, stmt.arguments[1].v],
        numTicks,
      );
      return;
    }
    if (
      (stmt.function === "con_ang" || stmt.function === "ref_ang") &&
      stmt.arguments.length === 2
    ) {
      if (options?.isRightAngleEquality) {
        EqualRightAngles.additions({ ctx, frame, mode }, [
          stmt.arguments[0].v,
          stmt.arguments[1].v,
        ]);
        return;
      }
      const numTicks = getNumTicks(tracker.angTickByObj, stmt, "a");
      EqualAngles.additions(
        { ctx, frame, mode },
        [stmt.arguments[0].v, stmt.arguments[1].v],
        numTicks,
      );
      return;
    }
    if (stmt.function === "con_tri" && stmt.arguments.length === 2) {
      CongruentTriangles.congruentLabel({ ctx, frame, mode }, [
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      ]);
      return;
    }
    if (stmt.function === "para" && stmt.arguments.length === 2) {
      const numTicks = getNumTicks(tracker.paraTickByObj, stmt, "s");
      ParallelLines.additions(
        { ctx, frame, mode },
        [stmt.arguments[0].v, stmt.arguments[1].v],
        numTicks,
      );
      return;
    }
    if (stmt.function === "right" && stmt.arguments.length === 1) {
      RightAngle.additions({ ctx, frame, mode }, stmt.arguments[0].v);
      return;
    }
    if (stmt.function === "con_right" && stmt.arguments.length === 2) {
      EqualRightAngles.additions({ ctx, frame, mode }, [
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      ]);
      return;
    }
    if (stmt.function === "midpt" && stmt.arguments.length === 2) {
      const segment = stmt.arguments[0].v;
      const point = stmt.arguments[1].v;
      Midpoint.additions({ ctx, frame, mode }, point, segment);
      return;
    }
    if (stmt.function === "perp" && stmt.arguments.length === 3) {
      const s1 = stmt.arguments[0].v;
      const s2 = stmt.arguments[1].v;
      Perpendicular.additions({ ctx, frame, mode }, s1, s2);
      return;
    }
    if (stmt.function === "ang_bisect" && stmt.arguments.length === 2) {
      AngleBisector.additions(
        { ctx, frame, mode },
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      );
      return;
    }
    if (stmt.function === "supplementary" && stmt.arguments.length === 2) {
      Supplementary.additions({ ctx, frame, mode }, [
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      ]);
      return;
    }
    if (stmt.function === "complementary" && stmt.arguments.length === 2) {
      Complementary.additions({ ctx, frame, mode }, [
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      ]);
      return;
    }
    if (stmt.function === "linear_pair" && stmt.arguments.length === 2) {
      LinearPair.additions({ ctx, frame, mode }, [
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      ]);
      return;
    }
    if (stmt.function === "sim_seg" && stmt.arguments.length === 2) {
      const numTicks = getNumTicks(tracker.simSegTickByObj, stmt, "s");
      SimilarSegments.additions(
        { ctx, frame, mode },
        [stmt.arguments[0].v, stmt.arguments[1].v],
        numTicks,
      );
      return;
    }
    if (stmt.function === "sim_tri" && stmt.arguments.length === 2) {
      SimilarTriangles.similarLabel({ ctx, frame, mode }, [
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      ]);
      return;
    }
    if (stmt.function === "seg_bisect" && stmt.arguments.length === 3) {
      SegmentBisector.additions(
        { ctx, frame, mode },
        [stmt.arguments[0].v, stmt.arguments[1].v],
        stmt.arguments[2].v,
      );
      return;
    }
    if (stmt.function === "perp_bisector" && stmt.arguments.length === 3) {
      PerpBisector.additions(
        { ctx, frame, mode },
        [stmt.arguments[0].v, stmt.arguments[1].v],
        stmt.arguments[2].v,
      );
      return;
    }
    if (stmt.function === "inscribed_angle" && stmt.arguments.length === 2) {
      InscribedAngle.additions(
        { ctx, frame, mode },
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      );
      return;
    }
    if (stmt.function === "tangent" && stmt.arguments.length === 3) {
      Tangent.additions(
        { ctx, frame, mode },
        stmt.arguments[2].v,
        stmt.arguments[1].v,
        stmt.arguments[0].v,
      );
      return;
    }
    if (
      (stmt.function === "chord" ||
        stmt.function === "diameter" ||
        stmt.function === "radius") &&
      stmt.arguments.length === 2
    ) {
      SegmentCircleClassification.additions(
        { ctx, frame, mode },
        stmt.arguments[1].v,
        stmt.arguments[0].v,
      );
      return;
    }
    if (
      (stmt.function === "isosceles" ||
        stmt.function === "equilateral" ||
        stmt.function === "equiangular") &&
      stmt.arguments.length === 1
    ) {
      TriangleClassification.additions(
        { ctx, frame, mode },
        stmt.arguments[0].v,
      );
      return;
    }
    if (
      (stmt.function === "rectangle" ||
        stmt.function === "parallelogram" ||
        stmt.function === "rhombus" ||
        stmt.function === "isos_trapezoid") &&
      stmt.arguments.length === 1
    ) {
      QuadClassification.additions({ ctx, frame, mode }, stmt.arguments[0].v);
      return;
    }
    if (
      stmt.function === "isos_trapezoid_premise" ||
      stmt.function === "kite_premise" ||
      (stmt.function === "trapezoid_premise" && stmt.arguments.length === 3)
    ) {
      QuadClassification.additions({ ctx, frame, mode }, stmt.arguments[0].v);
      return;
    }
  };

export const applyPremisesObjects = (
  ctx: DiagramContent,
  frame: string,
  mode: SVGModes,
) => {
  const base = ctx.getCtx();
  base.segments.forEach((s) => s.mode(frame, mode));
  base.angles.forEach((a) => a.mode(frame, mode));
  base.triangles.forEach((t) => t.mode(frame, mode));
  base.quads.forEach((q) => q.mode(frame, mode));
  base.circles.forEach((c) => c.mode(frame, mode));
};
