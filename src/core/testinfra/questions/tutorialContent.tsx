import { segmentQuestion } from "../../geometryText";
import { TutorialStep, TutorialStepType } from "../../types/types";

const bold = (text: string) => <span className="font-bold">{text}</span>;
const allProofRowListenerIds = Array.from(
  { length: 4 },
  (_, i) => `s${i + 1}-tutorial`
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
    listenerId: [],
    type: TutorialStepType.Popup,
  },
  {
    elemId: "reveal-btn-container",
    text: (
      <span>
        {bold("Click this button")}, use the {bold("\u2193 key")}, or{" "}
        {bold("click on a row ")} to reveal more of the proof.
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
      <span>
        Click on different rows of the proof and notice how the diagram changes.
      </span>
    ),
    type: TutorialStepType.Default,
    listenerId: ["reveal-step-btn"].concat(allProofRowListenerIds),
  },
  {
    elemId: "point.D",
    text: (
      <span>
        The {bold("construction")} shows the {bold("current state")} of the
        proof by adding or removing {bold("tick marks")} between steps.
      </span>
    ),
    type: TutorialStepType.Default,
    listenerId: ["reveal-step-btn"].concat(allProofRowListenerIds),
    exercise: <span>Reveal a new row of the proof</span>,
  },
  {
    elemId: "answer-button-1",
    text: (
      <span>
        Try to use the information in this proof to answer the question.
      </span>
    ),
    type: TutorialStepType.HideContinue,
    listenerId: [],
  },
  {
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
        Use the {"\u2193"} key or click to the row applying SAS Triangle
        Congruence. If it is already selected, you may have to click off and
        back onto it again.
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
    exercise: <span>Try answering the question using this information.</span>,
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
      <span>
        Use the arrow keys or click to the last row of the proof. If the last
        row is already selected, you may have to click off and back onto it
        again.
      </span>
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
