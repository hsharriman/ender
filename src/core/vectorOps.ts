import { Vector } from "./types/types";

export const vops = {
  // Return true if v1 === v2
  eq: (v1: Vector, v2: Vector) => v1[0] === v2[0] && v1[1] === v2[1],

  // Return the magnitude of vector v
  mag: (v: Vector) => Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2)),

  // Return unit vector of v
  unit: (v: Vector): Vector => vops.div(v, vops.mag(v)),

  // Return true if v1 === v2
  equals: (v1: Vector, v2: Vector) => v1[0] === v2[0] && v1[1] === v2[1],

  // Return v1 + v2
  add: (v1: Vector, v2: Vector): Vector => [v1[0] + v2[0], v1[1] + v2[1]],

  // Return v1 - v2
  sub: (v1: Vector, v2: Vector): Vector => [v1[0] - v2[0], v1[1] - v2[1]],

  // Return vector v entrywise multiplied by scalar s
  smul: (v: Vector, s: number): Vector => [v[0] * s, v[1] * s],

  // Return vector v entrywise divided by s
  div: (v: Vector, s: number): Vector => vops.smul(v, 1 / s),

  // Return dot product of v1 and v2
  dot: (v1: Vector, v2: Vector): number => v1[0] * v2[0] + v1[1] * v2[1],

  cross: (v1: Vector, v2: Vector): number => v1[0] * v2[1] - v1[1] * v2[0],

  // Rotate a 2D point [x, y] by a degrees counterclockwise.
  rot: ([x, y]: Vector, a: number): Vector => {
    const angle = (a * Math.PI) / 180;
    const x2 = Math.cos(angle) * x - Math.sin(angle) * y;
    const y2 = Math.sin(angle) * x + Math.cos(angle) * y;
    return [x2, y2];
  },

  angleBetweenDeg: (v1: Vector, v2: Vector): number =>
    Math.acos(vops.dot(v1, v2) / (vops.mag(v1) * vops.mag(v2))) *
    (180 / Math.PI),
};
