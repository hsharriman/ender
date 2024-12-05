import { Vector } from "../types/types";

const moveTo = (v: Vector) => {
  return `M ${v[0]} ${v[1]}`;
};

const lineTo = (v: Vector) => {
  return `L ${v[0]} ${v[1]}`;
};

const curveTo = (v1: Vector, v2: Vector, v3: Vector) => {
  return `C ${v1[0]} ${v1[1]}, ${v2[0]} ${v2[1]}, ${v3[0]} ${v3[1]}`;
};

const closePath = () => {
  return `Z`;
};

const arcTo = (r: number, major: number, sweep: number, end: Vector) => {
  return `A ${r} ${r} 0 ${major} ${sweep} ${end[0]} ${end[1]}`;
};

export const pops = {
  moveTo,
  lineTo,
  curveTo,
  closePath,
  arcTo,
};
