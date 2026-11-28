/**
 * What to change to make a rejected step acceptable, found by asking the
 * checker about edited copies of the step.
 *
 * Each rejected step is searched in a fixed order, and the first stage that
 * finds an accepted edit wins:
 *
 * 1. One citation changed: a cited step number replaced by another, or two
 *    citations swapped.
 * 2. One object in the conclusion replaced by another object of the same
 *    kind that the proof mentions or that its declarations determine.
 * 3. Deeper citation searches: for a reason the kernel gives as templates,
 *    the readings of `criteria.ts`; otherwise, two citations replaced.
 *
 * The order puts the edits the diagram can show first: a wrong citation is
 * drawn as a "?" dependency, a wrong conclusion as red objects.  Every
 * judgement comes from the checker through a `CheckerSession`; nothing here
 * decides whether a step is valid.  Problems are assumed complete: the
 * objects a fix needs are already in the proof.
 */
import { canonicalObject, reasonText, stmtText } from "checker/grammar/syntax";
import { ProofObj, ProofStep, Reason, Stmt } from "checker/types/checkerTypes";
import { presentationToProofObj } from "checker/verified/presentationAdapter";
import {
  VerifiedCheckReport,
  VerifiedStepReport,
} from "checker/verified/presentationTypes";
import { CheckerSession } from "checker/verified/session";
import {
  cachedMatches,
  criterionReadings,
  Matches,
  StepReadings,
} from "./criteria";
import { Obj, ParseObj } from "geometry-object";

/** How one rejected step could be made acceptable. */
export type StepDiagnosis =
  | {
      kind: "citation";
      /** Positions, in the reason's argument list, of the citations changed. */
      slots: number[];
      /** The reason, as written in an accepted edit. */
      fix: string;
    }
  | {
      kind: "conclusion";
      /** The conclusion, as written in an accepted edit. */
      fix: string;
    }
  | { kind: "criterion"; readings: StepReadings };

/** Diagnoses by step number. */
export type Diagnoses = Map<string, StepDiagnosis>;

/** The criterion readings among `diagnoses`, by step number. */
export const readingsOf = (diagnoses: Diagnoses): Map<string, StepReadings> =>
  new Map(
    [...diagnoses].flatMap(([step, d]) =>
      d.kind === "criterion" ? [[step, d.readings] as const] : [],
    ),
  );

/** A step's reason and conclusion, as the checker's parser read them. */
const stepParts = (
  step: ProofStep | undefined,
): { reason: Reason; conclusion: Stmt } | undefined =>
  step?.reason && step.statement
    ? { reason: step.reason, conclusion: step.statement }
    : undefined;

/** The reason with the citations at some positions replaced. */
const withCitations = (
  reason: Reason,
  edits: Array<[number, string]>,
): Reason => {
  const args = [...reason.arguments];
  edits.forEach(([i, value]) => (args[i] = value));
  return { ...reason, arguments: args };
};

// ---------------------------------------------------------------------------
// Citations

/** Positions of the reason's arguments that cite steps. */
const citationSlots = (reason: Reason): number[] =>
  reason.arguments.flatMap((arg, i) => (/^\d+$/.test(arg) ? [i] : []));

/** One citation replaced by another step, or two citations swapped. */
const oneCitationEdits = (
  reason: Reason,
  position: number,
): Array<{ slots: number[]; reason: Reason }> => {
  const slots = citationSlots(reason);
  const earlier = Array.from({ length: position - 1 }, (_, i) => String(i + 1));
  const replaced = slots.flatMap((slot) =>
    earlier
      .filter((n) => n !== reason.arguments[slot])
      .map((n) => ({
        slots: [slot],
        reason: withCitations(reason, [[slot, n]]),
      })),
  );
  const swapped = slots.flatMap((a, i) =>
    slots
      .slice(i + 1)
      .filter((b) => reason.arguments[a] !== reason.arguments[b])
      .map((b) => ({
        slots: [a, b],
        reason: withCitations(reason, [
          [a, reason.arguments[b]],
          [b, reason.arguments[a]],
        ]),
      })),
  );
  return [...replaced, ...swapped];
};

/** Two citations replaced by other steps. */
const twoCitationEdits = (
  reason: Reason,
  position: number,
): Array<{ slots: number[]; reason: Reason }> => {
  const slots = citationSlots(reason);
  const earlier = Array.from({ length: position - 1 }, (_, i) => String(i + 1));
  return slots.flatMap((a, i) =>
    slots.slice(i + 1).flatMap((b) =>
      earlier
        .filter((n) => n !== reason.arguments[a])
        .flatMap((x) =>
          earlier
            .filter((n) => n !== reason.arguments[b])
            .map((y) => ({
              slots: [a, b],
              reason: withCitations(reason, [
                [a, x],
                [b, y],
              ]),
            })),
        ),
    ),
  );
};

// ---------------------------------------------------------------------------
// Conclusion objects

/** One key per object; triangles keep every vertex order, which states a
 * correspondence. */
const objectKey = (o: ParseObj): string =>
  o.type === Obj.Triangle ? `${o.type}:${o.v}` : canonicalObject(o);

const permutations = <T>(items: T[]): T[][] =>
  items.length <= 1
    ? [items]
    : items.flatMap((x, i) =>
        permutations([...items.slice(0, i), ...items.slice(i + 1)]).map(
          (rest) => [x, ...rest],
        ),
      );

/**
 * Every object a conclusion could name, by kind: the objects the proof
 * mentions, the segments between its points, the corners of its triangles
 * and quadrilaterals, and every vertex order of its triangles.
 */
const vocabulary = (proof: ProofObj): Map<Obj, ParseObj[]> => {
  const { premises } = proof;
  const statements = [
    ...premises.diagramStatements.map((d) => d.statement),
    ...proof.steps.flatMap((step) => (step.statement ? [step.statement] : [])),
    ...(proof.goal ? [proof.goal] : []),
  ];
  const mentioned: ParseObj[] = [
    ...premises.points.map(({ type, v }) => ({ type, v })),
    ...premises.segments,
    ...premises.angles,
    ...premises.triangles,
    ...premises.quadrilaterals,
    ...premises.circles,
    ...premises.arcs,
    ...statements.flatMap((s) => s.arguments),
  ];
  const ofType = (type: Obj) =>
    mentioned.filter((o) => o.type === type).map((o) => o.v);
  const points = [...new Set(ofType(Obj.Point))];
  const derived: ParseObj[] = [
    ...points.flatMap((p, i) =>
      points.slice(i + 1).map((q) => ({ type: Obj.Segment, v: p + q })),
    ),
    ...ofType(Obj.Triangle).flatMap((t) =>
      permutations([...t]).flatMap((order) => [
        { type: Obj.Triangle, v: order.join("") },
        { type: Obj.Angle, v: order.join("") },
      ]),
    ),
    ...ofType(Obj.Quadrilateral).flatMap((q) =>
      [...q].map((corner, i) => ({
        type: Obj.Angle,
        v: `${q[(i + 3) % 4]}${corner}${q[(i + 1) % 4]}`,
      })),
    ),
  ] as ParseObj[];
  const byType = new Map<Obj, ParseObj[]>();
  const seen = new Set<string>();
  [...mentioned, ...derived]
    .filter((o) => o.type !== Obj.Text)
    .sort((a, b) => (a.v < b.v ? -1 : a.v > b.v ? 1 : 0))
    .forEach((o) => {
      const key = objectKey(o);
      if (seen.has(key)) return;
      seen.add(key);
      byType.set(o.type, [...(byType.get(o.type) ?? []), o]);
    });
  return byType;
};

/** The conclusion with one object replaced by another of the same type. */
const oneObjectEdits = (
  conclusion: Stmt,
  objects: Map<Obj, ParseObj[]>,
): Stmt[] =>
  conclusion.arguments.flatMap((arg, i) =>
    (objects.get(arg.type) ?? [])
      .filter((o) => objectKey(o) !== objectKey(arg))
      .map((o) => ({
        ...conclusion,
        arguments: conclusion.arguments.map((a, j) => (j === i ? o : a)),
      })),
  );

// ---------------------------------------------------------------------------

/** The diagnosis of one rejected step, or undefined if no search finds one. */
const diagnoseStep = (
  session: CheckerSession,
  matches: Matches,
  report: VerifiedCheckReport,
  objects: Map<Obj, ParseObj[]>,
  step: VerifiedStepReport,
  written: ProofStep | undefined,
): StepDiagnosis | undefined => {
  const parts = stepParts(written);
  if (!parts) return undefined;
  const { reason, conclusion } = parts;
  const position = step.number;
  const conclusionText = stmtText(conclusion);
  const accepts = (r: Reason, c: string) =>
    session.accepts(position, reasonText(r), c);

  const citationFix = (
    edits: Array<{ slots: number[]; reason: Reason }>,
  ): StepDiagnosis | undefined => {
    const found = edits.find((e) => accepts(e.reason, conclusionText));
    return (
      found && {
        kind: "citation",
        slots: found.slots,
        fix: reasonText(found.reason),
      }
    );
  };

  const oneCitation = citationFix(oneCitationEdits(reason, position));
  if (oneCitation) return oneCitation;

  const conclusionFix = oneObjectEdits(conclusion, objects).find((c) =>
    accepts(reason, stmtText(c)),
  );
  if (conclusionFix)
    return { kind: "conclusion", fix: stmtText(conclusionFix) };

  const readings = criterionReadings(session, matches, report, step);
  if (readings) return { kind: "criterion", readings };

  return citationFix(twoCitationEdits(reason, position));
};

/** Diagnose every rejected step. */
export const diagnoseSteps = (
  session: CheckerSession,
  report: VerifiedCheckReport,
): Diagnoses => {
  if (!report.presentation) return new Map();
  const proof = presentationToProofObj(report.presentation, report.rays);
  const matches = cachedMatches(session);
  const objects = vocabulary(proof);
  const written = new Map(
    proof.steps
      .filter((s) => s.type === "proof")
      .map((s) => [Number(s.stepNumber), s]),
  );
  const diagnoses: Diagnoses = new Map();
  for (const step of report.steps) {
    if (step.status !== "rejected") continue;
    const found = diagnoseStep(
      session,
      matches,
      report,
      objects,
      step,
      written.get(step.number),
    );
    if (found) diagnoses.set(String(step.number), found);
  }
  return diagnoses;
};
