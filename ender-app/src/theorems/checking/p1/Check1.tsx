import { InPlaceFormatter } from "../../formatters/InPlaceFormatter";
import { LongFormFormatter } from "../../formatters/LongFormFormatter";
import { Reasons } from "../../reasons";
import { PC1 } from "./pc1";

export class Check1 {
  private steps = [
    { cls: new PC1.S1(), reason: Reasons.Given },
    { cls: new PC1.S2(), reason: Reasons.Given },
    { cls: new PC1.S3(), reason: Reasons.Given },
    {
      cls: new PC1.S4(),
      reason: Reasons.SAS,
      dependsOn: [1, 2, 3],
    },
    {
      cls: new PC1.S5(),
      reason: Reasons.CorrespondingAngles,
      dependsOn: [4],
    },
  ];
  inPlace = () => {
    return InPlaceFormatter({
      baseContent: PC1.baseContent,
      steps: this.steps,
      givenCls: new PC1.Givens(),
      proveCls: new PC1.Proves(),
      miniContent: PC1.miniContent,
    });
  };
  longForm = () => {
    return LongFormFormatter({
      baseContent: PC1.baseContent,
      steps: this.steps,
      givenCls: new PC1.Givens(),
      proveCls: new PC1.Proves(),
      miniContent: PC1.miniContent,
      reliesOn: PC1.reliesOnText,
    });
  };
}
