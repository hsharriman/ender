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
import { Reasons } from "./reasons";

export const GIVEN_ID = "given";
export const PROVE_ID = "prove";

export const colors = {
  lightblue: "rgb(56, 189, 248)", //sky-400
  blue: "rgb(59, 130, 246)", // blue-500
  purple: "rgb(139, 92, 246)", //purple-500
  lightpurple: "rgb(196, 181, 253)",
};

// TODO move linked and reasonFn to different place, or move all this type info to a diff place
export const linked = (
  val: string,
  obj: BaseGeometryObject,
  objs?: BaseGeometryObject[],
  clr?: string
) => <LinkedText val={val} obj={obj} linkedObjs={objs} clr={clr} />;

export const tooltip = (obj: JSX.Element, definition: Reason) => (
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

export const possibleStepAnswers = (s: number, e: number) => {
  let answers = [];
  for (let i = s; i <= e; i++) {
    answers.push("Step " + i);
  }
  return answers;
};
