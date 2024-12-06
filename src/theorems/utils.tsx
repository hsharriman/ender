import { Content } from "../core/diagramContent";
import {
  StepFocusProps,
  StepMeta,
  StepUnfocusProps,
} from "../core/types/stepTypes";
import { Reason, SVGModes } from "../core/types/types";
import { Reasons } from "./reasons";

export const GIVEN_ID = "given";
export const PROVE_ID = "prove";

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
      mode: SVGModes.Default,
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
