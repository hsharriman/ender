import { ProofObj, Stmt } from "checker/types/checkerTypes";
import { Obj, ParseObj, ProofContent } from "geometry-object";

/**
 * Construct only the geometric objects needed to draw a parsed presentation.
 * This function deliberately performs no proof checking: acceptance and all
 * diagnostics come from the extracted Rocq checker.
 */
export const presentationContent = (proof: ProofObj): ProofContent => {
  const content = new ProofContent();

  const addAngle = (name: string): void => {
    if (name.length !== 3) return;
    content.addSegmentFromStr(name.slice(0, 2));
    content.addSegmentFromStr(name.slice(1, 3));
    content.addAngleFromStr(name);
  };

  proof.premises.points.forEach((point) =>
    content.addPoint({ label: point.v, pt: point.pt }),
  );
  proof.premises.triangles.forEach((object) =>
    content.addTriangleFromStr(object.v),
  );
  proof.premises.quadrilaterals.forEach((object) =>
    content.addQuadrilateralFromStr(object.v),
  );
  proof.premises.circles.forEach((object) =>
    content.addCircleFromStr(object.v),
  );
  proof.premises.segments.forEach((object) =>
    content.addSegmentFromStr(object.v),
  );
  proof.premises.angles.forEach((object) => addAngle(object.v));

  const addObject = (object: ParseObj): void => {
    switch (object.type) {
      case Obj.Segment:
        content.addSegmentFromStr(object.v);
        break;
      case Obj.Angle:
        addAngle(object.v);
        break;
      case Obj.Triangle:
        content.addTriangleFromStr(object.v);
        break;
      case Obj.Quadrilateral:
        content.addQuadrilateralFromStr(object.v);
        break;
      case Obj.Circle:
        content.addCircleFromStr(object.v);
        break;
      case Obj.Point:
        break;
    }
  };
  const addStatement = (statement: Stmt | undefined): void =>
    statement?.arguments.forEach(addObject);

  proof.premises.diagramStatements.forEach(({ statement }) =>
    addStatement(statement),
  );
  proof.steps.forEach(({ statement }) => addStatement(statement));
  addStatement(proof.goal);
  content.checkAngleOverlaps();
  return content;
};
