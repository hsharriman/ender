/**
 * What a rejected step was missing, read through the templates of its reason.
 *
 * The kernel gives many reasons as templates (`reason_needs` in
 * `rocq/Ghost/Checker.v`): for a conclusion, the statements each cited step
 * must match.  The session hands out the templates of the step's reason and
 * of every other reason that concludes the same kind of statement.  Each
 * needed statement is graded against what is established before the step:
 * cited in its slot, known but cited elsewhere or not at all, one step away,
 * or unknown.  The readings with the best grades say which part was missing,
 * and whether another reason fits better.
 *
 * This is interface advice, not checking.  Every judgement it makes comes
 * from the kernel through a `CheckerSession`: the templates are the ones
 * `rule_valid` checks, whether a fact fills a slot is the slot's own
 * matcher, "one step away" names a step `rule_valid` accepts, and a reading
 * whose every part is established is kept only when the kernel accepts the
 * step it describes.
 */
import { reasonDef, ReasonDef, REASONS } from "checker/grammar/catalog";
import {
  isFree,
  parseStatementText,
  reasonText,
  sameObject,
  stmtText,
} from "checker/grammar/syntax";
import {
  VerifiedCheckReport,
  VerifiedStepReport,
} from "checker/verified/presentationTypes";
import { stmtOf } from "checker/verified/presentationAdapter";
import { CheckerSession, TemplateSlot } from "checker/verified/session";

/** Whether a fact matches a template statement under a named matcher. */
export type Matches = (
  matcher: string,
  expected: string,
  actual: string,
) => boolean;

/** One part a reading requires, graded against what is known. */
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

/** One template of one reason, graded. */
export type CriterionReading = {
  reason: string;
  parts: CriterionPart[];
};

/** The best readings of a rejected step, and the reason it named. */
export type StepReadings = CriterionReading[] & { ownReason: string };

/** A statement's name, or "" if it does not parse. */
const nameOf = (statement: string): string =>
  parseStatementText(statement)?.function ?? "";

const COST = { cited: 0, known: 10, derivable: 100, unknown: 1000 };

const readingCost = (own: string, r: CriterionReading): number =>
  r.parts.reduce((sum, p) => sum + COST[p.status], r.reason === own ? 0 : 1);

/** Whether a needed statement still has an argument the figure left open. */
export const isOpen = (requires: string) =>
  parseStatementText(requires)?.arguments.some(isFree) ?? false;

/**
 * The spellings under which a step could state `goal`: either order of a
 * symmetric pair, and the reflexive form when both sides are one object.
 */
const spellings = (goal: string): string[] => {
  const stmt = parseStatementText(goal);
  if (!stmt || stmt.arguments.length !== 2) return [goal];
  const [a, b] = stmt.arguments;
  const swapped = stmtText({ ...stmt, arguments: [b, a] });
  const name = stmt.function;
  const reflexive =
    (name === "con_seg" || name === "con_ang") && sameObject(a, b)
      ? [
          stmtText({
            function: name.replace("con_", "ref_"),
            arguments: [a, a],
          }),
        ]
      : [];
  return [goal, swapped, ...reflexive];
};

/** Reasons citing one or two steps. */
const CITING_REASONS = REASONS.filter(
  (r) =>
    r.dependencies.length >= 1 &&
    r.dependencies.length <= 2 &&
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
  matches: Matches,
  report: VerifiedCheckReport,
  position: number,
  earlier: number[],
  goal: string,
): { by: string; statement: string } | undefined => {
  const satisfies = (expected: string, actual: string) =>
    matches("loose", expected, actual);
  for (const given of report.presentation?.givens ?? []) {
    const stated = stmtText(stmtOf(given.call));
    const by = `given(${given.label})`;
    if (satisfies(goal, stated) && session.accepts(position, by, stated))
      return { by, statement: stated };
  }
  const forms = spellings(goal);
  const attempt = (by: string, conclusions?: readonly string[]) => {
    for (const form of forms) {
      if (conclusions && !conclusions.includes(nameOf(form))) continue;
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
    if (!forms.some((f) => reason.conclusions.includes(nameOf(f)))) continue;
    for (const args of tuples(earlier, reason.dependencies.length)) {
      const found = attempt(
        `${reason.name}(${args.join(", ")})`,
        reason.conclusions,
      );
      if (found) return found;
    }
  }
  return undefined;
};

/** Statement names a fact of name `actual` can stand in for. */
const standsFor = (expected: string, actual: string) =>
  expected === actual ||
  (expected === "con_ang" && ["con_right", "ref_ang"].includes(actual)) ||
  (expected === "con_seg" && actual === "ref_seg") ||
  (expected === "ref_ang" && actual === "con_ang") ||
  (expected === "ref_seg" && actual === "con_seg") ||
  (expected === "parallelogram" && ["rectangle", "rhombus"].includes(actual));

/** `expected` with each argument its matcher ignores taken from `stated`. */
const withFree = (expected: string, stated: string): string => {
  const want = parseStatementText(expected);
  const have = parseStatementText(stated);
  if (!want || !have || want.function !== have.function) return expected;
  const free = want.arguments.some(isFree);
  if (want.arguments.length !== have.arguments.length || !free) return expected;
  return stmtText({
    ...want,
    arguments: want.arguments.map((a, i) =>
      isFree(a) ? have.arguments[i] : a,
    ),
  });
};

/** The needed statement `stated` supplies for a slot, if any. */
const fill =
  (matches: Matches) =>
  (slot: TemplateSlot, stated: string): string | undefined => {
    const statedName = nameOf(stated);
    for (const expected of slot.statements) {
      if (!standsFor(nameOf(expected), statedName)) continue;
      if (matches(slot.matcher, expected, stated))
        return withFree(expected, stated);
    }
    return undefined;
  };

/** A reason written with placeholder citations, for asking its templates. */
const placeholder = (name: string, arity: number) =>
  reasonText({ function: name, arguments: Array<string>(arity).fill("1") });

/**
 * The templates of the step's reason and of every other reason that
 * concludes the same kind of statement, or undefined when the step's own
 * reason has a rule of its own.
 */
const stepTemplates = (
  session: CheckerSession,
  step: VerifiedStepReport,
): Array<{ reason: string; slots: TemplateSlot[] }> | undefined => {
  const own = reasonDef(step.reason ?? "");
  const conclusion = step.conclusion ?? "";
  const name = parseStatementText(conclusion)?.function;
  if (!own || !name) return undefined;
  const of = (r: ReasonDef) =>
    session.needs(
      step.number,
      placeholder(r.name, r.dependencies.length),
      conclusion,
    );
  if (!of(own)) return undefined;
  return REASONS.filter(
    (r) => r.name === own.name || r.conclusions.includes(name),
  ).flatMap((r) =>
    (of(r) ?? [])
      // A slot listing nothing, such as an angle pair the figure does not
      // draw, can never be filled.
      .filter((t) => t.slots.every((slot) => slot.statements.length))
      .map((t) => ({ reason: r.name, slots: t.slots })),
  );
};

const sameReading = (a: CriterionReading, b: CriterionReading) =>
  a.reason === b.reason &&
  a.parts.length === b.parts.length &&
  a.parts.every((p, i) => p.requires === b.parts[i].requires);

/** The best readings of one rejected step, at most three. */
const diagnoseStep = (
  session: CheckerSession,
  matches: Matches,
  report: VerifiedCheckReport,
  step: VerifiedStepReport,
  templates: Array<{ reason: string; slots: TemplateSlot[] }>,
): CriterionReading[] => {
  const own = step.reason ?? "";
  const cited = step.dependencies;
  const conclusionOf = new Map(
    report.steps.map((s) => [s.number, s.conclusion] as const),
  );
  const earlier = report.steps
    .filter((s) => s.number < step.number && s.status === "accepted")
    .map((s) => s.number);
  const fits = fill(matches);
  const suppliedBy = (slot: TemplateSlot, n: number) => {
    const stated = conclusionOf.get(n);
    return stated ? fits(slot, stated) : undefined;
  };
  const grade = (index: number, slot: TemplateSlot): CriterionPart => {
    const inSlot = cited[index];
    const instead = inSlot !== undefined ? { cited: String(inSlot) } : {};
    if (inSlot !== undefined && earlier.includes(inSlot)) {
      const requires = suppliedBy(slot, inSlot);
      if (requires)
        return { index, requires, status: "cited", ref: String(inSlot) };
    }
    for (const n of earlier) {
      const requires = suppliedBy(slot, n);
      if (requires)
        return { index, requires, status: "known", ref: String(n), ...instead };
    }
    return {
      index,
      requires: slot.statements[0],
      status: "unknown",
      ...instead,
    };
  };

  const graded: CriterionReading[] = templates.map((t) => ({
    reason: t.reason,
    parts: t.slots.map((slot, i) => grade(i, slot)),
  }));
  if (!graded.length) return [];

  // A one-step derivation turns an unknown part (1000) into a derivable one
  // (100), so only readings that could then tie the best are searched.
  const best0 = Math.min(...graded.map((r) => readingCost(own, r)));
  const gain = COST.unknown - COST.derivable;
  const witnesses = new Map<string, ReturnType<typeof oneStepWitness>>();
  const witness = (req: string) => {
    if (!witnesses.has(req))
      witnesses.set(
        req,
        oneStepWitness(session, matches, report, step.number, earlier, req),
      );
    return witnesses.get(req);
  };
  const readings = graded.map((r) => {
    const open = r.parts.filter((p) => p.status === "unknown").length;
    if (!open || readingCost(own, r) - gain * open > best0) return r;
    return {
      ...r,
      parts: r.parts.map((p): CriterionPart => {
        if (p.status !== "unknown" || isOpen(p.requires)) return p;
        const found = witness(p.requires);
        return found ? { ...p, status: "derivable", ...found } : p;
      }),
    };
  });

  // A reading whose every part is established describes a whole step; keep
  // it only if the kernel accepts that step.  Grading is looser than some
  // rules (angles may be read along their rays), so this is what keeps a
  // reading from claiming a step the kernel would reject.
  const stands = (r: CriterionReading) => {
    if (r.parts.some((p) => p.status !== "cited" && p.status !== "known"))
      return true;
    const reason = reasonText({
      function: r.reason,
      arguments: r.parts.map((p) => p.ref ?? ""),
    });
    return session.accepts(step.number, reason, step.conclusion ?? "");
  };
  // Another reason is worth naming only if something it needs is in hand;
  // one needing only unknown facts would be a guess, and a reason with fewer
  // slots would win just by needing fewer.
  const ranked = readings
    .filter(
      (r) => r.reason === own || r.parts.some((p) => p.status !== "unknown"),
    )
    .map((r) => ({ r, cost: readingCost(own, r) }))
    .sort((a, b) => a.cost - b.cost);
  const kept: CriterionReading[] = [];
  let bestCost: number | undefined;
  for (const { r, cost } of ranked) {
    if (bestCost !== undefined && cost > bestCost) break;
    if (kept.some((k) => sameReading(k, r)) || !stands(r)) continue;
    bestCost = cost;
    kept.push(r);
    if (kept.length === 3) break;
  }
  return kept;
};

/** `session.matches` through a cache; it is called often. */
export const cachedMatches = (session: CheckerSession): Matches => {
  const cache = new Map<string, boolean>();
  return (matcher, expected, actual) => {
    const key = `${matcher}|${expected}|${actual}`;
    if (!cache.has(key))
      cache.set(key, session.matches(matcher, expected, actual));
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
 * The best readings of one rejected step, or undefined when its reason has
 * no templates or its triangles are not declared.
 */
export const criterionReadings = (
  session: CheckerSession,
  matches: Matches,
  report: VerifiedCheckReport,
  step: VerifiedStepReport,
): StepReadings | undefined => {
  if (step.status !== "rejected" || undeclaredSteps(report).has(step.number))
    return undefined;
  const templates = stepTemplates(session, step);
  if (!templates) return undefined;
  const readings = diagnoseStep(session, matches, report, step, templates);
  return readings.length
    ? Object.assign(readings, { ownReason: step.reason ?? "" })
    : undefined;
};

/** Per step number, the best readings of each rejected step. */
export const diagnoseCriteria = (
  session: CheckerSession,
  report: VerifiedCheckReport,
): Map<string, StepReadings> => {
  const matches = cachedMatches(session);
  const diagnoses = new Map<string, StepReadings>();
  for (const step of report.steps) {
    const readings = criterionReadings(session, matches, report, step);
    if (readings) diagnoses.set(String(step.number), readings);
  }
  return diagnoses;
};
