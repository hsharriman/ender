import { ProofParser } from "./lezerParser";
import { lexer } from "./parser";

// Debug function to see what tokens are being generated
function debugTokens(input: string) {
  lexer.reset(input);
  const tokens = [];
  let token;

  while ((token = lexer.next())) {
    if (token.type !== "ws" && token.type !== "nl") {
      tokens.push(token);
    }
  }

  console.log(
    "Tokens:",
    tokens.map((t) => ({ type: t.type, value: t.value }))
  );
  return tokens;
}

// Test the parser with the complex example
const parser = new ProofParser();

const complexInput = `title: "Prove Triangles Congruent (correct)"
premises:
pt: A, B, C, D
tri: t_ABC t_ADC
c(AB,AD) [01] // c = congruent
c(a_BAC,a_DAC) [02] // a prefix = object is angle
-> c(t_ABC,t_ADC)

steps:
reflex() -> c(AC, AC) [03]
sas([01], [02], [03]) -> c(t_ABC,t_ADC) [04]`;

console.log("=== Testing Complex Proof ===");
console.log("Input:", complexInput);
console.log("\n=== Tokens ===");
const tokens = debugTokens(complexInput);
console.log("\n=== Parse Result ===");
const result = parser.parse(complexInput);
console.log(JSON.stringify(result, null, 2));

// Let's also test just the given statements part
console.log("\n=== Testing Given Statements Only ===");
const givenOnlyInput = `title: "Test"
premises:
pt: A, B, C, D
steps:
c(AB,AD) [01]
c(a_BAC,a_DAC) [02]`;

const givenResult = parser.parse(givenOnlyInput);
console.log("Given statements result:", JSON.stringify(givenResult, null, 2));
