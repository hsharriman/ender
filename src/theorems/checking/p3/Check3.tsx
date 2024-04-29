import { InPlaceFormatter } from "../../formatters/InPlaceFormatter";
import { LongFormFormatter } from "../../formatters/LongFormFormatter";
import { StaticFormatter } from "../../formatters/StaticFormatter";
import { Reasons } from "../../reasons";
import { PC3 } from "./pc3";

export class Check3 {
  private steps = [
    { cls: new PC3.S1(), reason: Reasons.Given },
    { cls: new PC3.S2(), reason: Reasons.Given },
    { cls: new PC3.S3(), reason: Reasons.Given },
    { cls: new PC3.S4(), reason: Reasons.Rectangle, dependsOn: [1] },
    { cls: new PC3.S5(), reason: Reasons.Reflexive },
    { cls: new PC3.S6(), reason: Reasons.SAS, dependsOn: [2, 4, 5] },
  ];
  inPlace = () => {
    return InPlaceFormatter({
      baseContent: PC3.baseContent,
      steps: this.steps,
      givenCls: new PC3.Givens(),
      proveCls: new PC3.Proves(),
      miniContent: PC3.miniContent,
    });
  };
  longForm = () => {
    return LongFormFormatter({
      baseContent: PC3.baseContent,
      steps: this.steps,
      givenCls: new PC3.Givens(),
      proveCls: new PC3.Proves(),
      miniContent: PC3.miniContent,
      reliesOn: PC3.reliesOnText,
    });
  };
  staticForm = () => {
    return StaticFormatter({
      baseContent: PC3.baseContent,
      steps: this.steps,
      givenCls: new PC3.Givens(),
      proveCls: new PC3.Proves(),
    });
  };
}
