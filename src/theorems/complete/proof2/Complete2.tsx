import { InPlaceFormatter } from "../../formatters/InPlaceFormatter";
import { LongFormFormatter } from "../../formatters/LongFormFormatter";
import { StaticFormatter } from "../../formatters/StaticFormatter";
import { Reasons } from "../../reasons";
import { P2 } from "./proof2";

export class Complete2 {
  private steps = [
    { cls: new P2.S1(), reason: Reasons.Given },
    { cls: new P2.S2(), reason: Reasons.PerpendicularLines, dependsOn: [1] },
    { cls: new P2.S3(), reason: Reasons.CongAdjAngles, dependsOn: [2] },
    { cls: new P2.S4(), reason: Reasons.Reflexive },
    {
      cls: new P2.S5(),
      reason: Reasons.ASA,
      dependsOn: [1, 3, 4],
    },
    { cls: new P2.S6(), reason: Reasons.CorrespondingSegments, dependsOn: [5] },
    { cls: new P2.S7(), reason: Reasons.Midpoint, dependsOn: [6] },
  ];
  longForm = () => {
    return LongFormFormatter({
      baseContent: P2.baseContent,
      steps: this.steps,
      givenCls: new P2.Givens(),
      proveCls: new P2.Proves(),
      miniContent: P2.miniContent,
      reliesOn: P2.reliesOnText,
    });
  };

  inPlace = () => {
    return InPlaceFormatter({
      baseContent: P2.baseContent,
      steps: this.steps,
      givenCls: new P2.Givens(),
      proveCls: new P2.Proves(),
      miniContent: P2.miniContent,
    });
  };
  staticForm = () => {
    return StaticFormatter({
      baseContent: P2.baseContent,
      steps: this.steps,
      givenCls: new P2.Givens(),
      proveCls: new P2.Proves(),
    });
  };
}
