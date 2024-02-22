import React from "react";
import Card from "../components/Card";
import { Angle, Point, Segment, Triangle } from "../core/geometry";
import { EuclideanBuilder } from "../components/geometry/EuclideanBuilder";
import { Obj } from "../core/types";
import { Content } from "../core/objgraph";

// TODO some top level state that tracks all the color customizations
// currently in the doc and passes them down
export class AngleBisector extends React.Component {
  private ctx: Content;
  constructor(props: any) {
    super(props);
    this.ctx = this.construction();
    this.state = {
      style: {},
    };
  }
  private construction = () => {
    let ctx = new Content();
    // TODO define params for construction that other proofs can use
    // initialize points
    const labels = ["A", "B", "C", "D", "E"];
    const coords: [number, number][] = [
      [4.501, 3.001],
      [0, 0],
      [8, 0],
      [4, 0],
      [9, 6],
    ];
    const [A, B, C, D, E] = coords.map((c, i) =>
      ctx.push(new Point({ pt: c, label: labels[i] }))
    );

    // define triangles?
    // eventually it would be nice to just name the triangles without needing the pts defined first?
    const triangles = [
      new Triangle({ pts: [B, A, D] }, ctx),
      new Triangle({ pts: [D, A, C] }, ctx),
      new Triangle({ pts: [A, C, E] }, ctx),
    ];
    triangles.map((t) => ctx.push(t));
    // tBAD, tDAC colored red
    return ctx;
  };

  frame1 = () => {
    // const [tBAD, tDAC] = this.construction();
    this.ctx = this.construction();
    const tBAD = this.ctx.get("BAD", Obj.Triangle);
    const tDAC = this.ctx.get("DAC", Obj.Triangle);

    const diagram = new EuclideanBuilder();
    diagram.triangle(tBAD.p, tBAD.s);
    diagram.triangle(tDAC.p, tDAC.s);
    return diagram.contents();
  };

  frame2 = () => {
    const tACE = this.ctx.get("ACE", Obj.Triangle);
    const diagram = new EuclideanBuilder(this.frame1());
    diagram.triangle(tACE.p, tACE.s); // TODO labeled triangle?

    const AD = this.ctx.get("AD", Obj.Segment);
    const CE = this.ctx.get("CE", Obj.Segment);
    diagram.parallelMark(AD.labeled(), 1);
    diagram.parallelMark(CE.labeled(), 1);
    return diagram.contents();
  };

  frame3 = (useFrame: boolean) => {
    let diagram = new EuclideanBuilder();
    if (useFrame) {
      diagram = new EuclideanBuilder(this.frame2());
    }
    const AD = this.ctx.get("AD", Obj.Segment);
    const CE = this.ctx.get("CE", Obj.Segment);
    const AC = this.ctx.get("AC", Obj.Segment);
    const A = this.ctx.get("DAC", Obj.Angle);
    const C = this.ctx.get("ACE", Obj.Angle);
    const oppAngle = new Book1Prop29().construction([AD, CE], AC, A, C); // TODO also eww
    diagram.batchAdd(oppAngle);
    return diagram.contents();
  };

  frame4 = () => {
    const diagram = new EuclideanBuilder(this.frame3(true));
    const A = this.ctx.get("BAD", Obj.Angle);
    diagram.equalAngle(A.labeled(), 1);
    return diagram.contents();
  };

  frame5 = (useFrame: boolean) => {
    let diagram = new EuclideanBuilder();
    if (useFrame) {
      diagram = new EuclideanBuilder(this.frame4());
    }
    // diagram.addLine({start: , end: ,key, style})
    const AD = this.ctx.get("AD", Obj.Segment);
    const CE = this.ctx.get("CE", Obj.Segment);
    const AE = this.ctx.get("AE", Obj.Segment);
    const A = this.ctx.get("BAD", Obj.Angle);
    const E = this.ctx.get("AEC", Obj.Angle);
    // instance where we need segment BE which i did not define initially.
    const correspAngle = new Book1Prop29().construction([AD, CE], AE, A, E); // TODO also eww
    diagram.batchAdd(correspAngle);
    return diagram.contents();
  };

  frame6 = (useFrame: boolean) => {
    let diagram = new EuclideanBuilder();
    if (useFrame) {
      diagram = new EuclideanBuilder(this.frame5(true));
    }
    const tACE = this.ctx.get("ACE", Obj.Triangle);
    const C = this.ctx.get("ACE", Obj.Angle);
    const E = this.ctx.get("AEC", Obj.Angle);
    const AC = this.ctx.get("AC", Obj.Segment);
    const AE = this.ctx.get("AE", Obj.Segment);
    const isos = new AASTheorem().construction(tACE, [C, E], AC, AE);
    diagram.batchAdd(isos);
    return diagram.contents();
  };

  frame7 = () => {
    // TODO currently can fetch JSX.Elements from the diagram
    // but the elements cannot have their styles updated after creation
    // would be nice to avoid having to recreate diagram for styling changes
    const diagram = new EuclideanBuilder(this.frame6(true));
    const colors = ["orange", "lightblue", "lightgreen", "red"];
    ["BA", "BD", "DC", "AC"].map((label, i) => {
      const seg = this.ctx.segByLabel(label);
      diagram.setStyle(diagram.getId(Obj.Segment, seg.label), {
        stroke: colors[i],
      });
    });
    return diagram.contents();
  };

  render() {
    return (
      <div className="flex justify-center flex-row w-full flex-wrap">
        <Card idx={1} text={"Initial construction"} content={this.frame1} />
        <Card
          idx={2}
          text={"Add point E s.t. it makes a parallel line"}
          content={this.frame2}
        />
        <Card
          idx={3}
          text={"By opposite angle theorem"}
          content={() => this.frame3(true)}
          miniContent={() => this.frame3(false)}
        />
        <Card idx={4} text={"By hypothesis"} content={this.frame4} />
        <Card
          idx={5}
          text={"By parallelism implies corresponding angles"}
          content={() => this.frame5(true)}
          miniContent={() => this.frame5(false)}
        />
        <Card
          idx={6}
          text={"By AAS Theorem ACE is isosceles"}
          content={() => this.frame6(true)}
          miniContent={() => this.frame6(false)}
        />
        <Card
          idx={7}
          text={"Mini opposite angle"}
          content={() => this.frame3(false)}
        />
        <Card
          idx={8}
          text={"Mini corresponding angle"}
          content={() => this.frame5(false)}
        />
        <Card idx={8} text={"AAS repr"} content={() => this.frame6(false)} />

        <Card
          idx={9}
          text={"By AAS Theorem ACE is isosceles"}
          content={this.frame7}
        />
        {/* <Card idx={8} text={"minimap"} content={this.frame6} /> */}
      </div>
    );
  }
}

class Book1Prop29 {
  // parallelism implies corresponding angles
  construction(
    parallels: [Segment, Segment],
    s3: Segment,
    a1: Angle,
    a2: Angle
  ) {
    // TODO, currently the same as OppositeAngleTheorem
    // 2 lines are parallel
    const [s1, s2] = parallels;
    const diagram = new EuclideanBuilder();
    diagram.segment(s1.labeled());
    diagram.segment(s2.labeled());
    diagram.segment(s3.labeled());

    diagram.parallelMark(s1.labeled(), 1);
    diagram.parallelMark(s2.labeled(), 1);

    diagram.equalAngle(a1.labeled(), 1);
    diagram.equalAngle(a2.labeled(), 1);
    return diagram.contents();
  }

  renderConstruction() {
    // display the relevant objects to the construction
  }
}

class AASTheorem {
  construction = (
    t: Triangle,
    angles: [Angle, Angle],
    s1: Segment,
    s2: Segment
  ) => {
    // TODO can make this not take so many parameters if t holds more information
    const [a1, a2] = angles;
    const diagram = new EuclideanBuilder();
    diagram.triangle(t.p, t.s);
    diagram.equalAngle(a1.labeled(), 1);
    diagram.equalAngle(a2.labeled(), 1);
    diagram.equalLength(s1.labeled(), 1);
    diagram.equalLength(s2.labeled(), 1);
    return diagram.contents();
  };
}
