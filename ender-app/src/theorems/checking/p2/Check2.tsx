import { InPlaceFormatter } from "../../formatters/InPlaceFormatter";
import { LongFormFormatter } from "../../formatters/LongFormFormatter";
import { Reasons } from "../../reasons";
import { PC2 } from "./pc2";

export class Check2 {
  private steps = [
    { cls: new PC2.S1(), reason: Reasons.Given },
    { cls: new PC2.S2(), reason: Reasons.Given },
    { cls: new PC2.S3(), reason: Reasons.CongAdjAngles, dependsOn: [1] },
    { cls: new PC2.S4(), reason: Reasons.Reflexive },
    { cls: new PC2.S5(), reason: Reasons.SAS, dependsOn: [2, 3, 4] },
  ];
  inPlace = () => {
    return InPlaceFormatter({
      baseContent: PC2.baseContent,
      steps: this.steps,
      givenCls: new PC2.Givens(),
      proveCls: new PC2.Proves(),
      miniContent: PC2.miniContent,
    });
  };
  longForm = () => {
    return LongFormFormatter({
      baseContent: PC2.baseContent,
      steps: this.steps,
      givenCls: new PC2.Givens(),
      proveCls: new PC2.Proves(),
      miniContent: PC2.miniContent,
      reliesOn: PC2.reliesOnText,
    });
  };
}
