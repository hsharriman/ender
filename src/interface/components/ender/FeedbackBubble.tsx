import React from "react";
import {
  angleStr,
  circleStr,
  segmentStr,
  triangleStr,
} from "../../core/geometryText";

/** Feedback for an incorrect step, from feedback_metadata.json via the
 * backend's /dataset endpoints. */
export interface FeedbackContent {
  feedback?: string | null;
  hint?: string | null;
}

export const hasFeedbackContent = (
  feedback: FeedbackContent | null | undefined,
): feedback is FeedbackContent =>
  Boolean(feedback && (feedback.feedback || feedback.hint));

/** Renders one {{...}} token from feedback text using the same notation as
 * proof statements (overlined segments, angle/triangle symbols, ...). */
const renderToken = (token: string, key: number): React.ReactNode => {
  const stepMatch = token.match(/^step\s+(\d+)$/i);
  if (stepMatch) {
    return (
      <span key={key} className="font-semibold">
        step {stepMatch[1]}
      </span>
    );
  }
  if (token.startsWith("a_")) return <span key={key}>{angleStr(token.slice(2))}</span>;
  if (token.startsWith("t_")) return <span key={key}>{triangleStr(token.slice(2))}</span>;
  if (token.startsWith("c_")) return <span key={key}>{circleStr(token.slice(2))}</span>;
  if (token.startsWith("q_")) {
    return (
      <span key={key} className="font-notoSerif">
        {token.slice(2)}
      </span>
    );
  }
  if (/^[A-Z]{2}$/.test(token)) return <span key={key}>{segmentStr(token, true)}</span>;
  if (/^[A-Z]$/.test(token)) {
    return (
      <span key={key} className="font-notoSerif">
        {token}
      </span>
    );
  }
  // Reasons (SAS, reflexive, ...) and statement names.
  return (
    <span key={key} className="font-medium bg-slate-100 rounded px-1">
      {token}
    </span>
  );
};

/** Splits feedback text on {{...}} tokens and renders each token with
 * geometric notation. */
const renderFeedbackText = (text: string): React.ReactNode[] =>
  text.split(/\{\{([^}]*)\}\}/g).map((part, i) =>
    // Odd indices are the captured token contents.
    i % 2 === 1 ? renderToken(part.trim(), i) : <span key={i}>{part}</span>,
  );

/** Chat-bubble content for an incorrect step: the feedback paragraph followed
 * by an optional hint section. */
export const FeedbackBubble = (props: { feedback: FeedbackContent }) => (
  <>
    {props.feedback.feedback && (
      <div>{renderFeedbackText(props.feedback.feedback)}</div>
    )}
    {props.feedback.hint && (
      <div
        className={
          props.feedback.feedback ? "mt-2 pt-2 border-t border-slate-200" : ""
        }
      >
        <span className="font-semibold text-amber-600">Hint: </span>
        {renderFeedbackText(props.feedback.hint)}
      </div>
    )}
  </>
);
