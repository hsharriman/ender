import React from "react";
import { ProofTextItem } from "../core/types/stepTypes";
import { logEvent } from "../core/utils";

export interface ProofRowsProps {
  active: string;
  items: ProofTextItem[];
  onClick: (n: string) => void; // callback that returns new selected idx when clicked
  reliesOn?: Map<string, Set<string>>;
}
export interface ProofRowsState {
  idx: number;
  showAll: boolean;
  viewed: Set<string>;
  revealed: number;
}
export class ProofRows extends React.Component<ProofRowsProps, ProofRowsState> {
  private idPrefix = "prooftext-";
  constructor(props: ProofRowsProps) {
    super(props);
    this.state = {
      idx: 0,
      showAll: false,
      viewed: new Set(),
      revealed: 0,
    };
  }

  componentDidMount() {
    document.addEventListener("keydown", this.onKeyboardPress);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.onKeyboardPress);
  }

  onReveal = () => {
    if (this.state.revealed < this.props.items.length - 2) {
      const newIdx = this.state.revealed + 1;
      this.setState({ revealed: newIdx, idx: newIdx + 1 });
      this.props.onClick(`s${newIdx}`);
      logEvent("c", {
        c: "pr",
        v: `s${newIdx}`,
      });
    }
  };

  onKeyboardPress = (event: KeyboardEvent) => {
    let newIdx = this.state.idx;
    if (
      event.key === "ArrowDown" &&
      this.state.idx < this.props.items.length - 1
    ) {
      newIdx = this.state.idx + 1;
    } else if (event.key === "ArrowUp" && this.state.idx > 0) {
      newIdx = this.state.idx - 1;
    }
    if (newIdx !== this.state.idx && this.props.items[newIdx] !== undefined) {
      const newActive = this.props.items[newIdx].k;
      this.setState({
        idx: newIdx,
      });
      this.props.onClick(newActive);
    }
  };

  onClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const active = event.currentTarget.id.replace(this.idPrefix, "");
    if (active !== this.props.active) {
      const newIdx = this.props.items.findIndex((item) => item.k === active);
      if (newIdx === -1) {
        console.error(
          "couldn't find match in ProofRows items array for key: ",
          active
        );
      }
      if (active !== "given" && active !== "prove") {
        this.setState({
          viewed: new Set([...Array.from(this.state.viewed), active]),
        });
      }
      this.setState({
        idx: newIdx,
      });
      this.props.onClick(active);
      logEvent("c", {
        c: "pr",
        v: active,
      });
    }
  };

  highlightBar = (k: string, h: string) => {
    return (
      <div
        id="active-bar"
        className={`w-4 ${h} transition-all ease-in-out duration-300`}
        style={
          this.props.active === k ? { borderLeft: "10px double #9A76FF" } : {}
        }
      ></div>
    );
  };

  renderPremise = (premise: string, item: ProofTextItem) => {
    return (
      <div className="flex flex-row justify-start">
        {this.highlightBar(item.k, "h-12")}
        <button
          id={`${this.idPrefix}${item.k}`}
          onClick={this.onClick}
          className="py-2 border-b-2 border-gray-300 text-md w-full h-12 ml-2 focus:outline-none"
        >
          <div className="flex flex-row justify-start gap-8 align-baseline ml-2">
            <div className="font-semibold">{`${premise}:`} </div>
            {item.v}
          </div>
        </button>
      </div>
    );
  };

  onClickShowAll = () => {
    this.setState({ ...this.state, showAll: !this.state.showAll });
  };

  renderRow = (item: ProofTextItem, i: number) => {
    const activeItem = this.props.items[this.state.idx];
    const isActive = activeItem && activeItem.k === item.k;
    const depends = activeItem && activeItem.dependsOn?.has(item.k);
    // TODO update item.v to require a param that tells if linkedtext should be active or not, for colored text
    const textColor = isActive
      ? "text-slate-900"
      : depends || this.state.showAll || this.state.viewed.has(item.k)
      ? "text-slate-500"
      : "text-slate-500";
    const strokeColor = isActive
      ? "border-slate-800"
      : depends || this.state.showAll
      ? "border-slate-500"
      : "border-slate-500";
    if (this.state.revealed < i + 1) {
      // render empty row
      return (
        <div className={`flex flex-row justify-start h-16`} key={item.k}>
          <div
            id={`${this.idPrefix}${item.k}`}
            className="border-gray-300 border-b-2 w-full h-16 ml-6 text-lg focus:outline-none"
          >
            <div
              className={`${textColor} ${strokeColor} py-4  grid grid-rows-1 grid-cols-2`}
            >
              <div className="flex flex-row justify-start gap-8 ml-2 align-baseline">
                <div className="text-slate-400 font-bold">{i + 1}</div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={`flex flex-row justify-start h-16`} key={item.k}>
        {this.highlightBar(item.k, "h-16")}
        <button
          id={`${this.idPrefix}${item.k}`}
          onClick={this.onClick}
          className="border-gray-300 border-b-2 w-full h-16 ml-2 text-lg focus:outline-none"
        >
          <div
            className={`${textColor} ${strokeColor} py-4  grid grid-rows-1 grid-cols-2`}
          >
            <div className="flex flex-row justify-start gap-8 ml-2 align-baseline">
              <div
                className={`${
                  isActive ? "text-violet-500" : "text-slate-400"
                } font-bold`}
              >
                {i + 1}
              </div>
              <div>{item.v}</div>
            </div>
            <div
              className={`flex flex-row justify-start align-baseline`}
              id={`reason-${i + 1}`}
            >
              {item.reason}
            </div>
          </div>
        </button>
      </div>
    );
  };

  render() {
    if (this.props.items.length > 0) {
      // first 2 rows are "given" and "prove"
      const given = this.props.items[0];
      const prove = this.props.items[1];
      return (
        <>
          {this.renderPremise("Given", given)}
          {this.renderPremise("Prove", prove)}
          <div className="h-8"></div>
          <button onClick={this.onReveal}>Next Row</button>
          <div className="py-2 border-b-2 border-gray-300 grid grid-rows-1 grid-cols-2 text-lg font-bold ml-6">
            <div className="flex flex-row justify-start gap-8 ml-2 align-baseline">
              <div className="opacity-0">0</div>
              <div>Statement</div>
            </div>
            <div className="flex flex-row justify-between align-baseline">
              <div>Reason</div>
              {
                <button
                  className="text-xs self-end px-2 py-1 italic bg-transparent text-violet-500 justify-center rounded-md"
                  onClick={this.onClickShowAll}
                >
                  {`${
                    this.state.showAll ? "Show Current Row" : "Show All Rows"
                  }`}
                </button>
              }
            </div>
          </div>
          {this.props.items.slice(2).map((item, i) => this.renderRow(item, i))}
          <div className="w-full mt-4 text-right font-semibold text-base tracking-wide text-slate-800">
            Q.E.D.
          </div>
        </>
      );
    }
    return <></>;
  }
}

// interface ProofRowProps {
//   isActive: boolean;
//   depends: boolean;
//   showAll: boolean;
//   idPrefix: string;
//   i: number;
//   item: ProofTextItem;
//   onClick: () => void;
// }
// interface ProofRowState {
//   isClicked: boolean;
// }
// interface ProofRowState {}
// class ProofRow extends React.Component<ProofRowProps, ProofRowState> {
//   constructor(props: ProofRowProps) {
//     super(props);
//     this.state = {
//       isClicked: false
//     }
//   }

//   highlightBar = (k: string) => {
//     return (
//       <div
//         id="active-bar"
//         className="w-4 h-16 transition-all ease-in-out duration-300"
//         style={
//           this.props.isActive ? { borderLeft: "10px double #9A76FF" } : {}
//         }
//       ></div>
//     );
//   };

//   onClick = () => {
//     if (!this.state.isClicked) {
//       this.setState({isClicked: true});
//     }
//     this.props.onClick();
//   }

//   render () {
//     const textColor = this.props.isActive
//       ? "text-slate-800"
//       : this.props.depends || this.props.showAll
//       ? "text-slate-500"
//       : "text-slate-100";
//     const strokeColor = this.props.isActive
//       ? "border-slate-800"
//       : this.props.depends || this.props.showAll
//       ? "border-slate-500"
//       : "border-slate-100";
//     const opacity = this.props.isActive ? "opacity-1 block" : "opacity-0 hidden";
//     return (
//       <div className="flex flex-row justify-start h-16" key={this.props.item.k}>
//         {this.highlightBar(this.props.item.k)}
//         <button
//           id={`${this.props.idPrefix}${this.props.item.k}`}
//           onClick={this.props.onClick}
//           className="border-gray-300 border-b-2 w-full h-16 ml-2 text-lg focus:outline-none"
//         >
//           <div
//             className={`${textColor} ${strokeColor} py-4  grid grid-rows-1 grid-cols-2`}
//           >
//             <div className="flex flex-row justify-start gap-8 ml-2 align-baseline">
//               <div
//                 className={`${
//                   this.props.isActive ? "text-violet-500" : "text-slate-400"
//                 } font-bold`}
//               >
//                 {this.props.i + 1}
//               </div>
//               <div className={``}>{this.props.item.v}</div>
//             </div>
//             <div
//               className={`flex flex-row justify-start align-baseline`}
//               id={`reason-${this.props.i + 1}`}
//             >
//               {this.props.item.reason}
//             </div>
//           </div>
//         </button>
//       </div>
//     );
//   }
// }
