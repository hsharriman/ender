import { AppPage } from "../components/AppPage";
import { LinkedText } from "../components/LinkedText";
import { Angle } from "../core/geometry/Angle";
import { BaseGeometryObject } from "../core/geometry/BaseGeometryObject";
import { Point } from "../core/geometry/Point";
import { Segment } from "../core/geometry/Segment";
import { Tick } from "../core/geometry/Tick";
import { Triangle } from "../core/geometry/Triangle";
import { comma, congruent, parallel } from "../core/geometryText";
import { Content } from "../core/objgraph";
import { Obj, ProofTextItem, Reason, SVGModes, Vector } from "../core/types";

const baseContent = (labeledPoints: boolean) => {
  const coords: Vector[][] = [
    [
      [1, 4],
      [7, 0],
      [0, 1],
      [8, 3],
      [4, 2],
    ],
  ];
  let ctx = new Content();
  const labels = ["A", "B", "C", "D", "M"];
  const offsets: Vector[] = [
    [5, 5],
    [10, -10],
    [-20, -20],
    [3, 3],
    [0, 10],
  ];
  const pts = coords[0];
  const [A, B, C, D, M] = pts.map((c, i) =>
    // TODO option to make point labels invisible
    ctx.push(
      new Point({
        pt: c,
        label: labels[i],
        showLabel: labeledPoints,
        offset: offsets[i],
      })
    )
  );

  [
    new Triangle({ pts: [A, C, M] }, ctx),
    new Triangle({ pts: [B, D, M] }, ctx),
  ].map((t) => ctx.push(t));
  return ctx;
};

const contents = () => {
  let ctx = baseContent(true);

  // GIVEN
  const given = ctx.addFrame("given");
  let ACM = ctx.getTriangle("ACM").mode(given, SVGModes.Default);
  let BDM = ctx.getTriangle("BDM").mode(given, SVGModes.Default);

  // PROVE
  // old content should be rendered as unfocused
  const prove = ctx.addFrame("prove");
  ACM = ACM.mode(prove, SVGModes.Unfocused);
  BDM = BDM.mode(prove, SVGModes.Unfocused);
  const proves = (frame: string, mode: SVGModes): [Segment, Segment] => {
    const AC = ctx.getSegment("AC").mode(frame, mode);
    const BD = ctx.getSegment("BD").mode(frame, mode);
    const ACp = ctx.pushTick(AC, Obj.ParallelTick).mode(frame, mode);
    const BDp = ctx.pushTick(BD, Obj.ParallelTick).mode(frame, mode);
    return [AC, BD];
  };
  let [AC, BD] = proves(prove, SVGModes.Focused);

  // should know that AC/BD were first set to unfocused but should render focused, and also recognize that
  // AC and BD have tick marks that should match the same mode.

  // STEP 1
  const step1 = ctx.addFrame("step1");
  ACM = ACM.mode(step1, SVGModes.Unfocused);
  BDM = BDM.mode(step1, SVGModes.Unfocused);

  const givens = (
    frame: string,
    mode: SVGModes
  ): [Segment, Segment, Segment, Segment] => {
    const AM = ctx.getSegment("AM").mode(frame, mode);
    const BM = ctx.getSegment("BM").mode(frame, mode);
    const CM = ctx.getSegment("CM").mode(frame, mode);
    const DM = ctx.getSegment("DM").mode(frame, mode);

    // ticks
    ctx.pushTick(AM, Obj.EqualLengthTick).mode(frame, mode);
    ctx.pushTick(BM, Obj.EqualLengthTick).mode(frame, mode);
    ctx.pushTick(CM, Obj.EqualLengthTick, 2).mode(frame, mode);
    ctx.pushTick(DM, Obj.EqualLengthTick, 2).mode(frame, mode);
    return [AM, BM, CM, DM];
  };
  let [AM, BM, CM, DM] = givens(step1, SVGModes.Focused);

  // STEP 2
  const step2 = ctx.addFrame("step2");
  ACM = ACM.mode(step2, SVGModes.Unfocused);
  BDM = BDM.mode(step2, SVGModes.Unfocused);
  [AM, BM, CM, DM] = givens(step2, SVGModes.Unfocused);
  const equalAngles = (frame: string, mode: SVGModes): [Angle, Angle] => {
    let CMA = ctx.getAngle("CMA").mode(frame, mode); // TODO mode does nothing
    let DMB = ctx.getAngle("DMB").mode(frame, mode);
    ctx.pushTick(CMA, Obj.EqualAngleTick).mode(frame, mode);
    ctx.pushTick(DMB, Obj.EqualAngleTick).mode(frame, mode);
    return [CMA, DMB];
  };
  let [CMA, DMB] = equalAngles(step2, SVGModes.Focused);

  // STEP 3
  const step3 = ctx.addFrame("step3");
  ACM = ACM.mode(step3, SVGModes.Focused);
  BDM = BDM.mode(step3, SVGModes.Focused);
  givens(step3, SVGModes.Focused);
  equalAngles(step3, SVGModes.Focused);
  // this step needs to fetch the tick marks from the previous step

  // STEP 4
  const step4 = ctx.addFrame("step4");
  ACM = ACM.mode(step4, SVGModes.Unfocused);
  BDM = BDM.mode(step4, SVGModes.Unfocused);
  givens(step4, SVGModes.Unfocused);
  equalAngles(step4, SVGModes.Unfocused);
  const correspondingAngles = (
    frame: string,
    mode: SVGModes
  ): [Angle, Angle] => {
    let CAM = ctx.getAngle("CAM").mode(frame, mode);
    let DBM = ctx.getAngle("DBM").mode(frame, mode);
    ctx.pushTick(CAM, Obj.EqualAngleTick, 2).mode(frame, mode);
    ctx.pushTick(DBM, Obj.EqualAngleTick, 2).mode(frame, mode);
    return [CAM, DBM];
  };
  let [CAM, DBM] = correspondingAngles(step4, SVGModes.Focused);

  // STEP 5
  const step5 = ctx.addFrame("step5");
  ACM = ACM.mode(step5, SVGModes.Unfocused);
  BDM = BDM.mode(step5, SVGModes.Unfocused);
  proves(step5, SVGModes.Focused);
  givens(step5, SVGModes.Unfocused);
  equalAngles(step5, SVGModes.Unfocused);
  correspondingAngles(step5, SVGModes.Unfocused);
  AC = AC.mode(step5, SVGModes.Focused);
  BD = BD.mode(step5, SVGModes.Focused);
  ctx.pushTick(AC, Obj.ParallelTick).mode(step5, SVGModes.Focused);
  ctx.pushTick(BD, Obj.ParallelTick).mode(step5, SVGModes.Focused);

  // // update graph  finalized states
  // //update triangles
  // [ACM, BDM].map((obj) => ctx.update(obj));
  // //update segments
  // [AC, BD, AM, BM, CM, DM].map((obj) => ctx.update(obj));
  // // update angles
  // [CMA, DMB, CAM, DBM].map((obj) => ctx.update(obj));

  const linkedTexts: ProofTextItem[] = [];
  const linked = (
    val: string,
    obj: BaseGeometryObject,
    objs?: BaseGeometryObject[]
  ) => <LinkedText val={val} obj={obj} linkedObjs={objs} />;
  linkedTexts.push({
    k: given,
    v: (
      <span>
        {"AB and CD intersect at point M"}
        {comma}
        {linked("AM", AM, [ctx.getTick(AM, Obj.EqualLengthTick)])}
        {congruent}
        {linked("BM", BM, [ctx.getTick(BM, Obj.EqualLengthTick)])}
        {comma}
        {linked("CM", CM, [ctx.getTick(CM, Obj.EqualLengthTick, 2)])}
        {congruent}
        {linked("DM", DM, [ctx.getTick(DM, Obj.EqualLengthTick, 2)])}
      </span>
    ),
    alwaysActive: true,
  });
  linkedTexts.push({
    k: prove,
    v: (
      <span>
        {linked("AC", AC, [ctx.getTick(AC, Obj.ParallelTick)])}
        {parallel}
        {linked("BD", BD, [ctx.getTick(BD, Obj.ParallelTick)])}
      </span>
    ),
    alwaysActive: true,
  });
  // onClick linked text needs attached segment AND tick mark
  // TEXT STEP 1
  linkedTexts.push({
    k: step1,
    v: (
      <span>
        {linked("AM", AM, [ctx.getTick(AM, Obj.EqualLengthTick)])}
        {congruent}
        {linked("BM", BM, [ctx.getTick(BM, Obj.EqualLengthTick)])}
        {comma}
        {linked("CM", CM, [ctx.getTick(CM, Obj.EqualLengthTick, 2)])}
        {congruent}
        {linked("DM", DM, [ctx.getTick(DM, Obj.EqualLengthTick, 2)])}
      </span>
    ),
    reason: "Given", // TODO figure this out automatically based on KEY instead of array index
  });
  // TEXT STEP 2
  linkedTexts.push({
    k: step2,
    v: (
      <span>
        {linked("CMA", CMA, [ctx.getTick(CMA, Obj.EqualAngleTick)])}
        {congruent}
        {linked("DMB", DMB, [ctx.getTick(DMB, Obj.EqualAngleTick)])}
      </span>
    ),
    reason: "Vertical Angles Theorem",
  });
  // TEXT STEP 3
  linkedTexts.push({
    k: step3,
    v: (
      <span>
        {linked("ACM", ACM, [
          ctx.getTick(AM, Obj.EqualLengthTick),
          ctx.getTick(CM, Obj.EqualLengthTick, 2),
          ctx.getTick(CMA, Obj.EqualAngleTick),
        ])}
        {congruent}
        {linked("BDM", BDM, [
          ctx.getTick(BM, Obj.EqualLengthTick),
          ctx.getTick(DM, Obj.EqualLengthTick, 2),
          ctx.getTick(DMB, Obj.EqualAngleTick),
        ])}
      </span>
    ),
    reason: "SAS Triangle Congruence",
    dependsOn: new Set([step1, step2]),
  });
  // TEXT STEP 4
  linkedTexts.push({
    k: step4,
    v: (
      <span>
        {linked("CAM", CAM, [ctx.getTick(CAM, Obj.EqualAngleTick, 2)])}
        {congruent}
        {linked("DBM", DBM, [ctx.getTick(DBM, Obj.EqualAngleTick, 2)])}
      </span>
    ),
    reason: "Corresponding Angles Postulate",
    dependsOn: new Set([step3]),
  });
  // TEXT STEP 5
  linkedTexts.push({
    k: step5,
    v: (
      <span>
        {linked("AC", AC, [ctx.getTick(AC, Obj.ParallelTick)])}
        {parallel}
        {linked("BD", BD, [ctx.getTick(BD, Obj.ParallelTick)])}
      </span>
    ),
    reason: "Alternate Interior Angles Theorem",
    dependsOn: new Set([step4]), // TODO repetitive, same as ctx.deps
  });

  // RELIES ON:
  // STEP 3
  ctx.reliesOn(step3, [step1, step2]);
  // STEP 4
  ctx.reliesOn(step4, [step3]);
  // STEP 5
  ctx.reliesOn(step5, [step4]);

  return { ctx, linkedTexts };
};

const miniContent = () => {
  let ctx = baseContent(false);

  // STEP 2 - VERTICAL ANGLES
  const step2 = ctx.addFrame("step2");
  let ACM = ctx.getTriangle("ACM").mode(step2, SVGModes.Default);
  let BDM = ctx.getTriangle("BDM").mode(step2, SVGModes.Default);
  let AC = ctx.getSegment("AC").mode(step2, SVGModes.Hidden);
  let BD = ctx.getSegment("BD").mode(step2, SVGModes.Hidden);
  let CMA = ctx.getAngle("CMA").mode(step2, SVGModes.Purple);
  let DMB = ctx.getAngle("DMB").mode(step2, SVGModes.Blue);
  ctx.pushTick(CMA, Obj.EqualAngleTick).mode(step2, SVGModes.Purple);
  ctx.pushTick(DMB, Obj.EqualAngleTick).mode(step2, SVGModes.Blue);

  // STEP 3 - SAS TRIANGLE CONGRUENCE
  const step3 = ctx.addFrame("step3");
  const SAS = (frame: string, t1Mode: SVGModes, t2Mode: SVGModes) => {
    // T1
    let AM = ctx.getSegment("AM").mode(frame, t1Mode);
    let CM = ctx.getSegment("CM").mode(frame, t1Mode);
    let AC = ctx.getSegment("AC").mode(frame, t1Mode);
    let CMA = ctx.getAngle("CMA").mode(frame, t1Mode);
    // t1 ticks
    ctx.pushTick(CMA, Obj.EqualAngleTick).mode(frame, t1Mode);
    ctx.pushTick(AM, Obj.EqualLengthTick).mode(frame, t1Mode);
    ctx.pushTick(CM, Obj.EqualLengthTick, 2).mode(frame, t1Mode);

    // T2
    let BM = ctx.getSegment("BM").mode(frame, t2Mode);
    let DM = ctx.getSegment("DM").mode(frame, t2Mode);
    let BD = ctx.getSegment("BD").mode(frame, t2Mode);
    let DMB = ctx.getAngle("DMB").mode(frame, t2Mode);
    // t2 ticks
    ctx.pushTick(DMB, Obj.EqualAngleTick).mode(frame, t2Mode);
    ctx.pushTick(BM, Obj.EqualLengthTick).mode(frame, t2Mode);
    ctx.pushTick(DM, Obj.EqualLengthTick, 2).mode(frame, t2Mode);
  };
  SAS(step3, SVGModes.Purple, SVGModes.Blue);

  // STEP 4 - CORRESPONDING ANGLES
  const step4 = ctx.addFrame("step4");
  // ACM = ACM.mode(step4, SVGModes.Default);
  // BDM = BDM.mode(step4, SVGModes.Default);
  SAS(step4, SVGModes.Default, SVGModes.Default);
  let MAC = ctx.getAngle("MAC").mode(step4, SVGModes.Purple);
  let MBD = ctx.getAngle("MBD").mode(step4, SVGModes.Blue);
  let MDB = ctx.getAngle("BDM").mode(step4, SVGModes.Default);
  let MCA = ctx.getAngle("ACM").mode(step4, SVGModes.Default);
  AC = AC.mode(step4, SVGModes.Default);
  BD = BD.mode(step4, SVGModes.Default);
  // step 4 ticks
  ctx.pushTick(MAC, Obj.EqualAngleTick, 2).mode(step4, SVGModes.Purple);
  ctx.pushTick(MBD, Obj.EqualAngleTick, 2).mode(step4, SVGModes.Blue);
  ctx.pushTick(MDB, Obj.EqualAngleTick, 3).mode(step4, SVGModes.Default);
  ctx.pushTick(MCA, Obj.EqualAngleTick, 3).mode(step4, SVGModes.Default);
  ctx.pushTick(AC, Obj.EqualLengthTick, 3).mode(step4, SVGModes.Default);
  ctx.pushTick(BD, Obj.EqualLengthTick, 3).mode(step4, SVGModes.Default);

  // STEP 5 - ALTERNATE ANGLES
  // TODO need to be able to handle multiple types of tick marks
  // on the same object :(
  const step5 = ctx.addFrame("step5");
  // let CM = ctx.getSegment("CM").mode(step5, SVGModes.Hidden);
  // let DM = ctx.getSegment("DM").mode(step5, SVGModes.Hidden);
  let AM = ctx.getSegment("AM").mode(step5, SVGModes.Default);
  let BM = ctx.getSegment("BM").mode(step5, SVGModes.Default);

  MAC.mode(step5, SVGModes.Default);
  MBD.mode(step5, SVGModes.Default);
  AC.mode(step5, SVGModes.Purple);
  BD.mode(step5, SVGModes.Blue);
  // step 5 ticks
  ctx.pushTick(MAC, Obj.EqualAngleTick, 1).mode(step5, SVGModes.Default);
  ctx.pushTick(MBD, Obj.EqualAngleTick, 1).mode(step5, SVGModes.Default);
  ctx.pushTick(AC, Obj.ParallelTick, 1).mode(step5, SVGModes.Purple);
  ctx.pushTick(BD, Obj.ParallelTick, 1).mode(step5, SVGModes.Blue);

  return ctx;
};

const reasons = (activeFrame: string) => {
  let reasonMap = new Map<string, Reason>();
  reasonMap.set("step2", {
    title: "Vertical Angles Theorem",
    body: "When two lines intersect each other, the angles that are opposite from each other are congruent.",
  });
  reasonMap.set("step3", {
    title: "SAS Triangle Congruence",
    body: "Side-Angle-Side (SAS) Congruence. If two triangles have two sides and the included angle of one triangle congruent to two sides and the included angle of another triangle, then the triangles are congruent.",
  });
  reasonMap.set("step4", {
    title: "Corresponding Angles Postulate",
    body: "Corresponding angles are the angles in congruent or similar triangles that have the same measurement.",
  });
  reasonMap.set("step5", {
    title: "Alternate Interior Angles Theorem",
    body: "When a transversal intersects a pair of lines such that the alternate interior angles are congruent, then the lines are parallel to each other.",
  });
  return reasonMap.get(activeFrame) ?? { title: "", body: "" };
};

export const ParallelV2 = () => {
  // render list of all components ONCE  completed list of states
  const { ctx, linkedTexts } = contents();
  const svgElements = (activeFrame: string) => {
    let pts = ctx.points.flatMap((p) => p.svg());
    let segs = ctx.segments.flatMap((s) => s.svg(activeFrame));
    let angs = ctx.angles.flatMap((a) => a.svg(activeFrame));
    let ticks = ctx.ticks.flatMap((t) => t.svg(activeFrame));
    return pts.concat(segs).concat(angs).concat(ticks);
  };

  const miniCtx = miniContent();
  const miniSvgElements = (activeFrame: string) => {
    let pts = miniCtx.points.flatMap((p) => p.svg(true));
    let segs = miniCtx.segments.flatMap((s) => s.svg(activeFrame, true));
    let angs = miniCtx.angles.flatMap((a) => a.svg(activeFrame, true));
    let ticks = miniCtx.ticks.flatMap((t) => t.svg(activeFrame, true));
    return pts.concat(segs).concat(angs).concat(ticks);
  };

  // each component needs to accept state (activeIdx) as prop so it knows
  // what state to pick
  // each component needs to set up its own onHover/onClick handler to highlight
  // linked text
  // need COMPLETE CONSTRUCTION WHERE EACH COMPONENT KNOWS WHAT TO RENDER AT EACH STEP
  // need LINKED TEXT FOR EACH STEP
  return (
    <AppPage
      problemText={""}
      proofText={linkedTexts}
      svgElements={svgElements}
      reasonText={reasons}
      miniSvgElements={miniSvgElements}
      reliesOn={ctx.getReliesOn()}
      onResample={function (): void {
        throw new Error("Function not implemented.");
      }}
      onClickCanvas={function (): void {
        throw new Error("Function not implemented.");
      }}
    />
  );
};
