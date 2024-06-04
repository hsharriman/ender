import { strs } from "../core/geometryText";

export interface Question {
  prompt: string;
  answers?: string[];
  type: QuestionType;
}

export enum QuestionType {
  Single = "Single Select",
  Mutli = "Multiselect",
  Text = "Text",
}

export const completeProof1: Question[] = [
  {
    prompt: "Do you agree that segment AC = BD?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: `If ${strs.triangle}AMC and ${strs.triangle}BMD are congruent, what is the corresponding angle of ${strs.angle}CAM?`,
    answers: [
      `${strs.angle}MBD`,
      `${strs.angle}MDB`,
      `${strs.angle}ACM`,
      `${strs.angle}BMD`,
    ],
    type: QuestionType.Single,
  },
  {
    prompt:
      "Besides the given conditions, which statements can be directly applied without any explanation? Select all that apply.",
    answers: [
      "Vertical Angles Theorem",
      "SAS Triangle Congruency",
      "Corresponding Angles",
      "Alternate Angles Theorem",
    ],
    type: QuestionType.Mutli,
  },
  {
    prompt:
      "If someone suggests that the proof process is correct after line 2 and 3 are interchanged, would you agree with them?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt:
      "If someone suggests that the proof process is correct after line 3 and 4 are interchanged, would you agree?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: "Which of the following conditions is used to confirm AC||BD?",
    answers: ["Statement 2", "Statement 3", "Statement 4", "Statement 5"],
    type: QuestionType.Single,
  },
  {
    prompt:
      "If AB and CD intersect at point M, AM = BM, and CM = DM, then AC is always parallel with DB. Do you agree that this proof demonstrates that this statement is always correct?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: "Do you agree that this proof is correct?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt:
      "Explain it as you would to a classmate who has not seen this proof yet. For instance: 'Given _______, we first determine _______ in order to conclude that  _______.'",
    type: QuestionType.Text,
  },
  {
    prompt:
      "If a quadrilateral PURV has 2 diagonals PR and UV, and Q is the midpoint of both PR and UV, then is this quadrilateral a parallelogram?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: "Explain your reasoning in 1 sentence.",
    type: QuestionType.Text,
  },
  {
    prompt:
      "If QRST forms a quadrilateral, QS and RT intersect at point U, then is QRST a parallelogram?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: "Explain your reasoning in 1 sentence.",
    type: QuestionType.Text,
  },
];

export const completeProof2: Question[] = [
  {
    prompt: "Do you agree that AD = DC?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: `If ${strs.triangle}ABD and ${strs.triangle}CBD are congruent, what is the corresponding angle of ${strs.angle}ADB?`,
    answers: [`${strs.angle}ABD`, `${strs.angle}ABC`, `${strs.angle}BDC`],
    type: QuestionType.Single,
  },
  {
    prompt:
      "Besides the given information, which statements can be directly applied without any explanation? Select all that apply.",
    answers: [
      "Statement 3",
      "Statement 4",
      "Statement 5",
      "Statement 6",
      "Statement 7",
    ],
    type: QuestionType.Mutli,
  },
  {
    prompt:
      "If someone suggests that the proof process is correct after lines 2 and 3 are interchanged, would you agree?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt:
      "If someone suggests that the proof process is correct after lines 3 and 4 are interchanged, would you agree?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: `Which statements were necessary to determine that ${strs.triangle}ABD and ${strs.triangle}CBD are congruent? Select all that apply.`,
    answers: ["Statement 1", "Statement 2", "Statement 3", "Statement 4"],
    type: QuestionType.Mutli,
  },
  {
    prompt: `If ${strs.angle}ADB is a right angle and BD bisects ${strs.angle}ABC, then D is the midpoint of AC. Does this proof demonstrate that this statement is always correct?`,
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt:
      "Explain it as you would to a classmate who has not seen this proof yet. For instance: 'Given _______, we first determine _______ in order to conclude that  _______.'",
    type: QuestionType.Text,
  },
  {
    prompt: "Do you agree that the proof is correct?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt:
      "Based on the given information below, is it possible to conclude that K is the midpoint of JL?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: "Explain your reasoning in 1 sentence.",
    type: QuestionType.Text,
  },
  {
    prompt: `Given that ${strs.triangle}DEH and ${strs.triangle}GEH are congruent, must ${strs.angle}EHD be a right angle?`,
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: "Explain your reasoning in 1 sentence.",
    type: QuestionType.Text,
  },
  {
    prompt: `Given that ${strs.triangle}DEH and ${strs.triangle}GEH are congruent, must DH = EH?`,
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: "Explain your reasoning in 1 sentence.",
    type: QuestionType.Text,
  },
];

export const completeProof3: Question[] = [
  {
    prompt: `Does ${strs.angle}EFJ = ${strs.angle}GJH?`,
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: "If EFGH is a rectangle, is FG || EH?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt:
      "Besides the given information, which statements can be directly applied without any explanation? Select all that apply.",
    answers: [
      "Statement 3",
      "Statement 4",
      "Statement 5",
      "Statement 6",
      "Statement 7",
    ],
    type: QuestionType.Mutli,
  },
  {
    prompt:
      "If someone suggests that the proof process is correct after lines 3 and 4 are interchanged, would you agree?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt:
      "If someone suggests that the proof process is correct after lines 6 and 7 are interchanged, would you agree?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: `Which statements are necessary to prove that ${strs.triangle}FJG is isosceles? Select all that apply.`,
    answers: ["Statement 1", "Statement 2", "Statement 3", "Statement 4"],
    type: QuestionType.Mutli,
  },
  {
    prompt: `If EFGH is a rectangle and EJ = JH, then ${strs.triangle}FJG is isosceles. Does this proof demonstrate that this statement is always correct?`,
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt:
      "Explain it as you would to a classmate who has not seen this proof yet. For instance: 'Given _______, we first determine _______ in order to conclude that  _______.'",
    type: QuestionType.Text,
  },
  {
    prompt: "Do you agree that the proof is correct?",
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: `If QR || ST and QS || RT, must be ${strs.triangle}QRS and ${strs.triangle}RST be congruent?`,
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
  {
    prompt: `Given that EFGH is a quadrilateral and EJ = JH, must ${strs.triangle}FEJ and ${strs.triangle}JGH be congruent?`,
    answers: ["Yes", "No", "Can't Tell"],
    type: QuestionType.Single,
  },
];
