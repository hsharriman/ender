import { DefinitionTooltip } from "../components/DefinitionTooltip";
import { LinkedText } from "../components/LinkedText";
import { Content } from "../core/diagramContent";
import { BaseGeometryObject } from "../core/geometry/BaseGeometryObject";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../core/types/stepTypes";
import { Reason, SVGModes } from "../core/types/types";
import { Definition } from "./definitions";
import { Reasons } from "./reasons";

export const GIVEN_ID = "given";
export const PROVE_ID = "prove";

// TODO move linked and reasonFn to different place, or move all this type info to a diff place
export const linked = (
  val: string,
  obj: BaseGeometryObject,
  objs?: BaseGeometryObject[]
) => <LinkedText val={val} obj={obj} linkedObjs={objs} />;

export const tooltip = (obj: JSX.Element, definition: Definition) => (
  <DefinitionTooltip obj={obj} definition={definition} />
);

export const getReasonFn =
  (reasonMap: Map<string, Reason>) => (activeFrame: string) => {
    return reasonMap.get(activeFrame) || { title: "", body: "" };
  };

export const makeStepMeta = (meta: Partial<StepMeta>): StepMeta => {
  const defaultStaticText = () => <></>;
  const defaultAdditions = (props: StepFocusProps) => {};
  const defaultText = (ctx: Content) => <></>;
  const defaultUnfocused = (props: StepUnfocusProps) => {};
  const diagram = (ctx: Content, frame: string) => {
    const unfocusedProps = { ctx, frame };
    const additionProps = { ctx, frame, mode: SVGModes.Focused };
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
    staticText: meta.staticText || defaultStaticText,
    additions: meta.additions || defaultAdditions,
  };
};
