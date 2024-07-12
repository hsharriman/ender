import { segmentQuestion } from "../core/geometryText";
import { TutorialStep, TutorialStepType } from "../core/types/types";

const bold = (text: string) => <span className="font-bold">{text}</span>;
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
    listenerId: "", // TODO use this to check if specific actions have been taken?
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
  },
  {
    elemId: "reveal-step-btn",
    text: (
      <span>
        You can use the {bold("Down arrow key")} or {bold("click this button")}{" "}
        to reveal the next row of the proof.
      </span>
    ),
    type: TutorialStepType.Default,
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
  },
  {
    elemId: "answer-button-1",
    text: (
      <span>
        Try to use the information in this proof to answer the question. If you
        need help, {bold("click the '?' button for a hint")}.
      </span>
    ),
    type: TutorialStepType.HideContinue,
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
  },
  {
    type: TutorialStepType.Default,
    elemId: "answer-button-1",
    text: (
      <span>
        This question has to do with the {bold("order of the steps")} in the
        proof.{" "}
        {bold(
          "Press the Down arrow key or click to the row applying SAS Triangle Congruence"
        )}
        .
      </span>
    ),
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
        {bold("click the '?' button for a hint")}.
      </span>
    ),
    paddingL: 30,
  },
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
  },
];

export const tutorial3Steps: TutorialStep[] = [
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
      <span>Use the arrow keys to navigate to the last row of the proof.</span>
    ),
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
  },
];
