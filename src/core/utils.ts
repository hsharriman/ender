import { Obj } from "./types/types";

export const getId = (objectType: Obj, label: string, tickNumber?: number) => {
  if (objectType === Obj.Angle || objectType === Obj.EqualAngleTick) {
    const endPts = [label[0], label[2]].sort().toString().replaceAll(",", "");
    label = `${label[1]}-${endPts}`;
  } else {
    label = Array.from(label).sort().toString().replaceAll(",", "");
  }
  let id = `${objectType}.${label}`;
  return tickNumber ? `${id}.${tickNumber}` : id;
};

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

  // console.log(newEvent);
};
