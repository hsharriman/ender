import { Content } from "../diagramContent";
import { Reason, SVGModes } from "./types";

// -------- TYPES RELATED TO RENDERING STEPS OF A PROOF --------
export interface Step {
  meta: StepMeta;
  reason: Reason;
  dependsOn?: number[];
}

export interface StepUnfocusProps {
  ctx: Content;
  frame: string;
  inPlace: boolean;
}
export interface StepFocusProps {
  ctx: Content;
  frame: string;
  mode: SVGModes;
  inPlace: boolean;
}
export interface StepTextProps {
  ctx: Content;
  frame?: string;
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

export interface StepMeta {
  unfocused: (props: StepUnfocusProps) => void;
  diagram: (ctx: Content, frame: string, inPlace?: boolean) => void;
  text: (props: StepTextProps) => JSX.Element;
  ticklessText: (ctx: Content) => JSX.Element;
  staticText: () => JSX.Element;
  additions: (props: StepFocusProps) => void;
}
