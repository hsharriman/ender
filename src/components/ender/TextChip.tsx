import { Obj } from "../../core/types/types";

export interface TextChipProps {
  val: string;
  clr: string;
  isActive: boolean;
  obj: Obj;
}

export const TextChip = (props: TextChipProps) => {
  const renderText = () => {
    switch (props.obj) {
      case Obj.Segment:
        return (
          <span
            className={`border-t-2 border-solid ${
              props.isActive ? "border-white" : "border-slate-800"
            } leading-tight`}
          >{`${props.val}`}</span>
        );
      case Obj.Triangle:
        return (
          <span className={`font-notoSerif opacity-inherit `}>
            <span className="text-l leading-4 font-semibold opacity-inherit">{`\u25B3`}</span>
            {props.val}
          </span>
        );
      case Obj.Angle:
        return (
          <span className={`font-notoSerif opacity-inherit `}>
            <span className="text-2xl leading-4">{`\u2220`}</span>
            {props.val}
          </span>
        );
      default:
        return <span>{props.val}</span>;
    }
  };
  const style = props.isActive
    ? props.clr +
      " inline-flex text-white py-1 px-2 rounded-md text-sm font-notoSerif"
    : "inline-flex opacity-inherit font-notoSerif";
  return (
    <div id={`${props.obj}-text-${props.val}`} className={style}>
      {renderText()}
    </div>
  );
};
