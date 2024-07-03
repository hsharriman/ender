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
    type: TutorialStepType.Intro,
  },
  {
    elemId: "prooftext-s1",
    text: (
      <span>
        You can {bold("click on a row")} to see more information about it.
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
      <span>
        Notice how information is added or removed as you click around the
        proof.
      </span>
    ),
    type: TutorialStepType.Default,
  },
  {
    elemId: "triangle-text-ADC",
    text: (
      <span>
        Try {bold("hovering over text in the proof")} to highlight it in the
        construction.
      </span>
    ),
    type: TutorialStepType.Default,
  },
  {
    elemId: "point.D",
    text: (
      <span>
        Try {bold("clicking on parts of the construction")} to highlight their
        location in the proof.
      </span>
    ),
    type: TutorialStepType.Default,
  },
  {
    elemId: "answer-button-1",
    text: (
      <span>
        In the interactive proof,{" "}
        {bold(
          "we can look at the construction to find the answer to this question"
        )}
        , since the diagram tracks all the information established in the proof.
      </span>
    ),
    exercise: (
      <span>
        Click on the last step to see the state at the end of the proof.
      </span>
    ),
    type: TutorialStepType.Default,
  },
  {
    elemId: "point.D",
    text: (
      <span>
        {segmentQuestion("AB")} has 1 tick but {segmentQuestion("AC")} has 2, so
        we do not know that {segmentQuestion("AB")} must be congruent to{" "}
        {segmentQuestion("AC")}.
      </span>
    ),
    exercise: <span>Use the "Yes", "No" buttons to submit your answer.</span>,
    type: TutorialStepType.HideContinue,
  },
  {
    // STARTING QUESTION 2
    // TODO make these popups have the answers to the previous questions?
    type: TutorialStepType.Intro,
    elemId: "",
    headerText: "Nicely done!",
    text: <span>Let's look at another question.</span>,
  },
  {
    type: TutorialStepType.Default,
    elemId: "answer-button-1",
    text: (
      <span>
        This question has to do with the {bold("order of the steps")} in the
        proof. {bold("Click on the row applying SAS Triangle Congruence")}.
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
        Imagine moving row 4 between rows 2 and 3. When you're ready, submit
        your answer at the top of the page.
      </span>
    ),
    paddingL: 30,
  },
  // {
  //   type: TutorialStepType.HideContinue,
  //   elemId: "prooftext-s4",
  //   text: (
  //     <span>
  //       Moving row 4 between rows 2 and 3 means that SAS would incorrectly rely
  //       on statements that aren't stated until later in the proof!
  //     </span>
  //   ),
  //   exercise: <span>Use the buttons to submit your answer.</span>,
  //   paddingL: 30,
  // },
];

export const tutorial2Steps: TutorialStep[] = [
  {
    type: TutorialStepType.Intro,
    elemId: "",
    headerText: "Great!",
    text: (
      <span>
        Let's look at one more question, this time on a (very) slightly
        different proof.
      </span>
    ),
  },
  {
    type: TutorialStepType.Default,
    elemId: "answer-button-1",
    text: (
      <span>
        This question is about {bold("SSS Triangle Congruence")}{" "}
        (Side-Side-Side), so let's check out the row that applies it.
      </span>
    ),
  },
  {
    type: TutorialStepType.HideContinue,
    elemId: "svg-object-mini",
    text: (
      <span>
        Compare this {bold("illustration of SSS Triangle Congruence")} to the
        {bold("construction")}. Are there any differences that you notice?
      </span>
    ),
    exercise: (
      <span>When you're ready, submit your answer at the top of the page.</span>
    ),
    paddingL: -100,
  },
  // {
  //   type: TutorialStepType.HideContinue,
  //   elemId: "svg-object-mini",
  //   text: (
  //     <span>
  //       The tick marks are inconsistent between the illustration and the
  //       construction! This indicates that the proof is{" "}
  //       {bold("incorrectly applying SSS")} to this proof.
  //     </span>
  //   ),
  //   exercise: <span>Use the buttons to submit your answer.</span>,
  //   paddingL: -100,
  // },
];
