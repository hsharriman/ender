export type Vector = [number, number];

const mag = (v: Vector) => Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2));
const unit = (v: Vector) => v.map(c => c / mag(v));
const equals = (v1: Vector, v2: Vector) => v1[0] === v2[0] && v1[1] === v2[1];
const add = (v1: Vector, v2: Vector): Vector => [v1[0] + v2[0], v1[1] + v2[1]];
const sub = (v1: Vector, v2: Vector): Vector => [v1[0] + v2[0], v1[1] + v2[1]];
const smul = (v: Vector, s: number): Vector => [v[0] * s, v[1] * s];
const mmul = () => {};
const div = () => {};
const dotProd = () => {};

export const vops = {
  mag,
  unit,
  equals,
  add,
  sub,
  smul,
  mmul,
  div,
  dotProd,
} 
