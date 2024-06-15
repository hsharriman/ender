import React from "react";

interface SavePageProps {
  answers: { [proofName: string]: { [question: string]: string } };
}

const SavePage: React.FC<SavePageProps> = ({ answers }) => {
  const saveAsCSV = () => {
    // Create CSV content from answers object
    let csvContent = "proofName,question,answer\n";
    Object.keys(answers).forEach((proofName) => {
      Object.keys(answers[proofName]).forEach((question) => {
        const answer = answers[proofName][question];
        csvContent += `"${proofName}","${question}","${answer}"\n`;
      });
    });

    // Create a Blob object and download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "answers.csv");
    a.click();
  };

  return (
    <div className="flex items-center justify-center h-screentop-0 left-0 pt-10 flex flex-row flex-nowrap max-w-[1800px] min-w-[1500px] h-full font-notoSans text-slate-800">
      <button
        className="bg-blue-500 text-white p-4 rounded"
        onClick={saveAsCSV}
      >
        Save Data as CSV
      </button>
    </div>
  );
};

export default SavePage;
