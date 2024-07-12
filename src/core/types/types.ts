import { InteractiveAppPageProps } from "../../components/InteractiveAppPage";
import { StaticAppPageProps } from "../../components/StaticAppPage";
import { Question } from "../../questions/funcTypeQuestions";
import { Content } from "../diagramContent";
import { StepMeta } from "./stepTypes";

// -------- GEOMETRY TYPES --------
export type Vector = [number, number];
export type LPoint = { pt: Vector; label: string };
export type LSegment = { p1: Vector; p2: Vector; label: string };
export type LAngle = {
  center: Vector;
  start: Vector;
  end: Vector;
  label: string;
};

export enum Obj {
  Point = "point",
  Segment = "segment",
  Text = "text",
  // Circle,
  Angle = "angle",
  ParallelTick = "parallel",
  EqualLengthTick = "equallength",
  Triangle = "triangle",
  EqualAngleTick = "equalangle",
  Tick = "tick",
  HiddenTick = "hiddentick",
  RightTick = "righttick",
  Quadrilateral = "rectangle",
}

export type TickType =
  | Obj.ParallelTick
  | Obj.EqualLengthTick
  | Obj.EqualAngleTick
  | Obj.HiddenTick
  | Obj.RightTick;

export enum SVGModes {
  Hidden = "hidden",
  Focused = "focused",
  Active = "active",
  DiagramHover = "diagramhover",
  Unfocused = "unfocused",
  Default = "default",
  Purple = "purple",
  Blue = "blue",
  Pinned = "pinned",
  ActiveText = "activetext",
  ActiveTriangleBlue = "activetriangleblue",
  ActiveTrianglePurple = "activetrianglepurple",
  UnfocusedTriangle = "unfocusedtriangle",
}

// -------- TYPES RELATED TO PROOF SETUP --------
export interface StaticLayoutProps {
  name: string;
  baseContent: (showPoints: boolean, hoverable: boolean) => Content;
  steps: StepMeta[];
  givens: StepMeta;
  proves: StepMeta;
  questions: Question[];
}

export interface InteractiveLayoutProps extends StaticLayoutProps {
  miniContent: Content;
}

export type LayoutProps = InteractiveLayoutProps & StaticLayoutProps;

export interface Reason {
  title: string;
  body: string;
}

export interface TutorialStep {
  elemId: string;
  headerText?: string;
  text: JSX.Element;
  exercise?: JSX.Element;
  listenerId?: string; // the element that needs to be interacted with to be able to move on
  type: TutorialStepType;
  paddingL?: number;
}

export enum TutorialStepType {
  Popup = "popup",
  Default = "default",
  HideContinue = "hideContinue",
}
export interface ProofMeta {
  layout: LayoutOptions;
  props: StaticAppPageProps | InteractiveAppPageProps;
  tutorial?: TutorialStep[];
}
type LayoutOptions = "static" | "interactive";
