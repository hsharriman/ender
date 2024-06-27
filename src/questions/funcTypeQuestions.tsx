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
}

export const checkingProof1: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is SAS triangle congruence correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: (
      <span>
        Must {segmentQuestion("BA")} {strs.congruent} {segmentQuestion("CB")}?
      </span>
    ),
    answers: ["Yes", "No"],
    type: QuestionType.DiagramState,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: (
      <span>
        Must {segmentQuestion("CB")} {strs.congruent} {segmentQuestion("AD")}?
      </span>
    ),
    answers: ["Yes", "No"],
    type: QuestionType.DiagramState,
  },
];

export const checkingProof2: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Congruent Adjacent Angles correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: `Must ${strs.angle}DAB ${strs.congruent} ${strs.angle}BDC?`,
    answers: ["Yes", "No"],
    type: QuestionType.DiagramState,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: (
      <span>
        Must {segmentQuestion("KL")} {strs.congruent} {segmentQuestion("MK")}?
      </span>
    ),
    answers: ["Yes", "No"],
    type: QuestionType.DiagramState,
  },
];

export const checkingProof3: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is HL congruence correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Def. Rectangle correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: (
      <span>
        Must {segmentQuestion("KN")} {strs.congruent} {segmentQuestion("ML")}?
      </span>
    ),
    answers: ["Yes", "No"],
    type: QuestionType.DiagramState,
  },
];

export const completeProof1: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Alternative Interior Angles correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply Vertical Angles between step 1 and 2?",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply SAS triangle congruence between step 2 and 3?",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
];

export const completeProof2: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Def. Perpendicular correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Def. Midpoint correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply Congruent Adjacent Angles at step 3?",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply ASA triangle congruence at step 6?",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
];

export const incompleteProof2: Question[] = [
  {
    fullScaffold: "Placeholder: ",
    prompt: "Is Vertical Angles correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply ASA triangle congruence between step 3 and 4?",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt:
      "Is there enough information to apply Def. Midpoint between step 4 and 5?",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
  {
    fullScaffold: "Placeholder: ",
    prompt: (
      <span>
        Must {segmentQuestion("RQ")} {strs.congruent} {segmentQuestion("NR")}?
      </span>
    ),
    answers: ["Yes", "No"],
    type: QuestionType.DiagramState,
  },
];

export const placeholder: Question[] = [
  {
    prompt: "This is a placeholder",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
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
