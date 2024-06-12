import { Content } from "../../core/diagramContent";
import {
  StaticProofTextItem,
  Step,
  StepMeta,
} from "../../core/types/stepTypes";
import { Reason } from "../../core/types/types";
import { Question } from "../../questions/completeQuestions";
import { Reasons } from "../../theorems/reasons";
import { GIVEN_ID } from "../../theorems/utils";

export interface StaticLayoutProps {
  baseContent: (showPoints: boolean, frame?: string) => Content;
  steps: Step[];
  givens: StepMeta;
  proves: StepMeta;
  questions: Question[];
}

export const StaticLayout = (props: StaticLayoutProps, active: number) => {
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
    <></>
    // <StaticAppPage
    //   reasons={reasons}
    //   texts={texts}
    //   diagram={ctx.allSvgElements()(GIVEN_ID)}
    //   givenText={props.givens.staticText()}
    //   proveText={props.givens.staticText()}
    //   questions={props.questions}
    //   pageNum={active}
    // />
  );
};
