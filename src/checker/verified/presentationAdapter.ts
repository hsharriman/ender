import { Obj, ParseObj } from "../../geometry-object";
import { parseObject } from "../grammar/syntax";
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

/** A statement from the presentation parser, with its objects parsed. */
export const stmtOf = (surface: SurfaceCall): Stmt => ({
  function: surface.name,
  arguments: surface.arguments.map(parseObject),
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
    arcs: declarationObjects(file.declarations, "arc"),
    diagramStatements: file.diagramPremises.map(({ label, call }) => ({
      type: "diagram",
      stepNumber: normalizeReference(label),
      statement: stmtOf(call),
    })),
  },
  steps: [
    ...file.givens.map(({ label, call }) => ({
      type: "given" as const,
      stepNumber: normalizeReference(label),
      statement: stmtOf(call),
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
      statement: step.conclusion ? stmtOf(step.conclusion) : undefined,
    })),
  ],
  goal: file.goal ? stmtOf(file.goal) : undefined,
});
