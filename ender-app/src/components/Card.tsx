import { BaseSVG } from "../core/svg/BaseSVG";
import { Euclidean } from "./geometry/Euclidean";

export interface CardProps {
  idx: number;
  text: string;
  content: () => BaseSVG[];
  miniContent?: () => BaseSVG[];
}
const Card = (props: CardProps): JSX.Element => {
  return (
    <div
      id={`card-${props.idx}`}
      className="size-96 bg-cyan-200 justify-center flex-col p-3 m-2 rounded-sm"
    >
      <div>
        <div
          id="svg-canvas"
          className="box-border h-80 w-94 p-4 bg-white rounded-sm"
        >
          <div className="absolute h-80 w-94">
            <Euclidean svgIdSuffix={props.idx} content={props.content} />
            {props.miniContent && (
              <div
                id="svg-canvas-mini"
                className="absolute h-24 w-24 bg-slate-300 -top-4 -right-11 z-10"
              >
                <Euclidean
                  svgIdSuffix={props.idx}
                  content={props.miniContent}
                />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="font-sans text-sm text-slate-800">{props.text}</div>
    </div>
  );
};

export default Card;
