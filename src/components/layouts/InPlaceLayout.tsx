import { Content } from "../../core/diagramContent";
import { ProofTextItem, Step, StepMeta } from "../../core/types/stepTypes";
import { Reason } from "../../core/types/types";
import { Question } from "../../questions/completeQuestions";
import { GIVEN_ID, PROVE_ID, getReasonFn } from "../../theorems/utils";
import { AppPage } from "../InteractiveAppPage";

export interface InPlaceLayoutProps {
  baseContent: (showPoints: boolean, frame?: string) => Content;
  steps: Step[];
  givens: StepMeta;
  proves: StepMeta;
  miniContent: Content;
  questions: Question[];
}

export const InPlaceLayout = (props: InPlaceLayoutProps) => {
  let ctx = props.baseContent(true);

  // GIVEN
  ctx.addFrame(GIVEN_ID);
  props.givens.diagram(ctx, GIVEN_ID, false);

  // PROVE
  ctx.addFrame(PROVE_ID);
  props.proves.diagram(ctx, PROVE_ID, true);

  const linkedTexts: ProofTextItem[] = [];
  linkedTexts.push({
    k: GIVEN_ID,
    v: props.givens.ticklessText(ctx),
    alwaysActive: true,
  });
  linkedTexts.push({
    k: PROVE_ID,
    v: props.proves.text({ ctx }),
    alwaysActive: true,
  });

  const reasonMap = new Map<string, Reason>();
  props.steps.map((step, i) => {
    let textMeta = {};
    const s = ctx.addFrame(`s${i + 1}`);
    step.meta.diagram(ctx, s, true);
    if (step.dependsOn) {
      const depIds = step.dependsOn.map((i) => `s${i}`);
      ctx.reliesOn(s, depIds);
      textMeta = { dependsOn: new Set(depIds) };
    }
    reasonMap.set(s, step.reason);
    linkedTexts.push({
      ...textMeta,
      k: s,
      v: step.meta.text({ ctx }),
      reason: step.reason.title,
    });
  });

  return (
    <AppPage
      proofText={linkedTexts}
      svgElements={ctx.allSvgElements()}
      reasonText={getReasonFn(reasonMap)}
      miniSvgElements={props.miniContent.allSvgElements(true)}
      reliesOn={ctx.getReliesOn()}
      onClickCanvas={function (): void {
        throw new Error("Function not implemented.");
      }}
      questions={props.questions}
    />
  );
};
