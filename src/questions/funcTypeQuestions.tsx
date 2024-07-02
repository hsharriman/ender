import { segmentQuestion, strs } from "../core/geometryText";

export interface Question {
  fullScaffold?: string | JSX.Element;
  partlyScaffold?: string | JSX.Element;
  prompt: string | JSX.Element;
  answers: string[];
  type: QuestionType;
  id: number;
}

export enum QuestionType {
  Minifigures = "Minifigures",
  ReliesOn = "ReliesOn",
  DiagramState = "DiagramState",
  Correctness = "Correctness",
  TutorialInstructions = "TutorialInstructions",
}

const yesNoAnswers = ["Yes", "No"];

export const checkingProof1: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is SAS triangle congruence correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
    id: 1,
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
    id: 2,
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
    id: 3,
  },
];

export const checkingProof2: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Congruent Adjacent Angles correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
    id: 1,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: `Must ${strs.angle}DAB ${strs.congruent} ${strs.angle}BDC?`,
    answers: yesNoAnswers,
    type: QuestionType.DiagramState,
    id: 2,
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
    id: 3,
  },
];

export const checkingProof3: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is HL congruence correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
    id: 1,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Def. Rectangle correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
    id: 2,
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
    id: 3,
  },
];

export const completeProof1: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Alternative Interior Angles correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
    id: 1,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply Vertical Angles between steps 1 and 2?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
    id: 2,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply SAS triangle congruence between steps 2 and 3?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
    id: 3,
  },
];

export const completeProof2: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Def. Perpendicular correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
    id: 1,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Def. Midpoint correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
    id: 2,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply Congruent Adjacent Angles at step 3?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
    id: 3,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply ASA triangle congruence at step 6?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
    id: 4,
  },
];

export const incompleteProof2: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Vertical Angles correctly applied?",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
    id: 1,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply ASA triangle congruence between steps 3 and 4?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
    id: 2,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply Def. Midpoint between steps 4 and 5?",
    answers: yesNoAnswers,
    type: QuestionType.ReliesOn,
    id: 3,
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
    id: 4,
  },
];

export const placeholder: Question[] = [
  {
    prompt: "This is a placeholder",
    answers: yesNoAnswers,
    type: QuestionType.Minifigures,
    id: 1,
  },
];

export const exploratoryQuestion: Question[] = [
  {
    prompt: "Is this proof correct?",
    answers: yesNoAnswers,
    type: QuestionType.Correctness,
    id: 1,
  },
];

export const tutorial1Questions: Question[] = [
  {
    prompt: (
      <span>
        Must {segmentQuestion("AB")} {strs.congruent} {segmentQuestion("AC")}?
      </span>
    ),
    answers: yesNoAnswers,
    type: QuestionType.TutorialInstructions,
    id: 1,
  },
  {
    prompt:
      "Is there enough information to apply SAS Triangle Congruence between steps 2 and 3?",
    answers: yesNoAnswers,
    type: QuestionType.DiagramState,
    id: 2,
  },
];

export const tutorial2Questions: Question[] = [
  {
    prompt: "Is SSS Triangle Congruence Correctly Applied?",
    answers: yesNoAnswers,
    type: QuestionType.DiagramState,
    id: 1,
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
