import { angleStr, segmentQuestion } from "../core/geometryText";
import { AnswerType, Question, QuestionType } from "./funcTypeQuestions";

const id = (n: number) => `qID-${n}`;
const prefix = "According to the tick marks in the picture, ";
export const segmentPretestQuestions: Question[] = [
  {
    answerType: AnswerType.Dropdown,
    prompt: (
      <span>
        {prefix}
        {segmentQuestion("AB")} is congruent to:
      </span>
    ),
    answers: ["BC", "DE", "FG", "HJ", "MN"],
    type: QuestionType.Pretest,
    id: id(1),
  },
  {
    answerType: AnswerType.Dropdown,
    prompt: (
      <span>
        {prefix}
        {segmentQuestion("DE")} is congruent to:
      </span>
    ),
    answers: ["AB", "BC", "FG", "HJ", "MN"],
    type: QuestionType.Pretest,
    id: id(2),
  },
  {
    answerType: AnswerType.Dropdown,
    prompt: (
      <span>
        {prefix}
        {segmentQuestion("FG")} is parallel to:
      </span>
    ),
    answers: ["AB", "BC", "DE", "HJ", "MN"],
    type: QuestionType.Pretest,
    id: id(3),
  },
];

export const anglePretestQuestions: Question[] = [
  {
    answerType: AnswerType.Dropdown,
    prompt: (
      <span>
        {prefix}
        {angleStr("ABC")} is congruent to:
      </span>
    ),
    answers: ["Angle DEF", "Angle GHJ", "Angle KLM", "Angle NQP"],
    type: QuestionType.Pretest,
    id: id(1),
  },
  {
    answerType: AnswerType.Dropdown,
    prompt: (
      <span>
        {prefix}
        {angleStr("KLM")} is congruent to:
      </span>
    ),
    answers: ["Angle ABC", "Angle DEF", "Angle GHJ", "Angle NQP"],
    type: QuestionType.Pretest,
    id: id(2),
  },
  {
    answerType: AnswerType.Dropdown,
    prompt: prefix + "which angle is a right angle?",
    answers: ["Angle ABC", "Angle DEF", "Angle GHJ", "Angle KLM", "Angle NQP"],
    type: QuestionType.Pretest,
    id: id(3),
  },
];

export const trianglePretestQuestions: Question[] = [
  {
    answerType: AnswerType.Dropdown,
    prompt: prefix + "these triangles are congruent because of:",
    answers: [
      "SAS (Side-Angle-Side)",
      "SSS (Side-Side-Side)",
      "SSA (Side-Side-Angle)",
      "ASA (Angle-Side-Angle)",
      "AAS (Angle-Angle-Side)",
      "AAA (Angle-Angle-Angle)",
      "RHL (Right-Hypotenuse-Leg)",
    ],
    type: QuestionType.Pretest,
    id: id(1),
  },
];
export const triangleTextPreQuestions: Question[] = [
  {
    answerType: AnswerType.Dropdown,
    prompt: <span>Two triangles that are congruent must: </span>,
    answers: [
      "be the same shape, not necessarily the same size",
      "each have two segments with the same number of tick marks",
      "each have two angles with the same number of tick marks",
      "look like they are skewed versions of each other",
      "be the same shape and size, can be mirror images of each other",
      "have angles that add up to 180 degrees",
    ],
    type: QuestionType.Pretest,
    id: id(11),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: <span>Is SSA is a valid triangle congruence theorem?</span>,
    answers: ["Yes", "No"],
    type: QuestionType.Pretest,
    id: id(12),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: <span>Is AAA is a valid triangle congruence theorem?</span>,
    answers: ["Yes", "No"],
    type: QuestionType.Pretest,
    id: id(13),
  },
];
