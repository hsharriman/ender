import { logError } from "../errors/errorConstants";
import { DiagramContent } from "../geometry/DiagramContent";
import { ParseObj, ProofObj } from "../types/checkerTypes";
import { Obj } from "../types/types";

export const buildPremises = (proof: ProofObj) => {
  // Create DiagramContent context and populate it with all geometric objects from premises
  const ctx = new DiagramContent();

  // Add all points from premises
  proof.premises.points.forEach((pointLabel) => {
    ctx.addPoint({ pt: [0, 0], label: pointLabel, offset: [0, 0] }); // TODO pt coords
  });

  // Add all triangles from premises (this will also create their segments and angles)
  proof.premises.triangles.forEach((triangleLabel) => {
    // Parse triangle label (e.g., "t_ABC")
    const pointLabels = triangleLabel.substring(2); // Remove 't_' prefix
    ctx.addTriangleFromStr(pointLabels);
  });

  // Add all quadrilaterals from premises (this will also create their segments and angles)
  proof.premises.quadrilaterals.forEach((quadrilateralLabel) => {
    // Parse quadrilateral label (e.g., "q_ABCD")
    const pointLabels = quadrilateralLabel.substring(2); // Remove 'q_' prefix
    ctx.addQuadrilateralFromStr(pointLabels);
  });

  // Add all segments from premises
  proof.premises.segments.forEach((segmentLabel) => {
    ctx.addSegmentFromStr(segmentLabel);
  });

  // Add all angles from premises
  proof.premises.angles.forEach((angleLabel) => {
    // Parse angle label (e.g., "a_BAC")
    const pointLabels = angleLabel.substring(2); // Remove 'a_' prefix
    ctx.addAngleFromStr(pointLabels);
  });

  // Process given statements to create geometric objects
  proof.steps.forEach((step) => {
    if (
      step.type === "given" &&
      step.statement?.function &&
      step.statement.arguments
    ) {
      if (step.statement.function === "con_seg") {
        // Given congruent segments - ensure both segments exist
        step.statement.arguments.forEach((arg: ParseObj) => {
          ctx.addSegmentFromStr(arg.v);
        });
      } else if (step.statement.function === "con_ang") {
        // Given congruent angles - ensure both angles exist
        step.statement.arguments.forEach((arg: ParseObj) => {
          if (arg.type === Obj.Angle) {
            ctx.addAngleFromStr(arg.v);
          }
        });
      } else if (step.statement.function === "on_line") {
        const [seg, pt] = step.statement.arguments;
        const s = ctx.addSegmentFromStr(seg.v);
        const p = ctx.getPoint(pt.v);
        p.addOnLine(s);
        const ps2 = ctx.addSegmentFromStr(`${p.label}${s.p2.label}`);
        const ps1 = ctx.addSegmentFromStr(`${s.p1.label}${p.label}`);
        ps1.addParentSegment(s);
        ps2.addParentSegment(s);
      } else if (step.statement.function === "intersect_seg") {
        // Given intersecting segments - ensure both segments exist
        const [seg1, seg2, point] = step.statement.arguments;

        // Check if the intersection point exists in premises
        if (!proof.premises.points.includes(point.v)) {
          logError.parser.missingPointInPremises(point.v);
          throw new Error(
            `Point '${point}' is used in intersect_seg but not defined in premises`
          );
        }

        const s1 = ctx.addSegmentFromStr(seg1.v);
        const s2 = ctx.addSegmentFromStr(seg2.v);
        const p = ctx.getPoint(point.v);

        seg1.v.split("").forEach((pt) => {
          const subSeg = ctx.addSegmentFromStr(`${p.label}${pt}`);
          s1.addSubSegment(subSeg);
          subSeg.addParentSegment(s1);
        });
        seg2.v.split("").forEach((pt) => {
          const subSeg = ctx.addSegmentFromStr(`${p.label}${pt}`);
          s2.addSubSegment(subSeg);
          subSeg.addParentSegment(s2);
        });
      } else if (step.statement.function === "transversal") {
        const [s1p1, s1p2, p1, s2p1, s2p2, p2] = step.statement.arguments.map(
          (arg) => ctx.getPoint(arg.v)
        );
        const [s1, s2] = [
          ctx.addSegmentFromStr(`${s1p1.label}${s1p2.label}`),
          ctx.addSegmentFromStr(`${s2p1.label}${s2p2.label}`),
        ];
        ctx.addSegmentFromStr(`${p1.label}${p2.label}`);
        p1.addOnLine(s1);
        p2.addOnLine(s2);
      } else if (step.statement.function === "midpt") {
        const s = ctx.addSegmentFromStr(step.statement.arguments[0].v);
        const p = ctx.getPoint(step.statement.arguments[1].v);
        p.addOnLine(s);
        ctx.addSegmentFromStr(`${p.label}${s.p2.label}`).addParentSegment(s);
        ctx.addSegmentFromStr(`${s.p1.label}${p.label}`).addParentSegment(s);
      }
    }
  });
  return ctx;
};
