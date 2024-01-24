import { Canvas } from "./Canvas";

export interface CardProps {
  idx: number;
  text: string;
  svg: JSX.Element;
}
const Card = (props: CardProps): JSX.Element => {
  return <div id={`card-${props.idx}`} className="size-96 bg-slate-300 justify-center flex-col p-3">
    <Canvas svg={props.svg} idx={props.idx}/>
    <div className="font-sans text-sm text-slate-100">
      {props.text}
    </div>
  </div>;
}

export default Card;