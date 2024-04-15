// import { Vector } from "../src/core/types";
// import { BaseSVG } from "../src/core/svg/BaseSVG";
// import { CircularArcSVGProps, SVGObj } from "../src/core/svg/svgTypes";

// export class SVGCurve extends BaseSVG {
//   readonly props: CircularArcSVGProps;
//   constructor(props: CircularArcSVGProps) {
//     super(props);
//     this.props = props;
//   }

//   moveTo = (pt: Vector) => {
//     return `M ${pt[0]} ${pt[1]} `;
//   };

//   arcTo = (r: number, major: number, sweep: number, end: Vector) => {
//     return `A ${r} ${r} 0 ${major} ${sweep} ${end[0]} ${end[1]}`;
//   };

//   render() {
//     const pathStr =
//       this.moveTo(this.props.start) +
//       this.arcTo(
//         this.props.r,
//         this.props.majorArc,
//         this.props.sweep,
//         this.props.end
//       );
//     return (
//       <path
//         d={pathStr}
//         id={this.geoId}
//         // style={this.updateStyle()}
//         className={this.updateStyle()}
//         key={this.geoId}
//       />
//     );
//   }
// }
