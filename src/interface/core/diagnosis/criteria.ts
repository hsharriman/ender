/**
 * What a rejected triangle criterion was missing.
 *
 * A criterion is a template of three facts about two labelled triangles
 * (`sas_schema` and its siblings in `rocq/Ghost/Checker.v`).  When a
 * criterion step is rejected, every criterion is laid over every vertex
 * correspondence the conclusion allows, and each fact the template then
 * requires is graded against what is established before the step: cited in
 * its slot, known but cited elsewhere or not at all, one step away, or
 * unknown.  The readings with the best grades say which part was missing.
 *
 * This is interface advice, not checking.  Every judgement it makes comes
 * from the kernel through a `CheckerSession`: whether a fact satisfies a slot
 * is `dependency_matches`, and "one step away" names a step `rule_valid`
 * accepts, citing only steps accepted before this one.  The templates below
 * are copied from the kernel's; one that drifted could only give worse
 * advice, never change a verdict.
 */
import { REASONS_DEFS } from "checker/grammar/defs/reasons.defs";
import {
  VerifiedCheckReport,
  VerifiedStepReport,
} from "checker/verified/presentationTypes";
import { CheckerSession } from "checker/verified/session";

/** One part a criterion reading requires, graded against what is known. */
export type CriterionPart = {
  index: number;
  requires: string;
  status: "cited" | "known" | "derivable" | "unknown";
  /** The step that states it, when cited or known. */
  ref?: string;
  /** The one step that would state it, when derivable. */
  by?: string;
  statement?: string;
  /** What the step cited in this slot instead. */
  cited?: string;
};

/** A criterion laid over one vertex correspondence of the two triangles. */
export type CriterionReading = {
  reason: string;
  tri1: string;
  tri2: string;
  parts: CriterionPart[];
};

/** The best readings of a rejected criterion step, and the reason it named. */
export type StepReadings = CriterionReading[] & { ownReason: string };

type Triangle = [string, string, string];

const CRITERIA = ["sas", "sss", "asa", "aas", "rhl"];

const triangle = (name: string): Triangle | undefined => {
  const m = name.match(/^t_([A-Z])([A-Z])([A-Z])$/);
  return m ? [m[1], m[2], m[3]] : undefined;
};
const triText = (t: Triangle) => `t_${t.join("")}`;
const rotate = ([a, b, c]: Triangle): Triangle => [b, c, a];
const reverse = ([a, b, c]: Triangle): Triangle => [c, b, a];

const sideAB = (t: Triangle) => t[0] + t[1];
const sideBC = (t: Triangle) => t[1] + t[2];
const sideCA = (t: Triangle) => t[2] + t[0];
const angleA = (t: Triangle) => `a_${t[1]}${t[0]}${t[2]}`;
const angleB = (t: Triangle) => `a_${t[0]}${t[1]}${t[2]}`;
const angleC = (t: Triangle) => `a_${t[0]}${t[2]}${t[1]}`;

const conSeg = (f: (t: Triangle) => string) => (t: Triangle, u: Triangle) =>
  `con_seg(${f(t)},${f(u)})`;
const conAng = (f: (t: Triangle) => string) => (t: Triangle, u: Triangle) =>
  `con_ang(${f(t)},${f(u)})`;
const conRight = (f: (t: Triangle) => string) => (t: Triangle, u: Triangle) =>
  `con_right(${f(t)},${f(u)})`;

type Template = Array<(t: Triangle, u: Triangle) => string>;

/** Each criterion's templates, slot by slot, as `Checker.v` spells them. */
const TEMPLATES: Record<string, Template[]> = {
  sas: [[conSeg(sideAB), conAng(angleA), conSeg(sideCA)]],
  sss: [[conSeg(sideAB), conSeg(sideBC), conSeg(sideCA)]],
  asa: [[conAng(angleA), conSeg(sideAB), conAng(angleB)]],
  aas: [
    [conAng(angleC), conAng(angleB), conSeg(sideAB)],
    [conAng(angleB), conAng(angleC), conSeg(sideAB)],
  ],
  rhl: [
    [conRight(angleB), conSeg(sideCA), conSeg(sideBC)],
    [conRight(angleB), conSeg(sideBC), conSeg(sideCA)],
  ],
};

/** The relabelings the kernel's `six_correspondences` searches. */
const jointRelabelings = (
  t: Triangle,
  u: Triangle,
): Array<[Triangle, Triangle]> => {
  const turns = (a: Triangle, b: Triangle): Array<[Triangle, Triangle]> => [
    [a, b],
    [rotate(a), rotate(b)],
    [rotate(rotate(a)), rotate(rotate(b))],
  ];
  return [...turns(t, u), ...turns(reverse(t), reverse(u))];
};

const orderings = ([a, b, c]: Triangle): Triangle[] => [
  [a, b, c],
  [a, c, b],
  [b, a, c],
  [b, c, a],
  [c, a, b],
  [c, b, a],
];

/** The pairings a conclusion allows: an unordered `con_tri` allows any. */
const pairings = (conclusion: string): Array<[Triangle, Triangle]> => {
  const m = conclusion.match(/^(con_tri|con_tri_ordered)\((t_\w+),(t_\w+)\)$/);
  const t = m && triangle(m[2]);
  const u = m && triangle(m[3]);
  if (!m || !t || !u) return [];
  return m[1] === "con_tri_ordered"
    ? jointRelabelings(t, u)
    : orderings(u).flatMap((u2) => jointRelabelings(t, u2));
};

const COST = { cited: 0, known: 10, derivable: 100, unknown: 1000 };

const readingCost = (own: string, r: CriterionReading): number =>
  r.parts.reduce((sum, p) => sum + COST[p.status], r.reason === own ? 0 : 1);

/** A statement's call name and arguments, as the report spells it. */
const call = (text: string): [string, string[]] | undefined => {
  const m = text.match(/^([a-z_]+)\((.*)\)$/);
  return m ? [m[1], m[2].split(",").map((a) => a.trim())] : undefined;
};

/** The same segment or angle, in either direction. */
const sameObject = (a: string, b: string): boolean => {
  const flip = (x: string) =>
    x.startsWith("a_")
      ? `a_${x.slice(2).split("").reverse().join("")}`
      : x.split("").reverse().join("");
  return a === b || a === flip(b);
};

/**
 * The spellings under which a step could state `goal`: either order of a
 * symmetric pair, and the reflexive form when both sides are one object.
 */
const spellings = (goal: string): string[] => {
  const parsed = call(goal);
  if (!parsed) return [goal];
  const [name, args] = parsed;
  if (args.length !== 2) return [goal];
  const [a, b] = args;
  const swapped = `${name}(${b},${a})`;
  const reflexive =
    (name === "con_seg" || name === "con_ang") && sameObject(a, b)
      ? [`${name.replace("con_", "ref_")}(${a},${a})`]
      : [];
  return [goal, swapped, ...reflexive];
};

/** Reasons citing one or two steps, and the statements each may conclude. */
const CITING_REASONS = Object.values(REASONS_DEFS)
  .map((def) => ({
    name: def.name,
    arity: def.dependencies.length,
    concludes: String(def.conclusion)
      .split(",")
      .map((c) => c.trim()),
  }))
  .filter(
    (r) =>
      r.arity >= 1 &&
      r.arity <= 2 &&
      !["given", "reflex", "vert_ang"].includes(r.name),
  );

/** Every tuple of `length` items drawn from `items`, repeats allowed. */
const tuples = (items: number[], length: number): number[][] =>
  length === 0
    ? [[]]
    : tuples(items, length - 1).flatMap((rest) =>
        items.map((i) => [...rest, i]),
      );

/**
 * One step, citing only `earlier`, that the kernel accepts at `position` and
 * whose conclusion satisfies `goal`.
 */
const oneStepWitness = (
  session: CheckerSession,
  satisfies: (expected: string, actual: string) => boolean,
  report: VerifiedCheckReport,
  position: number,
  earlier: number[],
  goal: string,
): { by: string; statement: string } | undefined => {
  for (const given of report.presentation?.givens ?? []) {
    const stated = `${given.call.name}(${given.call.arguments.join(",")})`;
    const by = `given(${given.label})`;
    if (satisfies(goal, stated) && session.accepts(position, by, stated))
      return { by, statement: stated };
  }
  const forms = spellings(goal);
  const attempt = (by: string, concludes?: string[]) => {
    for (const form of forms) {
      if (concludes && !concludes.includes(call(form)?.[0] ?? "")) continue;
      if (session.accepts(position, by, form) && satisfies(goal, form))
        return { by, statement: form };
    }
    return undefined;
  };
  for (const by of ["reflex()", "vert_ang()"]) {
    const found = attempt(by);
    if (found) return found;
  }
  for (const reason of CITING_REASONS) {
    if (!forms.some((f) => reason.concludes.includes(call(f)?.[0] ?? "")))
      continue;
    for (const args of tuples(earlier, reason.arity)) {
      const found = attempt(
        `${reason.name}(${args.join(", ")})`,
        reason.concludes,
      );
      if (found) return found;
    }
  }
  return undefined;
};

const sameReading = (a: CriterionReading, b: CriterionReading) =>
  a.reason === b.reason &&
  a.parts.length === b.parts.length &&
  a.parts.every((p, i) => p.requires === b.parts[i].requires);

/** The best readings of one rejected criterion step, at most three. */
const diagnoseStep = (
  session: CheckerSession,
  satisfies: (expected: string, actual: string) => boolean,
  report: VerifiedCheckReport,
  step: VerifiedStepReport,
): CriterionReading[] => {
  const own = step.reason ?? "";
  const cited = step.dependencies;
  const conclusionOf = new Map(
    report.steps.map((s) => [s.number, s.conclusion] as const),
  );
  const earlier = report.steps
    .filter((s) => s.number < step.number && s.status === "accepted")
    .map((s) => s.number);
  const holds = (req: string, n: number) => {
    const stated = conclusionOf.get(n);
    return stated ? satisfies(req, stated) : false;
  };
  const witnesses = new Map<string, ReturnType<typeof oneStepWitness>>();
  const witness = (req: string) => {
    if (!witnesses.has(req))
      witnesses.set(
        req,
        oneStepWitness(session, satisfies, report, step.number, earlier, req),
      );
    return witnesses.get(req);
  };
  const grade = (slot: number, req: string): CriterionPart => {
    const inSlot = cited[slot];
    const base = { index: slot, requires: req };
    const instead = inSlot !== undefined ? { cited: String(inSlot) } : {};
    if (inSlot !== undefined && earlier.includes(inSlot) && holds(req, inSlot))
      return { ...base, status: "cited", ref: String(inSlot) };
    const known = earlier.find((n) => holds(req, n));
    if (known !== undefined)
      return { ...base, status: "known", ref: String(known), ...instead };
    return { ...base, status: "unknown", ...instead };
  };

  const graded: CriterionReading[] = CRITERIA.flatMap((reason) =>
    pairings(step.conclusion ?? "").flatMap(([t, u]) =>
      TEMPLATES[reason].map((template) => ({
        reason,
        tri1: triText(t),
        tri2: triText(u),
        parts: template.map((part, slot) => grade(slot, part(t, u))),
      })),
    ),
  );
  // Search for one-step derivations last, and only for facts still open.
  const readings = graded.map((r) => ({
    ...r,
    parts: r.parts.map((p): CriterionPart => {
      if (p.status !== "unknown") return p;
      const found = witness(p.requires);
      return found ? { ...p, status: "derivable", ...found } : p;
    }),
  }));
  const best = Math.min(...readings.map((r) => readingCost(own, r)));
  return readings
    .filter((r) => readingCost(own, r) === best)
    .reduce<CriterionReading[]>(
      (kept, r) => (kept.some((k) => sameReading(k, r)) ? kept : [...kept, r]),
      [],
    )
    .slice(0, 3);
};

/** Whether `satisfies` should be asked through a cache; it is called often. */
export const cachedSatisfies = (session: CheckerSession) => {
  const cache = new Map<string, boolean>();
  return (expected: string, actual: string) => {
    const key = `${expected}|${actual}`;
    if (!cache.has(key)) cache.set(key, session.satisfies(expected, actual));
    return cache.get(key)!;
  };
};

/** Steps whose triangles the checker says are not declared. */
const undeclaredSteps = (report: VerifiedCheckReport): Set<number> =>
  new Set(
    [...report.issues, ...report.errors]
      .filter(
        (issue) =>
          issue.code === "reason_application_error" &&
          (issue.details as { note?: string } | undefined)?.note ===
            "triangle_not_declared",
      )
      .flatMap(
        (issue) =>
          (issue.details as { steps?: string[] } | undefined)?.steps ?? [],
      )
      .map((s) => parseInt(s, 10)),
  );

/**
 * The best readings of one rejected triangle-criterion step, or undefined
 * when the step is not one or its triangles are not declared.
 */
export const criterionReadings = (
  session: CheckerSession,
  satisfies: (expected: string, actual: string) => boolean,
  report: VerifiedCheckReport,
  step: VerifiedStepReport,
): StepReadings | undefined => {
  if (
    step.status !== "rejected" ||
    !CRITERIA.includes(step.reason ?? "") ||
    step.dependencies.length !== 3 ||
    undeclaredSteps(report).has(step.number)
  )
    return undefined;
  const readings = diagnoseStep(session, satisfies, report, step);
  return readings.length
    ? Object.assign(readings, { ownReason: step.reason ?? "" })
    : undefined;
};

/** Per step number, the best readings of each rejected criterion step. */
export const diagnoseCriteria = (
  session: CheckerSession,
  report: VerifiedCheckReport,
): Map<string, StepReadings> => {
  const satisfies = cachedSatisfies(session);
  const diagnoses = new Map<string, StepReadings>();
  for (const step of report.steps) {
    const readings = criterionReadings(session, satisfies, report, step);
    if (readings) diagnoses.set(String(step.number), readings);
  }
  return diagnoses;
};
