import { LRParser } from "@lezer/lr";
import { lexer } from "./parser";
import { loadReasonDefinitions } from "./reasonParser.js";

// This will be generated from the grammar file
// For now, we'll create a basic structure
export class ProofParser {
  private lexer: any;
  private parser?: LRParser;
  private reasonDefinitions: Map<string, any>;

  constructor() {
    this.lexer = lexer;
    this.reasonDefinitions = loadReasonDefinitions();
    // TODO: Load the generated parser from proof.grammar
    // this.parser = require("./proof.grammar.js");
  }

  parse(input: string) {
    this.lexer.reset(input);
    const tokens = [];
    let token;

    while ((token = this.lexer.next())) {
      if (token.type !== "ws" && token.type !== "nl") {
        tokens.push(token);
      }
    }

    // For now, return a basic structure
    return this.parseBasicStructure(tokens);
  }

  private parseBasicStructure(tokens: any[]) {
    const result = {
      title: null as string | null,
      premises: {
        points: [] as string[],
        triangles: [] as string[],
        quadrilaterals: [] as string[],
        segments: [] as string[],
        angles: [] as string[],
      },
      steps: [] as any[],
    };

    let currentSection = null;
    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];

      if (token.type === "title") {
        currentSection = "title";
        i++;
        if (i < tokens.length && tokens[i].type === "colon") {
          i++;
          if (i < tokens.length && tokens[i].type === "quoted_string") {
            result.title = tokens[i].value;
          }
        }
      } else if (token.type === "premises") {
        currentSection = "premises";
        i++;
        if (i < tokens.length && tokens[i].type === "colon") {
          i++;
          // Parse premises
          while (i < tokens.length && tokens[i].type !== "steps") {
            if (tokens[i].type === "pt") {
              i++;
              if (i < tokens.length && tokens[i].type === "colon") {
                i++;
                while (i < tokens.length && tokens[i].type === "point") {
                  result.premises.points.push(tokens[i].value);
                  i++;
                  if (i < tokens.length && tokens[i].type === "comma") {
                    i++;
                  }
                }
              }
            } else if (tokens[i].type === "tri") {
              i++;
              if (i < tokens.length && tokens[i].type === "colon") {
                i++;
                while (i < tokens.length && tokens[i].type === "triangle") {
                  result.premises.triangles.push(tokens[i].value);
                  i++;
                }
              }
            } else if (tokens[i].type === "quad") {
              i++;
              if (i < tokens.length && tokens[i].type === "colon") {
                i++;
                while (
                  i < tokens.length &&
                  tokens[i].type === "quadrilateral"
                ) {
                  result.premises.quadrilaterals.push(tokens[i].value);
                  i++;
                }
              }
            } else if (tokens[i].type === "seg") {
              i++;
              if (i < tokens.length && tokens[i].type === "colon") {
                i++;
                while (i < tokens.length && tokens[i].type === "segment") {
                  result.premises.segments.push(tokens[i].value);
                  i++;
                }
              }
            } else if (tokens[i].type === "ang") {
              i++;
              if (i < tokens.length && tokens[i].type === "colon") {
                i++;
                while (i < tokens.length && tokens[i].type === "angle") {
                  result.premises.angles.push(tokens[i].value);
                  i++;
                }
              }
            } else {
              // After points/triangles/etc., parse given statements and goal until 'steps'
              if (tokens[i].type === "rarrow") {
                // Goal statement in premises
                i++;
                const goal = this.parseStatement(tokens, i);
                result.steps.push({ type: "goal", statement: goal });
                i = goal.endIndex;
              } else if (tokens[i].type === "stmt_function") {
                // Given statement in premises
                const step = this.parseStep(tokens, i);
                if (step) {
                  result.steps.push(step);
                  i = step.endIndex;
                } else {
                  i++;
                }
              } else {
                i++;
              }
            }
          }
        }
      } else if (token.type === "steps") {
        currentSection = "steps";
        i++;
        if (i < tokens.length && tokens[i].type === "colon") {
          i++;
          // Parse steps
          while (i < tokens.length) {
            if (tokens[i].type === "rarrow") {
              // Goal statement
              i++;
              const goal = this.parseStatement(tokens, i);
              result.steps.push({ type: "goal", statement: goal });
              break;
            } else if (tokens[i].type === "stmt_function") {
              // Check if this is a reason function (like reflex, sas, etc.)
              const functionName = tokens[i].value;
              if (this.isReasonFunction(functionName)) {
                // Proof step starting with reason
                const step = this.parseProofStep(tokens, i);
                if (step) {
                  result.steps.push(step);
                  i = step.endIndex;
                } else {
                  i++;
                }
              } else {
                // Given statement
                const step = this.parseStep(tokens, i);
                if (step) {
                  result.steps.push(step);
                  i = step.endIndex;
                } else {
                  i++;
                }
              }
            } else {
              i++;
            }
          }
        }
      } else {
        i++;
      }
    }

    return result;
  }

  private parseStatement(tokens: any[], startIndex: number) {
    let i = startIndex;
    const statement = {
      function: null as string | null,
      arguments: [] as string[],
      stepNumber: null as string | null,
    };

    if (i < tokens.length && tokens[i].type === "stmt_function") {
      statement.function = tokens[i].value;
      i++;
      if (i < tokens.length && tokens[i].type === "lparen") {
        i++;
        // Parse arguments
        while (i < tokens.length && tokens[i].type !== "rparen") {
          if (tokens[i].type === "point") {
            // Check if this is part of a segment (two consecutive points)
            if (i + 1 < tokens.length && tokens[i + 1].type === "point") {
              statement.arguments.push(tokens[i].value + tokens[i + 1].value);
              i += 2;
            } else {
              statement.arguments.push(tokens[i].value);
              i++;
            }
          } else if (
            tokens[i].type === "segment" ||
            tokens[i].type === "angle" ||
            tokens[i].type === "triangle" ||
            tokens[i].type === "statementRef"
          ) {
            statement.arguments.push(tokens[i].value);
            i++;
          } else {
            i++;
          }

          if (i < tokens.length && tokens[i].type === "comma") {
            i++;
          }
        }
        if (i < tokens.length && tokens[i].type === "rparen") {
          i++;
        }
      }
    }

    // Check for step number
    if (i < tokens.length && tokens[i].type === "lbracket") {
      i++;
      if (i < tokens.length && tokens[i].type === "float_literal") {
        statement.stepNumber = `[${tokens[i].value}]`;
        i++;
        if (i < tokens.length && tokens[i].type === "rbracket") {
          i++;
        }
      }
    }

    return { ...statement, endIndex: i };
  }

  private parseStep(tokens: any[], startIndex: number) {
    let i = startIndex;

    // Check if this is a given statement (has step number)
    let hasStepNumber = false;
    let tempIndex = i;
    while (tempIndex < tokens.length && tokens[tempIndex].type !== "rarrow") {
      if (tempIndex < tokens.length && tokens[tempIndex].type === "lbracket") {
        hasStepNumber = true;
        break;
      }
      tempIndex++;
    }

    if (hasStepNumber) {
      // Given statement
      const statement = this.parseStatement(tokens, i);
      return {
        type: "given",
        statement: statement,
        stepNumber: statement.stepNumber,
        endIndex: statement.endIndex,
      };
    }

    return null;
  }

  private parseProofStep(tokens: any[], startIndex: number) {
    let i = startIndex;

    // Parse reason
    const reason = this.parseReason(tokens, i);
    if (
      reason &&
      reason.endIndex < tokens.length &&
      tokens[reason.endIndex].type === "rarrow"
    ) {
      i = reason.endIndex + 1;
      const conclusion = this.parseStatement(tokens, i);
      return {
        type: "proof",
        reason: reason,
        statement: conclusion,
        stepNumber: conclusion.stepNumber,
        endIndex: conclusion.endIndex,
      };
    }

    return null;
  }

  private parseReason(tokens: any[], startIndex: number) {
    let i = startIndex;
    const reason = {
      function: null as string | null,
      arguments: [] as string[],
    };

    if (
      i < tokens.length &&
      tokens[i].type === "stmt_function" &&
      this.isReasonFunction(tokens[i].value)
    ) {
      reason.function = tokens[i].value;
      i++;
      if (i < tokens.length && tokens[i].type === "lparen") {
        i++;
        // Parse arguments
        while (i < tokens.length && tokens[i].type !== "rparen") {
          if (tokens[i].type === "lbracket") {
            // Parse statement reference like [01], [02], etc.
            i++;
            if (i < tokens.length && tokens[i].type === "float_literal") {
              reason.arguments.push(`[${tokens[i].value}]`);
              i++;
              if (i < tokens.length && tokens[i].type === "rbracket") {
                i++;
              }
            }
          } else {
            i++;
          }
          if (i < tokens.length && tokens[i].type === "comma") {
            i++;
          }
        }
        if (i < tokens.length && tokens[i].type === "rparen") {
          i++;
        }
      }
    }

    return { ...reason, endIndex: i };
  }

  private isReasonFunction(functionName: string): boolean {
    // Check if the function name exists in the loaded reason definitions
    return this.reasonDefinitions.has(functionName);
  }
}
