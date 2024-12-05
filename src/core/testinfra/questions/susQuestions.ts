export interface susQuestionType {
  prompt: string;
  answers: string[];
}
const questions = [
  `I think that I would like to use this interface frequently.`,
  `I found the interface unnecessarily complex.`,
  `I thought the interface was easy to use.`,
  `I think that I would need the support of a technical person to be able to use the interface.`,
  `I found the various interactions in the interface were well integrated.`,
  `I thought there was too much inconsistency in the interface.`,
  `I would imagine that most people would learn to use the interface quickly.`,
  `I found the interface difficult to use.`,
  `I felt confident using the interface.`,
  `I needed to learn a lot of things before I could get going with the interface.`,
];
const answers = ["1", "2", "3", "4", "5"];

export const susQuestions: susQuestionType[] = questions.map((prompt) => {
  return { prompt, answers };
});
