export const commonPt = (seg1: string, seg2: string): string => {
  for (const char of seg1) {
    if (seg2.includes(char)) {
      return char;
    }
  }
  console.error(`no common point found for ${seg1} and ${seg2}`);
  return "";
};

export const angCenter = (ang: string) => {
  return ang.replace("a_", "")[1];
};

export const stripAngPrefix = (angles: string[]) => {
  return angles.map((angle) => angle.replace("a_", ""));
};

export const stripTriPrefix = (triangles: string[]) => {
  return triangles.map((triangle) => triangle.replace("t_", ""));
};
