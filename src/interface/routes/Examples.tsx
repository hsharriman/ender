import { presentationToProofObj } from "checker/verified/presentationAdapter";
import { checkVerifiedReport } from "checker/verified/wasmLoader";
import { presentationContent } from "interface/core/grammarToLayout/presentationContent";
import {
  diagramAspectFor,
  interactiveLayoutFromProofObj,
} from "interface/core/grammarToLayout/proofObjLayout";
import { isGiven } from "interface/theorems/reasons";
import React from "react";
import { Link, NavLink } from "react-router-dom";
import CIRC_1 from "../../checker/proofs/examples/circ_1.txt?raw";
import CIRC_2 from "../../checker/proofs/examples/circ_2.txt?raw";
import OVERLAP from "../../checker/proofs/examples/overlap.txt?raw";
import RHOMBUS from "../../checker/proofs/examples/rhombusOutside.txt?raw";
import S1_C1 from "../../checker/proofs/examples/s1c1.txt?raw";
import S1_C2 from "../../checker/proofs/examples/s1c2.txt?raw";
import S1_C3 from "../../checker/proofs/examples/s1c3.txt?raw";
import S1_IN1 from "../../checker/proofs/examples/s1inc1.txt?raw";
import S1_IN2 from "../../checker/proofs/examples/s1inc2.txt?raw";
import S1_IN3 from "../../checker/proofs/examples/s1inc3.txt?raw";
import S2_C1 from "../../checker/proofs/examples/s2c1.txt?raw";
import S2_C2 from "../../checker/proofs/examples/s2c2.txt?raw";
import S2_IN1 from "../../checker/proofs/examples/s2inc1.txt?raw";
import S2_IN2 from "../../checker/proofs/examples/s2inc2.txt?raw";
import TUTORIAL_2 from "../../checker/proofs/examples/tutinc.txt?raw";
import TUTORIAL_1 from "../../checker/proofs/examples/tutorial.txt?raw";
import ender from "../assets/ender.png";
import { StaticAppPageProps } from "../components/ender/StaticAppPage";
import { StaticDiagram } from "../components/ender/StaticDiagram";
import { AspectRatio } from "../core/diagramSvg/svgTypes";
import { staticLayout } from "../core/grammarToLayout/setupLayout";

/** A gallery proof: its text, and its key in the harness's proof list. */
interface ExampleProof {
  key: string;
  source: string;
}

/** What a gallery tile draws, once the checker has read the proof. */
interface ExampleTile {
  title: string;
  ctx: StaticAppPageProps["ctx"];
  diagramAspect: AspectRatio;
  /** The frame after the givens, so the tile shows the given marks. */
  frame: string;
  hasMistake: boolean;
}

export interface ExamplesProps {}
export interface ExamplesState {
  /** Indexed like `proofs`; null until the checker has read that proof. */
  tiles: Array<ExampleTile | null>;
}

const example = (file: string, source: string): ExampleProof => ({
  key: `examples/${file}`,
  source,
});

/** Run the checker on a proof and lay out its figure for a tile. */
const buildTile = async ({ source }: ExampleProof): Promise<ExampleTile> => {
  const report = await checkVerifiedReport(source);
  if (!report.presentation) throw new Error("proof did not parse");
  const proof = presentationToProofObj(report.presentation, report.rays);
  const ctx = presentationContent(proof);
  const layout = interactiveLayoutFromProofObj(proof, ctx);
  const givens = layout.steps.filter((s) => isGiven(s.reason)).length;
  return {
    title: layout.title,
    ctx: (staticLayout(layout).props as StaticAppPageProps).ctx,
    diagramAspect: diagramAspectFor(proof),
    frame: `s${givens}`,
    hasMistake: report.verdict !== "accepted",
  };
};

export class Examples extends React.Component<ExamplesProps, ExamplesState> {
  private proofs: ExampleProof[];
  private unmounted = false;

  constructor(props: ExamplesProps) {
    // add other proofs to examples
    super(props);
    this.proofs = [
      example("s1c1.txt", S1_C1),
      example("tutorial.txt", TUTORIAL_1),
      example("tutinc.txt", TUTORIAL_2),
      example("s1c2.txt", S1_C2),
      example("s1inc1.txt", S1_IN1),
      example("s1c3.txt", S1_C3),
      example("s1inc2.txt", S1_IN2),
      example("s1inc3.txt", S1_IN3),
      example("s2c1.txt", S2_C1),
      example("s2c2.txt", S2_C2),
      example("s2inc1.txt", S2_IN1),
      example("s2inc2.txt", S2_IN2),
      example("overlap.txt", OVERLAP),
      example("circ_2.txt", CIRC_2),
      example("circ_1.txt", CIRC_1),
      example("rhombusOutside.txt", RHOMBUS),
    ];
    this.state = { tiles: this.proofs.map(() => null) };
  }

  componentDidMount = () => {
    // StrictMode remounts the same instance after unmounting it.
    this.unmounted = false;
    this.proofs.forEach((proof, idx) => {
      buildTile(proof)
        .then((tile) => {
          if (this.unmounted) return;
          this.setState((prev) => {
            const tiles = [...prev.tiles];
            tiles[idx] = tile;
            return { tiles };
          });
        })
        .catch((err) =>
          console.error(`Could not load example ${proof.key}:`, err),
        );
    });
  };

  componentWillUnmount = () => {
    this.unmounted = true;
  };

  renderExampleTile = (proof: ExampleProof, idx: number) => {
    const tile = this.state.tiles[idx];
    return (
      <Link
        key={proof.key}
        to={`/ender/harness?proof=${encodeURIComponent(proof.key)}`}
        className="m-4 w-72 h-72 border-2 bg-slate-50 shadow-md rounded-md flex flex-col"
      >
        <div className="w-full flex justify-between border-b-2 border-slate-500 border-dotted bg-slate-50 font-mono text-xs py-1 px-2">
          {tile?.title ?? proof.key}
          {tile?.hasMistake && (
            <div className="font-mono text-orange-500 font-bold text-xs">
              {"[M]"}
            </div>
          )}
        </div>
        <div className="flex justify-center items-center w-full h-full flex-col">
          {tile ? (
            <StaticDiagram
              svgIdSuffix={`example-${idx}`}
              width="260px"
              height="auto"
              ctx={tile.ctx}
              diagramAspect={tile.diagramAspect}
              activeFrame={tile.frame}
            />
          ) : (
            <div className="text-xs italic text-slate-400">Loading...</div>
          )}
        </div>
      </Link>
    );
  };

  render() {
    return (
      <>
        <div
          className="sticky top-0 left-0 p-3 h-10 z-30 flex bg-gradient-to-r from-violet-500 via-30% via-blue-500"
          id="header"
        >
          <NavLink to={"/ender"} className="px-3 text-sm h-8">
            <img src={ender} className="h-12 w-auto shadow-sm" />
          </NavLink>
          <div className="text-white italic tracking-widest">Ender</div>
        </div>
        <div className="w-screen h-full bg-white p-8">
          <div className="font-notoSans font-medium text-slate-700 text-3xl border-b-2 border-slate-300 mb-2 pb-4 flex flex-row justify-start gap-4">
            Ender Proof Examples
            <div>
              <span className="font-mono text-sm text-orange-500 font-bold">
                {"[M]"}
              </span>
              <span className="text-sm italic">
                {" indicates the proof has an intentional mistake"}
              </span>
            </div>
          </div>
          <div className="flex flex-row flex-wrap">
            {this.proofs.map(this.renderExampleTile)}
          </div>
        </div>
      </>
    );
  }
}
