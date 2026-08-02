export type SurfaceCall = { name: string; arguments: string[] };
export type DisplayPoint = {
  label: string;
  x: string;
  y: string;
  offsetCode: string | null;
};
export type DisplayDeclaration = {
  kind: "segment" | "angle" | "triangle" | "quadrilateral" | "circle";
  objects: string[];
};
export type LabeledSurfaceCall = { label: string; call: SurfaceCall };
export type PresentationStep = {
  label: string;
  reason: SurfaceCall | null;
  conclusion: SurfaceCall | null;
};
export type PresentationFile = {
  title: string | null;
  points: DisplayPoint[];
  declarations: DisplayDeclaration[];
  diagramPremises: LabeledSurfaceCall[];
  givens: LabeledSurfaceCall[];
  goal: SurfaceCall | null;
  steps: PresentationStep[];
};

declare global {
  interface Window {
    enderCheckProof?: (source: string) => string;
    enderParsePresentation?: (source: string) => string;
  }
}
