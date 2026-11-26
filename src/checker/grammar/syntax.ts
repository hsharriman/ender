/**
 * Conversions between proof text and the interface's objects, statements,
 * and reasons.  The checker parses proofs itself; these only read text it has
 * already reported (statements, templates) or text being edited, and write
 * statements and reasons back as text to ask it about.
 */
import { Obj, ParseObj } from "../../geometry-object";
import { Reason, Stmt } from "../types/checkerTypes";

/** How each kind of object is named: a prefix, then a number of points. */
const OBJECT_NAMES: Array<{
  type: ParseObj["type"];
  prefix: string;
  points: number;
}> = [
  { type: Obj.Point, prefix: "", points: 1 },
  { type: Obj.Segment, prefix: "", points: 2 },
  { type: Obj.Angle, prefix: "a_", points: 3 },
  { type: Obj.Triangle, prefix: "t_", points: 3 },
  { type: Obj.Quadrilateral, prefix: "q_", points: 4 },
  { type: Obj.Circle, prefix: "c_", points: 2 },
  { type: Obj.Arc, prefix: "r_", points: 3 },
];

/**
 * A template argument its matcher ignores, one `*` per point: `*` for a
 * point, `**` for a segment.
 */
const FREE = /^\*+$/;

/** The object a name such as `a_ABC` or `AB` names. */
export const parseObject = (raw: string): ParseObj => {
  const named = OBJECT_NAMES.find(
    ({ prefix, points }) =>
      raw.startsWith(prefix) &&
      new RegExp(`^[A-Z]{${points}}$`).test(raw.slice(prefix.length)),
  );
  if (named) return { type: named.type, v: raw.slice(named.prefix.length) };
  // A nested call is vocabulary the renderer has no object for; it passes
  // through as text because the presentation layer never determines
  // acceptance.  So does a template's free argument.  Legacy non-call
  // tokens (BR_OB-style arcs) still throw: reproducing their lossy old
  // rendering is deliberately refused.
  if (raw.includes("(") || FREE.test(raw)) return { type: Obj.Text, v: raw };
  throw new Error(`Unsupported presentation object: ${raw}`);
};

/** The name an object is written with: `parseObject` read backwards. */
export const objectName = (object: ParseObj): string =>
  (OBJECT_NAMES.find((n) => n.type === object.type)?.prefix ?? "") + object.v;

/** One spelling per object: a segment or angle read backwards is the same. */
export const canonicalObject = (object: ParseObj): string => {
  if (object.type !== Obj.Segment && object.type !== Obj.Angle)
    return `${object.type}:${object.v}`;
  const backwards = [...object.v].reverse().join("");
  return `${object.type}:${[object.v, backwards].sort()[0]}`;
};

/** Whether two objects are the same, such as `AB` and `BA`. */
export const sameObject = (a: ParseObj, b: ParseObj): boolean =>
  canonicalObject(a) === canonicalObject(b);

/** Whether a statement argument is one its template's matcher ignores. */
export const isFree = (object: ParseObj): boolean =>
  object.type === Obj.Text && FREE.test(object.v);

/** A statement as the checker's report spells it, e.g. `con_seg(AB,CD)`. */
export const parseStatementText = (text: string): Stmt | undefined => {
  const m = text.match(/^\s*([a-z_]+)\s*\((.*)\)\s*$/);
  if (!m) return undefined;
  const inner = m[2].trim();
  try {
    return {
      function: m[1],
      arguments: inner
        ? inner.split(",").map((arg) => parseObject(arg.trim()))
        : [],
    };
  } catch {
    return undefined;
  }
};

/** A statement spelled as the checker reports it: `con_seg(AB,CD)`. */
export const stmtText = (stmt: Stmt): string =>
  `${stmt.function}(${stmt.arguments.map(objectName).join(",")})`;

/** A reason written as in a proof file: `sas(1, 2, 3)`. */
export const reasonText = (reason: Reason): string =>
  `${reason.function}(${reason.arguments.join(", ")})`;

/** A step line's number, `[01]`, at its start. */
export const STEP_NUMBER = /^\s*\[(\d+)\]/;
