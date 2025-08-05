import { Content } from "../diagramContent";
import { SVGModes, TickType } from "./types";
export interface StepProps {
    ctx: Content;
    frame: string;
}
export interface StepFocusProps extends StepProps {
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
    ticks?: number;
}
export interface TickedAngles {
    a: [string, string];
    ticks?: number;
    type?: TickType;
}
export interface SetupStepMeta {
    prevStep?: StepMeta;
    unfocused: (props: StepProps) => void;
    diagram: (ctx: Content, frame: string) => void;
    text: (isActive: boolean) => JSX.Element;
    staticText: () => JSX.Element;
    additions: (props: StepFocusProps) => void;
    highlight?: (props: StepProps) => void;
}
export interface StepMeta extends SetupStepMeta {
    reason: string;
    dependsOn?: string[];
}
//# sourceMappingURL=stepTypes.d.ts.map