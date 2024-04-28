import { BaseSVG } from "./BaseSVG";
import { PathSVGProps } from "./svgTypes";

export class PathSVG extends BaseSVG {
  private d: string;
  constructor(props: PathSVGProps) {
    super(props);
    this.d = props.d;
  }

  render() {
    return (
      <path
        d={this.d}
        id={this.geoId}
        key={this.geoId}
        className={this.updateStyle(this.props.mode)}
      />
    );
  }
}
