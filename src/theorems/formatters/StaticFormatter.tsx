import { StaticAppPage } from "../../components/StaticAppPage";
import { Content } from "../../core/objgraph";
import { Reason, StaticProofTextItem } from "../../core/types";
import { Reasons } from "../reasons";
import { Step, BaseStep, GIVEN_ID } from "../utils";
import { Question } from "../../questions/completeQuestions";

export interface StaticFormatterProps {
  baseContent: (showPoints: boolean, frame?: string) => Content;
  steps: Step[];
  givenCls: BaseStep;
  proveCls: BaseStep;
  questions: Question[];
}

export const StaticFormatter = (props: StaticFormatterProps) => {
  // build diagram from given construction
  const ctx = props.baseContent(true);
  ctx.addFrame(GIVEN_ID);
  props.givenCls.diagram(ctx, GIVEN_ID, false);

  const reasons: Reason[] = [];
  const texts: StaticProofTextItem[] = [];
  props.steps.map((step) => {
    texts.push({
      stmt: step.cls.staticText(),
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
      givenText={props.givenCls.staticText()}
      proveText={props.proveCls.staticText()}
      questions={props.questions}
    />
  );
};
