import { QuestionType } from "./completeQuestions";

export interface susQuestionType {
  prompt: (type: string) => string;
  answers?: string[];
  type: QuestionType;
}

const likertAnswers = ["1", "2", "3", "4", "5"];

export const susQuestions: susQuestionType[] = [
  {
    prompt: (s: string) =>
      ` I think that I would like to use this ${s} interface frequently.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: (s: string) => ` I found the ${s} interface unnecessarily complex.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: (s: string) => `I thought the ${s} interface was easy to use.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: (s: string) =>
      `I think that I would need the support of a technical person to be able to use the ${s} interface.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: (s: string) =>
      `I found the various interactions in the ${s} interface were well integrated.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: (s: string) =>
      `I thought there was too much inconsistency in the ${s} interface.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: (s: string) =>
      `I would imagine that most people would learn to use the ${s} interface quickly.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: (s: string) => `I found the ${s} interface difficult to use.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: (s: string) => `I felt confident using the ${s} interface.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: (s: string) =>
      `I needed to learn a lot of things before I could get going with the ${s} interface.`,
    answers: likertAnswers,
    type: QuestionType.Single,
  },
];

export const staticFollowUpQuestions: susQuestionType[] = [
  {
    prompt: (s: string) =>
      `What do you like about this presentation style of the proof, layout etc.?`,
    type: QuestionType.Text,
  },
  {
    prompt: (s: string) =>
      `What do you disklike about this presentation style of the proof?`,
    type: QuestionType.Text,
  },
  {
    prompt: (s: string) => `Describe any difficulties you encountered.`,
    type: QuestionType.Text,
  },
  {
    prompt: (s: string) => `Describe the parts that are easy to do.`,
    type: QuestionType.Text,
  },
  {
    prompt: (s: string) => `Describe the parts that are hard to learn.`,
    type: QuestionType.Text,
  },
];

export const interactiveFollowUpQuestions: susQuestionType[] = [
  {
    prompt: (s: string) =>
      `What do you like about this presentation style of the proof, layout, interactions etc.?`,
    type: QuestionType.Text,
  },
  {
    prompt: (s: string) =>
      `What do you disklike about this presentation style of the proof?`,
    type: QuestionType.Text,
  },
  {
    prompt: (s: string) => `Describe any difficulties you encountered.`,
    type: QuestionType.Text,
  },
  {
    prompt: (s: string) => `Describe the parts that are easy to do.`,
    type: QuestionType.Text,
  },
  {
    prompt: (s: string) => `Describe the parts that are hard to learn.`,
    type: QuestionType.Text,
  },
];
