interface ExploreTutorialStep {
  listenerIds: string[];
  goal: JSX.Element;
}
export const exploreTutorialSteps: ExploreTutorialStep[] = [
  {
    listenerIds: [],
    goal: (
      <span>
        Click the purple arrow, use the Down Arrow key, or click on a row to
        reveal a step of the proof
      </span>
    ),
  },
  {
    listenerIds: [],
    goal: <span>Hover over text in the proof</span>,
  },
  {
    listenerIds: [],
    goal: <span>Reveal the full proof</span>,
  },
  {
    listenerIds: [],
    goal: <span>Click on a segment or triangle in the diagram</span>,
  },
  {
    listenerIds: [],
    goal: <span>Find the tutorial hints in the proof (2 remaining)</span>,
  },
  // to answer questions:
  {
    listenerIds: [],
    goal: <span>Reveal a hint with the ? button</span>,
  },
  {
    listenerIds: [],
    goal: <span>Answer the question about this proof</span>,
  },
];

interface ExploreTutorialPopupContent {
  elemId: string;
  paddingL?: number;
  title: string;
  body: JSX.Element;
}
export const exploreTutorialPopups = {
  // relies on
  // definitions
};
