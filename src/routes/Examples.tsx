import React from "react";
import { NavLink } from "react-router-dom";
import ender from "../assets/ender.png";
import { Diagram } from "../components/Diagram";
import {
  InteractiveAppPage,
  InteractiveAppPageProps,
} from "../components/InteractiveAppPage";
import { StaticAppPage, StaticAppPageProps } from "../components/StaticAppPage";
import { interactiveLayout, staticLayout } from "../core/testinfra/setupLayout";
import { LayoutProps } from "../core/types/types";
import { T1_S1_C1 } from "../theorems/testA/stage1/C1";
import { T1_S1_C2 } from "../theorems/testA/stage1/C2";
import { T1_S1_C3 } from "../theorems/testA/stage1/C3";
import { T1_S1_IN1 } from "../theorems/testA/stage1/IN1";
import { T1_S1_IN2 } from "../theorems/testA/stage1/IN2";
import { T1_S1_IN3 } from "../theorems/testA/stage1/IN3";
import { T1_S2_C1 } from "../theorems/testA/stage2/C1";
import { T1_S2_C2 } from "../theorems/testA/stage2/C2";
import { T1_S2_IN1 } from "../theorems/testA/stage2/IN1";
import { T1_S2_IN2 } from "../theorems/testA/stage2/IN2";
import { TutorialProof1, TutorialProof2 } from "../theorems/tutorial/tutorial1";

export interface ExamplesProps {}
export interface ExamplesState {
  activePage: number;
  isInteractive: boolean;
}

export class Examples extends React.Component<ExamplesProps, ExamplesState> {
  private proofs: LayoutProps[];
  constructor(props: ExamplesProps) {
    // add other proofs to examples
    super(props);
    this.proofs = [
      TutorialProof1,
      TutorialProof2,
      T1_S1_C1,
      T1_S1_C2,
      T1_S1_C3,
      T1_S1_IN1,
      T1_S1_IN2,
      T1_S1_IN3,
      T1_S2_C1,
      T1_S2_C2,
      T1_S2_IN1,
      T1_S2_IN2,
    ];
    this.state = {
      activePage: -1,
      isInteractive: true,
    };
  }
  onLayoutToggle = () => {
    this.setState({
      isInteractive: !this.state.isInteractive,
    });
  };

  renderSwitch = () => {
    const r = 10;
    const styling = this.state.isInteractive
      ? "bg-violet-500 border-violet-500 border-2 text-white"
      : "border-slate-500 border-2 fill-none";
    return (
      <button
        className={
          "inline-flex items-baseline text-xs italic rounded-md py-1 px-2 mr-1 transition-all " +
          styling
        }
        onClick={this.onLayoutToggle}
      >
        Use Interactive Layout
      </button>
    );
  };

  renderHeader = (title: string) => {
    return (
      <div
        className="sticky top-0 left-0 bg-slate-100 shadow-sm w-full p-3 z-30 flex justify-between"
        id="header"
      >
        <button
          onClick={this.onClickTile(-1)}
          className="px-3 underline underline-offset-2 z-30 text-sm"
        >
          {"Back"}
        </button>
        <div className="font-semibold">{`Proof: ${title}`}</div>
        {this.renderSwitch()}
      </div>
    );
  };

  onClickTile = (idx: number) => () => {
    this.setState({ activePage: idx });
  };

  renderProof = (proof: LayoutProps) => {
    const layout = this.state.isInteractive
      ? interactiveLayout(proof).meta
      : staticLayout(proof).meta;
    const toggleLayoutStr = this.state.isInteractive
      ? "Toggle static"
      : "Toggle interactive";
    if (layout) {
      return (
        <>
          {this.renderHeader(proof.title)}
          <div className="w-full h-full flex justify-start">
            {this.state.isInteractive ? (
              <InteractiveAppPage
                {...{
                  ...(layout.props as InteractiveAppPageProps),
                  pageNum: this.state.activePage,
                }}
                key={"interactive-pg" + this.state.activePage}
              />
            ) : (
              <StaticAppPage
                {...{
                  ...(layout.props as StaticAppPageProps),
                  pageNum: this.state.activePage,
                }}
                key={"static-pg" + this.state.activePage}
              />
            )}
          </div>
        </>
      );
    }
    return <></>;
  };

  renderExampleTile = (proof: LayoutProps, idx: number) => {
    const layout = staticLayout(proof).meta;
    if (layout) {
      const diagramCtx = layout.props as StaticAppPageProps;
      return (
        <button
          className="m-4 w-72 h-72 border-2 border-slate-300 shadow-md rounded-md justify-center items-center flex flex-col"
          onClick={this.onClickTile(idx)}
        >
          {proof.title}
          {/* <StaticDiagram
            svgIdSuffix={proof.name}
            width="260px"
            height="auto"
            ctx={diagramCtx.ctx}
          /> */}
          <Diagram
            width="260px"
            height="auto"
            svgIdSuffix={proof.name}
            activeFrame={"given"}
            ctx={diagramCtx.ctx}
            miniScale={false}
          />
        </button>
      );
    }
    return <></>;
  };

  renderExamplesGallery = () => {
    return (
      <>
        <div
          className="sticky top-0 left-0 p-3 h-10 z-30 flex bg-gradient-to-r from-violet-500 to-transparent"
          id="header"
        >
          <NavLink to={"/"} className="px-3 text-sm h-8">
            <img src={ender} className="h-12 w-auto shadow-sm" />
          </NavLink>
          <div className="text-white italic tracking-widest">Ender</div>
        </div>
        <div className="w-screen h-full bg-white p-8">
          <div className="font-notoSans font-medium text-slate-700 text-3xl border-b-2 border-slate-300 mb-4 pb-4">
            Triangle Congruence Proof Examples
          </div>
          <div className="flex flex-row flex-wrap">
            {this.proofs.map((proof, idx) =>
              this.renderExampleTile(proof, idx)
            )}
          </div>
        </div>
      </>
    );
  };

  render() {
    if (this.state.activePage >= 0) {
      return this.renderProof(this.proofs[this.state.activePage]);
    } else {
      return this.renderExamplesGallery();
    }
  }
}
