import React from "react";
import { Content } from "../core/objgraph";
import { Point, Segment, Triangle } from "../core/geometry";
import { AppPage } from "../components/AppPage";
import { Obj, Vector } from "../core/types";
import { EuclideanBuilder } from "../components/geometry/EuclideanBuilder";
import { ProofItem } from "../components/ProofItem";
import { LinkedText } from "../components/LinkedText";
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
    const diagram = new EuclideanBuilder();
    const ACM = this.ctx.get("ACM", Obj.Triangle);
    const BDM = this.ctx.get("BDM", Obj.Triangle);
    diagram.triangle(ACM.p, ACM.s);
    diagram.triangle(BDM.p, BDM.s);
    return new ProofItem("Initial construction", diagram.contents());
  };

  step1 = () => {
    const diagram = new EuclideanBuilder();
    const prevFrame = this.defaultConstruction();
    const AM = this.ctx.get("AM", Obj.Segment);
    const BM = this.ctx.get("BM", Obj.Segment);
    const CM = this.ctx.get("CM", Obj.Segment);
    const DM = this.ctx.get("DM", Obj.Segment);
    diagram.batchAdd(prevFrame.svg);
    diagram.equalLength(AM.labeled(), 1);
    diagram.equalLength(BM.labeled(), 2);
    diagram.equalLength(CM.labeled(), 2);
    diagram.equalLength(DM.labeled(), 2);

    const text = (
      <span>
        <LinkedText val={"AM"} activeColor="lightblue" type={Obj.Segment} />
        {congruent}
        <LinkedText val={"BM"} activeColor="lightgreen" type={Obj.Segment} />
        {comma}
        <LinkedText val={"CM"} activeColor="magenta" type={Obj.Segment} />
        {congruent}
        <LinkedText val={"DM"} activeColor="red" type={Obj.Segment} />
      </span>
    );
    return new ProofItem(text, diagram.contents());
  };

  step2 = () => {
    const diagram = new EuclideanBuilder();
    const prevFrame = this.step1();
    diagram.batchAdd(prevFrame.svg);
    const AMC = this.ctx.get("AMC", Obj.Angle);
    const BMD = this.ctx.get("DMB", Obj.Angle);
    diagram.equalAngle(AMC.labeled(), 1);
    diagram.equalAngle(BMD.labeled(), 1);
    const text = (
      <span>
        <LinkedText val={"AMC"} activeColor="lightblue" type={Obj.Angle} />
        {congruent}
        <LinkedText val={"BMD"} activeColor="pink" type={Obj.Angle} />
      </span>
    );
    return new ProofItem(text, diagram.contents());
  };

  step3 = () => {
    const diagram = new EuclideanBuilder();
    const prevFrame = this.step2();
    diagram.batchAdd(prevFrame.svg);
    // TODO colors should be different
    const text = (
      <span>
        <LinkedText val={"AMC"} activeColor="lightblue" type={Obj.Triangle} />
        {congruent}
        <LinkedText val={"BMD"} activeColor="pink" type={Obj.Triangle} />
      </span>
    );
    return new ProofItem(text, diagram.contents());
  };

  step4 = () => {
    const diagram = new EuclideanBuilder();
    const prevFrame = this.step3();
    diagram.batchAdd(prevFrame.svg);

    const CAM = this.ctx.get("CAM", Obj.Angle);
    const DBM = this.ctx.get("DBM", Obj.Angle);
    diagram.equalAngle(CAM.labeled(), 1);
    diagram.equalAngle(DBM.labeled(), 1);
    const text = (
      <span>
        <LinkedText val={"AMC"} activeColor="lightblue" type={Obj.Triangle} />
        {congruent}
        <LinkedText val={"tBMD"} activeColor="pink" type={Obj.Triangle} />
      </span>
    );
    return new ProofItem(text, diagram.contents());
  };

  step5 = () => {
    const diagram = new EuclideanBuilder();
    const prevFrame = this.step4();
    diagram.batchAdd(prevFrame.svg);

    const AC = this.ctx.get("AC", Obj.Segment);
    const BD = this.ctx.get("BD", Obj.Segment);
    const ACmark = diagram.parallelMark(AC.labeled(), 1);
    const BDmark = diagram.parallelMark(BD.labeled(), 1);
    const cb1 = segmentCallback(this.ctx, diagram, "AC", "lightblue", ACmark);
    const cb2 = segmentCallback(this.ctx, diagram, "BD", "pink", BDmark);
    const text = (
      <span>
        <LinkedText
          val={"AC"}
          activeColor="lightblue"
          clickCallback={cb1}
          type={Obj.Segment}
        />
        {parallel}
        <LinkedText
          val={"BD"}
          activeColor="pink"
          clickCallback={cb2}
          type={Obj.Segment}
        />
      </span>
    );
    return new ProofItem(text, diagram.contents());
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

const segmentCallback =
  (
    ctx: Content,
    diagram: EuclideanBuilder,
    label: string,
    activeColor: string,
    tickIds: string[] = []
  ) =>
  (isActive: boolean) => {
    const seg = ctx.get(label, Obj.Segment);
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        ele.style.stroke = isActive ? activeColor : "black";
        ele.style.strokeWidth = isActive ? "3px" : "1px";
      }
    };
    const ele = diagram.getElement(Obj.Segment, seg.label);
    setStyle(ele);
    if (tickIds.length > 0)
      tickIds.map((id) => {
        setStyle(document.getElementById(id));
      });
  };

const angleCallback =
  (
    ctx: Content,
    diagram: EuclideanBuilder,
    label: string,
    activeColor: string
  ) =>
  (isActive: boolean) => {
    const angle = ctx.get(label, Obj.Angle);
    const segs = [
      ctx.get(label.slice(0, 1), Obj.Segment),
      ctx.get(label.slice(1, 2), Obj.Segment),
    ];
    const ele = diagram.getElement(Obj.Angle, label);
    const setStyle = (ele: HTMLElement | null) => {
      if (ele) {
        ele.style.stroke = isActive ? activeColor : "black";
        ele.style.strokeWidth = isActive ? "3px" : "1px";
      }
    };
    setStyle(ele);
    segs.map((seg) => {
      const ele = diagram.getElement(Obj.Segment, seg.label);
      setStyle(ele);
    });
  };
