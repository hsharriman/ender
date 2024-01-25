import { Euclidean } from "./geometry/Euclidean";

export interface CardProps {
  idx: number;
  text: string;
  content: () => JSX.Element[];
}
const Card = (props: CardProps): JSX.Element => {
  return <div id={`card-${props.idx}`} className="size-96 bg-slate-300 justify-center flex-col p-3">
    <div id="svg-canvas" className="box-border h-80 w-80 p-4 bg-white">
        <Euclidean svgIdSuffix={props.idx} content={props.content}/>
      </div>
    <div className="font-sans text-sm text-slate-100">
      {props.text}
    </div>
  </div>;
}

export default Card;