import { Obj, ParseObj } from "../../geometry-object";
import { normalizeProofObj } from "../normalizeProofObj";
import { ProofObj, ProofStep, Reason, Stmt } from "../types/checkerTypes";
import { loadReasonDefinitionsWithBuiltins } from "./defsParsers";
import { lexer } from "./parser";

export class ProofParser {
  private lexer: any;
  private reasonDefinitions: Map<string, any>;

  constructor() {
    this.lexer = lexer;
    this.reasonDefinitions = loadReasonDefinitionsWithBuiltins();
  }

  // Helper function to parse objects
  private parseObj = (arg: string): ParseObj => {
    if (arg.startsWith("a_")) {
      return {
        type: Obj.Angle,
        v: arg.replace("a_", ""),
      };
    } else if (arg.startsWith("t_")) {
      return {
        type: Obj.Triangle,
        v: arg.replace("t_", ""),
      };
    } else if (arg.startsWith("q_")) {
      return {
        type: Obj.Quadrilateral,
        v: arg.replace("q_", ""),
      };
    } else if (arg.length === 2) {
      return {
        type: Obj.Segment,
        v: arg,
      };
    } else if (arg.length === 1) {
      return {
        type: Obj.Point,
        v: arg,
      };
    }
    throw new Error(`Cannot parse geometric object: ${arg}`);
  };

  private normalizeNumericRef = (raw: string): string => {
    const n = parseInt(raw.replace(/[[\]]/g, ""), 10);
    return Number.isNaN(n) ? raw : String(n);
  };

  parse(input: string) {
    this.lexer.reset(input);
    const tokens = [];
    let token;

    while ((token = this.lexer.next())) {
      if (token.type !== "ws" && token.type !== "nl") {
        tokens.push(token);
      }
    }

    return this.parseBasicStructure(tokens);
  }

  private parsePointPlacement(
    tokens: any[],
    startIndex: number,
  ): {
    pt: [number, number];
    offset: [number, number];
    endIndex: number;
  } | null {
    let i = startIndex;
    if (i >= tokens.length || tokens[i].type !== "lparen") return null;
    i++;
    if (i >= tokens.length || tokens[i].type !== "float_literal") return null;
    const x = Number(tokens[i].value);
    i++;
    if (i >= tokens.length || tokens[i].type !== "comma") return null;
    i++;
    if (i >= tokens.length || tokens[i].type !== "float_literal") return null;
    const y = Number(tokens[i].value);
    i++;
    if (i >= tokens.length || tokens[i].type !== "comma") return null;
    i++;
    if (i >= tokens.length || tokens[i].type !== "float_literal") return null;
    const offsetX = Number(tokens[i].value);
    i++;
    if (i >= tokens.length || tokens[i].type !== "comma") return null;
    i++;
    if (i >= tokens.length || tokens[i].type !== "float_literal") return null;
    const offsetY = Number(tokens[i].value);
    i++;
    if (i >= tokens.length || tokens[i].type !== "rparen") return null;
    i++;
    return { pt: [x, y], offset: [offsetX, offsetY], endIndex: i };
  }

  private parseBasicStructure(tokens: any[]) {
    const result: ProofObj = {
      title: "",
      premises: {
        points: [],
        triangles: [],
        quadrilaterals: [],
        segments: [],
        angles: [],
        diagramStatements: [],
      },
      steps: [],
      goal: undefined,
      errors: [],
    };

    let i = 0;

    while (i < tokens.length) {
      const token = tokens[i];

      if (token.type === "title") {
        i++;
        if (i < tokens.length && tokens[i].type === "colon") {
          i++;
          if (i < tokens.length && tokens[i].type === "quoted_string") {
            result.title = tokens[i].value;
          }
        }
      } else if (token.type === "premises") {
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
                  const pointLabel = tokens[i].value;
                  i++;
                  const placement = this.parsePointPlacement(tokens, i);
                  if (!placement) {
                    throw new Error(
                      `Expected coordinates and offsets after point '${pointLabel}' in premises. Use format: pt: A (x, y, offsetX, offsetY), B (x, y, offsetX, offsetY)`,
                    );
                  }
                  result.premises.points.push({
                    type: Obj.Point,
                    v: pointLabel,
                    pt: placement.pt,
                    offset: placement.offset,
                  });
                  i = placement.endIndex;
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
                  result.premises.triangles.push({
                    type: Obj.Triangle,
                    v: tokens[i].value,
                  });
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
                  result.premises.quadrilaterals.push({
                    type: Obj.Quadrilateral,
                    v: tokens[i].value,
                  });
                  i++;
                }
              }
            } else if (tokens[i].type === "seg") {
              i++;
              if (i < tokens.length && tokens[i].type === "colon") {
                i++;
                while (i < tokens.length && tokens[i].type === "segment") {
                  result.premises.segments.push({
                    type: Obj.Segment,
                    v: tokens[i].value,
                  });
                  i++;
                }
              }
            } else if (tokens[i].type === "ang") {
              i++;
              if (i < tokens.length && tokens[i].type === "colon") {
                i++;
                while (i < tokens.length && tokens[i].type === "angle") {
                  result.premises.angles.push({
                    type: Obj.Angle,
                    v: tokens[i].value,
                  });
                  i++;
                }
              }
            } else if (tokens[i].type === "diagramPremiseRef") {
              const diagramLabel = tokens[i].value as string;
              i++;
              const statement = this.parseStatement(tokens, i);
              result.premises.diagramStatements.push({
                type: "diagram",
                statement: statement.obj,
                stepNumber: diagramLabel,
                errors: [],
              });
              i = statement.endIndex;
            } else if (tokens[i].type === "givenPremiseDefRef") {
              const premiseLabel = tokens[i].value as string;
              i++;
              const statement = this.parseStatement(tokens, i);
              result.steps.push({
                type: "given",
                statement: statement.obj,
                stepNumber: premiseLabel,
                errors: [],
              });
              i = statement.endIndex;
            } else if (tokens[i].type === "rarrow") {
              // Goal statement in premises
              i++;
              const goal = this.parseStatement(tokens, i);
              result.goal = goal.obj;
              i = goal.endIndex;
            } else {
              i++;
            }
          }
        }
      } else if (token.type === "steps") {
        i++;
        if (i < tokens.length && tokens[i].type === "colon") {
          i++;
          // Parse steps
          while (i < tokens.length) {
            if (tokens[i].type === "rarrow") {
              // Goal statement
              i++;
              const goal = this.parseStatement(tokens, i);
              result.goal = goal.obj;
              break;
            } else if (tokens[i].type === "stepNumber") {
              const label = tokens[i].value as string;
              i++;
              const step = this.parseProofStep(tokens, i, label);
              if (step) {
                result.steps.push(step.obj);
                i = step.endIndex;
              } else {
                i++;
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

    return normalizeProofObj(result);
  }

  private parseStatement(
    tokens: any[],
    startIndex: number,
  ): { obj: Stmt; endIndex: number } {
    let i = startIndex;
    const statement: Stmt = {
      function: "",
      arguments: [],
      stepNumber: "",
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
              statement.arguments.push(
                this.parseObj(tokens[i].value + tokens[i + 1].value),
              );
              i += 2;
            } else {
              statement.arguments.push(this.parseObj(tokens[i].value));
              i++;
            }
          } else if (
            tokens[i].type === "segment" ||
            tokens[i].type === "angle" ||
            tokens[i].type === "triangle" ||
            tokens[i].type === "quadrilateral" ||
            tokens[i].type === "stepNumber"
          ) {
            statement.arguments.push(this.parseObj(tokens[i].value));
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
    return { obj: statement, endIndex: i };
  }

  /** Format: `[01] reason(1, 3, 2) -> conclusion` */
  private parseProofStep(
    tokens: any[],
    startIndex: number,
    stepLabel: string,
  ): { obj: ProofStep; endIndex: number } | null {
    const reason = this.parseReason(tokens, startIndex);
    if (
      !reason ||
      reason.endIndex >= tokens.length ||
      tokens[reason.endIndex].type !== "rarrow"
    ) {
      return null;
    }
    const i = reason.endIndex + 1;
    const conclusion = this.parseStatement(tokens, i);
    delete conclusion.obj.stepNumber;
    return {
      obj: {
        type: "proof",
        reason: reason.obj,
        statement: conclusion.obj,
        stepNumber: this.normalizeNumericRef(stepLabel),
        // Diagram deps are attached by the checker after geometric validation
        // (`runProofChecker` → `checkReasonApplication`).
        errors: [],
      },
      endIndex: conclusion.endIndex,
    };
  }

  private parseReason(
    tokens: any[],
    startIndex: number,
  ): { obj: Reason; endIndex: number } | null {
    let i = startIndex;
    const reason: Reason = {
      function: "",
      arguments: [],
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
          if (
            tokens[i].type === "givenPremiseRef" ||
            tokens[i].type === "diagramPremiseRef"
          ) {
            reason.arguments.push(tokens[i].value as string);
            i++;
          } else if (tokens[i].type === "float_literal") {
            const value = tokens[i].value as string;
            if (/^\d+$/.test(value)) {
              reason.arguments.push(this.normalizeNumericRef(value));
            }
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

    return { obj: reason, endIndex: i };
  }

  private isReasonFunction(functionName: string): boolean {
    // Check if the function name exists in the loaded reason definitions
    return this.reasonDefinitions.has(functionName);
  }
}
