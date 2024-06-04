import React from "react";
import { Check1 } from "./theorems/checking/p1/Check1";
import { Check2 } from "./theorems/checking/p2/Check2";
import { Complete1 } from "./theorems/complete/proof1/Complete1";
import { Complete2 } from "./theorems/complete/proof2/Complete2";
import { Complete3 } from "./theorems/complete/proof3/Complete3";
import { Check3 } from "./theorems/checking/p3/Check3";

// TODO: refractor and so that the last submit button will move along to the next proof

const order1 = [
  new Complete1().inPlace(),
  new Complete2().staticForm(),
  new Complete3().inPlace(),
  new Check1().staticForm(),
  new Check2().inPlace(),
  new Check3().staticForm(),
];

const order2 = [
  new Complete1().staticForm(),
  new Complete2().inPlace(),
  new Complete3().inPlace(),
  new Check1().inPlace(),
  new Check2().staticForm(),
  new Check3().staticForm(),
];

const order3 = [
  new Complete1().staticForm(),
  new Complete2().inPlace(),
  new Complete3().staticForm(),
  new Check1().inPlace(),
  new Check2().staticForm(),
  new Check3().inPlace(),
];
const NUM_PAGES = 6;

export interface AppProps {}
export interface AppState {
  activePage: number;
  activeTest: number;
}
export class App extends React.Component<AppProps, AppState> {
  private orders = new Map<number, JSX.Element[]>();
  constructor(props: AppProps) {
    super(props);
    this.state = {
      activePage: 0,
      activeTest: 0,
    };
    this.orders.set(1, order1);
    this.orders.set(2, order2);
    this.orders.set(3, order3);
  }
  onClick = (direction: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (this.state.activePage + direction < 0) {
      this.setState({ activeTest: 0 });
    } else {
      this.setState({ activePage: this.state.activePage + direction });
    }
  };

  onClickTest = (test: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    this.setState({ activeTest: test });
    if (test > 0) {
      this.renderProofPages(this.orders.get(test) || []);
    }
  };

  renderProofPages = (testOrder: JSX.Element[]) => {
    return (
      <div>
        <div className="sticky top-0 left-0 bg-gray-50 p-6 z-30" id="header">
          <button
            className="absolute top-0 left-0 p-3 underline underline-offset-2 z-30 text-sm"
            id="prev-arrow"
            style={{ display: this.state.activePage >= 0 ? "block" : "none" }}
            onClick={this.onClick(-1)}
          >
            {"Previous"}
          </button>
          <div className="absolute top-0 p-3 left-24 z-30">{`${
            this.state.activePage + 1
          } / ${NUM_PAGES}`}</div>
          <button
            className="absolute top-0 right-0 p-3 underline underline-offset-2 z-30 text-sm"
            id="next-arrow"
            style={{
              display: this.state.activePage < NUM_PAGES - 1 ? "block" : "none",
            }}
            onClick={this.onClick(1)}
          >
            {"Next"}
          </button>
        </div>
        <div className="w-full h-full flex justify-center xl:justify-start">
          {testOrder[this.state.activePage]}
        </div>
      </div>
    );
  };
  render() {
    if (this.state.activeTest > 0) {
      return this.renderProofPages(
        this.orders.get(this.state.activeTest) || []
      );
    }
    return (
      <div className="flex w-screen h-screen justify-center items-center">
        <div className="flex flex-row w-[1100px] h-32 justify-center">
          <button
            className="py-4 px-8 m-4 text-3xl bg-violet-300 rounded-md text-white"
            onClick={this.onClickTest(1)}
          >
            Test 1
          </button>
          <button
            className="py-4 px-8 m-4 text-3xl bg-violet-500 rounded-md text-white"
            onClick={this.onClickTest(2)}
          >
            Test 2
          </button>
          <button
            className="py-4 px-8 m-4 text-3xl bg-violet-700 rounded-md text-white"
            onClick={this.onClickTest(3)}
          >
            Test 3
          </button>
        </div>
      </div>
    );
  }
}

export default App;
