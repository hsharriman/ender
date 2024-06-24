import { LPoint, SVGModes, Vector } from "../../types/types";
import { BaseSVG } from "../BaseSVG";
import { SVGCircle } from "../SVGCircle";
import { SVGText } from "../SVGText";
import { BaseSVGProps } from "../svgTypes";
import { coordsToSvg } from "../svgUtils";

export type SVGPointProps = {
  p: LPoint;
  offset: Vector;
  label: string;
  showLabel?: boolean;
  miniScale: boolean;
} & BaseSVGProps;

export class SVGGeometryPoint extends BaseSVG {
  p: LPoint;
  offset: Vector;
  label: string;
  miniScale: boolean;
  showLabel: boolean;
  constructor(props: SVGPointProps) {
    super(props);
    this.p = props.p;
    this.offset = props.offset;
    this.label = props.label;
    this.miniScale = props.miniScale;
    this.showLabel = props.showLabel ?? true;
  }
  render() {
    return (
      <>
        // TODO fix point rendering
        {/* <SVGCircle
          {...{
            center: coordsToSvg(this.p.pt, this.miniScale),
            r: 2,
            geoId: this.geoId + "-circle",
            mode: this.props.mode, // TODO unnecessary rn
            activeFrame: "",
          }}
        /> */}
        {this.showLabel && (
          <SVGText
            {...{
              point: coordsToSvg(this.p.pt, this.miniScale, this.offset),
              geoId: this.geoId,
              text: this.label,
              style: {
                font: "18px serif",
                fontStyle: "italic",
              },
              mode: SVGModes.Default,
              activeFrame: "",
              hoverable: this.props.hoverable,
            }}
            key={this.geoId}
          />
        )}
      </>
    );
  }
}
