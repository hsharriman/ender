import { InPlaceFormatter } from "../../formatters/InPlaceFormatter";
import { LongFormFormatter } from "../../formatters/LongFormFormatter";
import { StaticFormatter } from "../../formatters/StaticFormatter";
import { Reasons } from "../../reasons";
import { P3 } from "./proof3";
import { completeProof3 } from "../../../questions/completeQuestions";

export class Complete3 {
  private steps = [
    { cls: new P3.S1(), reason: Reasons.Given },
    { cls: new P3.S2(), reason: Reasons.Given },
    { cls: new P3.S3(), reason: Reasons.Rectangle, dependsOn: [1] },
    { cls: new P3.S4(), reason: Reasons.Parallelogram, dependsOn: [3] },
    {
      cls: new P3.S5(),
      reason: Reasons.SAS,
      dependsOn: [2, 3, 4],
    },
    { cls: new P3.S6(), reason: Reasons.CorrespondingSegments, dependsOn: [5] },
    { cls: new P3.S7(), reason: Reasons.Isosceles, dependsOn: [6] },
  ];

  private questions = completeProof3;

  longForm = () => {
    return LongFormFormatter({
      baseContent: P3.baseContent,
      steps: this.steps,
      givenCls: new P3.Givens(),
      proveCls: new P3.Proves(),
      miniContent: P3.miniContent,
      reliesOn: P3.reliesOnText,
    });
  };

  inPlace = () => {
    return InPlaceFormatter({
      baseContent: P3.baseContent,
      steps: this.steps,
      givenCls: new P3.Givens(),
      proveCls: new P3.Proves(),
      miniContent: P3.miniContent,
      questions: this.questions,
    });
  };

  staticForm = () => {
    return StaticFormatter({
      baseContent: P3.baseContent,
      steps: this.steps,
      givenCls: new P3.Givens(),
      proveCls: new P3.Proves(),
      questions: this.questions,
    });
  };
}
