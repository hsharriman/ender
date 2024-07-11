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
    answers: ["AB", "BC", "FG", "HJ", "MN"],
    type: QuestionType.Pretest,
    id: id(2),
  },
  {
    answerType: AnswerType.Dropdown,
    prompt: "Which angle is a right angle?",
    answers: ["AB", "BC", "DE", "HJ", "MN"],
    type: QuestionType.Pretest,
    id: id(3),
  },
];

export const trianglePretestQuestions: Question[] = [
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
    id: id(2),
  },
];
