// emitLeanPremises.ts
// Converts parsed proof premises into Lean code using EuclideanGeometry.lean structures

/**
 * Given a parsed proof object (from ProofParser), emit Lean code for the premises section.
 * @param parsed The parsed proof object
 * @returns Lean code as a string
 */
export function emitLeanPremises(parsed: any): string {
  const { points, segments, angles, triangles } = parsed.premises;

  // 1. Points
  const pointDefs = (points || []).map(
    (p: string) => `def ${p} : Point := { label := "${p}" }`
  );

  // 2. Segments (e.g., "AB" => { p1 := A, p2 := B })
  const segmentDefs = (segments || []).map((s: string) =>
    s.length === 2
      ? `def ${s} : Segment := { p1 := ${s[0]}, p2 := ${s[1]} }`
      : `-- Could not parse segment: ${s}`
  );

  // 3. Angles (e.g., "a_BAC" => { a := B, o := A, b := C })
  const angleDefs = (angles || []).map((a: string) => {
    // Expect format a_BAC
    const match = /^a_([A-Z]{3})$/.exec(a);
    if (match) {
      const [A, O, B] = match[1].split("");
      return `def ${a} : Angle := { a := ${A}, o := ${O}, b := ${B} }`;
    } else {
      return `-- Could not parse angle: ${a}`;
    }
  });

  // 4. Triangles (e.g., "t_ABC" => { a := A, b := B, c := C })
  const triangleDefs = (triangles || []).map((t: string) => {
    // Expect format t_ABC
    const match = /^t_([A-Z]{3})$/.exec(t);
    if (match) {
      const [A, B, C] = match[1].split("");
      return `def ${t} : Triangle := { a := ${A}, b := ${B}, c := ${C} }`;
    } else {
      return `-- Could not parse triangle: ${t}`;
    }
  });

  return [
    "-- Premises",
    ...pointDefs,
    ...segmentDefs,
    ...angleDefs,
    ...triangleDefs,
  ].join("\n");
}
