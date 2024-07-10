import { segmentQuestion, strs } from "../core/geometryText";
import { Obj } from "../core/types/types";

export interface Question {
  answerType: AnswerType;
  partlyScaffold?: string | JSX.Element;
  prompt: string | JSX.Element;
  reason?: string;
  answers?: string[];
  type: QuestionType;
  id: string;
}

export enum AnswerType {
  YesNo = "YesNo",
  Dropdown = "Dropdown",
}

export enum QuestionType {
  Minifigures = "Minifigures",
  ReliesOn = "ReliesOn",
  DiagramState = "DiagramState",
  Correctness = "Correctness",
  TutorialInstructions = "TutorialInstructions",
}

const diagramStateQuestion = (x: string, y: string, type: Obj) => {
  const strType = (s: string, type: Obj) => {
    if (type === Obj.Angle) {
      return strs.angle + s;
    }
    return segmentQuestion(s);
  };
  return (
    <span>
      By the end of the proof, has enough information been established to
      conclude that {strType(x, type)} <span className="italic">must</span> be
      congruent to {strType(y, type)}?
    </span>
  );
};

const id = (n: number) => `qID-${n}`;

const mini = (reason: string | JSX.Element) =>
  `(Hint: Click the row with ${reason}. Do the diagrams match? Does it rely on the right information?)`;
const relies = (reason: string | JSX.Element) =>
  `(Hint: Click the row with ${reason}. In the proposed proof order, would the step rely only on steps that appear beforehand?)`;
export const scaffolding = {
  mini,
  relies,
  diagram:
    "(Hint: Click the last row of the proof. Do the objects have the same number of ticks?)",
};

export const checkingProof1: Question[] = [
  {
    answerType: AnswerType.YesNo,
    prompt: "Is SAS triangle congruence correctly applied?",
    reason: "SAS triangle congruence",
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: diagramStateQuestion("BA", "CB", Obj.Segment),
    type: QuestionType.DiagramState,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: diagramStateQuestion("DBA", "BCD", Obj.Angle),
    type: QuestionType.DiagramState,
    id: id(2),
  },
];

export const checkingProof2: Question[] = [
  {
    answerType: AnswerType.YesNo,
    prompt: "Is Congruent Adjacent Angles correctly applied?",
    reason: "Congruent Adjacent Angles",
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: diagramStateQuestion("KL", "MK", Obj.Segment),
    type: QuestionType.DiagramState,
    id: id(3),
  },
];

export const checkingProof3: Question[] = [
  {
    answerType: AnswerType.YesNo,
    prompt: "Is HL congruence correctly applied?",
    reason: "HL congruence",
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: "Is Def. Rectangle correctly applied?",
    reason: "Def. Rectangle",
    type: QuestionType.Minifigures,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: diagramStateQuestion("KN", "ML", Obj.Segment),
    type: QuestionType.DiagramState,
    id: id(3),
  },
];

export const completeProof1: Question[] = [
  {
    answerType: AnswerType.YesNo,
    prompt: "Is Converse of Alternate Interior Angles correctly applied?",
    reason: "Converse of Alternate Interior Angles",
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply Vertical Angles between steps 1 and 2?",
    reason: "Vertical Angles",
    type: QuestionType.ReliesOn,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply SAS triangle congruence between steps 3 and 4?",
    reason: "SAS triangle congruence",
    type: QuestionType.ReliesOn,
    id: id(3),
  },
];

export const completeProof2: Question[] = [
  {
    answerType: AnswerType.YesNo,
    prompt: "Is Def. Perpendicular Lines correctly applied?",
    reason: "Def. Perpendicular Lines",
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: "Is Converse of Def. Midpoint correctly applied?",
    reason: "Converse of Def. Midpoint",
    type: QuestionType.Minifigures,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply Congruent Adjacent Angles at step 4?",
    reason: "Congruent Adjacent Angles",
    type: QuestionType.ReliesOn,
    id: id(3),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply ASA triangle congruence at step 6?",
    reason: "ASA triangle congruence",
    type: QuestionType.ReliesOn,
    id: id(4),
  },
];

export const incompleteProof2: Question[] = [
  {
    answerType: AnswerType.YesNo,
    prompt: "Is Vertical Angles correctly applied?",
    reason: "Vertical Angles",
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply ASA triangle congruence between steps 2 and 3?",
    reason: "ASA triangle congruence",
    type: QuestionType.ReliesOn,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply Converse of Def. Midpoint between steps 4 and 5?",
    reason: "Converse of Def. Midpoint",
    type: QuestionType.ReliesOn,
    id: id(3),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: diagramStateQuestion("RQ", "NR", Obj.Segment),
    type: QuestionType.DiagramState,
    id: id(4),
  },
];

export const placeholder: Question[] = [
  {
    prompt: "This is a placeholder",
    answerType: AnswerType.YesNo,
    type: QuestionType.Minifigures,
    id: id(1),
  },
];

export const exploratoryQuestion: Question[] = [
  {
    prompt:
      "Is there a mistake in this proof, and if so, which of the following options best describes why it is wrong? Select 'the proof is correct' if there are no mistakes.",
    answers: [
      "A step says the wrong segments/angles are congruent to each other",
      "A step uses the wrong theorem or definition",
      "Some steps of the proof are in the wrong order",
      "The proof is correct",
    ],
    type: QuestionType.Correctness,
    id: id(1),
    answerType: AnswerType.Dropdown,
  },
];

export const tutorial1Questions: Question[] = [
  {
    prompt: diagramStateQuestion("AB", "AC", Obj.Segment),

    type: QuestionType.TutorialInstructions,
    id: id(1),
    answerType: AnswerType.YesNo,
  },
  {
    prompt:
      "Is there enough information to apply SAS Triangle Congruence between steps 2 and 3?",
    type: QuestionType.TutorialInstructions,
    id: id(2),
    answerType: AnswerType.YesNo,
  },
];

export const tutorial2Questions: Question[] = [
  {
    prompt: "Is SSS Triangle Congruence Correctly Applied?",
    answerType: AnswerType.YesNo,
    type: QuestionType.TutorialInstructions,
    id: id(1),
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
