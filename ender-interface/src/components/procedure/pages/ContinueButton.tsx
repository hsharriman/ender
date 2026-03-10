import { logEvent } from "../../../core/testinfra/testUtils";

export const ContinueButton = (props: { onNext: (n: number) => void }) => {
  const handleContinue = () => {
    logEvent("n", {
      c: "i",
      v: "",
    });
    props.onNext(1);
  };

  return (
    <button
      onClick={handleContinue}
      className="bg-green-500 hover:bg-green-700 text-2xl text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mr-2">
        <polygon
          strokeWidth={2}
          points="10,5 34,20 10,35"
          className="fill-current text-white"
        />
      </svg>
      Continue
    </button>
  );
};
