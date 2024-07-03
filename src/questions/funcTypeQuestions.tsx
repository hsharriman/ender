import { segmentQuestion, strs } from "../core/geometryText";
import { Obj } from "../core/types/types";

export interface Question {
  answerType: AnswerType;
  partlyScaffold?: string | JSX.Element;
  prompt: string | JSX.Element;
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

const mini = (reason: string) =>
  `(Hint: click the row with ${reason} to check if there are any differences between the big construction and the mini one.)`;
const relies = (reason: string) =>
  `(Hint: click on the row with ${reason} to check if everything it relies on would still appear earlier in the proof.)`;
export const scaffolding = {
  mini,
  relies,
  diagram:
    "(Hint: click the last row of the proof and check if they have the same tick marks.)",
};

export const checkingProof1: Question[] = [
  {
    answerType: AnswerType.YesNo,
    prompt: "Is SAS triangle congruence correctly applied?",
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
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: "Is Def. Rectangle correctly applied?",
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
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply Vertical Angles between steps 1 and 2?",
    type: QuestionType.ReliesOn,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply SAS triangle congruence between steps 2 and 3?",
    type: QuestionType.ReliesOn,
    id: id(3),
  },
];

export const completeProof2: Question[] = [
  {
    answerType: AnswerType.YesNo,
    prompt: "Is Def. Perpendicular Lines correctly applied?",
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: "Is Converse of Def. Midpoint correctly applied?",
    type: QuestionType.Minifigures,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply Congruent Adjacent Angles at step 4?",
    type: QuestionType.ReliesOn,
    id: id(3),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply ASA triangle congruence at step 6?",
    type: QuestionType.ReliesOn,
    id: id(4),
  },
];

export const incompleteProof2: Question[] = [
  {
    answerType: AnswerType.YesNo,
    prompt: "Is Vertical Angles correctly applied?",
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply ASA triangle congruence between steps 2 and 3?",
    type: QuestionType.ReliesOn,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply Converse of Def. Midpoint between steps 4 and 5?",
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
      "A step uses the wrong segment/angle/triangle",
      "A step is justified by an incorrect reason",
      "A step of the proof is in the wrong order",
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
    type: QuestionType.DiagramState,
    id: id(2),
    answerType: AnswerType.YesNo,
  },
];

export const tutorial2Questions: Question[] = [
  {
    prompt: "Is SSS Triangle Congruence Correctly Applied?",
    answerType: AnswerType.YesNo,
    type: QuestionType.DiagramState,
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
