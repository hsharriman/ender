import { StaticAppPage } from "../../components/StaticAppPage";
import { Reason, StaticProofTextItem } from "../../core/types";
import { Reasons } from "../reasons";
import { GIVEN_ID, StaticLayoutProps } from "../utils";

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
