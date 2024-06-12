import { Question, QuestionType } from "./completeQuestions";
import { strs } from "../core/geometryText";

export const incompleteProof1: Question[] = [
  {
    prompt: "Which of the following step can be applied here?",
    answers: [
      `${strs.angle}ACB = ${strs.angle}ACD by SAS`,
      `${strs.angle}ACB = ${strs.angle}ACD by SSS`,
      `${strs.angle}BAC = ${strs.angle}DAC by Alternate Angle Theorem`,
      `${strs.angle}BAC = ${strs.angle}DAC by Corresponding Angles`,
    ],
    type: QuestionType.Single,
  },
];

//fill in step 3
export const incompleteProof2a: Question[] = [
  {
    prompt: "Which of the following step correctly completes this proof?",
    answers: [
      `${strs.angle}QRP = ${strs.angle}MRN by Angle-Angle-Side (AAS)`,
      `${strs.angle}QRP = ${strs.angle}MRN by Side-Angle-Side (SAS)`,
      `${strs.angle}QRP = ${strs.angle}MRN by Angle-Side-Angle (ASA)`,
      `${strs.angle}QRP = ${strs.angle}MRN by Hypotenuse-Leg`,
    ],
    type: QuestionType.Single,
  },
];

//fill in step 4
export const incompleteProof2b: Question[] = [
  {
    prompt: "Which of the following step correctly completes this proof?",
    answers: [
      `QP = MN by Corresponding Segments`,
      `${strs.angle}QRP = ${strs.angle}MRN by Vertical Angles`,
      `${strs.angle}QRP = ${strs.angle}MRN by Alternate Angles`,
      `QP = MN by Given`,
    ],
    type: QuestionType.Single,
  },
];

export const incompleteProof3: Question[] = [
  {
    prompt: "Which of the following step can be applied at this step?",
    answers: [
      `${strs.angle}AEB = ${strs.angle}CEB by Perpendicular Bisector`,
      `${strs.angle}DEC = 90 = ${strs.angle}GEC by Perpendicular Bisector`,
      `${strs.angle}DEC = 90 = ${strs.angle}GEC by Congruent Adjacent Angles`,
      `${strs.angle}AEB = ${strs.angle}GEC by Vertical Angles`,
    ],
    type: QuestionType.Single,
  },
];
