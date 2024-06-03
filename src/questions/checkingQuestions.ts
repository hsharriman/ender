import { Question, QuestionType } from "./completeQuestions";

export const checkingProof1: Question[] = [
  {
    prompt:
      "Which row of this proof has a statement that is justified by an incorrect reason?",
    answers: ["Row 3", "Row 4", "Row 5", "The proof is correct."],
    type: QuestionType.Single,
  },
  {
    prompt: "Explain your reasoning in 1 sentence.",
    type: QuestionType.Text,
  },
];

export const checkingProof2: Question[] = [
  {
    prompt:
      "Which row of this proof has a statement that is justified by an incorrect reason?",
    answers: ["Row 3", "Row 4", "Row 5", "The proof is correct."],
    type: QuestionType.Single,
  },
  {
    prompt: "Explain your reasoning in 1 sentence.",
    type: QuestionType.Text,
  },
];

export const checkingProof3: Question[] = [
  {
    prompt:
      "Which row of this proof has a statement that is justified by an incorrect reason?",
    answers: ["Row 4", "Row 5", "Row 6", "The proof is correct."],
    type: QuestionType.Single,
  },
  {
    prompt: "Explain your reasoning in 1 sentence.",
    type: QuestionType.Text,
  },
];
