import { DiagramContent } from "geometry-object";
import { InteractiveAppPageProps } from "../../components/ender/InteractiveAppPage";
import { StaticAppPageProps } from "../../components/ender/StaticAppPage";
import { StepMeta } from "./stepTypes";

// -------- TYPES RELATED TO PROOF SETUP --------

export enum AspectRatio {
  Square = "square",
  Portrait = "portrait",
  Landscape = "landscape",
}

export interface LayoutProps {
  name: string;
  baseContent: () => DiagramContent;
  steps: StepMeta[];
  givens: StepMeta;
  proves: StepMeta;
  title: string;
  diagramAspect: AspectRatio;
}
export interface Reason {
  title: string;
  body: string;
  src?: string;
}

export interface ProofMeta {
  layout: LayoutOptions;
  props: StaticAppPageProps | InteractiveAppPageProps;
}
type LayoutOptions = "static" | "interactive";
