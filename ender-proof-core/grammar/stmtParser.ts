import { readFileSync } from "fs";
import moo from "moo";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { logDebug, logError } from "../errors/errorConstants.js";

// Lexer rules for statement definitions
const stmtLexerRules: moo.Rules = {
  // Whitespace
  ws: /[ \t]+/,
  nl: { match: /\r\n|\r|\n/, lineBreaks: true },

  // Comments
  comment: /\/\/.*$/,

  // Statement keyword
  stmt: "stmt",

  // Symbols for structure (put these before identifiers)
  lparen: "(",
  rparen: ")",
  comma: ",",

  // Parameter types (capitalized) - put before general identifiers
  param_type: /Segment|Angle|Triangle|Point/,

  // Parameter names: lowercase with optional numbers, or 'intersect', only if followed by ',' or ')'
  // Put this before stmt_function since it's more specific
  param_name: {
    match: /(?:[a-z][a-z0-9]*|intersect)(?=\s*[,)])/,
    value: (x: string) => x,
  },

  // Statement function names: start with a letter (upper/lower), may contain underscores or capital letters
  // This is more general, so put it after param_name
  stmt_function: {
    match: /[A-Za-z_][A-Za-z0-9_]*/,
    value: (x: string) => x,
  },
};

// Create the lexer
const stmtLexer = moo.compile(stmtLexerRules);

// Types for statement definitions
export interface StatementDefinition {
  name: string;
  parameters: string[];
}

// Parser for statement definitions
export class StmtParser {
  private lexer: any;

  constructor() {
    this.lexer = stmtLexer;
  }

  parseStatementDefinition(line: string): StatementDefinition | null {
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

    // Parse: stmt function_name(param_type param_name, param_type param_name, ...)
    if (tokens[0].type !== "stmt") return null;
    if (tokens[1].type !== "stmt_function") return null;
    if (tokens[2].type !== "lparen") return null;

    const stmtName = tokens[1].value;
    const parameters: string[] = [];
    let i = 3;

    // Parse parameters
    while (i < tokens.length && tokens[i].type !== "rparen") {
      if (
        tokens[i].type === "param_type" &&
        i + 1 < tokens.length &&
        tokens[i + 1].type === "param_name"
      ) {
        parameters.push(`${tokens[i].value} ${tokens[i + 1].value}`);
        i += 2;
      } else if (tokens[i].type === "param_name") {
        parameters.push(tokens[i].value);
        i++;
      } else {
        i++;
      }

      if (i < tokens.length && tokens[i].type === "comma") {
        i++;
      }
    }

    if (i >= tokens.length || tokens[i].type !== "rparen") return null;

    return {
      name: stmtName,
      parameters,
    };
  }

  parseStatementDefinitions(
    filePath: string
  ): Map<string, StatementDefinition> {
    const content = readFileSync(filePath, "utf-8");
    const statements = new Map<string, StatementDefinition>();

    const lines = content
      .split("\n")
      .filter((line: string) => line.trim() && !line.startsWith("//"));

    logDebug(`📚 Parsing ${lines.length} statement definition lines`);

    lines.forEach((line: string, index: number) => {
      logDebug(`  Line ${index + 1}: "${line.trim()}"`);
      const stmtDef = this.parseStatementDefinition(line.trim());
      if (stmtDef) {
        logDebug(`    ✅ Parsed: ${JSON.stringify(stmtDef)}`);
        statements.set(stmtDef.name, stmtDef);
      } else {
        logError.parser.failedToParse();
      }
    });

    logDebug(`📚 Loaded ${statements.size} statement definitions`);
    return statements;
  }
}

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Export a convenience function
export const loadStatementDefinitions = (): Map<
  string,
  StatementDefinition
> => {
  const parser = new StmtParser();
  const stmtsPath = join(__dirname, "defs", "stmts.txt");
  return parser.parseStatementDefinitions(stmtsPath);
};
