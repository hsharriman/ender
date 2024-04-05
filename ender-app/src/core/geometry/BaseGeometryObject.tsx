import React from "react";
import { Obj, SVGModes, Vector } from "../types";
import { vops } from "../vectorOps";

const SVG_XSHIFT = 60;
const SVG_YSHIFT = -200;
const TICK_SCALE = 20;
const SVG_SCALE = 60;
const SVG_DIM = 120;

const MINI_SVG_DIM = 40;
const MINI_SVG_SCALE = 25;
const MINI_SVG_XSHIFT = 20;
const MINI_SVG_YSHIFT = -70;

export interface BaseGeometryProps {
  modes?: Map<string, SVGModes>; // all modes for all states
  activeIdx?: number; // follows the state of the app
}

export class BaseGeometryObject {
  public readonly tag: Obj;
  public names: string[] = [];
  public label: string = "";
  protected modes: Map<string, SVGModes>;
  public activeIdx: number;
  constructor(tag: Obj, props: BaseGeometryProps) {
    this.tag = tag;
    this.modes = props.modes ? props.modes : new Map();
    this.activeIdx = props.activeIdx ? props.activeIdx : -1;
  }

  mode = (frameKey: string, mode: SVGModes) => {
    this.modes.set(frameKey, mode);
    return this;
  };

  // https://stackoverflow.com/questions/9960908/permutations-in-javascript
  permutator = (inputArr: string[]): string[] => {
    let result: string[] = [];
    const permute = (arr: string[], m: string = "") => {
      if (arr.length === 0) {
        result.push(m);
      } else {
        for (let i = 0; i < arr.length; i++) {
          let curr = arr.slice(); // copy arr
          let next = curr.splice(i, 1);
          permute(curr.slice(), m + next);
        }
      }
    };
    permute(inputArr);
    return result;
  };

  matches = (name: string) => this.names.find((n) => n === name) !== undefined;

  // From EuclideanBuilder SVG Related
  coordsToSvg = (
    coords: Vector,
    miniScale: boolean,
    offset: Vector = [0, 0]
  ): Vector => {
    // scale coordinates, shift and invert y axis
    // TODO scale the transformation based on canvas size
    const scale = miniScale ? MINI_SVG_SCALE : SVG_SCALE;
    const xshift = miniScale ? MINI_SVG_XSHIFT : SVG_XSHIFT;
    const yshift = miniScale ? MINI_SVG_YSHIFT : SVG_YSHIFT;
    const dim = miniScale ? MINI_SVG_DIM : SVG_DIM;

    let vec = vops.add(vops.smul(coords, scale), [
      xshift + offset[0],
      yshift + offset[1],
    ]);
    return [vec[0], dim - vec[1]];
  };

  scaleToSvg = (n: number, miniScale: boolean) =>
    n * (miniScale ? MINI_SVG_SCALE : SVG_SCALE);

  getId = (objectType: Obj, label: string, tickNumber?: number) => {
    if (objectType === Obj.Angle) {
      const endPts = [label[0], label[2]].sort().toString().replaceAll(",", "");
      label = `${label[1]}-${endPts}`;
    } else {
      label = Array.from(label).sort().toString().replaceAll(",", "");
    }
    let id = `${objectType}.${label}`;
    return tickNumber ? `${id}.${tickNumber}` : id;
  };

  // method to check whether ticks should be included in the render or not
}
