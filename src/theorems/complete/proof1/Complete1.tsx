import { InPlaceFormatter } from "../../formatters/InPlaceFormatter";
import { LongFormFormatter } from "../../formatters/LongFormFormatter";
import { StaticFormatter } from "../../formatters/StaticFormatter";
import { Reasons } from "../../reasons";
import { P1 } from "./proof1";
import { completeProof1 } from "../../../questions/completeQuestions";

export class Complete1 {
  private steps = [
    { cls: new P1.S1(), reason: Reasons.Given },
    { cls: new P1.S2(), reason: Reasons.Given },
    {
      cls: new P1.S3(),
      reason: Reasons.VerticalAngles,
      dependsOn: [2],
    },
    { cls: new P1.S4(), reason: Reasons.SAS, dependsOn: [1, 3] },
    {
      cls: new P1.S5(),
      reason: Reasons.CorrespondingAngles,
      dependsOn: [4],
    },
    {
      cls: new P1.S6(),
      reason: Reasons.AlternateInteriorAngles,
      dependsOn: [5],
    },
  ];
  private questions = completeProof1;
  inPlace = () => {
    return InPlaceFormatter({
      baseContent: P1.baseContent,
      steps: this.steps,
      givenCls: new P1.Givens(),
      proveCls: new P1.Proves(),
      miniContent: P1.miniContent,
      questions: this.questions,
    });
  };
  longForm = () => {
    return LongFormFormatter({
      baseContent: P1.baseContent,
      steps: this.steps,
      givenCls: new P1.Givens(),
      proveCls: new P1.Proves(),
      miniContent: P1.miniContent,
      reliesOn: P1.reliesOnText,
    });
  };
  staticForm = () => {
    return StaticFormatter({
      baseContent: P1.baseContent,
      steps: this.steps,
      givenCls: new P1.Givens(),
      proveCls: new P1.Proves(),
      questions: this.questions,
    });
  };
}
