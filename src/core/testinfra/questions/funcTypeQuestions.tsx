import { Reasons } from "../../../theorems/reasons";
import { possibleStepAnswers } from "../../../theorems/utils";
import { segmentQuestion, strs } from "../../geometryText";
import { Obj, Reason } from "../../types/types";

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
  DropdownTextbox = "DropdownTextbox",
  Continue = "Continue",
}

export enum QuestionType {
  Minifigures = "Minifigures",
  ReliesOn = "ReliesOn",
  DiagramState = "DiagramState",
  Correctness = "Correctness",
  TutorialInstructions = "TutorialInstructions",
  Pretest = "Pretest",
  Continue = "Continue",
}

const diagramStateQuestion = (x: string, y: string, type: Obj) => {
  const strType = (s: string, type: Obj) => {
    if (type === Obj.Angle) {
      return strs.angle + s;
    }
    return segmentQuestion(s);
  };
  return (
    <span className="text-base">
      By the end of the proof, is there enough information to conclude that{" "}
      {strType(x, type)} <span className="italic">must</span> be congruent to{" "}
      {strType(y, type)}?
    </span>
  );
};

const reliesQuestion = (r: Reason, step: number, steps?: [number, number]) => {
  const s = steps
    ? `(step ${step}) between steps ${steps[0]} and ${steps[1]}`
    : `at step ${step}`;
  return (
    <span className="text-base">
      Is there enough information to apply {r.title} {s}?
    </span>
  );
};

const miniQuestion = (r: Reason, step: number) => {
  return (
    <span className="text-base">
      If we assume all previous steps are valid, is {r.title} the correct reason
      to use in step {step}?
    </span>
  );
};

const id = (n: number) => `qID-${n}`;

const mini = (reason: string | JSX.Element) =>
  `(Hint: Click the row with ${reason}. Do the diagrams match? Does it rely on the right information?)`;
const relies = (reason: string | JSX.Element) =>
  `(Hint: Click the row with ${reason}. In the proposed proof order, would any of the steps that the reason relies on appear afterwards?)`;
export const scaffolding = {
  mini,
  relies,
  diagram:
    "(Hint: Click the last row of the proof. Do the objects have the same number of ticks?)",
};

export const checkingProof1: Question[] = [
  {
    answerType: AnswerType.Continue,
    prompt: (
      <span className="text-base">
        Take a look through the proof. When you're ready to proceed to the
        questions, click continue.
      </span>
    ),
    type: QuestionType.Continue,
    id: id(0),
  },
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
    id: id(3),
  },
];

export const checkingProof2: Question[] = [
  {
    answerType: AnswerType.Continue,
    prompt: (
      <span className="text-base">
        Take a look through the proof. When you're ready to proceed to the
        questions, click continue.
      </span>
    ),
    type: QuestionType.Continue,
    id: id(0),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: miniQuestion(Reasons.CongAdjAngles, 3),
    reason: Reasons.CongAdjAngles.title,
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: diagramStateQuestion("KL", "KM", Obj.Segment),
    type: QuestionType.DiagramState,
    id: id(2),
  },
];

export const checkingProof3: Question[] = [
  {
    answerType: AnswerType.Continue,
    prompt: (
      <span className="text-base">
        Take a look through the proof. When you're ready to proceed to the
        questions, click continue.
      </span>
    ),
    type: QuestionType.Continue,
    id: id(0),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: miniQuestion(Reasons.RHL, 6),
    reason: Reasons.RHL.title,
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: miniQuestion(Reasons.Quadrilateral, 4),
    reason: Reasons.Quadrilateral.title,
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
    answerType: AnswerType.Continue,
    prompt: (
      <span className="text-base">
        Take a look through the proof. When you're ready to proceed to the
        questions, click continue.
      </span>
    ),
    type: QuestionType.Continue,
    id: id(0),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: miniQuestion(Reasons.ConverseAltInteriorAngs, 7),
    reason: Reasons.ConverseAltInteriorAngs.title,
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: reliesQuestion(Reasons.VerticalAngles, 4, [1, 2]),
    reason: Reasons.VerticalAngles.title,
    type: QuestionType.ReliesOn,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: reliesQuestion(Reasons.SAS, 5, [3, 4]),
    reason: Reasons.SAS.title,
    type: QuestionType.ReliesOn,
    id: id(3),
  },
];

export const completeProof2: Question[] = [
  {
    answerType: AnswerType.Continue,
    prompt: (
      <span className="text-base">
        Take a look through the proof. When you're ready to proceed to the
        questions, click continue.
      </span>
    ),
    type: QuestionType.Continue,
    id: id(0),
  },
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
    prompt: reliesQuestion(Reasons.CongAdjAngles, 4),
    reason: Reasons.CongAdjAngles.title,
    type: QuestionType.ReliesOn,
    id: id(3),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: reliesQuestion(Reasons.ASA, 6),
    reason: Reasons.ASA.title,
    type: QuestionType.ReliesOn,
    id: id(4),
  },
];

export const incompleteProof2: Question[] = [
  {
    answerType: AnswerType.Continue,
    prompt: (
      <span className="text-base">
        Take a look through the proof. When you're ready to proceed to the
        questions, click continue.
      </span>
    ),
    type: QuestionType.Continue,
    id: id(0),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: miniQuestion(Reasons.VerticalAngles, 4),
    reason: Reasons.VerticalAngles.title,
    type: QuestionType.Minifigures,
    id: id(1),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: reliesQuestion(Reasons.ASA, 5, [3, 4]),
    reason: Reasons.ASA.title,
    type: QuestionType.ReliesOn,
    id: id(2),
  },
  {
    answerType: AnswerType.YesNo,
    prompt: reliesQuestion(Reasons.ConverseMidpoint, 7, [5, 6]),
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
      "The step says the wrong things are congruent to each other (ex: incorrectly says PA is congruent to AC)",
      "The step uses the wrong theorem or definition (ex: incorrectly uses ASA triangle congruence)",
      "There is not enough information to apply the theorem or definition",
      "Other (write a 1 sentence explanation)",
    ],
    type: QuestionType.Correctness,
    id: id(3),
    answerType: AnswerType.DropdownTextbox,
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
    prompt: reliesQuestion(Reasons.SAS, 4, [2, 3]),
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
