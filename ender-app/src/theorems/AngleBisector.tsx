import React from "react";
import Card from "../components/Card";
import { Angle, Point, Segment, Triangle } from "../core/geometry";
import {
  EuclideanBuilder,
  ObjectType,
} from "../components/geometry/EuclideanBuilder";
interface obj {
  points: number[][]; // arr of 2d points
  type: string;
  direction?: number; // for angles
}

let objMap = new Map<string, obj>(); // map of id to objects
// something like "aACE"->{type: angle, id: xyz, data: angle data like p1,p2,p3,min}

export class AngleBisector extends React.Component {
  private construction = () => {
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
    const [A, B, C, D, E] = coords.map(
      (c, i) => new Point({ pt: c, label: labels[i] })
    );

    // define triangles?
    // eventually it would be nice to just name the triangles without needing the pts defined first?
    const [tBAD, tDAC, tACE] = [
      new Triangle({ p1: B, p2: A, p3: D }),
      new Triangle({ p1: D, p2: A, p3: C }),
      new Triangle({ p1: A, p2: C, p3: E }),
    ];
    // TODO return a map of all objects in the construction?
    return [tBAD, tDAC, tACE];
    // tBAD, tDAC colored red
  };

  // array of steps
  // proof = (): ProofStep[] => {
  proof = () => {
    return [
      // 1, add triangle
      // tACE.show()
      // 2, opp angle theorem
      // equalangle(a ace, a cad), mini: oppositeAngleTheorem(AD, CE, AC, aACE, aCAD)
      // 3, by hypothesis
      // equalangle(aCAD, aBAD)
      // 4, parallelism implies = corresponding angles
      // book1Prop29()
      // 5, isosceles triangle
      // 6, ratios
    ];
  };

  frame1 = () => {
    const [tBAD, tDAC] = this.construction();
    const diagram = new EuclideanBuilder();
    diagram.triangle(tBAD.getLabeledPts());
    diagram.triangle(tDAC.getLabeledPts());
    return diagram.contents();
  };

  frame2 = () => {
    const [tBAD, , tACE] = this.construction();
    const diagram = new EuclideanBuilder(this.frame1());
    diagram.triangle(tACE.getLabeledPts());
    diagram.parallelMark(tBAD.s23.getLabeledPts(), 1); // TODO still not great
    diagram.parallelMark(tACE.s23.getLabeledPts(), 1);
    return diagram.contents();
  };

  frame3 = () => {
    const [tBAD, tDAC, tACE] = this.construction();
    const diagram = new EuclideanBuilder(this.frame2());
    const oppAngle = new Book1Prop29().construction(
      [tBAD.s23, tACE.s23],
      tACE.s12,
      tDAC.a2,
      tACE.a2
    ); // TODO also eww
    diagram.batchAdd(oppAngle);
    return diagram.contents();
  };

  frame4 = () => {
    const [tBAD, ,] = this.construction();
    const diagram = new EuclideanBuilder(this.frame3());
    diagram.equalAngle(tBAD.a2.getLabeledAngle(), 1);
    return diagram.contents();
  };

  frame5 = () => {
    const [tBAD, , tACE] = this.construction();
    const diagram = new EuclideanBuilder(this.frame4());
    // instance where we need segment BE which i did not define initially.
    const correspAngle = new Book1Prop29().construction(
      [tBAD.s23, tACE.s23],
      tACE.s12,
      tBAD.a2,
      tACE.a3
    ); // TODO also eww
    diagram.batchAdd(correspAngle);
    console.log(correspAngle);
    return diagram.contents();
  };

  frame6 = () => {
    const [, , tACE] = this.construction();
    const diagram = new EuclideanBuilder(this.frame5());
    const isos = new AASTheorem().construction(
      tACE,
      [tACE.a2, tACE.a3],
      tACE.s12,
      tACE.s13
    );
    diagram.batchAdd(isos);
    return diagram.contents();
  };

  frame7 = () => {
    // TODO currently can fetch JSX.Elements from the diagram
    // but the elements cannot have their styles updated after creation
    // would be nice to avoid having to recreate diagram for styling changes
    const diagram = new EuclideanBuilder(this.frame6());
    const colors = ["orange", "lightblue", "lightgreen", "red"];
    ["BA", "BD", "DC", "AC"].map((label, i) => {
      let elem = diagram.getExistingElement(
        diagram.getId(ObjectType.Segment, label)
      );
      elem.props.style = {
        stroke: colors[i],
      };
    });
    return diagram.contents();
  };

  render() {
    return (
      <div>
        <Card idx={1} text={"Initial construction"} content={this.frame1} />
        <Card
          idx={2}
          text={"Add point E s.t. it makes a parallel line"}
          content={this.frame2}
        />
        <Card
          idx={3}
          text={"By opposite angle theorem"}
          content={this.frame3}
        />
        <Card idx={4} text={"By hypothesis"} content={this.frame4} />
        <Card
          idx={5}
          text={"By parallelism implies corresponding angles"}
          content={this.frame5}
        />
        <Card
          idx={6}
          text={"By AAS Theorem ACE is isosceles"}
          content={this.frame6}
        />
        {/* <Card
          idx={7}
          text={"By AAS Theorem ACE is isosceles"}
          content={this.frame7}
        /> */}
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
    diagram.segment(s1.p1, s1.p2);
    diagram.segment(s2.p1, s2.p2);
    diagram.segment(s3.p1, s3.p2);

    diagram.parallelMark(s1.getLabeledPts(), 1);
    diagram.parallelMark(s2.getLabeledPts(), 1);

    diagram.equalAngle(a1.getLabeledAngle(), 1);
    diagram.equalAngle(a2.getLabeledAngle(), 1);
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
    diagram.triangle(t.getLabeledPts());
    diagram.equalAngle(a1.getLabeledAngle(), 1);
    diagram.equalAngle(a2.getLabeledAngle(), 1);
    diagram.equalLength(s1.getLabeledPts(), 1);
    diagram.equalLength(s2.getLabeledPts(), 1);
    return diagram.contents();
  };
}
