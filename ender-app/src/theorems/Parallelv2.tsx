import { AppPage } from "../components/AppPage";
import { Point } from "../core/geometry/Point";
import { Segment } from "../core/geometry/Segment";
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

  let AC = ctx
    .getSegment("AC")
    .tick(Obj.ParallelTick)
    .mode(prove, SVGModes.Focused);
  let BD = ctx
    .getSegment("BD")
    .tick(Obj.ParallelTick)
    .mode(prove, SVGModes.Focused);
  // should know that AC/BD were first set to unfocused but should render focused, and also recognize that
  // AC and BD have tick marks that should match the same mode.

  // STEP 1
  const step1 = ctx.addFrame("step1");
  ACM = ACM.mode(step1, SVGModes.Unfocused);
  BDM = BDM.mode(step1, SVGModes.Unfocused);
  AC = AC.hideTick(step1);
  BD = BD.hideTick(step1);

  let AM = ctx
    .getSegment("AM")
    .tick(Obj.EqualLengthTick) // default is 1 tick? should be auto eventually
    .mode(step1, SVGModes.Focused);
  let BM = ctx
    .getSegment("BM")
    .tick(Obj.EqualLengthTick)
    .mode(step1, SVGModes.Focused);
  let CM = ctx
    .getSegment("CM")
    .tick(Obj.EqualLengthTick, 2)
    .mode(step1, SVGModes.Focused);
  let DM = ctx
    .getSegment("DM")
    .tick(Obj.EqualLengthTick, 2)
    .mode(step1, SVGModes.Focused);

  // STEP 2
  const step2 = ctx.addFrame("step2");
  ACM = ACM.mode(step2, SVGModes.Unfocused);
  BDM = BDM.mode(step2, SVGModes.Unfocused);
  AC = AC.hideTick(step2);
  BD = BD.hideTick(step2);
  let CMA = ctx
    .getAngle("CMA")
    .tick(Obj.EqualAngleTick)
    .mode(step2, SVGModes.Focused);
  let DMB = ctx
    .getAngle("DMB")
    .tick(Obj.EqualAngleTick)
    .mode(step2, SVGModes.Focused);

  // STEP 3
  const step3 = ctx.addFrame("step3");
  ACM = ACM.mode(step3, SVGModes.Focused);
  BDM = BDM.mode(step3, SVGModes.Focused);
  AC = AC.hideTick(step3);
  BD = BD.hideTick(step3);
  // this step needs to fetch the tick marks from the previous step

  // STEP 4
  const step4 = ctx.addFrame("step4");
  ACM = ACM.mode(step4, SVGModes.Unfocused);
  BDM = BDM.mode(step4, SVGModes.Unfocused);
  AC = AC.hideTick(step4);
  BD = BD.hideTick(step4);
  let CAM = ctx
    .getAngle("CAM")
    .tick(Obj.EqualAngleTick, 2)
    .mode(step4, SVGModes.Focused);
  let DBM = ctx
    .getAngle("DBM")
    .tick(Obj.EqualAngleTick, 2)
    .mode(step4, SVGModes.Focused);

  // STEP 5
  const step5 = ctx.addFrame("step5");
  ACM = ACM.mode(step5, SVGModes.Unfocused);
  BDM = BDM.mode(step5, SVGModes.Unfocused);
  AC = AC.mode(step5, SVGModes.Focused);
  BD = BD.mode(step5, SVGModes.Focused);

  // update graph  finalized states
  //update triangles
  [ACM, BDM].map((obj) => ctx.update(obj));
  //update segments
  [AC, BD, AM, BM, CM, DM].map((obj) => ctx.update(obj));
  // update angles
  [CMA, DMB, CAM, DBM].map((obj) => ctx.update(obj));

  const linkedTexts: ProofTextItem[] = [];
  linkedTexts.push({
    k: given,
    v: (
      <span>
        {"AB and CD intersect at point M"}
        {comma}
        {AM.linkedText("AM")}
        {congruent}
        {BM.linkedText("BM")}
        {comma}
        {CM.linkedText("CM")}
        {congruent}
        {DM.linkedText("DM")}
      </span>
    ),
    alwaysActive: true,
  });
  linkedTexts.push({
    k: prove,
    v: (
      <span>
        {AC.linkedText("AC")} {parallel} {BD.linkedText("BD")}
      </span>
    ),
    alwaysActive: true,
  });

  // TEXT STEP 1
  linkedTexts.push({
    k: step1,
    v: (
      <span>
        {AM.linkedText("AM")}
        {congruent}
        {BM.linkedText("BM")}
        {comma}
        {CM.linkedText("CM")}
        {congruent}
        {DM.linkedText("DM")}
      </span>
    ),
    reason: "Given", // TODO figure this out automatically based on KEY instead of array index
  });
  // TEXT STEP 2
  linkedTexts.push({
    k: step2,
    v: (
      <span>
        {CMA.linkedText("CMA")}
        {congruent}
        {DMB.linkedText("DMB")}
      </span>
    ),
    reason: "Vertical Angles Theorem",
  });
  // TEXT STEP 3
  linkedTexts.push({
    k: step3,
    v: (
      <span>
        {ACM.linkedText("ACM")}
        {congruent}
        {BDM.linkedText("BDM")}
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
        {CAM.linkedText("CAM")}
        {congruent}
        {DBM.linkedText("DBM")}
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
        {AC.linkedText("AC")} {parallel} {BD.linkedText("BD")}
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
  let CMA = ctx
    .getAngle("CMA")
    .tick(Obj.EqualAngleTick)
    .mode(step2, SVGModes.Purple);
  let DMB = ctx
    .getAngle("DMB")
    .tick(Obj.EqualAngleTick)
    .mode(step2, SVGModes.Blue);

  // STEP 3 - SAS TRIANGLE CONGRUENCE
  const step3 = ctx.addFrame("step3");
  AC = AC.mode(step3, SVGModes.Purple);
  BD = BD.mode(step3, SVGModes.Blue);
  CMA = CMA.mode(step3, SVGModes.Purple);
  DMB = DMB.mode(step3, SVGModes.Blue);

  let AM = ctx
    .getSegment("AM")
    .tick(Obj.EqualLengthTick)
    .mode(step3, SVGModes.Purple);
  let BM = ctx
    .getSegment("BM")
    .tick(Obj.EqualLengthTick)
    .mode(step3, SVGModes.Blue);
  let CM = ctx
    .getSegment("CM")
    .tick(Obj.EqualLengthTick, 2)
    .mode(step3, SVGModes.Purple);
  let DM = ctx
    .getSegment("DM")
    .tick(Obj.EqualLengthTick, 2)
    .mode(step3, SVGModes.Blue);

  // STEP 4 - CORRESPONDING ANGLES
  const step4 = ctx.addFrame("step4");
  ACM = ACM.mode(step4, SVGModes.Default);
  BDM = BDM.mode(step4, SVGModes.Default);
  let MAC = ctx
    .getAngle("MAC")
    .tick(Obj.EqualAngleTick, 2)
    .mode(step4, SVGModes.Purple);
  let MBD = ctx
    .getAngle("MBD")
    .tick(Obj.EqualAngleTick, 2)
    .mode(step4, SVGModes.Blue);
  let MDB = ctx
    .getAngle("BDM")
    .tick(Obj.EqualAngleTick, 3)
    .mode(step4, SVGModes.Default);
  let MCA = ctx
    .getAngle("ACM")
    .tick(Obj.EqualAngleTick, 3)
    .mode(step4, SVGModes.Default);
  AC = AC.tick(Obj.EqualLengthTick).mode(step4, SVGModes.Default);
  BD = BD.tick(Obj.EqualLengthTick).mode(step4, SVGModes.Default);

  // STEP 5 - ALTERNATE ANGLES
  // TODO need to be able to handle multiple types of tick marks
  // on the same object :(
  const step5 = ctx.addFrame("step5");
  CM = CM.mode(step5, SVGModes.Hidden);
  DM = DM.mode(step5, SVGModes.Hidden);
  AM = AM.mode(step5, SVGModes.Default); // TODO hide tick
  BM = BM.mode(step5, SVGModes.Default); // TODO hide tick
  AM = AM.hideTick(step5);
  BM = BM.hideTick(step5);
  MAC = MAC.tick(Obj.EqualAngleTick).mode(step5, SVGModes.Default);
  MBD = MBD.tick(Obj.EqualAngleTick).mode(step5, SVGModes.Default);
  AC = AC.tick(Obj.ParallelTick).mode(step5, SVGModes.Purple);
  BD = BD.tick(Obj.ParallelTick).mode(step5, SVGModes.Blue);

  // update graph with finalized states
  // update triangles
  [ACM, BDM].map((obj) => ctx.update(obj));
  // update segments
  [AC, BD, AM, BM, CM, DM].map((obj) => ctx.update(obj));
  // update angles
  [CMA, DMB, MAC, MBD, MDB, MCA].map((obj) => ctx.update(obj));
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
    return pts.concat(segs).concat(angs);
  };

  const miniCtx = miniContent();
  const miniSvgElements = (activeFrame: string) => {
    let pts = miniCtx.points.flatMap((p) => p.svg(true));
    let segs = miniCtx.segments.flatMap((s) => s.svg(activeFrame, true));
    let angs = miniCtx.angles.flatMap((a) => a.svg(activeFrame, true));
    return pts.concat(segs).concat(angs);
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
