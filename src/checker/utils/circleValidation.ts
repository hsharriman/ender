// export type CircleShapeError = "wrong_length" | "duplicate_points";

// /** Strip optional `c_` prefix; does not validate. */
// export const stripCirclePrefix = (label: string): string =>
//   label.startsWith("c_") ? label.slice(2) : label;

// /** Proof spelling for errors and display, e.g. `OA` → `c_OA`. */
// export const formatCircleToken = (body: string): string => `c_${body}`;

// export const getCirclePointLabels = (
//   label: string,
// ): [center: string, intersect: string] => {
//   const body = stripCirclePrefix(label);
//   return [body[0], body[1]];
// };

// export const getCircleShapeErrors = (body: string): CircleShapeError[] => {
//   const errors: CircleShapeError[] = [];
//   if (body.length !== 2) errors.push("wrong_length");
//   else if (body[0] === body[1]) errors.push("duplicate_points");
//   return errors;
// };

// const circleShapeErrorMessage = (
//   token: string,
//   kind: CircleShapeError,
// ): string => {
//   switch (kind) {
//     case "wrong_length":
//       return `Invalid circle format: '${token}' - circles must have exactly 2 points`;
//     case "duplicate_points":
//       return `Circle '${token}' contains duplicate points`;
//   }
// };

// /** Non-throwing shape checks for checker validators. */
// export const collectCircleShapeErrorMessages = (label: string): string[] => {
//   const body = stripCirclePrefix(label);
//   const token = formatCircleToken(body);
//   return getCircleShapeErrors(body).map((kind) =>
//     circleShapeErrorMessage(token, kind),
//   );
// };

// export const assertCirclePointsDefined = (
//   label: string,
//   definedPoints: Iterable<string>,
//   onMissing: (point: string) => void,
// ): void => {
//   const defined = new Set(definedPoints);
//   for (const point of getCirclePointLabels(label)) {
//     if (!defined.has(point)) onMissing(point);
//   }
// };
