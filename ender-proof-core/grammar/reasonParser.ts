import { readFileSync } from "fs";
import moo from "moo";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Lexer rules for reason definitions
const reasonLexerRules: moo.Rules = {
  // Whitespace
  ws: /[ \t]+/,
  nl: { match: /\r\n|\r|\n/, lineBreaks: true },

  // Comments
  comment: /\/\/.*$/,

  // Reason keyword
  reason: "reason",

  // Symbols for structure (put these before identifiers)
  lparen: "(",
  rparen: ")",
  comma: ",",
  rarrow: "->",

  // Statement names in requirements and conclusions: lowercase, may include underscores and numbers
  // Put this before reason_function since it's more specific
  stmt_name: {
    match: /[a-z][a-z0-9_]*/,
    value: (x: string) => x,
  },

  // Reason function names: start with a letter or underscore, may contain numbers/underscores
  // This is more general, so put it after stmt_name
  reason_function: {
    match: /[A-Za-z_][A-Za-z0-9_]*/,
    value: (x: string) => x,
  },
};

// Create the lexer
const reasonLexer = moo.compile(reasonLexerRules);

// Types for reason definitions
export interface StatementGroup {
  name: string;
  base: string; // The base statement that can be substituted for
  extensions: string[]; // Statements that can substitute for the base
}

export interface ReasonDefinition {
  name: string;
  dependencies: (string | StatementGroup)[];
  conclusion: string;
}

// Parser for reason definitions
export class ReasonParser {
  private lexer: any;

  constructor() {
    this.lexer = reasonLexer;
  }

  parseReasonDefinition(line: string): ReasonDefinition | null {
    this.lexer.reset(line);
    const tokens = [];
    let token;

    while ((token = this.lexer.next())) {
      if (
        token.type !== "ws" &&
        token.type !== "nl" &&
        token.type !== "comment"
      ) {
        tokens.push(token);
      }
    }

    if (tokens.length === 0) return null;

    // Parse: reason function_name(dep1, dep2, ...) -> conclusion1, conclusion2, ...
    if (tokens[0].type !== "reason") {
      return null;
    }
    if (
      tokens.length < 2 ||
      (tokens[1].type !== "reason_function" && tokens[1].type !== "stmt_name")
    ) {
      return null;
    }
    if (tokens.length < 3 || tokens[2].type !== "lparen") {
      return null;
    }

    const reasonName = tokens[1].value;
    const dependencies: string[] = [];
    let i = 3;

    // Parse dependencies - accept both stmt_name and reason_function
    while (i < tokens.length && tokens[i].type !== "rparen") {
      if (
        tokens[i].type === "stmt_name" ||
        tokens[i].type === "reason_function"
      ) {
        dependencies.push(tokens[i].value);
      }
      i++;
      if (i < tokens.length && tokens[i].type === "comma") {
        i++;
      }
    }

    if (i >= tokens.length || tokens[i].type !== "rparen") {
      return null;
    }
    i++;

    // Check for arrow and conclusion
    if (i >= tokens.length || tokens[i].type !== "rarrow") {
      // No conclusion (like "reason given()")
      return {
        name: reasonName,
        dependencies,
        conclusion: "",
      };
    }
    i++;

    // Parse conclusion(s) - accept both stmt_name and reason_function
    const conclusions: string[] = [];
    while (i < tokens.length) {
      if (
        tokens[i].type === "stmt_name" ||
        tokens[i].type === "reason_function"
      ) {
        conclusions.push(tokens[i].value);
      }
      i++;
      if (i < tokens.length && tokens[i].type === "comma") {
        i++;
      }
    }

    return {
      name: reasonName,
      dependencies,
      conclusion: conclusions.join(", "),
    };
  }

  parseReasonDefinitions(filePath: string): Map<string, ReasonDefinition> {
    const content = readFileSync(filePath, "utf-8");
    const reasons = new Map<string, ReasonDefinition>();

    const lines = content
      .split("\n")
      .filter((line: string) => line.trim() && !line.startsWith("?"));

    lines.forEach((line: string, index: number) => {
      const reasonDef = this.parseReasonDefinition(line.trim());
      if (reasonDef) {
        reasons.set(reasonDef.name, reasonDef);
      }
    });
    return reasons;
  }
}

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Export a convenience function
export const loadReasonDefinitions = (): Map<string, ReasonDefinition> => {
  const parser = new ReasonParser();
  const reasonsPath = join(__dirname, "defs", "reasons.txt");
  return parser.parseReasonDefinitions(reasonsPath);
};
