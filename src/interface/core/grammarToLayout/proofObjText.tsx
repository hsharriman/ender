import { Stmt } from "checker/types/checkerTypes";
import React from "react";
import { Complementary } from "../reasons/Complementary";
import { EqualAngles } from "../reasons/EqualAngles";
import { EqualRightAngles } from "../reasons/EqualRightAngles";
import { EqualSegments } from "../reasons/EqualSegments";
import { EqualTriangles } from "../reasons/EqualTriangles";
import { Midpoint } from "../reasons/Midpoint";
import { ParallelLines } from "../reasons/ParallelLines";
import { Perpendicular } from "../reasons/Perpendicular";
import { RightAngle } from "../reasons/RightAngle";
import { Supplementary } from "../reasons/Supplementary";

export const stmtToText = (stmt?: Stmt) => (isActive: boolean) => {
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
  if (stmt.function === "perp" && args.length === 2) {
    return Perpendicular.text(args[0], args[1])(isActive);
  }
  if (stmt.function === "supplementary" && args.length === 2) {
    return Supplementary.text([args[0], args[1]])(isActive);
  }
  if (stmt.function === "complementary" && args.length === 2) {
    return Complementary.text([args[0], args[1]])(isActive);
  }
  return React.createElement(
    "span",
    null,
    `${stmt.function}(${args.join(", ")})`,
  );
};

export const stmtListToText =
  (stmts: Array<Stmt | undefined>) => (isActive: boolean) =>
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
            stmtToText(stmt)(isActive),
          ),
        );
        return parts;
      }),
    );
