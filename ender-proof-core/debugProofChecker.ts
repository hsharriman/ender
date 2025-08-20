import { readFileSync } from "fs";
import { basename, dirname } from "path";
import { fileURLToPath } from "url";
import { logError } from "./errors/errorConstants.js";
import { DiagramContent } from "./geometry/DiagramContent.js";
import { ProofParser } from "./grammar/lezerParser.js";
import { reflex_a, reflex_s, sas } from "./grammar/reasons/reasonChecks.js";

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug function to test proof checker step by step
const debugProofChecker = (filePath: string): void => {
  console.log(`\n🔍 Debugging proof: ${basename(filePath)}\n`);

  try {
    // Parse proof
    const content = readFileSync(filePath, "utf-8");
    const parser = new ProofParser();
    const proof = parser.parse(content);

    console.log("📋 Parsed Proof:");
    console.log("Title:", proof.title);
    console.log("Premises:", proof.premises);
    console.log("Steps:", proof.steps.length);

    // Create DiagramContent context
    const ctx = new DiagramContent();

    // Add all points from premises
    console.log("\n📍 Adding points...");
    proof.premises.points.forEach((pointLabel) => {
      const point = ctx.addPoint({
        pt: [0, 0],
        label: pointLabel,
        offset: [0, 0],
      });
      console.log(`Added point: ${pointLabel} -> ${point.label}`);
    });

    // Add all triangles from premises
    console.log("\n🔺 Adding triangles...");
    proof.premises.triangles.forEach((triangleLabel) => {
      const pointLabels = triangleLabel.substring(2); // Remove 't_' prefix
      const triangle = ctx.addTriangleFromStr(pointLabels);
      console.log(`Added triangle: ${triangleLabel} -> ${triangle.label}`);
      console.log(`  Segments: ${triangle.s.map((s) => s.label).join(", ")}`);
      console.log(`  Angles: ${triangle.a.map((a) => a.label).join(", ")}`);
    });

    // Add all segments from premises
    console.log("\n📏 Adding segments...");
    proof.premises.segments.forEach((segmentLabel) => {
      const segment = ctx.addSegmentFromStr(segmentLabel);
      console.log(`Added segment: ${segmentLabel} -> ${segment.label}`);
    });

    // Add all angles from premises
    console.log("\n📐 Adding angles...");
    proof.premises.angles.forEach((angleLabel) => {
      const pointLabels = angleLabel.substring(2); // Remove 'a_' prefix
      const angle = ctx.addAngleFromStr(pointLabels);
      console.log(`Added angle: ${angleLabel} -> ${angle.label}`);
    });

    // Test geometric object retrieval
    console.log("\n🔍 Testing geometric object retrieval...");

    // Test getting a segment
    const testSegment = ctx.getSegment("AC");
    console.log("Segment AC:", testSegment ? testSegment.label : "Not found");

    // Test getting an angle
    const testAngle = ctx.getAngle("a_BAC");
    console.log("Angle a_BAC:", testAngle ? testAngle.label : "Not found");

    // Test reason checking
    console.log("\n🧪 Testing reason checking...");

    // Test reflex_s
    if (testSegment) {
      const reflexResult = reflex_s(testSegment, testSegment);
      console.log("reflex_s(AC, AC):", reflexResult);
    }

    // Test reflex_a
    if (testAngle) {
      const reflexAngleResult = reflex_a(testAngle, testAngle);
      console.log("reflex_a(a_BAC, a_BAC):", reflexAngleResult);
    }

    // Test SAS
    const triangle1 = ctx.getTriangle("ABC");
    const triangle2 = ctx.getTriangle("ADC");
    const segment1 = ctx.getSegment("AB");
    const segment2 = ctx.getSegment("AD");
    const angle1 = ctx.getAngle("BAC");
    const angle2 = ctx.getAngle("DAC");
    const segment3 = ctx.getSegment("AC");

    console.log("Objects for SAS test:");
    console.log("  triangle1:", triangle1?.label);
    console.log("  triangle2:", triangle2?.label);
    console.log("  segment1:", segment1?.label);
    console.log("  segment2:", segment2?.label);
    console.log("  angle1:", angle1?.label);
    console.log("  angle2:", angle2?.label);
    console.log("  segment3:", segment3?.label);

    if (
      triangle1 &&
      triangle2 &&
      segment1 &&
      segment2 &&
      angle1 &&
      angle2 &&
      segment3
    ) {
      console.log("\n🔍 SAS Test Details:");

      // Test individual checks
      const segmentsCongruent =
        segment1.label === segment2.label ||
        (segment1.p1.label === segment2.p1.label &&
          segment1.p2.label === segment2.p2.label) ||
        (segment1.p1.label === segment2.p2.label &&
          segment1.p2.label === segment2.p1.label);
      console.log("  segmentsCongruent (AB, AD):", segmentsCongruent);

      const anglesCongruent =
        angle1.label === angle2.label ||
        (angle1.start.label === angle2.start.label &&
          angle1.center.label === angle2.center.label &&
          angle1.end.label === angle2.end.label) ||
        (angle1.start.label === angle2.end.label &&
          angle1.center.label === angle2.center.label &&
          angle1.end.label === angle2.start.label);
      console.log("  anglesCongruent (BAC, DAC):", anglesCongruent);

      const segmentsInTriangles =
        triangle1.s.some(
          (s) => s.label === segment1.label || s.label === segment3.label
        ) &&
        triangle2.s.some(
          (s) => s.label === segment2.label || s.label === segment3.label
        );
      console.log("  segmentsInTriangles:", segmentsInTriangles);

      const anglesInTriangles =
        triangle1.a.some((a) => a.label === angle1.label) &&
        triangle2.a.some((a) => a.label === angle2.label);
      console.log("  anglesInTriangles:", anglesInTriangles);

      const sasResult = sas(
        triangle1,
        triangle2,
        [segment1, segment2],
        [angle1, angle2],
        [segment3, segment3]
      );
      console.log(
        "sas(t_ABC, t_ADC, [AB, AD], [BAC, DAC], [AC, AC]):",
        sasResult
      );
    } else {
      logError.proofChecker.missingObjectsForSAS();
    }

    console.log("\n✅ Debug complete!");
  } catch (error) {
    logError.proofChecker.errorDebuggingProof(error);
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.log("Usage: npm run debug-proof <proof-file>");
    console.log("Example: npm run debug-proof proofs/tutorialProof.txt");
    process.exit(1);
  }

  const proofFile = args[0];
  debugProofChecker(proofFile);
}

export { debugProofChecker };
