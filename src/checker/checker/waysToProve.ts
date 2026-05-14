import { REASONS_DEFS } from "checker/grammar/defs/reasons.defs";
import {
  ProofStep,
  WaysToProveCandidate,
  WaysToProveSummary,
} from "checker/types/checkerTypes";
import { getGeometricObject } from "checker/utils/utils";
import {
  Angle,
  Obj,
  ParseObj,
  ProofContent,
  Quadrilateral,
  Segment,
  Triangle,
} from "geometry-object";

type DepSlot = { i: number; dep: string; type: ParseObj["type"] };

const depToObjType = (dep: string): ParseObj["type"] | undefined => {
  if (dep.includes("seg")) return Obj.Segment;
  if (dep.includes("ang")) return Obj.Angle;
  if (dep.includes("tri")) return Obj.Triangle;
  if (dep.includes("quad")) return Obj.Quadrilateral;
  if (dep.includes("point") || dep.includes("midpt")) return Obj.Point;
  return undefined;
};

const po = (type: ParseObj["type"], v: string): ParseObj => ({ type, v });
const rDef = REASONS_DEFS as Record<
  string,
  { dependencies: readonly (string | { name: string })[] }
>;

const ex = (arg: ParseObj, ctx: ProofContent): ParseObj[] => {
  const g = getGeometricObject(arg, ctx);
  if (g instanceof Triangle) {
    return [
      ...g.s.map((s) => po(Obj.Segment, s.label)),
      ...g.a.map((a) => po(Obj.Angle, a.label)),
    ];
  }
  if (g instanceof Quadrilateral) {
    return [
      ...g.s.map((s) => po(Obj.Segment, s.label)),
      ...g.a.map((a) => po(Obj.Angle, a.label)),
    ];
  }
  if (g instanceof Segment) return [po(Obj.Segment, g.label)];
  if (g instanceof Angle) return [po(Obj.Angle, g.label)];
  return [arg];
};

const uniqObjs = (objs: ParseObj[]): ParseObj[] => {
  const m = new Map<string, ParseObj>();
  objs.forEach((o) => m.set(`${o.type}:${o.v}`, o));
  return [...m.values()];
};

const mkSlots = (deps: string[]): DepSlot[] =>
  deps
    .map((dep, i) => ({ i, dep, type: depToObjType(dep) }))
    .filter((s): s is DepSlot => Boolean(s.type));

const byType = (objs: ParseObj[], type: ParseObj["type"]) =>
  objs.filter((o) => o.type === type);

const sig = (xs: ParseObj[]): string =>
  xs
    .map((x) => `${x.type}:${x.v}`)
    .sort((a, b) => a.localeCompare(b))
    .join("|");

const enumCombos = (slots: DepSlot[], pool: ParseObj[]): ParseObj[][] => {
  const out: ParseObj[][] = [];
  const seen = new Set<string>();
  const used = new Set<string>();

  const go = (i: number, acc: ParseObj[]) => {
    if (i >= slots.length) {
      const k = sig(acc);
      if (!seen.has(k)) {
        seen.add(k);
        out.push([...acc]);
      }
      return;
    }
    const cands = byType(pool, slots[i].type);
    for (const c of cands) {
      const k = `${c.type}:${c.v}`;
      if (used.has(k)) continue;
      used.add(k);
      acc.push(c);
      go(i + 1, acc);
      acc.pop();
      used.delete(k);
    }
  };

  go(0, []);
  return out;
};

const vr = (o: ParseObj): string[] => [...new Set(o.v.split(""))];

const cand = (
  step: ProofStep,
  slots: DepSlot[],
  depObjs: ParseObj[],
): WaysToProveCandidate => {
  const reasonFn = step.reason?.function ?? "";
  return {
    reasonFunction: reasonFn,
    templateId: reasonFn,
    completion: 1,
    dependencyRefs: depObjs.map((o) => o.v),
    diagramRefs: [],
    statementRefs: depObjs.map((o) => o.v),
    contributors: depObjs.map((o) => `${o.type}(${o.v})`),
    slots: slots.map((s, i) => ({
      slotId: `dep_${s.i}`,
      expected: s.dep,
      state: "matched",
      sourceRef: depObjs[i]?.v,
      visualRef: depObjs[i]?.v,
      visualRefs: depObjs[i] ? vr(depObjs[i]) : [],
    })),
  };
};

// Build mini-figure candidates directly from statement geometry.
export const waysToProve = (
  step: ProofStep,
  ctx: ProofContent,
): WaysToProveSummary | undefined => {
  if (!step.reason || !step.statement || step.reason.function === "given")
    return undefined;
  const reason = rDef[step.reason.function];
  if (!reason?.dependencies?.length) return undefined;

  const slots = mkSlots(
    reason.dependencies.map((d: string | { name: string }) =>
      typeof d === "string" ? d : d.name,
    ),
  );
  if (!slots.length) return undefined;

  // Gather candidate geometric parts from the statement args (tri/quad -> sides/angles).
  const pool = uniqObjs(step.statement.arguments.flatMap((a) => ex(a, ctx)));
  const cs = enumCombos(slots, pool).map((depObjs) => cand(step, slots, depObjs));
  if (!cs.length) return undefined;

  return {
    reasonFunction: step.reason.function,
    totalSlots: slots.length,
    matchedSlots: slots.length,
    candidates: cs,
  };
};
