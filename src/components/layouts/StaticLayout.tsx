import { StaticAppPage } from "../StaticAppPage";
import { Reason } from "../../core/types/types";
import { Reasons } from "../../theorems/reasons";
import { GIVEN_ID } from "../../theorems/utils";
import { Content } from "../../core/diagramContent";
import {
  Step,
  StepMeta,
  StaticProofTextItem,
} from "../../core/types/stepTypes";

export interface StaticLayoutProps {
  baseContent: (showPoints: boolean, frame?: string) => Content;
  steps: Step[];
  givens: StepMeta;
  proves: StepMeta;
}

export const StaticLayout = (props: StaticLayoutProps) => {
  // build diagram from given construction
  const ctx = props.baseContent(true);
  ctx.addFrame(GIVEN_ID);
  props.givens.diagram(ctx, GIVEN_ID, false);

  const reasons: Reason[] = [];
  const texts: StaticProofTextItem[] = [];
  props.steps.map((step) => {
    texts.push({
      stmt: step.meta.staticText(),
      reason: step.reason.title,
    });
    if (step.reason.body !== "" && step.reason.title !== Reasons.Given.title) {
      reasons.push(step.reason);
    }
  });
  return (
    <StaticAppPage
      reasons={reasons}
      texts={texts}
      diagram={ctx.allSvgElements()(GIVEN_ID)}
      givenText={props.givens.staticText()}
      proveText={props.givens.staticText()}
    />
  );
};
