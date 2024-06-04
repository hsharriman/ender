import { LinkedText } from "../components/LinkedText";
import { BaseGeometryObject } from "../core/geometry/BaseGeometryObject";
import { Content } from "../core/objgraph";
import { Reason, SVGModes } from "../core/types";

export const GIVEN_ID = "given";
export const PROVE_ID = "prove";
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

export interface InPlaceLayoutProps {
  baseContent: (showPoints: boolean, frame?: string) => Content;
  steps: Step[];
  givens: StepMeta;
  proves: StepMeta;
  miniContent: Content;
}

export interface StaticLayoutProps {
  baseContent: (showPoints: boolean, frame?: string) => Content;
  steps: Step[];
  givens: StepMeta;
  proves: StepMeta;
}

export type LayoutProps = InPlaceLayoutProps & StaticLayoutProps;

// TODO move linked and reasonFn to different place, or move all this type info to a diff place
export const linked = (
  val: string,
  obj: BaseGeometryObject,
  objs?: BaseGeometryObject[]
) => <LinkedText val={val} obj={obj} linkedObjs={objs} />;

export const getReasonFn =
  (reasonMap: Map<string, Reason>) => (activeFrame: string) => {
    return reasonMap.get(activeFrame) || { title: "", body: "" };
  };

export interface StepMeta {
  unfocused: (props: StepUnfocusProps) => void;
  diagram: (ctx: Content, frame: string, inPlace?: boolean) => void;
  text: (props: StepTextProps) => JSX.Element;
  ticklessText: (ctx: Content) => JSX.Element;
  staticText: () => JSX.Element;
  additions: (props: StepFocusProps) => void;
}

export const makeStepMeta = (meta: Partial<StepMeta>): StepMeta => {
  const defaultStaticText = () => <></>;
  const defaultAdditions = (props: StepFocusProps) => {};
  const defaultText = (props: StepTextProps) => <></>;
  const defaultTicklessText = (ctx: Content) => <></>;
  const defaultUnfocused = (props: StepUnfocusProps) => {};
  const diagram = (ctx: Content, frame: string, inPlace = true) => {
    const unfocusedProps = { ctx, frame, inPlace };
    const additionProps = { ctx, frame, mode: SVGModes.Focused, inPlace };
    meta.unfocused
      ? meta.unfocused(unfocusedProps)
      : defaultUnfocused(unfocusedProps);
    meta.additions
      ? meta.additions(additionProps)
      : defaultAdditions(additionProps);
  };

  return {
    unfocused: meta.unfocused || defaultUnfocused,
    diagram,
    text: meta.text || defaultText,
    ticklessText: meta.ticklessText || defaultTicklessText,
    staticText: meta.staticText || defaultStaticText,
    additions: meta.additions || defaultAdditions,
  };
};
