import { Angle, Segment } from "./geometry";

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
