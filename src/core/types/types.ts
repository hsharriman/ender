import { InteractiveAppPageProps } from "../../components/ender/InteractiveAppPage";
import { StaticAppPageProps } from "../../components/ender/StaticAppPage";
import { PretestAppPageProps } from "../../components/procedure/pages/PretestAppPage";
import { Content } from "../diagramContent";
import { Question } from "../testinfra/questions/testQuestions";
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
  Pinned = "pinned",
  ActiveText = "activetext",
  ReliesOn = "relieson",
  ReliesOnPoint = "reliesonpoint",
  ReliesMissing = "reliesmissing",
  Derived = "derived",
  Inconsistent = "inconsistent",
}

// -------- TYPES RELATED TO PROOF SETUP --------
export interface StaticLayoutProps {
  name: string;
  baseContent: (showPoints: boolean, hoverable: boolean) => Content;
  steps: StepMeta[];
  givens: StepMeta;
  proves: StepMeta;
  questions: Question[];
  shuffleQuestions: Question[];
  title: string;
}

export interface InteractiveLayoutProps extends StaticLayoutProps {
  // miniContent: Content;
}

export type LayoutProps = InteractiveLayoutProps & StaticLayoutProps;

export interface Reason {
  title: string;
  body: string;
  src?: string;
}

export interface TutorialStep {
  elemId: string;
  headerText?: string;
  text: JSX.Element;
  exercise?: JSX.Element;
  listenerId: string[]; // the element that needs to be interacted with to be able to move on
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
  props: StaticAppPageProps | InteractiveAppPageProps | PretestAppPageProps;
  tutorial?: TutorialStep[];
}
type LayoutOptions = "static" | "interactive";

// for determining what type of styling to apply to an object
export enum HighlightType {
  Relies = "relies",
  ReliesUnmet = "reliesunmet",
  Highlight = "highlight",
  HighlightUnmet = "highlightunmet",
}
