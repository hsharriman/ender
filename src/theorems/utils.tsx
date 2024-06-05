import { LinkedText } from "../components/LinkedText";
import { Content } from "../core/diagramContent";
import { BaseGeometryObject } from "../core/geometry/BaseGeometryObject";
import {
  StepFocusProps,
  StepMeta,
  StepTextProps,
  StepUnfocusProps,
} from "../core/types/stepTypes";
import { Reason, SVGModes } from "../core/types/types";
import { Reasons } from "./reasons";

export const GIVEN_ID = "given";
export const PROVE_ID = "prove";

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
    reason: meta.reason || Reasons.Empty,
    dependsOn: meta.dependsOn,
    unfocused: meta.unfocused || defaultUnfocused,
    diagram,
    text: meta.text || defaultText,
    ticklessText: meta.ticklessText || defaultTicklessText,
    staticText: meta.staticText || defaultStaticText,
    additions: meta.additions || defaultAdditions,
  };
};
