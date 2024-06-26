import { Content } from "../diagramContent";
import { Reason, SVGModes, TickType } from "./types";

// -------- TYPES RELATED TO RENDERING STEPS OF A PROOF --------
export interface StepUnfocusProps {
  ctx: Content;
  frame: string;
}
export interface StepFocusProps extends StepUnfocusProps {
  mode: SVGModes;
}
export interface ProofTextItem {
  k: string;
  v: JSX.Element;
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
  unfocused: (props: StepUnfocusProps) => void;
  diagram: (ctx: Content, frame: string) => void;
  text: (ctx: Content) => JSX.Element;
  staticText: () => JSX.Element;
  additions: (props: StepFocusProps) => void;
}
export interface StepMeta extends SetupStepMeta {
  reason: Reason;
  dependsOn?: number[];
}
