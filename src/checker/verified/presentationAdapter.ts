import { Obj, ParseObj } from "../../geometry-object";
import { ProofObj, Stmt } from "../types/checkerTypes";
import {
  DisplayDeclaration,
  PresentationFile,
  SurfaceCall,
} from "./presentationTypes";

const normalizeNumber = (value: string): string => {
  const match = value.match(/^0*(\d+)$/);
  return match ? String(parseInt(match[1], 10)) : value;
};

const normalizeReference = (value: string): string => {
  const given = value.match(/^g_0*(\d+)$/);
  if (given) return `g_${parseInt(given[1], 10)}`;
  const diagram = value.match(/^d_0*(\d+)$/);
  if (diagram) return `d_${parseInt(diagram[1], 10)}`;
  return normalizeNumber(value);
};

const parseObject = (raw: string): ParseObj => {
  if (/^a_[A-Z]{3}$/.test(raw)) return { type: Obj.Angle, v: raw.slice(2) };
  if (/^t_[A-Z]{3}$/.test(raw)) return { type: Obj.Triangle, v: raw.slice(2) };
  if (/^q_[A-Z]{4}$/.test(raw))
    return { type: Obj.Quadrilateral, v: raw.slice(2) };
  if (/^c_[A-Z]{2}$/.test(raw)) return { type: Obj.Circle, v: raw.slice(2) };
  if (/^[A-Z]{2}$/.test(raw)) return { type: Obj.Segment, v: raw };
  if (/^[A-Z]$/.test(raw)) return { type: Obj.Point, v: raw };
  throw new Error(`Unsupported presentation object: ${raw}`);
};

const statement = (call: SurfaceCall): Stmt => ({
  function: call.name,
  arguments: call.arguments.map(parseObject),
});

const declarationObjects = (
  declarations: DisplayDeclaration[],
  kind: DisplayDeclaration["kind"],
): ParseObj[] =>
  declarations
    .filter((declaration) => declaration.kind === kind)
    .flatMap((declaration) => declaration.objects.map(parseObject));

export const presentationToProofObj = (file: PresentationFile): ProofObj => ({
  title: file.title,
  premises: {
    points: file.points.map((point) => ({
      type: Obj.Point,
      v: point.label,
      pt: [Number(point.x), Number(point.y)],
      offsetCode: point.offsetCode ?? "c",
    })),
    triangles: declarationObjects(file.declarations, "triangle"),
    quadrilaterals: declarationObjects(file.declarations, "quadrilateral"),
    segments: declarationObjects(file.declarations, "segment"),
    angles: declarationObjects(file.declarations, "angle"),
    circles: declarationObjects(file.declarations, "circle"),
    diagramStatements: file.diagramPremises.map(({ label, call }) => ({
      type: "diagram",
      stepNumber: normalizeReference(label),
      statement: statement(call),
      errors: [],
    })),
  },
  steps: [
    ...file.givens.map(({ label, call }) => ({
      type: "given" as const,
      stepNumber: normalizeReference(label),
      statement: statement(call),
      errors: [],
    })),
    ...file.steps.map((step) => ({
      type: "proof" as const,
      stepNumber: normalizeReference(step.label),
      reason: step.reason
        ? {
            function: step.reason.name,
            arguments: step.reason.arguments.map(normalizeReference),
          }
        : undefined,
      statement: step.conclusion ? statement(step.conclusion) : undefined,
      errors: [],
    })),
  ],
  goal: file.goal ? statement(file.goal) : undefined,
  errors: [],
  isCorrect: false,
});
