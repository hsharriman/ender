import { Stmt } from "checker/types/checkerTypes";
import { ProofContent } from "geometry-object";
import React from "react";
import { AngleBisector } from "../reasons/AngleBisector";
import { Complementary } from "../reasons/Complementary";
import { EqualAngles } from "../reasons/EqualAngles";
import { InscribedAngle } from "../reasons/InscribedAngle";
import { LinearPair } from "../reasons/LinearPair";
import { PerpBisector } from "../reasons/PerpBisector";
import { QuadClassification } from "../reasons/QuadClassification";
import { SegmentBisector } from "../reasons/SegmentBisector";
import { SegmentCircleClassification } from "../reasons/SegmentCircleClassification";
import { SimilarSegments } from "../reasons/SimilarSegments";
import { SimilarTriangles } from "../reasons/SimilarTriangles";
import { Tangent } from "../reasons/Tangent";
import { TriangleClassification } from "../reasons/TriangleClassification";
import { EqualRightAngles } from "../reasons/EqualRightAngles";
import { EqualSegments } from "../reasons/EqualSegments";
import { EqualTriangles } from "../reasons/EqualTriangles";
import { Midpoint } from "../reasons/Midpoint";
import { ParallelLines } from "../reasons/ParallelLines";
import { Perpendicular } from "../reasons/Perpendicular";
import { RightAngle } from "../reasons/RightAngle";
import { Supplementary } from "../reasons/Supplementary";

export const stmtToText =
  (stmt?: Stmt, ctx?: ProofContent) => (isActive: boolean) => {
  if (!stmt) return React.createElement("span", null, "");
  const args = stmt.arguments.map((a) => a.v);
  if (stmt.function === "con_seg" && args.length === 2) {
    return EqualSegments.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "con_ang" && args.length === 2) {
    return EqualAngles.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "con_tri" && args.length === 2) {
    return EqualTriangles.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "para" && args.length === 2) {
    return ParallelLines.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "right" && args.length === 1) {
    return RightAngle.text(args[0])(isActive);
  }
  if (stmt.function === "con_right" && args.length === 2) {
    return EqualRightAngles.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "midpt" && args.length === 2) {
    return Midpoint.text(args[1], args[0])(isActive);
  }
  if (stmt.function === "perp" && args.length === 3) {
    return Perpendicular.text(args[0], args[1])(isActive);
  }
  if (stmt.function === "ang_bisect" && args.length === 2) {
    return AngleBisector.text(args[0], args[1])(isActive);
  }
  if (stmt.function === "supplementary" && args.length === 2) {
    return Supplementary.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "complementary" && args.length === 2) {
    return Complementary.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "sim_seg" && args.length === 2) {
    return SimilarSegments.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "sim_tri" && args.length === 2) {
    return SimilarTriangles.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "linear_pair" && args.length === 2) {
    return LinearPair.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "seg_bisect" && args.length === 3) {
    return SegmentBisector.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "perp_bisector" && args.length === 3) {
    return PerpBisector.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "inscribed_angle" && args.length === 2) {
    return InscribedAngle.text(args[0], args[1])(isActive);
  }
  if (stmt.function === "tangent" && args.length === 3) {
    const centerLabel = ctx?.getCircle(args[0])?.center.label ?? args[0];
    return Tangent.text(args[1], centerLabel, args[2])(isActive);
  }
  if (
    (stmt.function === "chord" || stmt.function === "diameter") &&
    args.length === 2
  ) {
    const centerLabel = ctx?.getCircle(args[0])?.center.label ?? args[0];
    return SegmentCircleClassification.text(args[1], centerLabel, stmt.function)(
      isActive,
    );
  }
  if (stmt.function === "radius" && args.length === 2) {
    const centerLabel = ctx?.getCircle(args[0])?.center.label ?? args[0];
    const segLabel = centerLabel + args[1];
    return SegmentCircleClassification.text(segLabel, centerLabel, "radius")(
      isActive,
    );
  }
  if (
    (stmt.function === "isosceles" ||
      stmt.function === "equilateral" ||
      stmt.function === "equiangular") &&
    args.length === 1
  ) {
    return TriangleClassification.text(args[0], stmt.function)(isActive);
  }
  if (
    (stmt.function === "rectangle" ||
      stmt.function === "parallelogram" ||
      stmt.function === "rhombus" ||
      stmt.function === "isos_trapezoid") &&
    args.length === 1
  ) {
    return QuadClassification.text(args[0], stmt.function)(isActive);
  }
  if (stmt.function === "isos_trapezoid_premise" && args.length === 3) {
    return QuadClassification.text(args[0], "isos_trapezoid")(isActive);
  }
  return React.createElement(
    "span",
    null,
    `${stmt.function}(${args.join(", ")})`,
  );
};

export const stmtListToText =
  (stmts: Array<Stmt | undefined>, ctx?: ProofContent) =>
  (isActive: boolean) =>
    React.createElement(
      "span",
      null,
      ...stmts.flatMap((stmt, i) => {
        const parts: React.ReactNode[] = [];
        if (i > 0) parts.push("; ");
        parts.push(
          React.createElement(
            React.Fragment,
            { key: `stmt-${i}` },
            stmtToText(stmt, ctx)(isActive),
          ),
        );
        return parts;
      }),
    );
