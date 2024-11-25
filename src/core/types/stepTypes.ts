import { Content } from "../diagramContent";
import { Reason, SVGModes, TickType } from "./types";

// -------- TYPES RELATED TO RENDERING STEPS OF A PROOF --------
export interface StepUnfocusProps {
  ctx: Content;
  frame: string;
}
export interface StepFocusProps {
  ctx: Content;
  frame: string;
  mode: SVGModes;
}
export interface ProofTextItem {
  k: string;
  v: (isActive: boolean) => JSX.Element;
  reason?: string;
  dependsOn?: Set<string>;
  alwaysActive?: boolean;
}

export interface StaticProofTextItem {
  stmt: JSX.Element;
  reason?: string;
}

export interface TickedSegments {
  s: [string, string];
  ticks?: number; // 1 by default
}
export interface TickedAngles {
  a: [string, string];
  ticks?: number; // 1 by default
  type?: TickType; // Equal angles by default
}

export interface SetupStepMeta {
  prevStep?: StepMeta;
  unfocused: (props: StepUnfocusProps) => void;
  diagram: (ctx: Content, frame: string) => void;
  text: (isActive: boolean) => JSX.Element;
  staticText: () => JSX.Element;
  additions: (props: StepFocusProps) => void;
  highlight?: (ctx: Content, frame: string) => void;
}
export interface StepMeta extends SetupStepMeta {
  reason: Reason;
  dependsOn?: string[];
}
