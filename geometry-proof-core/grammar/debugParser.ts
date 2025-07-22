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

// Test the parser
const parser = new ProofParser();

const testInput = `title: "Test Proof"
premises:
pt: A, B, C
steps:
c(AB,AD) [01]
c(a_BAC,a_DAC) [02]
reflex() -> c(AC, AC) [03]`;

console.log("=== Testing Parser ===");
console.log("Input:", testInput);
console.log("\n=== Tokens ===");
const tokens = debugTokens(testInput);
console.log("\n=== Parse Result ===");
const result = parser.parse(testInput);
console.log(JSON.stringify(result, null, 2));
