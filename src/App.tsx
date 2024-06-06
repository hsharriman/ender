import React from "react";
import { InPlaceLayout } from "./components/layouts/InPlaceLayout";
import { StaticLayout } from "./components/layouts/StaticLayout";
import { PC1 } from "./theorems/checking/pc1";
import { PC2 } from "./theorems/checking/pc2";
import { PC3 } from "./theorems/checking/pc3";
import { P1 } from "./theorems/complete/proof1";
import { P2 } from "./theorems/complete/proof2";
import { P3 } from "./theorems/complete/proof3";
import { SusPage } from "./components/SusPage";
import { LayoutProps } from "./core/types/types";

const NUM_PAGES = 6;

const randomizeOrder = (arr: number[]) => {
  for (let i = arr.length - 1; i >= 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    arr.push(arr[randomIndex]);
    arr.splice(randomIndex, 1);
  }
  return arr;
};

const randomizeProofs = (arr: LayoutProps[]) => {
  const order = randomizeOrder([0, 1, 2]);
  const newArr = order.map((i) => arr[i]);

  return newArr.slice(1);
};

const randomizeLayout = (proof: LayoutProps[]) => {
  const randomNum = Math.floor(Math.random());

  const newLayout = proof.map((i) => {
    if (randomNum === 0) {
      return StaticLayout(i);
    } else {
      return InPlaceLayout(i);
    }
  });

  return newLayout;
};

interface AppProps {}
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

    // TODO randomize order of questions and type
    const randomCompleteProofs = randomizeProofs([P1, P2, P3]);
    const randomizedCompleteProofs = randomizeLayout(randomCompleteProofs);
    const randomCheckingProofs = randomizeProofs([PC1, PC2, PC3]);
    const randomizedCheckingProofs = randomizeLayout(randomCheckingProofs);
    let randomProofOrder = randomizedCompleteProofs.concat(
      randomizedCheckingProofs
    );

    const presetOrder1 = [
      InPlaceLayout(P1),
      StaticLayout(P2),
      InPlaceLayout(P3),
      StaticLayout(PC1),
      InPlaceLayout(PC2),
      StaticLayout(PC3),
    ];
    const presetOrder2 = [
      StaticLayout(P1),
      InPlaceLayout(P2),
      StaticLayout(P3),
      InPlaceLayout(PC1),
      StaticLayout(PC2),
      InPlaceLayout(PC3),
    ];
    this.orders.set(1, presetOrder1);
    this.orders.set(2, presetOrder2);
    this.orders.set(3, randomProofOrder);
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
          } / ${NUM_PAGES + 2}`}</div>
          <button
            className="absolute top-0 right-0 p-3 underline underline-offset-2 z-30 text-sm"
            id="next-arrow"
            style={{
              display:
                this.state.activePage < NUM_PAGES + 2 - 1 ? "block" : "none",
            }}
            onClick={this.onClick(1)}
          >
            {"Next"}
          </button>
        </div>
        <div className="w-full h-full flex justify-start">
          {this.state.activePage <= NUM_PAGES - 1 ? (
            testOrder[this.state.activePage]
          ) : (
            <SusPage
              key={this.state.activePage}
              type={this.state.activePage === 6 ? "Static" : "Interactive"}
            />
          )}
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
