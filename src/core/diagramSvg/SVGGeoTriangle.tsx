import React from "react";
import { Triangle } from "../geometry/Triangle";
import { strs } from "../geometryText";
import { logEvent } from "../testinfra/testUtils";
import { Obj, Vector } from "../types/types";
import { permutator } from "../utils";
import { vops } from "../vectorOps";
import { HoverTextLabel } from "./HoverTextLabel";
import { getPatternId } from "./LinePattern";
import { pops } from "./pathBuilderUtils";
import { BaseSVGProps, BaseSVGState } from "./svgTypes";
import { coordsToSvg, updateStyle } from "./svgUtils";

export type SVGTriangleProps = {
  t: Triangle;
  congruent: boolean;
  rotate: boolean;
} & BaseSVGProps;

export class SVGGeoTriangle extends React.Component<
  SVGTriangleProps,
  BaseSVGState
> {
  constructor(props: SVGTriangleProps) {
    super(props);
    this.state = {
      isActive: false,
      isPinned: false,
      css: "",
    };
  }
  onHover = (isActive: boolean) => {
    if (
      this.props.hoverable &&
      !this.state.isPinned &&
      isActive !== this.state.isActive
    ) {
      this.setState({
        isActive,
      });
      logEvent("h", {
        c: "t",
        v: this.props.geoId,
      });
    }
  };

  highlightElems = (isActive: boolean) => {
    const a = this.props.t.a;
    const s = this.props.t.s;
    s.map((seg) => {
      seg.onClickText(isActive);
    });
    a.map((ang) => {
      ang.onClickText(isActive);
    });
  };

  // deprecated
  onHoverLabelClick = (isActive: boolean) => {
    this.setState({
      isActive,
      isPinned: isActive,
    });
    // TODO find matches for all segments/angles and add to their class
    const prefix = `#${Obj.Triangle}-text-`;
    const tri = this.props.t.label;
    const selectors = permutator(tri.split(""))
      .map((p) => prefix + p)
      .join(", ");
    const matches = document.querySelectorAll(selectors);
    matches.forEach((ele) => {
      if (ele) {
        const cls = [""];
        if (isActive) {
          ele.classList.add(...cls);
        } else {
          ele.classList.remove(...cls);
        }
      }
    });
    logEvent("c", {
      c: "t",
      v: this.props.geoId,
    });
  };

  triangleBbox = () => {
    const [p1, p2, p3] = this.props.t.p;
    const a = coordsToSvg(p1.pt, this.props.miniScale);
    const b = coordsToSvg(p2.pt, this.props.miniScale);
    const c = coordsToSvg(p3.pt, this.props.miniScale);

    const dStr =
      pops.moveTo(a) + pops.lineTo(b) + pops.lineTo(c) + pops.closePath();
    return dStr;
  };

  triangleInCenter = () => {
    const segLength = (p1: Vector, p2: Vector) => vops.mag(vops.sub(p1, p2));
    const [A, B, C] = [
      this.props.t.p[0].pt,
      this.props.t.p[1].pt,
      this.props.t.p[2].pt,
    ];
    const a = segLength(B, C);
    const b = segLength(C, A);
    const c = segLength(A, B);
    const incenterCoord: Vector = vops.add(
      vops.add(vops.smul(A, a / (a + b + c)), vops.smul(B, b / (a + b + c))),
      vops.smul(C, c / (a + b + c))
    );
    return coordsToSvg(incenterCoord, this.props.miniScale);
  };

  render() {
    // calculate center of triangle
    const [p1, p2, p3] = this.props.t.p;
    // centroid is at 1/3(u+v+w)
    const center = vops.smul(vops.add(vops.add(p1.pt, p2.pt), p3.pt), 1 / 3);
    const triStyle = updateStyle(this.props.mode, true);
    const triIncenter = this.triangleInCenter();
    return (
      <>
        {this.props.congruent && (
          <>
            <text
              x={triIncenter[0]}
              y={triIncenter[1] + 10}
              className={"text-4xl leading-[16px] " + triStyle}
              id={this.props.geoId + "-conglabel"}
              key={this.props.geoId + "-conglabel"}
              fill="black"
              textAnchor="middle"
            >
              {strs.congruent}
            </text>
            <path
              d={this.triangleBbox()}
              id={this.props.geoId + "-bg"}
              key={this.props.geoId + "-bg"}
              fill={`url(#${getPatternId(this.props.mode, this.props.rotate)})`}
            />
          </>
        )}
        {this.props.hoverable && (
          <HoverTextLabel
            pt={coordsToSvg(center, this.props.miniScale)}
            rot={0}
            text={strs.triangle + this.props.t.label}
            isHovered={this.state.isActive}
            isPinned={Boolean(this.state.isPinned)}
          />
        )}
        {this.props.hoverable && (
          <path
            d={this.triangleBbox()}
            id={this.props.geoId + "-hover"}
            key={this.props.geoId + "-hover"}
            onPointerEnter={() => this.onHover(true)}
            onPointerLeave={() => this.onHover(false)}
            onClick={() => this.onHoverLabelClick(!this.state.isPinned)}
            style={{
              opacity: 0,
              fill: "blue",
              cursor: "pointer",
            }}
          />
        )}
      </>
    );
  }
}
