import { readFileSync } from "fs";
import moo from "moo";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { logDebug, logError } from "../errors/errorConstants";

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
  isPremisesOnly?: boolean;
  group?: string; // Optional group membership
}

export interface StatementGroup {
  name: string;
  base: string; // The base statement that can be substituted for
  extensions: string[]; // Statements that can substitute for the base
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

  parseGroupDefinition(line: string): StatementGroup | null {
    // Parse: group group_name { base: stmt1, extensions: stmt2, stmt3 }
    const trimmed = line.trim();
    const hierarchyMatch = trimmed.match(
      /^group\s+(\w+)\s*\{\s*base:\s*(\w+)\s*,\s*extensions:\s*([^}]+)\s*\}$/
    );
    if (hierarchyMatch) {
      const [, groupName, base, extensionsStr] = hierarchyMatch;
      const extensions = extensionsStr
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      return {
        name: groupName,
        base,
        extensions,
      };
    }

    return null;
  }

  parseStatementDefinitions(filePath: string): {
    statements: Map<string, StatementDefinition>;
    groups: Map<string, StatementGroup>;
  } {
    const content = readFileSync(filePath, "utf-8");
    const statements = new Map<string, StatementDefinition>();
    const groups = new Map<string, StatementGroup>();

    const lines = content
      .split("\n")
      .filter((line: string) => line.trim() && !line.startsWith("//"));

    logDebug(`📚 Parsing ${lines.length} statement definition lines`);

    let inPremisesSection = false;
    let lineIndex = 0;

    for (const line of lines) {
      lineIndex++;
      logDebug(`  Line ${lineIndex}: "${line.trim()}"`);

      // Check for premises section markers
      if (line.trim() === "premises") {
        inPremisesSection = true;
        logDebug(`    📍 Entering premises section`);
        continue;
      }

      if (line.trim() === "end_premises") {
        inPremisesSection = false;
        logDebug(`    📍 Exiting premises section`);
        continue;
      }

      // Try to parse as group first
      const groupDef = this.parseGroupDefinition(line.trim());
      if (groupDef) {
        groups.set(groupDef.name, groupDef);
        logDebug(`    ✅ Parsed group: ${JSON.stringify(groupDef)}`);
        continue;
      }

      const stmtDef = this.parseStatementDefinition(line.trim());
      if (stmtDef) {
        // Mark statements in premises section as premises-only
        if (inPremisesSection) {
          stmtDef.isPremisesOnly = true;
          logDebug(`    ✅ Parsed (premises-only): ${JSON.stringify(stmtDef)}`);
        } else {
          logDebug(`    ✅ Parsed: ${JSON.stringify(stmtDef)}`);
        }
        statements.set(stmtDef.name, stmtDef);
      } else if (line.trim() !== "premises" && line.trim() !== "end_premises") {
        logError.parser.failedToParse();
      }
    }

    // Link statements to their groups
    for (const [groupName, group] of groups) {
      // Link base statement to group
      const baseStmt = statements.get(group.base);
      if (baseStmt) {
        baseStmt.group = groupName;
      }

      // Link extension statements to group
      for (const stmtName of group.extensions) {
        const stmt = statements.get(stmtName);
        if (stmt) {
          stmt.group = groupName;
        }
      }
    }

    logDebug(
      `📚 Loaded ${statements.size} statement definitions and ${groups.size} groups`
    );
    return { statements, groups };
  }
}

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Export a convenience function
export const loadStatementDefinitions = (): {
  statements: Map<string, StatementDefinition>;
  groups: Map<string, StatementGroup>;
} => {
  const parser = new StmtParser();
  const stmtsPath = join(__dirname, "defs", "stmts.txt");
  return parser.parseStatementDefinitions(stmtsPath);
};
