import { strs } from "../core/geometryText";
import { Question, QuestionType } from "./completeQuestions";

export const incompleteProof1: Question[] = [
  {
    prompt: "Which step can be applied at step 4?",
    answers: [
      `${strs.triangle}ACB${strs.congruent}${strs.triangle}ACD by Side-Angle-Side (SAS) Congruence`,
      `${strs.triangle}ACB${strs.congruent}${strs.triangle}ACD by Side-Side-Side (SSS) Congruence`,
      `${strs.angle}BAC${strs.congruent}${strs.angle}DAC by Alternate Angle Theorem`,
      `${strs.angle}BAC${strs.congruent}${strs.angle}DAC by Corresponding Angles`,
    ],
    type: QuestionType.Single,
  },
];

//fill in step 4
export const incompleteProof2a: Question[] = [
  {
    prompt: "Which step can be applied at step 4?",
    answers: [
      `${strs.angle}PQR${strs.congruent}${strs.angle}MNR by Alternate Angles`,
      `QR${strs.congruent}RN by Corresponding Segments`, // TODO display segment
      `${strs.triangle}QRP${strs.congruent}${strs.triangle}MRN by Angle-Side-Angle (ASA)`,
      `${strs.triangle}QRP${strs.congruent}${strs.triangle}MRN by Hypotenuse-Leg (HL) Congruence`,
    ],
    type: QuestionType.Single,
  },
];

//fill in step 3
export const incompleteProof2b: Question[] = [
  {
    prompt: "Which step can be applied at step 3?",
    answers: [
      `QR${strs.congruent}RN by Corresponding Segments`, // TODO display segment
      `${strs.angle}RQP${strs.congruent}${strs.angle}RNM by Alternate Angles`,
      `${strs.angle}QRP${strs.congruent}${strs.angle}MRN by Vertical Angles`,
      `${strs.triangle}QRP${strs.congruent}${strs.triangle}MRN by Hypotenuse-Leg (HL) Congruence`, // TODO display segment
    ],
    type: QuestionType.Single,
  },
];

//fill in step 3
export const incompleteProof2c: Question[] = [
  {
    prompt: "Which step can be applied at step 3?",
    answers: [
      `QR${strs.congruent}RN by Corresponding Segments`, // TODO display segment
      `${strs.angle}RQP${strs.congruent}${strs.angle}RNM by Alternate Angles`,
      `${strs.angle}QRP${strs.congruent}${strs.angle}MRN by Vertical Angles`,
      `${strs.triangle}QRP${strs.congruent}${strs.triangle}MRN by Hypotenuse-Leg (HL) Congruence`, // TODO display segment
    ],
    type: QuestionType.Single,
  },
];

export const incompleteProof3: Question[] = [
  {
    prompt: "Which step can be applied at step 8?",
    answers: [
      `${strs.angle}GEC=90=${strs.angle}DEC by Congruent Adjacent Angles`,
      `${strs.angle}BCD${strs.congruent}${strs.angle}ECD by Angle Bisector`,
      `${strs.triangle}DEC${strs.congruent}${strs.triangle}GEC by Side-Angle-Side (SAS) Congruence`,
      `DC${strs.congruent}GC by Corresponding Segments`, // TODO segment
    ],
    type: QuestionType.Single,
  },
];
