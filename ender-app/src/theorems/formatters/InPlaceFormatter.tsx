import { AppPage } from "../../components/AppPage";
import { Content } from "../../core/objgraph";
import { ProofTextItem, Reason } from "../../core/types";
import { BaseStep, GIVEN_ID, PROVE_ID, Step, getReasonFn } from "../utils";

export interface InPlaceFormatterProps {
  baseContent: (showPoints: boolean, frame?: string) => Content;
  steps: Step[];
  givenCls: BaseStep;
  proveCls: BaseStep;
  miniContent: Content;
}

export const InPlaceFormatter = (props: InPlaceFormatterProps) => {
  let ctx = props.baseContent(true);

  // GIVEN
  ctx.addFrame(GIVEN_ID);
  props.givenCls.diagram(ctx, GIVEN_ID, false);

  // PROVE
  ctx.addFrame(PROVE_ID);
  props.proveCls.diagram(ctx, PROVE_ID, true);

  const linkedTexts: ProofTextItem[] = [];
  linkedTexts.push({
    k: GIVEN_ID,
    v: props.givenCls.ticklessText(ctx),
    alwaysActive: true,
  });
  linkedTexts.push({
    k: PROVE_ID,
    v: props.proveCls.text(ctx),
    alwaysActive: true,
  });

  const reasonMap = new Map<string, Reason>();
  props.steps.map((step, i) => {
    let textMeta = {};
    const s = ctx.addFrame(`s${i + 1}`);
    step.cls.diagram(ctx, s, true);
    if (step.dependsOn) {
      const depIds = step.dependsOn.map((i) => `s${i}`);
      ctx.reliesOn(s, depIds);
      textMeta = { dependsOn: new Set(depIds) };
    }
    reasonMap.set(s, step.reason);
    linkedTexts.push({
      ...textMeta,
      k: s,
      v: step.cls.text(ctx),
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
    />
  );
};
