import { Content, Obj } from "geometry-object";
import { InteractiveAppPageProps } from "../../components/ender/InteractiveAppPage";
import { StaticAppPageProps } from "../../components/ender/StaticAppPage";
import { PretestAppPageProps } from "../../components/procedure/pages/PretestAppPage";
import { Question } from "../testinfra/questions/testQuestions";
import { StepMeta } from "./stepTypes";

// -------- TYPES RELATED TO PROOF SETUP --------
export interface LayoutProps {
  name: string;
  baseContent: () => Content;
  steps: StepMeta[];
  givens: StepMeta;
  proves: StepMeta;
  questions: Question[];
  shuffleQuestions: Question[];
  title: string;
}
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
