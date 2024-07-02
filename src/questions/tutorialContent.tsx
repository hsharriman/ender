import { segmentQuestion, strs } from "../core/geometryText";
import { TutorialStep, TutorialStepType } from "../core/types/types";

const bold = (text: string) => <span className="font-bold">{text}</span>;
export const tutorial1Steps: TutorialStep[] = [
  {
    elemId: "",
    headerText: "Welcome to the tutorial!",
    text: (
      <span>
        Let's walk through the features of this interactive proof together.
      </span>
    ),
    type: TutorialStepType.Intro,
  },
  {
    elemId: "prooftext-given",
    headerText: "Seeing the steps",
    text: (
      <span>
        <p>
          At first glance, this looks a lot like a normal two-column proof.
          However, there are some interactive features available for you to use.
          Most importantly, you can {bold("click on a row")} to see more
          information about it.
        </p>
        <p className="py-4">
          {bold("Try clicking on different rows of the proof")}. Don't worry
          about the details, we'll introduce you to each feature one by one.
        </p>
        <p>
          When you're ready, {bold("click 'Continue'")} on this message to move
          on to the next step of the tutorial.
        </p>
      </span>
    ),
    listenerId: "prooftext-proves",
    type: TutorialStepType.Default,
  },
  {
    elemId: "point.D",
    headerText: "Seeing the steps",
    text: (
      <span>
        The {bold("construction")} keeps up-to-date with the{" "}
        {bold("current state")} of the proof, updating with {bold("tick marks")}{" "}
        that show the relationships between segments and angles.
      </span>
    ),
    exercise: (
      <span>
        Try clicking on a few different rows of the proof to see how the
        construction changes.
      </span>
    ),
    listenerId: "prooftext-proves",
    type: TutorialStepType.Default,
  },
  {
    elemId: "triangle-text-ADC",
    headerText: "Highlighting elements",
    text: (
      <span>
        {bold("Hovering over symbols")} in the statements highlights their
        location in the construction.
      </span>
    ),
    exercise: <span>{`Try hovering over ${strs.triangle}ADC here.`}</span>,
    listenerId: "prooftext-proves",
    type: TutorialStepType.Default,
  },
  {
    elemId: "point.D",
    headerText: "Highlighting elements",
    text: (
      <span>
        Similarly, {bold("clicking on parts of the construction")} highlights
        their location in the proof.
      </span>
    ),
    exercise: (
      <span>Try clicking on {segmentQuestion("CD")} on the diagram.</span>
    ),
    listenerId: "prooftext-proves",
    type: TutorialStepType.Default,
  },
  {
    elemId: "answer-button-1",
    headerText: "Answering questions",
    text: (
      <span>
        Let's find the answer to this question together. In the interactive
        proof, we can look at the construction to find the answer.
      </span>
    ),
    exercise: (
      <span>
        Click on the last step of the proof to show all the established
        information.
      </span>
    ),
    type: TutorialStepType.Default,
  },
  {
    elemId: "point.D",
    headerText: "Answering questions",
    text: (
      <span>
        {segmentQuestion("AB")} has 1 tick but {segmentQuestion("AC")} has 2!
        That means it is not determined that {segmentQuestion("AB")} must be
        congruent to {segmentQuestion("AC")} by the end of the proof.
      </span>
    ),
    exercise: <span>Click the "No" button to submit your answer.</span>,
    type: TutorialStepType.HideContinue,
  },
  {
    // STARTING QUESTION 2
    type: TutorialStepType.Intro,
    elemId: "",
    headerText: "Nicely done!",
    text: <span>Let's look at another question together.</span>,
  },
  {
    type: TutorialStepType.Default,
    elemId: "answer-button-1",
    headerText: "Seeing the steps",
    text: (
      <span>
        This question asks about the placement of{" "}
        {bold("SAS Triangle Congruence")} (Side-Angle-Side) relative to the
        other steps.
      </span>
    ),
    exercise: <span>Click on the row applying SAS Triangle Congruence.</span>,
    listenerId: "prooftext-proves",
  },
  {
    type: TutorialStepType.Default,
    elemId: "prooftext-s4",
    headerText: "Seeing the steps",
    text: (
      <span>
        Recall that SAS Triangle Congruence has {bold("three requirements")}:
        two sides and an included angle of each triangle must be congruent.
        Right now, SAS {bold("relies on information in steps 1, 2, and 3")}.
      </span>
    ),
    exercise: <span>Imagine moving row 4 between rows 2 and 3.</span>,
    listenerId: "prooftext-proves",
    paddingL: 30,
  },
  {
    type: TutorialStepType.HideContinue,
    elemId: "prooftext-s4",
    headerText: "Seeing the steps",
    text: (
      <span>
        If we move row 4 between rows 2 and 3, then SAS would rely on statements
        that aren't stated until later in the proof! This would break the rules.
      </span>
    ),
    exercise: <span>Click the "No" button to submit your answer.</span>,
    listenerId: "prooftext-proves",
    paddingL: 30,
  },
];

export const tutorial2Steps: TutorialStep[] = [
  {
    type: TutorialStepType.Intro,
    elemId: "",
    headerText: "Great!",
    text: (
      <span>
        Let's look at one more question together, this time on a (very) slightly
        different proof.
      </span>
    ),
    listenerId: "prooftext-proves",
  },
  {
    type: TutorialStepType.Default,
    elemId: "answer-button-1",
    headerText: "Seeing the steps",
    text: (
      <span>
        This question asks about {bold("SSS Triangle Congruence")}{" "}
        (Side-Side-Side). Let's check how it is used in the proof.
      </span>
    ),
    exercise: <span>Click on the row applying SSS Triangle Congruence.</span>,
    listenerId: "prooftext-proves",
  },
  {
    type: TutorialStepType.Default,
    elemId: "svg-object-mini",
    headerText: "Seeing the steps",
    text: (
      <span>
        Compare this {bold("illustration of SSS Triangle Congruence")} to the
        construction. What do you see?
      </span>
    ),
    listenerId: "prooftext-proves",
    paddingL: -100,
  },
  {
    type: TutorialStepType.Default,
    elemId: "svg-object-mini",
    headerText: "Highlighting elements",
    text: (
      <span>
        The tick marks are inconsistent between the illustration and the
        construction! This indicates that the proof is{" "}
        {bold("incorrectly applying SSS")}
        to this proof.
      </span>
    ),
    listenerId: "prooftext-proves",
    paddingL: -100,
  },
  {
    type: TutorialStepType.HideContinue,
    elemId: "svg-object-mini",
    headerText: "Answering questions",
    text: (
      <span>
        If the proof was correct, the{" "}
        {bold(
          "construction would have the same ticks in the same places as the illustration"
        )}
        .
      </span>
    ),
    exercise: <span>Click the 'No' button to submit your answer.</span>,
    paddingL: -100,
  },
];
