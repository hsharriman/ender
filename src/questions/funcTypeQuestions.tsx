import { segmentQuestion, strs } from "../core/geometryText";

export interface Question {
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
    prompt: "Is SAS triangle congruence correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    prompt: (
      <span>
        Must {segmentQuestion("BA")} {strs.congruent} {segmentQuestion("CB")}?
      </span>
    ),
    answers: ["Yes", "No"],
    type: QuestionType.DiagramState,
  },
  {
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
    prompt: "Is Congruent Adjacent Angles correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    prompt: `Must ${strs.angle}DAB ${strs.congruent} ${strs.angle}BDC?`,
    answers: ["Yes", "No"],
    type: QuestionType.DiagramState,
  },
  {
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
    prompt: "Is HL congruence correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    prompt: "Is Def. Rectangle correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
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
    prompt: "Is Alternative Interior Angles correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    prompt:
      "Is there enough information to apply Vertical Angles between step 1 and 2?",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
  {
    prompt:
      "Is there enough information to apply SAS triangle congruence between step 2 and 3",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
];

export const completeProof2: Question[] = [
  {
    prompt: "Is Def. Perpendicular correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    prompt: "Is midpoint correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    prompt:
      "Is there enough information to apply Congruent Adjacent Angles at this point?",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
  {
    prompt:
      "Is there enough information to apply ASA triangle congruence at this point?",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
];

export const incompleteProof2: Question[] = [
  {
    prompt: "Is Vertical Angles correctly applied?",
    answers: ["Yes", "No"],
    type: QuestionType.Minifigures,
  },
  {
    prompt:
      "Is there enough information to apply ASA triangle congruence between step 3 and 4?",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
  {
    prompt:
      "Is there enough information to apply midpoint between step 4 and 5?",
    answers: ["Yes", "No"],
    type: QuestionType.ReliesOn,
  },
  {
    prompt: (
      <span>
        Must {segmentQuestion("RQ")} {strs.congruent} {segmentQuestion("NR")}?
      </span>
    ),
    answers: ["Yes", "No"],
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
