import { Obj, ParseObj } from "../geometry-object";
import {
  ParseDiagramStmt,
  ProofObj,
  ProofStep,
  Stmt,
} from "./types/checkerTypes";

export const stripStepRefBrackets = (value: string): string => {
  return value.replace(/[[\]]/g, "");
};

/** Strip t_/a_/q_ prefixes from premise object labels (lexer keeps raw tokens). */
const stripPremiseObjPrefix = (type: Obj, v: string): string => {
  if (type === Obj.Triangle && v.startsWith("t_")) return v.slice(2);
  if (type === Obj.Angle && v.startsWith("a_")) return v.slice(2);
  if (type === Obj.Quadrilateral && v.startsWith("q_")) return v.slice(2);
  return v;
};

/**
 * Normalize step refs: drop brackets, drop leading zeros on numeric ids.
 * `[01]` → `1`, `g_01` → `g_1`, `[d_03]` → `d_3`.
 * Source uses `[g_n]` only in premises; reason deps use bare `g_n` (parser-enforced).
 */
export const normalizeStepRef = (ref: string): string => {
  const trimmed = ref.trim();
  const mGBare = trimmed.match(/^g_0*(\d+)$/i);
  if (mGBare) return `g_${parseInt(mGBare[1], 10)}`;
  const mD = trimmed.match(/^\[d_0*(\d+)\]$/i);
  if (mD) return `d_${parseInt(mD[1], 10)}`;
  const mNum = trimmed.match(/^\[0*(\d+)\]$/);
  if (mNum) return String(parseInt(mNum[1], 10));
  const bare = stripStepRefBrackets(trimmed);
  if (/^\d+$/.test(bare)) return String(parseInt(bare, 10));
  return trimmed;
};

const normalizeDiagramStepNumber = (raw: string): string => {
  const s = stripStepRefBrackets(raw);
  const m = s.match(/^d_0*(\d+)$/i);
  if (m) return `d_${parseInt(m[1], 10)}`;
  return s;
};

const normalizeGivenPremiseStepNumber = (raw: string): string => {
  const bare = raw.match(/^g_0*(\d+)$/i);
  if (bare) return `g_${parseInt(bare[1], 10)}`;
  return normalizeStepRef(raw);
};

const normalizeProofStepLabel = (raw: string): string => {
  return normalizeStepRef(raw);
};

const normalizeParseObjArg = (arg: ParseObj): ParseObj => {
  if (arg.type === Obj.Triangle && arg.v.startsWith("t_")) {
    return { ...arg, v: arg.v.slice(2) };
  }
  if (arg.type === Obj.Angle && arg.v.startsWith("a_")) {
    return { ...arg, v: arg.v.slice(2) };
  }
  if (arg.type === Obj.Quadrilateral && arg.v.startsWith("q_")) {
    return { ...arg, v: arg.v.slice(2) };
  }
  return arg;
};

const normalizeStmt = (stmt: Stmt | undefined): Stmt | undefined => {
  if (!stmt?.arguments) return stmt;
  return {
    ...stmt,
    arguments: stmt.arguments.map(normalizeParseObjArg),
  };
};

const normalizeReasonArgs = (args: string[]): string[] => {
  return args.map((a) => {
    const t = a.trim();
    if (/^g_\d/i.test(t) || /^\[d_/i.test(t) || /^\[\d/.test(t)) {
      return normalizeStepRef(t);
    }
    return t;
  });
};

const normalizeDiagramStmt = (d: ParseDiagramStmt): ParseDiagramStmt => {
  return {
    ...d,
    stepNumber: normalizeDiagramStepNumber(d.stepNumber),
    statement: normalizeStmt(d.statement)!,
  };
};

const normalizeStep = (step: ProofStep): ProofStep => {
  const base: ProofStep = {
    ...step,
    statement: normalizeStmt(step.statement),
    reason: step.reason
      ? {
          ...step.reason,
          arguments: normalizeReasonArgs(step.reason.arguments),
        }
      : undefined,
  };

  if (step.type === "given" && step.stepNumber) {
    return {
      ...base,
      stepNumber: normalizeGivenPremiseStepNumber(step.stepNumber),
    };
  }
  if (step.type === "proof" && step.stepNumber) {
    return {
      ...base,
      stepNumber: normalizeProofStepLabel(step.stepNumber),
    };
  }
  if (step.type === "goal" && step.stepNumber) {
    return {
      ...base,
      stepNumber: normalizeProofStepLabel(step.stepNumber),
    };
  }
  return base;
};

/**
 * Cleans ProofObj for consumers (e.g. UI): premise prefixes and canonical step indices.
 */
export const normalizeProofObj = (proof: ProofObj): ProofObj => {
  const premises = { ...proof.premises };

  premises.triangles = premises.triangles.map((o) => ({
    ...o,
    v: stripPremiseObjPrefix(Obj.Triangle, o.v),
  }));
  premises.angles = premises.angles.map((o) => ({
    ...o,
    v: stripPremiseObjPrefix(Obj.Angle, o.v),
  }));
  premises.quadrilaterals = premises.quadrilaterals.map((o) => ({
    ...o,
    v: stripPremiseObjPrefix(Obj.Quadrilateral, o.v),
  }));

  premises.diagramStatements =
    premises.diagramStatements.map(normalizeDiagramStmt);

  // `diagramDeps` is unset until `runProofChecker` (parse → normalize → checker).
  const steps = proof.steps.map((step) => normalizeStep(step));
  const goal = normalizeStmt(proof.goal);

  return {
    ...proof,
    premises,
    steps,
    goal,
  };
};
