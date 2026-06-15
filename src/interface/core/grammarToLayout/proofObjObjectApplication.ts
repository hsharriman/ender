import { Stmt } from "checker/types/checkerTypes";
import { DiagramContent } from "../builder/DiagramContent";
import { CongruentTriangles } from "../reasons/CongruentTriangles";
import { EqualAngles } from "../reasons/EqualAngles";
import { EqualRightAngles } from "../reasons/EqualRightAngles";
import { EqualSegments } from "../reasons/EqualSegments";
import { Midpoint } from "../reasons/Midpoint";
import { ParallelLines } from "../reasons/ParallelLines";
import { Perpendicular } from "../reasons/Perpendicular";
import { RightAngle } from "../reasons/RightAngle";
import { SVGModes } from "../types/diagramTypes";

const normalizeCongruentPairKey = (a: string, b: string): string =>
  [a, b].sort().join("|");

export type CongruenceTickTracker = {
  segTickByKey: Map<string, number>;
  angTickByKey: Map<string, number>;
};

export const buildCongruenceTickTracker = (
  stmts: Array<Stmt | undefined>,
): CongruenceTickTracker => {
  const segTickByKey = new Map<string, number>();
  const angTickByKey = new Map<string, number>();
  let nextSegTick = 1;
  let nextAngTick = 1;

  stmts.forEach((stmt) => {
    if (!stmt || stmt.arguments.length !== 2) return;
    if (stmt.function === "con_seg") {
      const key = normalizeCongruentPairKey(
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      );
      if (!segTickByKey.has(key)) segTickByKey.set(key, nextSegTick++);
      return;
    }
    if (stmt.function === "con_ang") {
      const key = normalizeCongruentPairKey(
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      );
      if (!angTickByKey.has(key)) angTickByKey.set(key, nextAngTick++);
    }
  });

  return { segTickByKey, angTickByKey };
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
    if (!stmt) return;
    if (stmt.function === "con_seg" && stmt.arguments.length === 2) {
      const key = normalizeCongruentPairKey(
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      );
      const numTicks = tracker.segTickByKey.get(key) ?? 1;
      EqualSegments.additions(
        { ctx, frame, mode },
        [stmt.arguments[0].v, stmt.arguments[1].v],
        numTicks,
      );
      return;
    }
    if (stmt.function === "con_ang" && stmt.arguments.length === 2) {
      if (options?.isRightAngleEquality) {
        EqualRightAngles.additions({ ctx, frame, mode }, [
          stmt.arguments[0].v,
          stmt.arguments[1].v,
        ]);
        return;
      }
      const key = normalizeCongruentPairKey(
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      );
      const numTicks = tracker.angTickByKey.get(key) ?? 1;
      EqualAngles.additions(
        { ctx, frame, mode },
        [stmt.arguments[0].v, stmt.arguments[1].v],
        numTicks,
      );
      return;
    }
    if (stmt.function === "con_tri" && stmt.arguments.length === 2) {
      CongruentTriangles.congruentLabel(
        { ctx, frame },
        [stmt.arguments[0].v, stmt.arguments[1].v],
        mode,
      );
      return;
    }
    if (stmt.function === "para" && stmt.arguments.length === 2) {
      ParallelLines.additions({ ctx, frame, mode }, [
        stmt.arguments[0].v,
        stmt.arguments[1].v,
      ]);
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
    if (stmt.function === "perp" && stmt.arguments.length === 2) {
      const s1 = stmt.arguments[0].v;
      const s2 = stmt.arguments[1].v;
      Perpendicular.additions({ ctx, frame, mode }, s1, s2);
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
