import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ProofCheckSummary,
  ProofObjHarness,
} from "../components/ender/ProofObjHarness";

/** Renders a proof from the geo-proof-dataset volume (served by the backend)
 * in the ProofObjHarness, with feedback generation for incorrect proofs. */
export const DatasetProof = () => {
  const params = useParams();
  const proofPath = params["*"] ?? "";

  const [proofText, setProofText] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isIncorrect, setIsIncorrect] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProofText(null);
    setFeedback(null);
    setLoadError(null);
    setIsIncorrect(false);
    setGenerateError(null);
    fetch(`/api/dataset/proof?path=${encodeURIComponent(proofPath)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setProofText(data.text ?? "");
        setFeedback(data.feedback ?? null);
      })
      .catch((err) => {
        if (!cancelled) setLoadError(String(err));
      });
    return () => {
      cancelled = true;
    };
  }, [proofPath]);

  const onCheckResult = useCallback((result: ProofCheckSummary) => {
    setIsIncorrect(
      !result.parseSucceeded ||
        result.incorrectSteps.length > 0 ||
        result.proofWideIssues.length > 0,
    );
  }, []);

  const generateFeedback = () => {
    setIsGenerating(true);
    setGenerateError(null);
    fetch("/api/dataset/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: proofPath }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
        return data;
      })
      .then((data) => setFeedback(data.feedbackText || null))
      .catch((err) => setGenerateError(String(err)))
      .finally(() => setIsGenerating(false));
  };

  if (loadError) {
    return (
      <div className="p-8 text-red-600">
        Failed to load proof "{proofPath}": {loadError}
      </div>
    );
  }
  if (proofText === null) {
    return <div className="p-8 text-slate-600">Loading proof...</div>;
  }

  const headerExtras = isIncorrect ? (
    <div className="flex items-center gap-2">
      {generateError && (
        <div
          className="text-xs text-red-600 max-w-[240px] truncate"
          title={generateError}
        >
          {generateError}
        </div>
      )}
      <button
        type="button"
        onClick={generateFeedback}
        disabled={isGenerating}
        className="px-3 py-1 rounded-md bg-red-600 text-white text-sm disabled:opacity-50"
      >
        {isGenerating
          ? "Generating..."
          : feedback
            ? "Regenerate Feedback"
            : "Generate Feedback"}
      </button>
    </div>
  ) : undefined;

  return (
    <ProofObjHarness
      proofText={proofText}
      title={proofPath}
      feedback={feedback}
      headerExtras={headerExtras}
      onCheckResult={onCheckResult}
    />
  );
};
