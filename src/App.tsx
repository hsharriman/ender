import React from "react";
import { InteractiveAppPage } from "./components/InteractiveAppPage";
import { StaticAppPage } from "./components/StaticAppPage";
import { SusPage } from "./components/SusPage";
import { LayoutProps } from "./core/types/types";
import { PC1 } from "./theorems/checking/pc1";
import { PC2 } from "./theorems/checking/pc2";
import { PC3 } from "./theorems/checking/pc3";
import { P1 } from "./theorems/complete/proof1";
import { P2 } from "./theorems/complete/proof2";
import { P3 } from "./theorems/complete/proof3";
import { IP1 } from "./theorems/incomplete/ip1";
import { IP2 } from "./theorems/incomplete/ip2";
import { IP3 } from "./theorems/incomplete/ip3";
import SavePage from "./components/SavePage";

interface AppMeta {
  layout: LayoutOptions;
  proofMeta: LayoutProps;
}
type LayoutOptions = "static" | "interactive";

/* Helper methods related to randomizing the proof order */
const fisherYates = (arrLen: number) => {
  // create a range of numbers from 0 to arrLen in an array
  const arr = Array.from({ length: arrLen }, (_, i) => i);
  // shuffle the array with Fisher-Yates algorithm
  for (let i = arrLen - 1; i >= 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    arr.push(arr[randomIndex]);
    arr.splice(randomIndex, 1);
  }
  // return the shuffled array
  return arr;
};

const randomizeProofs = (arr: LayoutProps[]) => {
  const order = fisherYates(arr.length);
  const newArr = order.map((i) => arr[i]);
  // only 2 proofs are needed per experiment
  if (arr.length === 2) return newArr;
  return newArr.slice(1);
};

const staticLayout = (proofMeta: LayoutProps): AppMeta => {
  return {
    layout: "static",
    proofMeta,
  };
};
const interactiveLayout = (proofMeta: LayoutProps): AppMeta => {
  return {
    layout: "interactive",
    proofMeta,
  };
};

const randomizeLayout = (proofMetas: LayoutProps[]): AppMeta[] => {
  // randomly pick 0 or 1
  // if 1, then the first proof is static, else interactive
  const staticFirst = Math.round(Math.random()) === 1;
  return staticFirst
    ? [staticLayout(proofMetas[0]), interactiveLayout(proofMetas[1])]
    : [interactiveLayout(proofMetas[0]), staticLayout(proofMetas[1])];
};

interface AppProps {}
interface AppState {
  activePage: number;
  activeTest: number;
  refresh: boolean;
  activePageName: string;
  answers: {
    [proofName: string]: {
      [question: string]: string;
    };
  };
}
export class App extends React.Component<AppProps, AppState> {
  private meta: AppMeta[] = [];
  constructor(props: AppProps) {
    super(props);
    this.state = {
      activePage: 0,
      activeTest: 0,
      refresh: true,
      activePageName: "",
      answers: {},
    };

    const randomCompleteProofs = randomizeLayout(randomizeProofs([P1, P2, P3])); // 2 random complete proofs
    const randomCheckingProofs = randomizeLayout(
      randomizeProofs([PC1, PC2, PC3])
    );
    const randomIncompleteProofs = randomizeLayout(
      randomizeProofs([IP1, IP2, IP3])
    );

    let randomProofOrder = randomCompleteProofs.concat(
      randomCheckingProofs,
      randomIncompleteProofs
    );
    // shuffle activities
    const shuffleProofOrder = fisherYates(randomProofOrder.length);
    this.meta = shuffleProofOrder.map((i) => randomProofOrder[i]);
  }

  onClick = (direction: number) => (e: React.MouseEvent<HTMLButtonElement>) => {
    if (this.state.activePage + direction < 0) {
      this.setState({ activeTest: 0 });
    } else {
      this.setState({
        activePage: this.state.activePage + direction,
        refresh: true,
      });
    }
  };

  onClickCallback = () => {
    this.setState({ refresh: false });
  };

  updateAnswers = (proofName: string, question: string, answer: string) => {
    this.setState((prevState) => ({
      answers: {
        ...prevState.answers,
        [proofName]: {
          ...prevState.answers[proofName],
          [question]: answer,
        },
      },
    }));
  };

  // saveAnswersAsCSV = () => {
  //   const csvRows = [["Proof", "Question", "Answer"]];
  //   for (const proof in this.state.answers) {
  //     for (const question in this.state.answers[proof]) {
  //       csvRows.push([proof, question, this.state.answers[proof][question]]);
  //     }
  //   }
  //   const csvContent =
  //     "data:text/csv;charset=utf-8," +
  //     csvRows.map((e) => e.join(",")).join("\n");
  //   const encodedUri = encodeURI(csvContent);
  //   const link = document.createElement("a");
  //   link.setAttribute("href", encodedUri);
  //   link.setAttribute("download", "answers.csv");
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  // };

  render() {
    const currMeta = this.meta[this.state.activePage];
    return (
      <div>
        <div className="sticky top-0 left-0 bg-gray-50 p-6 z-30" id="header">
          <button
            className="absolute top-0 left-0 p-3 font-bold underline underline-offset-2 z-30 text-lg"
            id="prev-arrow"
            style={{ display: this.state.activePage >= 0 ? "block" : "none" }}
            onClick={this.onClick(-1)}
          >
            {"Previous"}
          </button>
          <div className="absolute top-0 p-3 left-24 z-30 font-bold text-lg">{`${
            this.state.activePage + 1
          } / ${this.meta.length + 3}`}</div>
          <button
            className="absolute top-0 right-0 p-3 font-bold underline underline-offset-2 z-30 text-lg"
            id="next-arrow"
            style={{
              display:
                this.state.activePage < this.meta.length + 3 - 1
                  ? "block"
                  : "none",
            }}
            onClick={this.onClick(1)}
          >
            {"Next"}
          </button>
        </div>
        <div className="w-full h-full flex justify-start">
          {this.state.activePage < this.meta.length ? (
            currMeta.layout === "static" ? (
              <StaticAppPage
                {...{
                  ...currMeta.proofMeta,
                  pageNum: this.state.activePage,
                  reset: this.state.refresh,
                  onClickCallback: this.onClickCallback,
                  proofName: currMeta.proofMeta.name,
                  updateAnswers: this.updateAnswers,
                  answers: this.state.answers[currMeta.proofMeta.name] || {},
                }}
              />
            ) : (
              <InteractiveAppPage
                {...{
                  ...currMeta.proofMeta,
                  pageNum: this.state.activePage,
                  reset: this.state.refresh,
                  onClickCallback: this.onClickCallback,
                  proofName: currMeta.proofMeta.name,
                  updateAnswers: this.updateAnswers,
                  answers: this.state.answers[currMeta.proofMeta.name] || {},
                }}
              />
            )
          ) : this.state.activePage === this.meta.length ? (
            <SusPage
              key={this.state.activePage}
              type="Static"
              updateAnswers={this.updateAnswers}
              answers={this.state.answers["Static"] || {}}
            />
          ) : this.state.activePage === this.meta.length + 1 ? (
            <SusPage
              key={this.state.activePage}
              type="Interactive"
              updateAnswers={this.updateAnswers}
              answers={this.state.answers["Interactive"] || {}}
            />
          ) : (
            <SavePage answers={this.state.answers} />
          )}
        </div>
      </div>
    );
  }
}

export default App;
