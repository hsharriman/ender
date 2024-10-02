import { QuestionType } from "./completeQuestions";

export interface susQuestionType {
  prompt: string;
  answers: string[];
  type: QuestionType;
}

const likertAnswers = ["1", "2", "3", "4", "5"];

export const susQuestions: susQuestionType[] = [
  {
    prompt: `I think that I would like to use this interface frequently.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: `I found the interface unnecessarily complex.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: `I thought the interface was easy to use.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: `I think that I would need the support of a technical person to be able to use the interface.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: `I found the various interactions in the interface were well integrated.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: `I thought there was too much inconsistency in the interface.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: `I would imagine that most people would learn to use the interface quickly.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: `I found the interface difficult to use.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: `I felt confident using the interface.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: `I needed to learn a lot of things before I could get going with the interface.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
];
