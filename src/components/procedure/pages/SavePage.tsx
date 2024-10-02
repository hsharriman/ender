import React from "react";
import { EventLog } from "../../../core/testinfra/testUtils";

interface SavePageProps {
  answers: { [proofName: string]: { [question: string]: string } };
}

interface SavePageState {
  answersSaved: boolean;
  logsSaved: boolean;
  id: string;
}

export class SavePage extends React.Component<SavePageProps, SavePageState> {
  constructor(props: SavePageProps) {
    super(props);
    const id = localStorage.getItem("id") || "";
    this.state = {
      answersSaved: false,
      logsSaved: false,
      id: JSON.parse(id),
    };
  }

  saveAnswersAsCSV = () => {
    // Create CSV content from answers object
    const storedAnswers = localStorage.getItem("answers") || "None";

    const answers = JSON.parse(storedAnswers);
    let csvContent = "pageName,question,answer,time,version\n";
    Object.keys(answers).forEach((proofName) => {
      Object.keys(answers[proofName]).forEach((question) => {
        const { answer, timestamp, version } = answers[proofName][question];
        csvContent += `"${proofName}","${question}","${answer}","${timestamp}","${version}"\n`;
      });
    });

    // Create a Blob object and download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `answers-${this.state.id}.csv`);
    a.click();

    this.setState({ answersSaved: true });
  };

  saveLogsAsCSV = () => {
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
    a.setAttribute("download", `eventLogs-${this.state.id}.csv`);
    a.click();

    this.setState({ logsSaved: true });
  };

  clearStorage = () => {
    localStorage.removeItem("answers");
    sessionStorage.removeItem("eventLogs");
    localStorage.removeItem("id");
  };

  render() {
    const { answersSaved, logsSaved } = this.state;
    const clearStorageVisible = answersSaved && logsSaved;

    return (
      <div className="flex items-center justify-center left-0 pt-10 flex-col w-screen h-full font-notoSans text-slate-800">
        <div className="text-center mb-4 text-2xl">
          <p>Please don't close the browser.</p>
          <br />
          <p>
            Please tell the researchers that you are done. And click on both the
            blue and green buttons.
          </p>
          <br />
        </div>
        <div className="flex flex-row flex-nowrap">
          <button
            className="bg-blue-500 text-white p-4 rounded mr-10"
            onClick={this.saveAnswersAsCSV}
          >
            Save Answers as CSV
          </button>
          <button
            className="bg-green-500 text-white p-4 rounded mr-10"
            onClick={this.saveLogsAsCSV}
          >
            Save Event Logs as CSV
          </button>
          {clearStorageVisible && (
            <button
              className="bg-red-500 text-white p-4 rounded text-sm"
              onClick={this.clearStorage}
            >
              Clear Storage
            </button>
          )}
        </div>
      </div>
    );
  }
}
