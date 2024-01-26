import { Angle, Segment } from "./geometry";

// TODO can add logic that differentiates between 90 deg and all others
export const equalAngle = (a1: Angle, a2: Angle) => {
  // check for marks on a1 and a2
  let numMarks = numberOfTicks(a1.getEqualMark(), a2.getEqualMark());

  a1.setEqualMark(numMarks);
  a2.setEqualMark(numMarks);
  // if present, use that number of ticks
};

export const parallel = (s1: Segment, s2: Segment) => {
  // check for marks on s1 and s2
  let numMarks = numberOfTicks(s1.getParallel(), s2.getParallel());

  s1.setParallel(numMarks);
  s2.setParallel(numMarks);
};

export const equalLength = (s1: Segment, s2: Segment) => {
  let numMarks = numberOfTicks(s1.getEqualMark(), s2.getEqualMark());

  s1.setEqualMark(numMarks);
  s2.setEqualMark(numMarks);
};

/* ---------- HELPERS ---------- */

const numberOfTicks = (a: number, b: number) => {
  let numTicks = 0;
  if (a > 0 && b > 0) {
    if (a !== b) {
      console.log("need to castcading update angle markers");
    }
    numTicks = Math.min(a, b);
  } else if (a > 0) {
    numTicks = a;
  } else if (b > 0) {
    numTicks = b;
  } else {
    // numMarked = addAngleMark(); // TODO rename, method tracks highest num tick marks in diagram
    numTicks = 1;
  }
  return numTicks;
};
