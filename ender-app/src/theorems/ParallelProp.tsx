import React from "react";
import { Content } from "../core/objgraph";
import { Point, Segment, Triangle } from "../core/geometry";
import { AppPage } from "../components/AppPage";
import { Obj, Vector } from "../core/types";
import { ProofItem } from "../components/ProofItem";
import { congruent, parallel, comma } from "../core/geometryText";

export class ParallelProp extends React.Component {
  private ctx: Content;
  private coords: Vector[][] = [
    [
      [1, 4],
      [7, 0],
      [0, 1],
      [8, 3],
      [4, 2],
    ],
  ];
  constructor(props: any) {
    super(props);
    this.ctx = this.construction();
    this.state = {
      style: {},
    };
  }
  construction = () => {
    let ctx = new Content();
    const labels = ["A", "B", "C", "D", "M"];
    const pts = this.coords[0];
    const [A, B, C, D, M] = pts.map((c, i) =>
      ctx.push(new Point({ pt: c, label: labels[i] }))
    );

    [
      new Triangle({ pts: [A, C, M] }, ctx),
      new Triangle({ pts: [B, D, M] }, ctx),
    ].map((t) => ctx.push(t));
    return ctx;
  };

  defaultConstruction = () => {
    this.ctx.addFrame("0", []);
    const ACM = this.ctx.get("ACM", Obj.Triangle);
    const BDM = this.ctx.get("BDM", Obj.Triangle);
    this.ctx.batchAdd("0", ACM.svg(0));
    this.ctx.batchAdd("0", BDM.svg(0));
    return new ProofItem("Initial construction", this.ctx.getFrame("0"));
  };

  step1 = () => {
    // TODO needs the "reason"
    const AM = this.ctx.get("AM", Obj.Segment);
    const BM = this.ctx.get("BM", Obj.Segment);
    const CM = this.ctx.get("CM", Obj.Segment);
    const DM = this.ctx.get("DM", Obj.Segment);

    this.ctx.addFrame("1", this.ctx.getFrame("0"));
    this.ctx.batchAdd(
      "1",
      [
        // for now, stores in AM object and returns SVG (not stored)
        AM.equalLengthMark(1, 1),
        BM.equalLengthMark(1, 1),
        CM.equalLengthMark(2, 1),
        DM.equalLengthMark(2, 1),
      ].flat()
    );

    const text = (
      <span>
        {AM.linkedText("AM")}
        {congruent}
        {BM.linkedText("BM")}
        {comma}
        {CM.linkedText("CM")}
        {congruent}
        {DM.linkedText("DM")}
      </span>
    );
    return new ProofItem(text, this.ctx.getFrame("1"));
  };

  step2 = () => {
    this.ctx.addFrame("2", this.ctx.getFrame("1"));
    const AMC = this.ctx.get("AMC", Obj.Angle);
    const BMD = this.ctx.get("DMB", Obj.Angle);
    this.ctx.batchAdd(
      "2",
      [AMC.equalAngleMark(1, 2), BMD.equalAngleMark(1, 2)].flat()
    );

    const text = (
      <span>
        {AMC.linkedText("AMC")}
        {congruent}
        {BMD.linkedText("BMD")}
      </span>
    );
    return new ProofItem(text, this.ctx.getFrame("2"));
  };

  step3 = () => {
    this.ctx.addFrame("3", this.ctx.getFrame("2"));
    const AMC = this.ctx.get("AMC", Obj.Triangle);
    const BMD = this.ctx.get("BMD", Obj.Triangle);

    // TODO triangle highlighting
    const text = (
      <span>
        {AMC.linkedText("AMC")}
        {congruent}
        {BMD.linkedText("BMD")}
      </span>
    );
    return new ProofItem(text, this.ctx.getFrame("3"));
  };

  step4 = () => {
    this.ctx.addFrame("4", this.ctx.getFrame("3"));

    const CAM = this.ctx.get("CAM", Obj.Angle);
    const DBM = this.ctx.get("DBM", Obj.Angle);
    this.ctx.batchAdd(
      "4",
      [CAM.equalAngleMark(2, 4), DBM.equalAngleMark(2, 4)].flat()
    );
    const text = (
      <span>
        {CAM.linkedText("CAM")}
        {congruent}
        {DBM.linkedText("DBM")}
      </span>
    );
    return new ProofItem(text, this.ctx.getFrame("4"));
  };

  step5 = () => {
    this.ctx.addFrame("5", this.ctx.getFrame("4"));

    const AC = this.ctx.get("AC", Obj.Segment);
    const BD = this.ctx.get("BD", Obj.Segment);
    this.ctx.batchAdd("5", [AC.parallel(1, 5), BD.parallel(1, 5)].flat());
    const text = (
      <span>
        {AC.linkedText("AC")}
        {parallel}
        {BD.linkedText("BD")}
      </span>
    );
    return new ProofItem(text, this.ctx.getFrame("5"));
  };

  steps = () => {
    return [
      this.defaultConstruction(),
      this.step1(),
      this.step2(),
      this.step3(),
      this.step4(),
      this.step5(),
    ];
  };

  render() {
    return (
      <AppPage
        problemText={
          "As shown, AB and CD intersect at point M, AM = BM and CM = DM; then, must AC and DB be parallel with each other?"
        }
        proof={this.steps()}
        onResample={function (): void {
          throw new Error("Function not implemented.");
        }}
        onClickCanvas={function (): void {
          throw new Error("Function not implemented.");
        }}
      />
    );
  }

  problem = () => {
    return ``;
  };
}
