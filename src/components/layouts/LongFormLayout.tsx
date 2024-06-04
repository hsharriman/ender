import { Content } from "../../core/diagramContent";
import { Step, StepMeta, ProofTextItem } from "../../core/types/stepTypes";
import { Reason } from "../../core/types/types";
import { GIVEN_ID, PROVE_ID, getReasonFn } from "../../theorems/utils";
import { LongPage } from "../LongPage";

export interface LongFormFormatterProps {
  baseContent: (showPoints: boolean, frame?: string) => Content;
  steps: Step[];
  givenCls: StepMeta;
  proveCls: StepMeta;
  miniContent: Content;
  reliesOn: Map<string, string[]>;
}

export const LongFormLayout = (props: LongFormFormatterProps) => {
  const linkedTexts: ProofTextItem[] = [];
  // build given and prove info
  const givenCtx = props.baseContent(true, GIVEN_ID);
  props.givenCls.diagram(givenCtx, GIVEN_ID, true);

  const proveCtx = props.baseContent(true, PROVE_ID);
  props.proveCls.diagram(proveCtx, PROVE_ID, false);
  linkedTexts.push({
    k: GIVEN_ID,
    v: props.givenCls.ticklessText(givenCtx),
  });
  linkedTexts.push({
    k: GIVEN_ID,
    v: props.proveCls.ticklessText(givenCtx),
  });

  // build step info
  const svgElements: JSX.Element[][] = [];
  const frames: string[] = [];
  const reasonMap = new Map<string, Reason>();
  props.steps.map((step, i) => {
    const frame = `s${i + 1}`;
    const diagram = props.baseContent(true, frame);
    step.meta.diagram(diagram, frame, false);

    linkedTexts.push({
      k: frame,
      v: step.meta.text({ ctx: diagram, frame }),
      reason: step.reason.title,
    });

    reasonMap.set(frame, step.reason);

    svgElements.push(diagram.allSvgElements()(frame));

    frames.push(frame);
  });

  return (
    <LongPage
      proofText={linkedTexts}
      svgElements={svgElements}
      reasonText={getReasonFn(reasonMap)}
      givenSvg={givenCtx.allSvgElements(true)(GIVEN_ID)}
      frames={frames}
      miniSvgElements={props.miniContent.allSvgElements(true)}
      reliesOn={props.reliesOn}
    />
  );
};
