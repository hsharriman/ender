import { Obj } from "../core/types/types";
import { Reasons } from "../theorems/reasons";
import { AnswerType, Question, QuestionType } from "./funcTypeQuestions";

const id = (n: number) => `qID-${n}`;
export const checkingProof1: Question[] = [
  {
    answerType: AnswerType.Dropdown,
    prompt: miniQuestion(Reasons.SAS, 4),
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
