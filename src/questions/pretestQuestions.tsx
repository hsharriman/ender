import { angleStr, segmentQuestion } from "../core/geometryText";
import { AnswerType, Question, QuestionType } from "./funcTypeQuestions";

const id = (n: number) => `qID-${n}`;
export const segmentPretestQuestions: Question[] = [
  {
    answerType: AnswerType.Dropdown,
    prompt: <span>{segmentQuestion("AB")} is congruent to:</span>,
    answers: ["BC", "DE", "FG", "HJ", "MN"],
    type: QuestionType.Pretest,
    id: id(1),
  },
  {
    answerType: AnswerType.Dropdown,
    prompt: <span>{segmentQuestion("DE")} is congruent to:</span>,
    answers: ["AB", "BC", "FG", "HJ", "MN"],
    type: QuestionType.Pretest,
    id: id(2),
  },
  {
    answerType: AnswerType.Dropdown,
    prompt: <span>{segmentQuestion("FG")} is parallel to:</span>,
    answers: ["AB", "BC", "DE", "HJ", "MN"],
    type: QuestionType.Pretest,
    id: id(3),
  },
];

export const anglePretestQuestions: Question[] = [
  {
    answerType: AnswerType.Dropdown,
    prompt: <span>{angleStr("ABC")} is congruent to:</span>,
    answers: ["Angle DEF", "Angle GHJ", "Angle KLM", "Angle NQP"],
    type: QuestionType.Pretest,
    id: id(1),
  },
  {
    answerType: AnswerType.Dropdown,
    prompt: <span>{angleStr("GHJ")} is congruent to:</span>,
    answers: ["Angle ABC", "Angle DEF", "Angle KLM", "Angle NQP"],
    type: QuestionType.Pretest,
    id: id(2),
  },
  {
    answerType: AnswerType.Dropdown,
    prompt: "Which angle is a right angle?",
    answers: ["Angle ABC", "Angle DEF", "Angle GHJ", "Angle KLM", "Angle NQP"],
    type: QuestionType.Pretest,
    id: id(3),
  },
];

const congruenceQuestions: Question[] = [1, 2, 3, 4, 5].map((n) => {
  const q: Question = {
    answerType: AnswerType.Dropdown,
    prompt: "These triangles are congruent because of:",
    answers: [
      "SAS (Side-Angle-Side)",
      "SSS (Side-Side-Side)",
      "ASA (Angle-Side-Angle)",
      "SSA (Side-Side-Angle)",
      "AAS (Angle-Angle-Side)",
      "HL (Hypotenuse-Leg)",
      "AAA (Angle-Angle-Angle)",
    ],
    type: QuestionType.Pretest,
    id: id(n),
  };
  return q;
});
export const trianglePretestQuestions: Question[] = congruenceQuestions.concat([
  {
    answerType: AnswerType.Dropdown,
    prompt: <span>The definition of congruent triangles is...</span>,
    answers: [
      "Triangles that are the same shape but not necessarily the same size",
      "Triangles that have two segments with the same number of tick marks",
      "Triangles that have two angles with the same number of tick marks",
      "Triangles that look like they are skewed versions of each other",
      "Triangles that are the same shape and size, can be mirror images of each other",
      "Triangles whose angles add up to 180 degrees",
    ],
    type: QuestionType.Pretest,
    id: id(6),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: <span>Is SSA is a valid triangle congruence theorem?</span>,
    answers: ["Yes", "No"],
    type: QuestionType.Pretest,
    id: id(7),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: <span>Is AAA is a valid triangle congruence theorem?</span>,
    answers: ["Yes", "No"],
    type: QuestionType.Pretest,
    id: id(8),
  },
]);
