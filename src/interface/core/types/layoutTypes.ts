import { ProofContent } from "geometry-object";
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
  baseContent: () => ProofContent;
  steps: StepMeta[];
  givens: StepMeta;
  proves: StepMeta;
  title: string;
  diagramAspect: AspectRatio;
}
export interface ProofMeta {
  layout: LayoutOptions;
  props: StaticAppPageProps | InteractiveAppPageProps;
}
type LayoutOptions = "static" | "interactive";
