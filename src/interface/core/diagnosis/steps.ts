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
 * 3. Deeper citation searches: for a triangle criterion, the criterion
 *    readings of `criteria.ts`; otherwise, two citations replaced.
 *
 * The order puts the edits the diagram can show first: a wrong citation is
 * drawn as a "?" dependency, a wrong conclusion as red objects.  Every
 * judgement comes from the checker through a `CheckerSession`; nothing here
 * decides whether a step is valid.  Problems are assumed complete: the
 * objects a fix needs are already in the proof.
 */
import {
  VerifiedCheckReport,
  VerifiedStepReport,
} from "checker/verified/presentationTypes";
import { CheckerSession } from "checker/verified/session";
import { cachedSatisfies, criterionReadings, StepReadings } from "./criteria";

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

/** A call such as `sas(1, 2, 3)`, split into its name and arguments. */
type Call = { name: string; args: string[] };

const parseCall = (text: string): Call | undefined => {
  const m = text.match(/^\s*([A-Za-z0-9_]+)\s*\((.*)\)\s*$/);
  if (!m) return undefined;
  const inner = m[2].trim();
  return {
    name: m[1],
    args: inner ? inner.split(",").map((a) => a.trim()) : [],
  };
};

const callText = ({ name, args }: Call): string =>
  `${name}(${args.join(", ")})`;

/** A step line's reason and conclusion, as written. */
const stepParts = (
  step: VerifiedStepReport,
): { reason: Call; conclusion: Call } | undefined => {
  // A trailing `//` or `#` comment is not part of the step.
  const line = step.source.replace(/\s*(\/\/|#).*$/, "");
  const m = line.match(/^\s*\[\d+\]\s*(.*?)\s*->\s*(.*?)\s*$/);
  if (!m) return undefined;
  const reason = parseCall(m[1]);
  const conclusion = parseCall(m[2]);
  return reason && conclusion ? { reason, conclusion } : undefined;
};

const withArgs = (call: Call, edits: Array<[number, string]>): Call => {
  const args = [...call.args];
  edits.forEach(([i, value]) => (args[i] = value));
  return { ...call, args };
};

// ---------------------------------------------------------------------------
// Citations

/** Positions of the reason's arguments that cite steps. */
const citationSlots = (reason: Call): number[] =>
  reason.args.flatMap((arg, i) => (/^\d+$/.test(arg) ? [i] : []));

/** One citation replaced by another step, or two citations swapped. */
const oneCitationEdits = (
  reason: Call,
  position: number,
): Array<{ slots: number[]; reason: Call }> => {
  const slots = citationSlots(reason);
  const earlier = Array.from({ length: position - 1 }, (_, i) => String(i + 1));
  const replaced = slots.flatMap((slot) =>
    earlier
      .filter((n) => n !== reason.args[slot])
      .map((n) => ({ slots: [slot], reason: withArgs(reason, [[slot, n]]) })),
  );
  const swapped = slots.flatMap((a, i) =>
    slots
      .slice(i + 1)
      .filter((b) => reason.args[a] !== reason.args[b])
      .map((b) => ({
        slots: [a, b],
        reason: withArgs(reason, [
          [a, reason.args[b]],
          [b, reason.args[a]],
        ]),
      })),
  );
  return [...replaced, ...swapped];
};

/** Two citations replaced by other steps. */
const twoCitationEdits = (
  reason: Call,
  position: number,
): Array<{ slots: number[]; reason: Call }> => {
  const slots = citationSlots(reason);
  const earlier = Array.from({ length: position - 1 }, (_, i) => String(i + 1));
  return slots.flatMap((a, i) =>
    slots.slice(i + 1).flatMap((b) =>
      earlier
        .filter((n) => n !== reason.args[a])
        .flatMap((x) =>
          earlier
            .filter((n) => n !== reason.args[b])
            .map((y) => ({
              slots: [a, b],
              reason: withArgs(reason, [
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

type Kind =
  "point" | "segment" | "angle" | "triangle" | "quad" | "circle" | "arc";

const kindOf = (token: string): Kind | undefined => {
  if (/^[A-Z]$/.test(token)) return "point";
  if (/^[A-Z]{2}$/.test(token)) return "segment";
  if (/^a_[A-Z]{3}$/.test(token)) return "angle";
  if (/^t_[A-Z]{3}$/.test(token)) return "triangle";
  if (/^q_[A-Z]{4}$/.test(token)) return "quad";
  if (/^c_[A-Z]{2}$/.test(token)) return "circle";
  if (/^r_[A-Z]{3}$/.test(token)) return "arc";
  return undefined;
};

/** One spelling per object: a segment or angle read backwards is the same. */
const canonical = (token: string): string => {
  const kind = kindOf(token);
  if (kind === "segment")
    return [token, [...token].reverse().join("")].sort()[0];
  if (kind === "angle") {
    const v = token.slice(2);
    return `a_${[v, [...v].reverse().join("")].sort()[0]}`;
  }
  return token;
};

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
const vocabulary = (source: string): Map<Kind, string[]> => {
  const text = source
    .split("\n")
    .filter((line) => !/^\s*title:/.test(line))
    .map((line) => line.replace(/(\/\/|#).*$/, ""))
    .join("\n");
  const tokens = new Set(text.match(/\b(?:[a-z]_[A-Z]+|[A-Z]{1,2})\b/g) ?? []);
  const points = [...tokens].filter((t) => kindOf(t) === "point");
  const triangles = [...tokens].filter((t) => kindOf(t) === "triangle");
  const quads = [...tokens].filter((t) => kindOf(t) === "quad");
  points.forEach((p, i) =>
    points.slice(i + 1).forEach((q) => tokens.add(p + q)),
  );
  triangles.forEach((t) =>
    permutations([...t.slice(2)]).forEach((order) => {
      tokens.add(`t_${order.join("")}`);
      tokens.add(`a_${order.join("")}`);
    }),
  );
  quads.forEach((q) => {
    const v = [...q.slice(2)];
    v.forEach((_, i) =>
      tokens.add(`a_${v[(i + 3) % 4]}${v[i]}${v[(i + 1) % 4]}`),
    );
  });
  const byKind = new Map<Kind, string[]>();
  const seen = new Set<string>();
  [...tokens].sort().forEach((token) => {
    const kind = kindOf(token);
    // Triangles keep every vertex order: the order states a correspondence.
    const key = kind === "triangle" ? token : canonical(token);
    if (!kind || seen.has(key)) return;
    seen.add(key);
    byKind.set(kind, [...(byKind.get(kind) ?? []), token]);
  });
  return byKind;
};

/** The conclusion with one object replaced by another of the same kind. */
const oneObjectEdits = (
  conclusion: Call,
  objects: Map<Kind, string[]>,
): Call[] =>
  conclusion.args.flatMap((arg, i) => {
    const kind = kindOf(arg);
    if (!kind) return [];
    const same = kind === "triangle" ? arg : canonical(arg);
    return (objects.get(kind) ?? [])
      .filter((o) => (kind === "triangle" ? o : canonical(o)) !== same)
      .map((o) => withArgs(conclusion, [[i, o]]));
  });

// ---------------------------------------------------------------------------

/** The diagnosis of one rejected step, or undefined if no search finds one. */
const diagnoseStep = (
  session: CheckerSession,
  satisfies: (expected: string, actual: string) => boolean,
  report: VerifiedCheckReport,
  objects: Map<Kind, string[]>,
  step: VerifiedStepReport,
): StepDiagnosis | undefined => {
  const parts = stepParts(step);
  if (!parts) return undefined;
  const { reason, conclusion } = parts;
  const position = step.number;
  const conclusionText = callText(conclusion);
  const accepts = (r: Call, c: string) =>
    session.accepts(position, callText(r), c);

  const citationFix = (
    edits: Array<{ slots: number[]; reason: Call }>,
  ): StepDiagnosis | undefined => {
    const found = edits.find((e) => accepts(e.reason, conclusionText));
    return (
      found && {
        kind: "citation",
        slots: found.slots,
        fix: callText(found.reason),
      }
    );
  };

  const oneCitation = citationFix(oneCitationEdits(reason, position));
  if (oneCitation) return oneCitation;

  const conclusionFix = oneObjectEdits(conclusion, objects).find((c) =>
    accepts(reason, callText(c)),
  );
  if (conclusionFix)
    return { kind: "conclusion", fix: callText(conclusionFix) };

  const readings = criterionReadings(session, satisfies, report, step);
  if (readings) return { kind: "criterion", readings };

  return citationFix(twoCitationEdits(reason, position));
};

/** Diagnose every rejected step. */
export const diagnoseSteps = (
  session: CheckerSession,
  report: VerifiedCheckReport,
  source: string,
): Diagnoses => {
  const satisfies = cachedSatisfies(session);
  const objects = vocabulary(source);
  const diagnoses: Diagnoses = new Map();
  for (const step of report.steps) {
    if (step.status !== "rejected") continue;
    const found = diagnoseStep(session, satisfies, report, objects, step);
    if (found) diagnoses.set(String(step.number), found);
  }
  return diagnoses;
};
