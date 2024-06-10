import { Content } from "../../core/diagramContent";
import {
  SetupStepMeta,
  StaticProofTextItem,
  StepMeta,
} from "../../core/types/stepTypes";
import { Reason } from "../../core/types/types";
import { Question } from "../../questions/completeQuestions";
import { Reasons } from "../../theorems/reasons";
import { GIVEN_ID } from "../../theorems/utils";
import { StaticAppPage } from "../StaticAppPage";

export interface StaticLayoutProps {
  baseContent: (showPoints: boolean, frame?: string) => Content;
  steps: StepMeta[];
  givens: SetupStepMeta;
  proves: SetupStepMeta;
  questions: Question[];
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
      stmt: step.staticText(),
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
      proveText={props.proves.staticText()}
      questions={props.questions}
    />
  );
};
