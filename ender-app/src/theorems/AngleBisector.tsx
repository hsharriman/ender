import React from "react";
import { equalAngle, parallel } from "../core/checks";
import Card from "../components/Card";
import { Angle, Point, Segment, Triangle } from "../core/geometry";
import { EuclideanBuilder } from "../components/geometry/EuclideanBuilder";
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
    const coords: [number, number][] = [[4.501, 3.001], [0., 0.], [8., 0.], [4., 0.], [9., 6.]];
    const [A, B, C, D, E] = coords.map((c,i) => new Point({pt: c, label: labels[i]}));

    // define triangles?
    // eventually it would be nice to just name the triangles without needing the pts defined first?
    const [tBAD, tDAC, tACE] = [
      new Triangle({p1: B, p2: A, p3: D}),
      new Triangle({p1: D, p2: A, p3: C}),
      new Triangle({p1: A, p2: C, p3: E})
    ];
    // TODO return a map of all objects in the construction?
    return [tBAD, tDAC, tACE];
    // tBAD, tDAC colored red and tACE invisible to start
  }

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
  }

  componentDidMount() {
    this.frame1();
    this.frame2();
  }

  frame1 = () => {
    const [tBAD, tDAC, ] = this.construction();
    const diagram = new EuclideanBuilder();
    diagram.triangle(tBAD.getLabeledPts());
    diagram.triangle(tDAC.getLabeledPts());
    return diagram.contents();
  }

  frame2 = () => {
    const [tBAD, , tACE] = this.construction();
    const diagram = new EuclideanBuilder(this.frame1());
    console.log("frame1", this.frame1());
    diagram.triangle(tACE.getLabeledPts());
    diagram.parallelMark(tBAD.s23.getLabeledPts(), 1); // TODO EWW
    diagram.parallelMark(tACE.s23.getLabeledPts(), 1);
    console.log("frame2", diagram.contents());
    return diagram.contents();
  }

  render() {
    return(
      <div>
        <Card idx={1} text={"Initial construction"} content={this.frame1}/>
        <Card idx={2} text={"Add point E s.t. it makes a parallel line"} content={this.frame2} />
        {/*
        <Card idx={3} text={"Initial construction"} svg={<></>}/>
        <Card idx={4} text={"Initial construction"} svg={<></>}/>
        <Card idx={5} text={"Initial construction"} svg={<></>}/>
        <Card idx={6} text={"Initial construction"} svg={<></>}/> */}
      </div>
    )
  }
}

class OppositeAngleTheorem {
  construction (parallels: [Segment, Segment], s3: Segment, a1: Angle, a2: Angle) {
    // 2 lines will get parallel markers
    const [s1, s2] = parallels;
    parallel(s1, s2);
    // 2 opposite angles will be marked
    equalAngle(a1, a2);
  }

  renderConstruction() {
    // display relevant objects to the construction
  }
}

class Book1Prop29 {
  // parallelism implies corresponding angles
  construction(parallels: [Segment, Segment], s3: Segment, a1: Angle, a2: Angle) {
    // 2 lines are parallel
    const [s1, s2] = parallels;
    parallel(s1, s2);

    // 2 corresponding angles are equal
    equalAngle(a1, a2);
  }

  renderConstruction() {
    // display the relevant objects to the construction
  }
}