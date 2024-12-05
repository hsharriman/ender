import { DefinitionTooltip } from "../components/ender/DefinitionTooltip";
import { LinkedText } from "../components/ender/LinkedText";
import { TextChip } from "../components/ender/TextChip";
import { Content } from "../core/diagramContent";
import { BaseGeometryObject } from "../core/geometry/BaseGeometryObject";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../core/types/stepTypes";
import { Obj, Reason, SVGModes } from "../core/types/types";
import { Reasons } from "./reasons";

export const GIVEN_ID = "given";
export const PROVE_ID = "prove";

export const colors = {
  lightblue: "rgb(56, 189, 248)", //sky-400
  blue: "rgb(59, 130, 246)", // blue-500
  purple: "rgb(139, 92, 246)", //purple-500
  lightpurple: "rgb(196, 181, 253)",
};

export enum BGColors {
  Purple = "bg-violet-700",
  Blue = "bg-violet-400",
}

// TODO move linked and reasonFn to different place, or move all this type info to a diff place
export const linked = (
  val: string,
  obj: BaseGeometryObject,
  objs?: BaseGeometryObject[],
  clr?: string
) => <LinkedText val={val} obj={obj} linkedObjs={objs} clr={clr} />;

export const chipText = (
  obj: Obj,
  s: string,
  clr: BGColors,
  isActive: boolean
) => {
  return <TextChip val={s} obj={obj} clr={clr} isActive={isActive} />;
};

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
  const defaultText: (isActive: boolean) => JSX.Element = (
    isActive: boolean
  ) => <></>;
  const defaultUnfocused = (props: StepUnfocusProps) => {
    if (meta.prevStep) {
      meta.prevStep.additions({
        ctx: props.ctx,
        frame: props.frame,
        mode: SVGModes.Unfocused,
      });
      meta.prevStep.unfocused(props);
    }
  };
  const diagram = (ctx: Content, frame: string, prevStep?: StepMeta) => {
    const additionProps = {
      ctx,
      frame,
      mode: SVGModes.Focused,
    };
    meta.unfocused
      ? meta.unfocused({ ctx, frame })
      : defaultUnfocused({ ctx, frame });
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
    highlight: meta.highlight,
  };
};

export const possibleStepAnswers = (s: number, e: number) => {
  let answers = [];
  for (let i = s; i <= e; i++) {
    answers.push("Step " + i);
  }
  return answers;
};
