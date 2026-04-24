import React from "react";
import { HarnessInlineEditConfig } from "./ProofRows";

export type HarnessLlmFeedbackEntry = {
  feedback: string;
  nextHint: string;
  collapsed?: boolean;
};

export interface HarnessStepFeedbackPanelProps {
  activeFrame: string;
  harnessInlineEdit?: HarnessInlineEditConfig;
  llmByStepNumber: Map<string, HarnessLlmFeedbackEntry>;
  llmLoading: boolean;
  llmError?: string;
}

type State = { hintRevealed: boolean; contentExpanded: boolean };

/**
 * Harness-only: shows LLM feedback for the active proof row when the checker marks that step incorrect.
 * Replaces the mini “ways to prove” figures in harness mode.
 */
export class HarnessStepFeedbackPanel extends React.Component<
  HarnessStepFeedbackPanelProps,
  State
> {
  state: State = { hintRevealed: false, contentExpanded: false };

  private stepNumberForActive(): string | undefined {
    if (!this.props.activeFrame.startsWith("s")) return undefined;
    const meta = this.props.harnessInlineEdit?.stepByKey.get(
      this.props.activeFrame,
    );
    return meta?.stepNumber;
  }

  componentDidUpdate(prevProps: HarnessStepFeedbackPanelProps) {
    const prevStep = prevProps.activeFrame.startsWith("s")
      ? prevProps.harnessInlineEdit?.stepByKey.get(prevProps.activeFrame)
          ?.stepNumber
      : undefined;
    const nextStep = this.stepNumberForActive();
    if (prevStep !== nextStep) {
      this.setState({ hintRevealed: false, contentExpanded: false });
    }
  }

  render() {
    const {
      activeFrame,
      llmByStepNumber,
      llmLoading,
      llmError,
    } = this.props;
    const stepNumber = this.stepNumberForActive();
    const entry =
      activeFrame.startsWith("s") && stepNumber
        ? llmByStepNumber.get(stepNumber)
        : undefined;
    const shouldStartCollapsed = Boolean(entry?.collapsed);
    const showContent = !shouldStartCollapsed || this.state.contentExpanded;
    if (!entry && !llmLoading && !llmError) return null;

    return (
      <div className="mt-4 w-[650px] rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-sm text-slate-800 shadow-sm">
        <div className="font-semibold text-amber-900">
          Step feedback
        </div>
        <p className="mt-1 text-[11px] italic text-amber-800/80">
          AI-generated feedback; please verify with your teacher and course
          materials.
        </p>
        {llmLoading && (
          <p className="mt-1 text-slate-600">Getting feedback from the model…</p>
        )}
        {!llmLoading && llmError && (
          <p className="mt-1 text-red-700 whitespace-pre-wrap">{llmError}</p>
        )}
        {!llmLoading && !llmError && entry && !showContent ? (
          <div className="mt-2 rounded border border-amber-300 bg-white px-2 py-2">
            <button
              type="button"
              className="rounded-md border border-amber-700 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
              onClick={() => this.setState({ contentExpanded: true })}
            >
              Show feedback and hint
            </button>
          </div>
        ) : null}
        {!llmLoading &&
          !llmError &&
          entry?.feedback &&
          showContent && (
          <p className="mt-1 leading-snug">{entry.feedback}</p>
        )}
        {!llmLoading &&
          !llmError &&
          !entry?.feedback &&
          showContent && (
          <p className="mt-1 text-slate-600">
            No model feedback for this step yet.
          </p>
        )}
        {!llmLoading && !llmError && showContent && entry?.nextHint ? (
          <div className="mt-2 flex flex-row items-start gap-2">
            {!this.state.hintRevealed ? (
              <button
                type="button"
                className="shrink-0 rounded-md border border-amber-700 bg-white px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-100"
                onClick={() => this.setState({ hintRevealed: true })}
              >
                Give me a hint
              </button>
            ) : (
              <div className="min-w-0 flex-1 rounded border border-amber-300 bg-white px-2 py-1 text-xs leading-snug text-slate-800">
                <span className="font-semibold text-amber-900">Hint: </span>
                {entry.nextHint}
              </div>
            )}
          </div>
        ) : null}
      </div>
    );
  }
}
