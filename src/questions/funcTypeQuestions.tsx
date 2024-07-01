import { segmentQuestion, strs } from "../core/geometryText";

export interface Question {
  fullScaffold?: string | JSX.Element;
  partlyScaffold?: string | JSX.Element;
  prompt: string | JSX.Element;
  answers: string[];
  type: QuestionType;
}

export enum QuestionType {
  Minifigures = "Minifigures",
  ReliesOn = "ReliesOn",
  DiagramState = "DiagramState",
  Correctness = "Correctness",
  TutorialInstructions = "TutorialInstructions",
}

const yesNoAnswers = ["Yes", "No", "Not Sure"];

export const checkingProof1: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is SAS triangle congruence correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: (
      <span>
        Must {segmentQuestion("BA")} {strs.congruent} {segmentQuestion("CB")}?
      </span>
    ),
    answers: yesNoAnswers,
    type: QuestionType.DiagramState,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: (
      <span>
        Must {segmentQuestion("CB")} {strs.congruent} {segmentQuestion("AD")}?
      </span>
    ),
    answers: yesNoAnswers,
    type: QuestionType.DiagramState,
  },
];

export const checkingProof2: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Congruent Adjacent Angles correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: `Must ${strs.angle}DAB ${strs.congruent} ${strs.angle}BDC?`,
    answers: yesNoAnswers,
    type: QuestionType.DiagramState,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: (
      <span>
        Must {segmentQuestion("KL")} {strs.congruent} {segmentQuestion("MK")}?
      </span>
    ),
    answers: yesNoAnswers,
    type: QuestionType.DiagramState,
  },
];

export const checkingProof3: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is HL congruence correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Def. Rectangle correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: (
      <span>
        Must {segmentQuestion("KN")} {strs.congruent} {segmentQuestion("ML")}?
      </span>
    ),
    answers: yesNoAnswers,
    type: QuestionType.DiagramState,
  },
];

export const completeProof1: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Alternative Interior Angles correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply Vertical Angles between step 1 and 2?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply SAS triangle congruence between step 2 and 3?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
  },
];

export const completeProof2: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Def. Perpendicular correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Def. Midpoint correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply Congruent Adjacent Angles at step 3?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply ASA triangle congruence at step 6?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
  },
];

export const incompleteProof2: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Vertical Angles correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply ASA triangle congruence between step 3 and 4?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply Def. Midpoint between step 4 and 5?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: (
      <span>
        Must {segmentQuestion("RQ")} {strs.congruent} {segmentQuestion("NR")}?
      </span>
    ),
    answers: yesNoAnswers,
    type: QuestionType.DiagramState,
  },
];

export const placeholder: Question[] = [
  {
    prompt: "This is a placeholder",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
  },
];

export const exploratoryQuestion: Question[] = [
  {
    prompt: "Is this proof correct?",
    answers: yesNoAnswers,
    type: QuestionType.Correctness,
  },
];

export const tutorial1Questions: Question[] = [
  {
    prompt:
      "Press the Up/Down arrow keys to progress through the steps of the proof. Notice that the construction updates at every step. Tick marks show relationships between segments and angles. The construction keeps track of what information is known at each step of the proof.",
    answers: ["Next"], // should be an ID instead of a question?
    type: QuestionType.TutorialInstructions,
  },
  {
    prompt: `Try hovering over the triangle ${strs.triangle}ABC.`,
    answers: ["Next"],
    type: QuestionType.TutorialInstructions,
  },
  {
    prompt: `The triangle is now highlighted in the diagram.`,
    answers: ["Next"],
    type: QuestionType.TutorialInstructions,
  },
  {
    prompt: `Must AB = AC? To find the answer, click on the last step of the proof and look at the diagram.`,
    answers: yesNoAnswers,
    type: QuestionType.TutorialInstructions,
  },
];

export const tutorial2Questions: Question[] = [
  {
    prompt: "Tutorial: This version of the proof has a mistake in it. ",
    answers: yesNoAnswers,
    type: QuestionType.DiagramState,
  },
];

export const allFuncQuestions = [
  checkingProof1,
  checkingProof2,
  checkingProof3,
  completeProof1,
  completeProof2,
  incompleteProof2,
];
