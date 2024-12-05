interface LogEventInfo {
  c: string;
  v: string;
}

export interface EventLog {
  t: number;
  e: string;
  c: string;
  v: string;
}

export const logEvent = (e: string, additionalInfo: LogEventInfo) => {
  const t = new Date().valueOf();

  const newEvent: EventLog = {
    t,
    e,
    ...additionalInfo,
  };

  const logs = JSON.parse(
    sessionStorage.getItem("eventLogs") || "[]"
  ) as EventLog[];

  logs.push(newEvent);

  sessionStorage.setItem("eventLogs", JSON.stringify(logs));
};

export const addTutorialActive = (id: string) => {
  const elem = document.getElementById(id);
  if (elem && !elem.classList.contains("activeTutorial")) {
    elem.classList.add("activeTutorial");
  }
};
