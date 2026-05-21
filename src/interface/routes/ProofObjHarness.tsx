import { ProofParser } from "checker/grammar/lezerParser";
import { runProofChecker } from "checker/proofChecker";
import buggyProofUrl from "checker/proofs/buggyproof.txt";
import overlapUrl from "checker/proofs/overlap.txt";
import s1c1Url from "checker/proofs/s1c1.txt";
import s1c1incompleteUrl from "checker/proofs/s1c1incomplete.txt";
import s1c2Url from "checker/proofs/s1c2.txt";
import s1c3Url from "checker/proofs/s1c3.txt";
import s1inc1Url from "checker/proofs/s1inc1.txt";
import s1inc2Url from "checker/proofs/s1inc2.txt";
import s1inc3Url from "checker/proofs/s1inc3.txt";
import s2c1Url from "checker/proofs/s2c1.txt";
import s2c2Url from "checker/proofs/s2c2.txt";
import s2c2incompleteUrl from "checker/proofs/s2c2incomplete.txt";
import s2inc1Url from "checker/proofs/s2inc1.txt";
import s2inc2Url from "checker/proofs/s2inc2.txt";
import tutincUrl from "checker/proofs/tutinc.txt";
import tutorialUrl from "checker/proofs/tutorial.txt";
import { ErrorObj, ProofObj } from "checker/types/checkerTypes";
import { interactiveLayoutFromProofObj } from "interface/core/grammarToLayout/proofObjLayout";
import { Component, createRef } from "react";
import { NavLink } from "react-router-dom";
import ender from "../assets/ender.png";
import {
  InteractiveAppPage,
  InteractiveAppPageProps,
} from "../components/ender/InteractiveAppPage";
import {
  StaticAppPage,
  StaticAppPageProps,
} from "../components/ender/StaticAppPage";
import type { LlmFeedbackEntry } from "../components/stepFeedback/types";
import { AspectRatio } from "../core/diagramSvg/svgTypes";
import {
  interactiveLayout,
  staticLayout,
} from "../core/grammarToLayout/setupLayout";

const parser = new ProofParser();

const proofOptions: Array<{ key: string; label: string; url: string }> = [
  { key: "tutorial", label: "tutorial.txt", url: tutorialUrl },
  { key: "tutinc", label: "tutinc.txt", url: tutincUrl },
  { key: "s1c1", label: "s1c1.txt", url: s1c1Url },
  {
    key: "s1c1incomplete",
    label: "s1c1incomplete.txt",
    url: s1c1incompleteUrl,
  },
  { key: "s1c2", label: "s1c2.txt", url: s1c2Url },
  { key: "s1c3", label: "s1c3.txt", url: s1c3Url },
  { key: "s1inc1", label: "s1inc1.txt", url: s1inc1Url },
  { key: "s1inc2", label: "s1inc2.txt", url: s1inc2Url },
  { key: "s1inc3", label: "s1inc3.txt", url: s1inc3Url },
  { key: "s2c1", label: "s2c1.txt", url: s2c1Url },
  {
    key: "s2c2incomplete",
    label: "s2c2incomplete.txt",
    url: s2c2incompleteUrl,
  },
  { key: "s2c2", label: "s2c2.txt", url: s2c2Url },
  { key: "s2inc1", label: "s2inc1.txt", url: s2inc1Url },
  { key: "s2inc2", label: "s2inc2.txt", url: s2inc2Url },
  { key: "buggyproof", label: "buggyproof.txt", url: buggyProofUrl },
  { key: "overlap", label: "overlap.txt", url: overlapUrl },
];

function formatErrorList(errors: ErrorObj[] | undefined): string {
  if (!errors?.length) return "Incorrect step (no step.errors payload)";
  return errors
    .map((e, i) => {
      const suffix =
        e.data === undefined ? "" : `: ${JSON.stringify(e.data, null, 2)}`;
      return `${i + 1}. ${e.type}${suffix}`;
    })
    .join("\n");
}

function buildAnnotatedLines(
  text: string,
  stepErrorsByStep: Map<string, ErrorObj[]>,
): Array<{ text: string; tooltip?: string; isIncorrect: boolean }> {
  return text.split("\n").map((line) => {
    const m = line.match(/^\s*\[(\d+)\]/);
    if (!m) return { text: line, isIncorrect: false };
    const stepNum = String(parseInt(m[1], 10));
    const stepErrors = stepErrorsByStep.get(stepNum);
    if (!stepErrors) return { text: line, isIncorrect: false };
    return {
      text: line,
      isIncorrect: true,
      tooltip: formatErrorList(stepErrors),
    };
  });
}

type ProofObjHarnessState = {
  isEditorOpen: boolean;
  isInteractiveLayout: boolean;
  selectedProofKey: string;
  proofText: string;
  lastGoodProof: ProofObj | null;
  parseVersion: number;
  statusMessage: string;
  incorrectSteps: Set<string>;
  proofWideIssues: string[];
  incorrectStepErrors: Map<string, ErrorObj[]>;
  proofParseSucceeded: boolean;
  hoverTooltip: string;
  hoverPos: { x: number; y: number } | null;
  editorScrollTop: number;
  harnessLlmByStep: Map<string, LlmFeedbackEntry>;
  harnessLlmLoading: boolean;
  harnessLlmError: string | undefined;
};

export class ProofObjHarness extends Component<object, ProofObjHarnessState> {
  editorRef = createRef<HTMLDivElement>();
  controlsRef = createRef<HTMLDivElement>();
  editorOverlayRef = createRef<HTMLPreElement>();

  private proofParseTimeoutId: number | null = null;
  private llmEffectGeneration = 0;
  private selectedProofFetchGen = 0;
  private editorOutsideMouseDownHandler: ((event: MouseEvent) => void) | null =
    null;

  constructor(props: object) {
    super(props);
    this.state = {
      isEditorOpen: true,
      isInteractiveLayout: true,
      selectedProofKey: "tutorial",
      proofText: "",
      lastGoodProof: null,
      parseVersion: 0,
      statusMessage: "Loading proof...",
      incorrectSteps: new Set(),
      proofWideIssues: [],
      incorrectStepErrors: new Map(),
      proofParseSucceeded: true,
      hoverTooltip: "",
      hoverPos: null,
      editorScrollTop: 0,
      harnessLlmByStep: new Map(),
      harnessLlmLoading: false,
      harnessLlmError: undefined,
    };
  }

  componentDidMount(): void {
    this.fetchSelectedProof(this.state.selectedProofKey);
    this.scheduleProofParseDebounce();
    this.setupEditorOutsideClick(this.state.isEditorOpen);
    this.runHarnessLlmEffect();
  }

  componentDidUpdate(
    _prevProps: object,
    prevState: ProofObjHarnessState,
  ): void {
    if (prevState.proofText !== this.state.proofText) {
      this.scheduleProofParseDebounce();
    }
    if (prevState.selectedProofKey !== this.state.selectedProofKey) {
      this.fetchSelectedProof(this.state.selectedProofKey);
    }
    if (prevState.isEditorOpen !== this.state.isEditorOpen) {
      this.setupEditorOutsideClick(this.state.isEditorOpen);
    }
    if (
      prevState.lastGoodProof !== this.state.lastGoodProof ||
      prevState.proofParseSucceeded !== this.state.proofParseSucceeded
    ) {
      this.runHarnessLlmEffect();
    }
  }

  componentWillUnmount(): void {
    if (this.proofParseTimeoutId !== null) {
      window.clearTimeout(this.proofParseTimeoutId);
      this.proofParseTimeoutId = null;
    }
    if (this.editorOutsideMouseDownHandler) {
      document.removeEventListener(
        "mousedown",
        this.editorOutsideMouseDownHandler,
      );
      this.editorOutsideMouseDownHandler = null;
    }
    this.llmEffectGeneration += 1;
    this.selectedProofFetchGen += 1;
  }

  private scheduleProofParseDebounce(): void {
    if (this.proofParseTimeoutId !== null) {
      window.clearTimeout(this.proofParseTimeoutId);
      this.proofParseTimeoutId = null;
    }
    if (!this.state.proofText.trim()) return;
    this.proofParseTimeoutId = window.setTimeout(() => {
      this.proofParseTimeoutId = null;
      try {
        const parsed = parser.parse(
          this.state.proofText,
        ) as unknown as ProofObj;
        const result = runProofChecker(parsed);

        const nextIncorrectStepErrors = new Map<string, ErrorObj[]>();
        result.graph.incorrectSteps.forEach((stepNum) => {
          const step = result.proof.steps.find((s) => s.stepNumber === stepNum);
          nextIncorrectStepErrors.set(stepNum, step?.errors ?? []);
        });

        const nextProofIssues: string[] = [];
        if (!result.goalMatchResult.matches) {
          nextProofIssues.push(
            `Goal not reached: ${result.goalMatchResult.details}`,
          );
        }
        if (result.graph.unusedSteps.size > 0) {
          nextProofIssues.push(
            `Unused steps: ${Array.from(result.graph.unusedSteps).sort().join(", ")}`,
          );
        }
        if (result.graph.cycles.length > 0) {
          nextProofIssues.push(
            `Cycles: ${result.graph.cycles.map((c) => c.join(" -> ")).join(" | ")}`,
          );
        }
        if (result.duplicateSteps.length > 0) {
          nextProofIssues.push(
            `Duplicate steps: ${result.duplicateSteps
              .map(([a, b]) => `${a} & ${b}`)
              .join(", ")}`,
          );
        }
        if (result.stepNumberErrors.length > 0) {
          nextProofIssues.push(
            `Step numbering issues: ${result.stepNumberErrors.join(" | ")}`,
          );
        }
        if (result.geometricObjectErrors.length > 0) {
          nextProofIssues.push(
            `Geometric object issues: ${result.geometricObjectErrors.join(" | ")}`,
          );
        }
        if (result.graph.incorrectSteps.size > 0) {
          nextProofIssues.push(
            `Incorrect steps: ${Array.from(result.graph.incorrectSteps).sort().join(", ")}`,
          );
        }

        this.setState((prev) => ({
          incorrectStepErrors: nextIncorrectStepErrors,
          proofWideIssues: nextProofIssues,
          statusMessage: "Proof parsed successfully.",
          lastGoodProof: parsed,
          incorrectSteps: result.graph.incorrectSteps,
          proofParseSucceeded: true,
          parseVersion: prev.parseVersion + 1,
        }));
      } catch (err) {
        this.setState({
          statusMessage: err instanceof Error ? err.message : String(err),
          proofWideIssues: [],
          incorrectStepErrors: new Map(),
          incorrectSteps: new Set(),
          proofParseSucceeded: false,
        });
      }
    }, 500);
  }

  private runHarnessLlmEffect(): void {
    this.llmEffectGeneration += 1;
    const gen = this.llmEffectGeneration;

    const clearLlm = (): void => {
      this.setState({
        harnessLlmLoading: false,
        harnessLlmError: undefined,
        harnessLlmByStep: new Map(),
      });
    };

    const { proofParseSucceeded, lastGoodProof } = this.state;

    if (!proofParseSucceeded || !lastGoodProof) {
      clearLlm();
      return;
    }

    if (lastGoodProof.isCorrect === true) {
      clearLlm();
      return;
    }

    this.setState({ harnessLlmLoading: true, harnessLlmError: undefined });
  }

  private fetchSelectedProof(selectedProofKey: string): void {
    this.selectedProofFetchGen += 1;
    const gen = this.selectedProofFetchGen;
    const selected = proofOptions.find((p) => p.key === selectedProofKey);
    if (!selected) return;
    fetch(selected.url)
      .then((r) => r.text())
      .then((txt) => {
        if (gen !== this.selectedProofFetchGen) return;
        this.setState({ proofText: txt });
      })
      .catch((err) => {
        if (gen !== this.selectedProofFetchGen) return;
        this.setState({
          statusMessage: `Failed to load ${selected.label}: ${String(err)}`,
          proofWideIssues: [],
          incorrectStepErrors: new Map(),
        });
      });
  }

  private setupEditorOutsideClick(isEditorOpen: boolean): void {
    if (this.editorOutsideMouseDownHandler) {
      document.removeEventListener(
        "mousedown",
        this.editorOutsideMouseDownHandler,
      );
      this.editorOutsideMouseDownHandler = null;
    }
    if (!isEditorOpen) return;
    this.editorOutsideMouseDownHandler = (event: MouseEvent) => {
      const target = event.target as Node;
      if (this.editorRef.current?.contains(target)) return;
      if (this.controlsRef.current?.contains(target)) return;
      this.setState({ isEditorOpen: false });
    };
    document.addEventListener("mousedown", this.editorOutsideMouseDownHandler);
  }

  private getLayouts(): {
    interactive: InteractiveAppPageProps & { diagramAspect: AspectRatio };
    static: StaticAppPageProps & { diagramAspect: AspectRatio };
  } | null {
    const { lastGoodProof, incorrectSteps } = this.state;
    if (!lastGoodProof) return null;
    const layoutProps = interactiveLayoutFromProofObj(
      lastGoodProof,
      incorrectSteps,
    );
    const maxX = Math.max(
      ...lastGoodProof.premises.points.map((p) => p.pt?.[0] ?? -Infinity),
    );
    const diagramAspect =
      maxX > 10 ? AspectRatio.Landscape : AspectRatio.Square;
    return {
      interactive: {
        ...(interactiveLayout(layoutProps).props as InteractiveAppPageProps),
        diagramAspect,
        proofHarnessMode: true,
      },
      static: {
        ...(staticLayout(layoutProps).props as StaticAppPageProps),
        diagramAspect,
      },
    };
  }

  private getCheckerStepByFrameKey(): Map<string, string> {
    const m = new Map<string, string>();
    const { lastGoodProof } = this.state;
    if (!lastGoodProof) return m;
    const proofSteps = lastGoodProof.steps.filter(
      (s) =>
        s.type === "proof" &&
        s.stepNumber !== undefined &&
        /^\d+$/.test(String(s.stepNumber)),
    );
    proofSteps.forEach((step, i) => {
      m.set(`s${i + 1}`, String(step.stepNumber ?? ""));
    });
    return m;
  }

  private getInteractiveProps():
    | (InteractiveAppPageProps & {
        checkerStepByFrameKey: Map<string, string>;
        harnessLlmFeedback: {
          byStepNumber: Map<string, LlmFeedbackEntry>;
          loading: boolean;
          error: string | undefined;
        };
      })
    | null {
    const layouts = this.getLayouts();
    if (!layouts) return null;
    const checkerStepByFrameKey = this.getCheckerStepByFrameKey();
    const { harnessLlmByStep, harnessLlmLoading, harnessLlmError } = this.state;
    return {
      ...layouts.interactive,
      checkerStepByFrameKey,
      harnessLlmFeedback: {
        byStepNumber: harnessLlmByStep,
        loading: harnessLlmLoading,
        error: harnessLlmError,
      },
    };
  }

  render() {
    const {
      isEditorOpen,
      isInteractiveLayout,
      selectedProofKey,
      proofText,
      parseVersion,
      statusMessage,
      proofWideIssues,
      incorrectStepErrors,
      hoverTooltip,
      hoverPos,
      editorScrollTop,
    } = this.state;

    const layouts = this.getLayouts();
    const interactiveProps = this.getInteractiveProps();
    const annotatedLines = buildAnnotatedLines(proofText, incorrectStepErrors);
    const lineHeightPx = 16;
    const editorPaddingTopPx = 8;

    return (
      <div className="h-screen">
        <div className="sticky top-0 left-0 bg-slate-100 shadow-sm w-full p-3 z-30 flex justify-between">
          <NavLink to={"/ender"} className="px-3 text-sm h-8">
            <img
              src={ender}
              alt="Ender logo"
              className="h-12 w-auto shadow-sm"
            />
          </NavLink>
          <div className="font-semibold">ProofObj Harness</div>
          <div ref={this.controlsRef} className="flex items-center gap-4">
            <button
              type="button"
              onClick={() =>
                this.setState((prev) => ({ isEditorOpen: !prev.isEditorOpen }))
              }
              className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm"
            >
              {isEditorOpen ? "Hide Editor" : "Show Editor"}
            </button>
            <button
              type="button"
              onClick={() =>
                this.setState((prev) => ({
                  isInteractiveLayout: !prev.isInteractiveLayout,
                }))
              }
              className="px-3 py-1 rounded-md bg-slate-700 text-white text-sm"
            >
              {isInteractiveLayout
                ? "Show Static Layout"
                : "Show Interactive Layout"}
            </button>
            <NavLink
              to={"/ender/examples"}
              className="px-3 underline underline-offset-2 text-sm"
            >
              Examples
            </NavLink>
          </div>
        </div>

        {isEditorOpen && (
          <div
            ref={this.editorRef}
            className="fixed top-20 right-6 w-[560px] h-[520px] bg-white border border-slate-300 rounded-lg shadow-xl z-40 p-3 flex flex-col"
          >
            <div className="font-semibold text-sm mb-2">
              Live Proof Text Editor
            </div>
            <select
              className="mb-2 border border-slate-300 rounded px-2 py-1 text-sm"
              value={selectedProofKey}
              onChange={(e) =>
                this.setState({ selectedProofKey: e.target.value })
              }
            >
              {proofOptions.map((proof) => (
                <option key={proof.key} value={proof.key}>
                  {proof.label}
                </option>
              ))}
            </select>
            <div className="relative w-full h-full border border-slate-200 rounded font-mono text-xs overflow-hidden">
              <pre
                ref={this.editorOverlayRef}
                aria-hidden
                className="absolute inset-0 m-0 p-2 leading-4 whitespace-pre-wrap break-words pointer-events-none overflow-auto"
              >
                {annotatedLines.map((line, i) => (
                  <div
                    key={`${i}-${line.text}`}
                    className={
                      line.isIncorrect
                        ? "bg-red-100 rounded px-1 -mx-1"
                        : undefined
                    }
                  >
                    {line.text || " "}
                  </div>
                ))}
              </pre>
              <textarea
                className="absolute inset-0 w-full h-full p-2 m-0 resize-none bg-transparent text-transparent caret-black selection:bg-blue-200 border-0 rounded focus:outline-none leading-4 whitespace-pre-wrap break-words overflow-auto"
                value={proofText}
                onChange={(e) => this.setState({ proofText: e.target.value })}
                onScroll={(e) => {
                  const overlay = this.editorOverlayRef.current;
                  if (!overlay) return;
                  const scrollTop = e.currentTarget.scrollTop;
                  this.setState({ editorScrollTop: scrollTop });
                  overlay.scrollTop = scrollTop;
                  overlay.scrollLeft = e.currentTarget.scrollLeft;
                }}
                spellCheck={false}
              />
              <div className="absolute left-0 top-0 w-3 h-full">
                {annotatedLines.map((line, idx) => {
                  if (!line.isIncorrect || !line.tooltip) return null;
                  const dotY =
                    editorPaddingTopPx +
                    idx * lineHeightPx +
                    lineHeightPx / 2 -
                    editorScrollTop;
                  return (
                    <button
                      key={`dot-${idx}`}
                      type="button"
                      className="absolute left-[2px] w-2 h-2 rounded-full bg-red-600"
                      style={{ top: `${dotY}px` }}
                      onMouseEnter={() => {
                        this.setState({
                          hoverTooltip: line.tooltip ?? "",
                          hoverPos: { x: 16, y: Math.max(8, dotY - 8) },
                        });
                      }}
                      onMouseLeave={() => {
                        this.setState({ hoverTooltip: "", hoverPos: null });
                      }}
                      aria-label={`Show checker errors for line ${idx + 1}`}
                    />
                  );
                })}
              </div>
              {hoverTooltip && hoverPos && (
                <div
                  className="absolute z-20 max-w-[420px] rounded border border-slate-300 bg-white/95 px-2 py-1 text-[11px] leading-4 text-slate-900 shadow pointer-events-none whitespace-pre-wrap"
                  style={{ left: hoverPos.x, top: hoverPos.y }}
                >
                  {hoverTooltip}
                </div>
              )}
            </div>
            <div
              className={`mt-2 text-xs ${
                statusMessage === "Proof parsed successfully."
                  ? "text-green-700"
                  : "text-red-600"
              }`}
            >
              {statusMessage}
            </div>
            {proofWideIssues.length > 0 && (
              <div className="mt-1 text-xs text-red-700 space-y-1">
                {proofWideIssues.map((issue) => (
                  <div key={issue}>- {issue}</div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="w-full flex justify-start">
          {layouts ? (
            isInteractiveLayout ? (
              interactiveProps ? (
                <InteractiveAppPage
                  key={`proof-interactive-${parseVersion}`}
                  {...interactiveProps}
                />
              ) : null
            ) : (
              <StaticAppPage
                key={`proof-static-${parseVersion}`}
                {...layouts.static}
              />
            )
          ) : null}
        </div>
      </div>
    );
  }
}
