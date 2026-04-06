import { ProofParser } from "checker/grammar/lezerParser";
import { runProofChecker } from "checker/proofChecker";
import buggyProofUrl from "checker/proofs/buggyproof.txt";
import s1c1Url from "checker/proofs/s1c1.txt";
import s1c2Url from "checker/proofs/s1c2.txt";
import s1c3Url from "checker/proofs/s1c3.txt";
import s1inc1Url from "checker/proofs/s1inc1.txt";
import s1inc2Url from "checker/proofs/s1inc2.txt";
import s1inc3Url from "checker/proofs/s1inc3.txt";
import s2c1Url from "checker/proofs/s2c1.txt";
import s2c2Url from "checker/proofs/s2c2.txt";
import s2inc1Url from "checker/proofs/s2inc1.txt";
import s2inc2Url from "checker/proofs/s2inc2.txt";
import tutincUrl from "checker/proofs/tutinc.txt";
import tutorialUrl from "checker/proofs/tutorial.txt";
import { ErrorObj, ProofObj } from "checker/types/checkerTypes";
import { interactiveLayoutFromProofObj } from "interface/core/grammarToLayout/proofObjLayout";
import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import ender from "../assets/ender.png";
import {
  InteractiveAppPage,
  InteractiveAppPageProps,
} from "../components/ender/InteractiveAppPage";
import { interactiveLayout } from "../core/grammarToLayout/setupLayout";

const defaultProofText = `title: "Tutorial #1 - Prove Triangles Congruent"
premises:
pt: A (5.5, 9, 0, 5), B (2, 3, -8, -18), C (5.5, 1, -8, -17), D (9, 3, -5, -18)
tri: t_ABC t_ADC
[g_1] con_seg(AB,AD)
[g_2] con_ang(a_BAC,a_DAC) 
-> con_tri(t_ABC,t_ADC)

steps:
[01] given(g_1) -> con_seg(AB,AD)
[02] given(g_2) -> con_ang(a_BAC,a_DAC) 
[03] reflex_s() -> con_seg(AC, AC)
[04] sas(1, 2, 3) -> con_tri(t_ABC,t_ADC) 
`;
const parser = new ProofParser();
const proofOptions: Array<{ key: string; label: string; url: string }> = [
  { key: "tutorial", label: "tutorial.txt", url: tutorialUrl },
  { key: "tutinc", label: "tutinc.txt", url: tutincUrl },
  { key: "s1c1", label: "s1c1.txt", url: s1c1Url },
  { key: "s1c2", label: "s1c2.txt", url: s1c2Url },
  { key: "s1c3", label: "s1c3.txt", url: s1c3Url },
  { key: "s1inc1", label: "s1inc1.txt", url: s1inc1Url },
  { key: "s1inc2", label: "s1inc2.txt", url: s1inc2Url },
  { key: "s1inc3", label: "s1inc3.txt", url: s1inc3Url },
  { key: "s2c1", label: "s2c1.txt", url: s2c1Url },
  { key: "s2c2", label: "s2c2.txt", url: s2c2Url },
  { key: "s2inc1", label: "s2inc1.txt", url: s2inc1Url },
  { key: "s2inc2", label: "s2inc2.txt", url: s2inc2Url },
  { key: "buggyproof", label: "buggyproof.txt", url: buggyProofUrl },
];

export const ProofObjHarness = () => {
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [selectedProofKey, setSelectedProofKey] = useState("tutorial");
  const [proofText, setProofText] = useState(defaultProofText);
  const [lastGoodProof, setLastGoodProof] = useState<ProofObj>(() => {
    const p = parser.parse(defaultProofText) as unknown as ProofObj;
    runProofChecker(p);
    return p;
  });
  const [parseVersion, setParseVersion] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Proof parsed successfully.",
  );
  const [proofWideIssues, setProofWideIssues] = useState<string[]>([]);
  const [incorrectStepErrors, setIncorrectStepErrors] = useState<
    Map<string, ErrorObj[]>
  >(new Map());
  const editorRef = useRef<HTMLDivElement | null>(null);
  const toggleBtnRef = useRef<HTMLButtonElement | null>(null);

  const onTextChange = (next: string) => {
    setProofText(next);
  };

  const formatErrorList = (errors: ErrorObj[] | undefined): string => {
    if (!errors?.length) return "Incorrect step (no step.errors payload)";
    return errors
      .map((e, i) => {
        const suffix =
          e.data === undefined ? "" : `: ${JSON.stringify(e.data, null, 2)}`;
        return `${i + 1}. ${e.type}${suffix}`;
      })
      .join("\n");
  };

  const buildAnnotatedLines = (
    text: string,
    stepErrorsByStep: Map<string, ErrorObj[]>,
  ): Array<{ text: string; tooltip?: string; isIncorrect: boolean }> => {
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
  };

  useEffect(() => {
    const handle = window.setTimeout(() => {
      try {
        const parsed = parser.parse(proofText) as unknown as ProofObj;
        const result = runProofChecker(parsed);

        const nextIncorrectStepErrors = new Map<string, ErrorObj[]>();
        result.graph.incorrectSteps.forEach((stepNum) => {
          const step = result.proof.steps.find(
            (s) => s.stepNumber === stepNum,
          );
          nextIncorrectStepErrors.set(stepNum, step?.errors ?? []);
        });
        setIncorrectStepErrors(nextIncorrectStepErrors);

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
        setProofWideIssues(nextProofIssues);
        setStatusMessage("Proof parsed successfully.");

        setLastGoodProof(parsed);
        // Reset InteractiveAppPage/ProofRows state to "Given" after successful parse.
        setParseVersion((v) => v + 1);
      } catch (err) {
        setStatusMessage(err instanceof Error ? err.message : String(err));
        setProofWideIssues([]);
        setIncorrectStepErrors(new Map());
      }
    }, 500);

    return () => {
      window.clearTimeout(handle);
    };
  }, [proofText]);

  useEffect(() => {
    const selected = proofOptions.find((p) => p.key === selectedProofKey);
    if (!selected) return;
    let isCancelled = false;
    fetch(selected.url)
      .then((r) => r.text())
      .then((txt) => {
        if (!isCancelled) onTextChange(txt);
      })
      .catch((err) => {
        if (!isCancelled) {
          setStatusMessage(`Failed to load ${selected.label}: ${String(err)}`);
          setProofWideIssues([]);
          setIncorrectStepErrors(new Map());
        }
      });
    return () => {
      isCancelled = true;
    };
  }, [selectedProofKey]);

  useEffect(() => {
    if (!isEditorOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (editorRef.current?.contains(target)) return;
      if (toggleBtnRef.current?.contains(target)) return;
      setIsEditorOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
    };
  }, [isEditorOpen]);

  const props = useMemo(
    () =>
      interactiveLayout(interactiveLayoutFromProofObj(lastGoodProof))
        .props as InteractiveAppPageProps,
    [lastGoodProof],
  );

  return (
    <div className="h-screen">
      <div className="sticky top-0 left-0 bg-slate-100 shadow-sm w-full p-3 z-30 flex justify-between">
        <NavLink to={"/ender"} className="px-3 text-sm h-8">
          <img src={ender} alt="Ender logo" className="h-12 w-auto shadow-sm" />
        </NavLink>
        <div className="font-semibold">ProofObj Harness</div>
        <div className="flex items-center gap-4">
          <button
            ref={toggleBtnRef}
            onClick={() => setIsEditorOpen((v) => !v)}
            className="px-3 py-1 rounded-md bg-blue-600 text-white text-sm"
          >
            {isEditorOpen ? "Hide Editor" : "Show Editor"}
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
          ref={editorRef}
          className="fixed top-20 right-6 w-[560px] h-[520px] bg-white border border-slate-300 rounded-lg shadow-xl z-40 p-3 flex flex-col"
        >
          <div className="font-semibold text-sm mb-2">
            Live Proof Text Editor
          </div>
          <select
            className="mb-2 border border-slate-300 rounded px-2 py-1 text-sm"
            value={selectedProofKey}
            onChange={(e) => setSelectedProofKey(e.target.value)}
          >
            {proofOptions.map((proof) => (
              <option key={proof.key} value={proof.key}>
                {proof.label}
              </option>
            ))}
          </select>
          <textarea
            className="w-full h-full border border-slate-200 rounded p-2 font-mono text-xs"
            value={proofText}
            onChange={(e) => onTextChange(e.target.value)}
          />
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
          <div className="mt-2 border border-slate-200 rounded p-2 bg-slate-50 h-36 overflow-auto">
            <div className="text-[11px] text-slate-500 mb-1">
              Checker annotations
            </div>
            <pre className="font-mono text-xs whitespace-pre-wrap break-words">
              {buildAnnotatedLines(proofText, incorrectStepErrors).map(
                (line, i) => (
                  <div
                    key={`${i}-${line.text}`}
                    title={line.tooltip}
                    className={
                      line.isIncorrect
                        ? "bg-red-100 hover:bg-red-200 rounded px-1"
                        : undefined
                    }
                  >
                    {line.text || " "}
                  </div>
                ),
              )}
            </pre>
          </div>
        </div>
      )}

      <div className="w-full flex justify-start">
        <InteractiveAppPage key={`proof-${parseVersion}`} {...props} />
      </div>
    </div>
  );
};
