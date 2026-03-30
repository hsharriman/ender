import { ProofParser } from "checker/grammar/lezerParser";
import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import ender from "../assets/ender.png";
import { InteractiveAppPage } from "../components/ender/InteractiveAppPage";
import {
  interactiveLayoutFromProofObj,
  ProofObjLike,
} from "../core/testinfra/setupLayout";

const defaultProofText = `title: "Tutorial #1 - Prove Triangles Congruent"
premises:
pt: A (5.5, 9, 0, 5), B (2, 3, -8, -18), C (5.5, 1, -8, -17), D (9, 3, -5, -18)
tri: t_ABC t_ADC
[g_01] con_seg(AB,AD)
[g_02] con_ang(a_BAC,a_DAC) 
-> con_tri(t_ABC,t_ADC)

steps:
[01] given([g_01]) -> con_seg(AB,AD)
[02] given([g_02]) -> con_ang(a_BAC,a_DAC) 
[03] reflex_s() -> con_seg(AC, AC)
[04] sas([01], [02], [03]) -> con_tri(t_ABC,t_ADC) 
`;
const parser = new ProofParser();

export function ProofObjHarness() {
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const [proofText, setProofText] = useState(defaultProofText);
  const [lastGoodProof, setLastGoodProof] = useState<ProofObjLike>(
    () => parser.parse(defaultProofText) as unknown as ProofObjLike,
  );
  const [parseError, setParseError] = useState("");

  const onTextChange = (next: string) => {
    setProofText(next);
    try {
      const parsed = parser.parse(next) as unknown as ProofObjLike;
      setLastGoodProof(parsed);
      setParseError("");
    } catch (err) {
      setParseError(err instanceof Error ? err.message : String(err));
    }
  };

  const props = useMemo(
    () => interactiveLayoutFromProofObj(lastGoodProof),
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
        <div className="fixed top-20 right-6 w-[560px] h-[520px] bg-white border border-slate-300 rounded-lg shadow-xl z-40 p-3 flex flex-col">
          <div className="font-semibold text-sm mb-2">
            Live Proof Text Editor
          </div>
          <textarea
            className="w-full h-full border border-slate-200 rounded p-2 font-mono text-xs"
            value={proofText}
            onChange={(e) => onTextChange(e.target.value)}
          />
          <div
            className={`mt-2 text-xs ${parseError ? "text-red-600" : "text-green-700"}`}
          >
            {parseError || "Parsed successfully."}
          </div>
        </div>
      )}

      <div className="w-full flex justify-start">
        <InteractiveAppPage {...props} />
      </div>
    </div>
  );
}
