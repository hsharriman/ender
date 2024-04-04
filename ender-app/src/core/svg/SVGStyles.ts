const HIDDEN: React.CSSProperties = {
  opacity: 0,
};
const FOCUSED: React.CSSProperties = {
  opacity: 1,
  stroke: "black",
  strokeWidth: "2px",
  fill: "none",
};
const ACTIVE: React.CSSProperties = {
  opacity: 1,
  stroke: "#9A76FF",
  strokeWidth: "2px",
  fill: "none",
};
const DEFAULT: React.CSSProperties = {
  opacity: 1,
  stroke: "black",
  strokeWidth: "1px",
  fill: "none",
};
const UNFOCUSED: React.CSSProperties = {
  opacity: 0.5,
  stroke: "black",
  strokeWidth: "1px",
  fill: "none",
};
const PURPLE: React.CSSProperties = {
  opacity: 1,
  stroke: "#9A76FF",
  strokeWidth: "2px",
  fill: "none",
};
const BLUE: React.CSSProperties = {
  opacity: 1,
  stroke: "#41B2E2",
  strokeWidth: "2px",
  fill: "none",
};
export const ModeCSS = {
  DEFAULT,
  HIDDEN,
  ACTIVE,
  FOCUSED,
  UNFOCUSED,
  BLUE,
  PURPLE,
};
