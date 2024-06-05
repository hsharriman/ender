import { Question, QuestionType } from "./completeQuestions";

const likertAnswers = ["1", "2", "3", "4", "5"];

export const susQuestions: Question[] = [
  {
    prompt: " I think that I would like to use this interface frequently.",
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: " I found the system unnecessarily complex.",
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: "I thought the interface was easy to use.",
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt:
      "I think that I would need the support of a technical person to be able to use this system.",
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt:
      "I found the various functions in this interface were well integrated.",
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: "I thought there was too much inconsistency in this interface.",
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt:
      "I would imagine that most people would learn to use this interface very quickly.",
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: "I found the interface very cumbersome to use.",
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt: "I felt very confident using the interface.",
    answers: likertAnswers,
    type: QuestionType.Single,
  },
  {
    prompt:
      "I needed to learn a lot of things before I could get going with this interface.",
    answers: likertAnswers,
    type: QuestionType.Single,
  },
];

export const staticFollowUpQuestions: Question[] = [
  {
    prompt:
      "What do you like about this presentation style of the proof, layout etc.?",
    type: QuestionType.Text,
  },
  {
    prompt: "What do you disklike about this presentation style of the proof?",
    type: QuestionType.Text,
  },
  {
    prompt: "Describe any difficulties you encountered.",
    type: QuestionType.Text,
  },
  {
    prompt: "Describe the parts that are easy to do.",
    type: QuestionType.Text,
  },
  {
    prompt: "Describe the parts that are hard to learn.",
    type: QuestionType.Text,
  },
];

export const dynamicFollowUpQuestions: Question[] = [
  {
    prompt:
      "What do you like about this presentation style of the proof, layout, interactions etc.?",
    type: QuestionType.Text,
  },
  {
    prompt: "What do you disklike about this presentation style of the proof?",
    type: QuestionType.Text,
  },
  {
    prompt: "Describe any difficulties you encountered.",
    type: QuestionType.Text,
  },
  {
    prompt: "Describe the parts that are easy to do.",
    type: QuestionType.Text,
  },
  {
    prompt: "Describe the parts that are hard to learn.",
    type: QuestionType.Text,
  },
];
