import { ModeCSS } from "./SVGStyles";

export const Legend = () => {
  const modes: [string, string][] = [
    ["New Statement", ModeCSS.DERIVEDFILL],
    ["Relies on", ModeCSS.RELIESFILL],
    ["Inconsistency", ModeCSS.INCONSISTENTFILL],
  ];
  const renderItem = (mode: string, text: string, isLast?: boolean) => (
    <div className="inline-flex flex-row pr-2 pb-1">
      <div className="inline-flex w-4 h-4 mr-1">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <rect
            width={"100%"}
            height={"100%"}
            x={"0"}
            y={"0"}
            className={mode + " stroke-[36px]"}
          ></rect>
        </svg>
      </div>
      <div className="text-sm text-black flex-nowrap">{text}</div>
    </div>
  );
  return (
    <div className="mt-2">
      <div className="text-md font-semibold pb-1">Legend</div>
      <div className="flex flex-row flex-wrap">
        {modes.map((m, i) => {
          return renderItem(m[1], m[0], i === modes.length - 1);
        })}
      </div>
    </div>
  );
};
