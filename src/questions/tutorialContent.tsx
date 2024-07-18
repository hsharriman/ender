import { segmentQuestion, triangleStr } from "../core/geometryText";
import { TutorialStep, TutorialStepType } from "../core/types/types";

const bold = (text: string) => <span className="font-bold">{text}</span>;
const allProofRowListenerIds = Array.from(
  { length: 4 },
  (_, i) => `s${i + 1}-tutorial`
);
const hintBtn = (
  <span className="inline-flex">
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="8" fill="#3B82F6"></circle>
      <text
        x={4}
        y={12}
        id={"tutorial-hint-button-inline"}
        key={"tutorial-hint-button-inline"}
        style={{
          font: "12px sans-serif",
          fontStyle: "black",
          color: "white",
          fill: "white",
          strokeWidth: 0.5,
          stroke: "white",
        }}
      >
        ?
      </text>
    </svg>
  </span>
);
export const tutorial1Steps: TutorialStep[] = [
  {
    elemId: "",
    headerText: "Welcome to the tutorial!",
    text: (
      <span>
        This is an interactive proof with multiple features available for you to
        use. Let's look through them together.
      </span>
    ),
    listenerId: [], // TODO use this to check if specific actions have been taken?
    type: TutorialStepType.Popup,
  },
  {
    elemId: "triangle-text-ADC",
    text: (
      <span>
        You can {bold("hover over text in the proof")} to highlight it in the
        construction.
      </span>
    ),
    type: TutorialStepType.Default,
    exercise: <span>Hover over {triangleStr("ADC")}</span>,
    listenerId: ["triangle-text-ADC"],
  },
  {
    elemId: "point.D",
    text: (
      <span>
        You can also {bold("click on objects in the construction")} to highlight
        where they appear in the proof.
      </span>
    ),
    type: TutorialStepType.Default,
    listenerId: ["segment.CD-hover"],
    exercise: <span>Click on segment DC on the diagram</span>,
  },
  {
    elemId: "reveal-btn-container",
    text: (
      <span>
        You can use the {bold("Down arrow key")}, {bold("click this button")},
        or {bold("click on a row ")}
        to reveal more of the proof.
      </span>
    ),
    type: TutorialStepType.Default,
    listenerId: ["reveal-step-btn"].concat(allProofRowListenerIds),
    exercise: <span>Reveal a new row of the proof</span>,
  },
  {
    elemId: "point.D",
    text: (
      <span>
        The {bold("construction")} shows the {bold("current state")} of the
        proof by adding or removing {bold("tick marks")} between steps.
      </span>
    ),
    exercise: (
      <span>Notice how the diagram changes as you add steps to the proof.</span>
    ),
    type: TutorialStepType.Default,
    listenerId: ["reveal-step-btn"].concat(allProofRowListenerIds),
  },
  {
    elemId: "answer-button-1",
    text: (
      <span>
        Try to use the information in this proof to answer the question. If you
        need help, {bold("click the ")} {hintBtn} {bold(" button for a hint")}.
      </span>
    ),
    type: TutorialStepType.HideContinue,
    listenerId: [],
  },
  {
    // TODO make these popups have the answers to the previous questions?
    type: TutorialStepType.Popup,
    elemId: "",
    headerText: "The correct answer was 'No'.",
    text: (
      <span>
        {segmentQuestion("AB")} had 1 tick but {segmentQuestion("AC")} had 2, so
        we did not know that {segmentQuestion("AB")} must be congruent to{" "}
        {segmentQuestion("AC")}.
      </span>
    ),
    listenerId: [],
  },
  {
    type: TutorialStepType.Default,
    elemId: "answer-button-1",
    text: (
      <span>
        This question has to do with the {bold("order of the steps")} in the
        proof.
      </span>
    ),
    exercise: (
      <span>
        Press the Down arrow key or click to the row applying SAS Triangle
        Congruence
      </span>
    ),
    listenerId: ["reveal-step-btn", "s4-tutorial"],
  },
  {
    type: TutorialStepType.HideContinue,
    elemId: "prooftext-s4",
    text: (
      <span>
        SAS Triangle Congruence has {bold("three requirements")}: two sides and
        an included angle of each triangle must be congruent. Right now, SAS{" "}
        {bold("relies on information in steps 1, 2, and 3")}.
      </span>
    ),
    exercise: (
      <span>
        Try answering the question using this information. If you need help,{" "}
        {bold("click the")} {hintBtn} {bold("button for a hint")}.
      </span>
    ),
    paddingL: 30,
    listenerId: [],
  },
];

export const tutorial3Steps: TutorialStep[] = [
  {
    type: TutorialStepType.Popup,
    elemId: "",
    headerText: "The correct answer was 'No'.",
    text: (
      <span>
        Moving row 4 between rows 2 and 3 would make SAS incorrectly rely on
        statements that aren't stated until later in the proof.
      </span>
    ),
    listenerId: [],
  },
  {
    type: TutorialStepType.Default,
    elemId: "hint-button",
    text: (
      <span>
        This question is about {bold("SSS Triangle Congruence")}{" "}
        (Side-Side-Side), so let's check out the row that applies it.
      </span>
    ),
    exercise: (
      <span>Use the arrow keys or click to the last row of the proof.</span>
    ),
    listenerId: ["reveal-step-btn", "s4-tutorial"],
  },
  {
    type: TutorialStepType.HideContinue,
    elemId: "svg-object-mini",
    text: (
      <span>
        Compare this {bold("illustration of SSS Triangle Congruence")} to the
        {bold(" construction")}. Are there any differences that you notice?
      </span>
    ),
    exercise: (
      <span>When you're ready, submit your answer at the top of the page.</span>
    ),
    paddingL: -100,
    listenerId: [],
  },
  {
    // TODO this is not shown because the page moves on
    type: TutorialStepType.Popup,
    elemId: "",
    headerText: "The correct answer was 'No'.",
    text: (
      <span>
        The tick marks were inconsistent between the illustration and the
        construction, indicating that the proof
        {bold(" incorrectly applies SSS")}.
      </span>
    ),
    listenerId: [],
  },
];
