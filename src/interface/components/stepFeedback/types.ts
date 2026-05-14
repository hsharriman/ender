/** One LLM feedback payload for a single proof step (checker step id string key). */
export type LlmFeedbackEntry = {
  feedback: string;
  nextHint: string;
  collapsed?: boolean;
};

export interface StepFeedbackPanelProps {
  activeFrame: string;
  /** Maps layout frame keys (`s1`…) to checker step ids for LLM lookup. */
  checkerStepByFrameKey?: Map<string, string>;
  llmByStepNumber: Map<string, LlmFeedbackEntry>;
  llmLoading: boolean;
  llmError?: string;
}
