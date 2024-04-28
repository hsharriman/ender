import { InPlaceFormatter } from "../../formatters/InPlaceFormatter";
import { LongFormFormatter } from "../../formatters/LongFormFormatter";
import { Reasons } from "../../reasons";
import { P3 } from "./proof3";

export class Complete3 {
  private steps = [
    { cls: new P3.S1(), reason: Reasons.Given },
    { cls: new P3.S2(), reason: Reasons.PerpendicularLines },
    { cls: new P3.S3(), reason: Reasons.Reflexive },
    { cls: new P3.S4(), reason: Reasons.ASA, dependsOn: [1, 2, 3] },
    {
      cls: new P3.S5(),
      reason: Reasons.CorrespondingSegments,
      dependsOn: [4],
    },
    { cls: new P3.S6(), reason: Reasons.Midpoint, dependsOn: [5] },
  ];
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
    });
  };
}
