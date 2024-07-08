import React from "react";
import { EventLog } from "../core/utils";

interface SavePageProps {
  answers: { [proofName: string]: { [question: string]: string } };
}

const SavePage: React.FC<SavePageProps> = () => {
  const saveAsCSV = () => {
    // Create CSV content from answers object
    const storedAnswers = localStorage.getItem("answers") || "None";

    const answers = JSON.parse(storedAnswers);
    let csvContent = "pageName,question,answer\n";
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
    a.setAttribute("download", `answers-${new Date().valueOf()}.csv`);
    a.click();
  };

  const saveLogsAsCSV = () => {
    const logs = JSON.parse(
      sessionStorage.getItem("eventLogs") || "None"
    ) as EventLog[];

    // Create CSV content
    const header = "t,e,c,v\n";
    const csvContent = logs.reduce((acc, log) => {
      return acc + `${log.t},${log.e},${log.c},${log.v}\n`;
    }, header);

    // Create a blob from the CSV content
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `eventLogs-${new Date().valueOf()}.csv`);
    a.click();
  };

  const clearStorage = () => {
    localStorage.removeItem("answers");
    sessionStorage.removeItem("eventLogs");
  };

  return (
    <div className="flex items-center justify-center h-screentop-0 left-0 pt-10 flex flex-row flex-nowrap max-w-[1800px] min-w-[1500px] h-full font-notoSans text-slate-800">
      <button
        className="bg-blue-500 text-white p-4 rounded mr-10"
        onClick={saveAsCSV}
      >
        Save Data as CSV
      </button>
      <button
        className="bg-green-500 text-white p-4 rounded mr-10"
        onClick={saveLogsAsCSV}
      >
        Save Event Logs as CSV
      </button>
      <button
        className="bg-red-500 text-white p-4 rounded"
        onClick={clearStorage}
      >
        Clear Storage
      </button>
    </div>
  );
};

export default SavePage;
