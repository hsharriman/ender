import { segmentQuestion, strs } from "../core/geometryText";
import { Obj, Reason } from "../core/types/types";
import { Reasons } from "../theorems/reasons";
import { possibleStepAnswers } from "../theorems/utils";

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

const miniQuestion = (r: Reason, step: number) => {
  // TODO wording: If we pretend that all other steps in the proof are correct,...
  return `Is ${r.title} correctly applied in step ${step}?`;
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
    prompt: miniQuestion(Reasons.SAS, 4),
    reason: Reasons.SAS.title,
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
    prompt: miniQuestion(Reasons.CongAdjAngles, 3),
    reason: Reasons.CongAdjAngles.title,
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
    prompt: miniQuestion(Reasons.HL, 6),
    reason: Reasons.HL.title,
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: miniQuestion(Reasons.Rectangle, 4),
    reason: Reasons.Rectangle.title,
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
    prompt: miniQuestion(Reasons.ConverseAltInteriorAngs, 7),
    reason: Reasons.ConverseAltInteriorAngs.title,
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply Vertical Angles between steps 1 and 2?",
    reason: Reasons.VerticalAngles.title,
    type: QuestionType.ReliesOn,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply SAS triangle congruence between steps 3 and 4?",
    reason: Reasons.SAS.title,
    type: QuestionType.ReliesOn,
    id: id(3),
  },
];

export const completeProof2: Question[] = [
  {
    answerType: AnswerType.YesNo,
    prompt: miniQuestion(Reasons.PerpendicularLines, 3),
    reason: Reasons.PerpendicularLines.title,
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: miniQuestion(Reasons.ConverseMidpoint, 8),
    reason: Reasons.ConverseMidpoint.title,
    type: QuestionType.Minifigures,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply Congruent Adjacent Angles at step 4?",
    reason: Reasons.CongAdjAngles.title,
    type: QuestionType.ReliesOn,
    id: id(3),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply ASA triangle congruence at step 6?",
    reason: Reasons.ASA.title,
    type: QuestionType.ReliesOn,
    id: id(4),
  },
];

export const incompleteProof2: Question[] = [
  {
    answerType: AnswerType.YesNo,
    prompt: miniQuestion(Reasons.VerticalAngles, 3),
    reason: Reasons.VerticalAngles.title,
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply ASA triangle congruence between steps 2 and 3?",
    reason: Reasons.ASA.title,
    type: QuestionType.ReliesOn,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt:
      "Is there enough information to apply Converse of Def. Midpoint between steps 4 and 5?",
    reason: Reasons.ConverseMidpoint.title,
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

export const exploratoryQuestion = (start: number, end: number): Question[] => [
  {
    prompt: "Is there a mistake in this proof?",
    answerType: AnswerType.YesNo,
    type: QuestionType.Correctness,
    id: id(1),
  },
  {
    prompt: "What is the first step that is wrong?",
    answerType: AnswerType.Dropdown,
    type: QuestionType.Correctness,
    id: id(2),
    answers: possibleStepAnswers(start, end), // dynamically fill in based on the proof.
  },
  {
    prompt: "Which of the following options best describes why it is wrong?",
    answers: [
      "The step says the wrong things are congruent to each other",
      "The step uses the wrong theorem or definition",
      "The step relies on information that appears later in the proof",
      "Other (write a 1 sentence explanation)", // TODO add text box option
    ],
    type: QuestionType.Correctness,
    id: id(3),
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
    prompt: miniQuestion(Reasons.SSS, 4),
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
