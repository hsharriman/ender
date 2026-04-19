import { Obj, ParseObj } from "../../geometry-object";
import { normalizeProofObj } from "../normalizeProofObj";
import { NEW_PROOF_STEP_PLACEHOLDER_SOURCE } from "../proofStepPlaceholder";
import {
  ProofObj,
  ProofStep,
  Reason,
  ReasonDefinition,
  StatementDefinition,
  Stmt,
} from "../types/checkerTypes";
import { loadReasonDefinitions, loadStatementDefinitions } from "./defsParsers";
import { lexer } from "./parser";

export class ProofParser {
  /** Lexer types for bare geometric literals in premises lists. */
  private static readonly geomPremiseTokenTypes = new Set([
    "point",
    "segment",
    "angle",
    "triangle",
    "quadrilateral",
  ]);

  private lexer: any;
  private reasonDefinitions: Map<string, ReasonDefinition>;
  private statementDefinitions: Map<string, StatementDefinition>;

  constructor() {
    this.lexer = lexer;
    this.reasonDefinitions = loadReasonDefinitions();
    this.statementDefinitions = loadStatementDefinitions().statements;
  }

  /** Three labeled points, all distinct (e.g. angle ABC, triangle ABC). */
  private distinctThreePoints = (body: string): boolean => {
    return body.length === 3 && new Set(body).size === 3;
  };

  private validateAngleToken = (full: string): string => {
    const v = full.startsWith("a_") ? full.slice(2) : full;
    if (v.length !== 3) {
      throw new Error(
        `Invalid angle '${full}': expected exactly 3 point labels after 'a_'`,
      );
    }
    if (!this.distinctThreePoints(v)) {
      throw new Error(
        `Invalid angle '${full}': duplicate point labels are not allowed (need 3 distinct points)`,
      );
    }
    return v;
  };

  private validateTriangleToken = (full: string): string => {
    const v = full.startsWith("t_") ? full.slice(2) : full;
    if (v.length !== 3) {
      throw new Error(
        `Invalid triangle '${full}': expected exactly 3 point labels after 't_'`,
      );
    }
    if (!this.distinctThreePoints(v)) {
      throw new Error(
        `Invalid triangle '${full}': duplicate point labels are not allowed (need 3 distinct points)`,
      );
    }
    return v;
  };

  private validateQuadrilateralToken = (full: string): string => {
    const v = full.startsWith("q_") ? full.slice(2) : full;
    if (v.length !== 4) {
      throw new Error(
        `Invalid quadrilateral '${full}': expected exactly 4 point labels after 'q_'`,
      );
    }
    if (new Set(v).size !== 4) {
      throw new Error(
        `Invalid quadrilateral '${full}': duplicate point labels are not allowed (need 4 distinct points)`,
      );
    }
    return v;
  };

  private validateSegmentLabel = (segment: string) => {
    if (segment[0] === segment[1]) {
      throw new Error(
        `Invalid segment '${segment}': endpoints must be two distinct points`,
      );
    }
  };

  // Helper function to parse objects
  private parseObj = (arg: string): ParseObj => {
    if (arg.startsWith("a_")) {
      return {
        type: Obj.Angle,
        v: this.validateAngleToken(arg),
      };
    }
    if (arg.startsWith("t_")) {
      return {
        type: Obj.Triangle,
        v: this.validateTriangleToken(arg),
      };
    }
    if (arg.startsWith("q_")) {
      return {
        type: Obj.Quadrilateral,
        v: this.validateQuadrilateralToken(arg),
      };
    }
    if (arg.length === 2) {
      this.validateSegmentLabel(arg);
      return {
        type: Obj.Segment,
        v: arg,
      };
    }
    if (arg.length === 1) {
      return {
        type: Obj.Point,
        v: arg,
      };
    }
    if (arg.length > 2) {
      throw new Error(
        `Malformed object '${arg}': names longer than 2 characters must use a prefix ('a_', 't_', or 'q_')`,
      );
    }
    throw new Error(`Cannot parse geometric object: ${arg}`);
  };

  private normalizeNumericRef = (raw: string): string => {
    const n = parseInt(raw.replace(/[[\]]/g, ""), 10);
    return Number.isNaN(n) ? raw : String(n);
  };

  /**
   * After `tri:`, `seg:`, etc., the next token (if any) must not be a different kind of
   * geometric literal — otherwise it was silently skipped by the old parser.
   */
  private assertPremiseListHead = (
    tokens: any[],
    i: number,
    sectionLabel: string,
    expected: "point" | "segment" | "angle" | "triangle" | "quadrilateral",
    humanReadable: string,
  ): void => {
    if (i >= tokens.length) return;
    const t = tokens[i];
    if (!ProofParser.geomPremiseTokenTypes.has(t.type)) return;
    if (t.type !== expected) {
      throw new Error(
        `In ${sectionLabel}: section, only ${humanReadable} are allowed; found ${t.type} '${t.value}'`,
      );
    }
  };

  /**
   * Lexer emits malformed prefixed objects like `t_RA` as `identifier` tokens
   * (not as `triangle`/`angle`/`quadrilateral`), so we detect and reject them.
   */
  private asMalformedObjectIdentifier = (token: any): string | null => {
    if (token?.type !== "identifier" || typeof token.value !== "string") {
      return null;
    }
    const v = token.value as string;
    if (/^[atq]_/.test(v)) return v;
    return null;
  };

  private assertNoMalformedObjectIdentifier = (
    token: any,
    context: string,
  ): void => {
    const malformed = this.asMalformedObjectIdentifier(token);
    if (!malformed) return;
    throw new Error(
      `Malformed object '${malformed}' in ${context}: use 'a_' with 3 points, 't_' with 3 points, or 'q_' with 4 points`,
    );
  };

  private makeProofStep = (
    stepLabel: string,
    parts: { reason?: Reason; statement?: Stmt },
  ): ProofStep => ({
    type: "proof",
    reason: parts.reason,
    statement: parts.statement,
    stepNumber: this.normalizeNumericRef(stepLabel),
    // Diagram deps are attached by the checker after geometric validation
    // (`runProofChecker` → `checkReasonApplication`).
    errors: [],
  });

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
      isCorrect: false,
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
                this.assertPremiseListHead(
                  tokens,
                  i,
                  "pt",
                  "point",
                  "single-letter points (then coordinates in parentheses)",
                );
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
                this.assertPremiseListHead(
                  tokens,
                  i,
                  "tri",
                  "triangle",
                  "triangles (t_XYZ)",
                );
                while (i < tokens.length && tokens[i].type === "triangle") {
                  this.validateTriangleToken(tokens[i].value as string);
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
                this.assertPremiseListHead(
                  tokens,
                  i,
                  "quad",
                  "quadrilateral",
                  "quadrilaterals (q_WXYZ)",
                );
                while (
                  i < tokens.length &&
                  tokens[i].type === "quadrilateral"
                ) {
                  this.validateQuadrilateralToken(tokens[i].value as string);
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
                this.assertPremiseListHead(
                  tokens,
                  i,
                  "seg",
                  "segment",
                  "segments (two capital letters, e.g. AB)",
                );
                while (i < tokens.length && tokens[i].type === "segment") {
                  this.validateSegmentLabel(tokens[i].value as string);
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
                this.assertPremiseListHead(
                  tokens,
                  i,
                  "ang",
                  "angle",
                  "angles (a_XYZ)",
                );
                while (i < tokens.length && tokens[i].type === "angle") {
                  this.validateAngleToken(tokens[i].value as string);
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
            } else if (ProofParser.geomPremiseTokenTypes.has(tokens[i].type)) {
              throw new Error(
                `Unexpected ${tokens[i].type} '${tokens[i].value}' in goal statement.`,
              );
            } else if (
              tokens[i].type === "comma" ||
              tokens[i].type === "comment"
            ) {
              i++;
            } else {
              this.assertNoMalformedObjectIdentifier(tokens[i], "premises");
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
                // Preserve blank step rows like `[03]` so the interface can render
                // an empty proof row tied to that step id.
                result.steps.push({
                  type: "proof",
                  stepNumber: this.normalizeNumericRef(label),
                  errors: [],
                });
                // Avoid skipping a legitimate next step token.
                if (i < tokens.length && tokens[i].type !== "stepNumber") {
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
    };

    if (i < tokens.length && tokens[i].type === "stmt_function") {
      statement.function = tokens[i].value;
      i++;
      if (i < tokens.length && tokens[i].type === "lparen") {
        i++;
        // Parse arguments
        while (i < tokens.length && tokens[i].type !== "rparen") {
          this.assertNoMalformedObjectIdentifier(
            tokens[i],
            `statement '${statement.function}' arguments`,
          );
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

    if (statement.function) {
      if (this.reasonDefinitions.has(statement.function)) {
        throw new Error(
          `'${statement.function}' is defined as a reason only and cannot be used as a statement`,
        );
      }
      if (!this.statementDefinitions.has(statement.function)) {
        throw new Error(
          `'${statement.function}' is not a defined reason or statement`,
        );
      }
    }

    return { obj: statement, endIndex: i };
  }

  /**
   * Single `comment` token matching {@link NEW_PROOF_STEP_PLACEHOLDER_SOURCE} is an
   * empty proof step (harness placeholder), not DSL.
   */
  private tryConsumeNewProofStepPlaceholder(
    tokens: any[],
    startIndex: number,
  ): number | null {
    if (startIndex >= tokens.length) return null;
    const t = tokens[startIndex];
    if (t.type !== "comment") return null;
    const raw =
      typeof t.text === "string"
        ? t.text
        : typeof t.value === "string"
          ? t.value
          : "";
    if (raw.trim() !== NEW_PROOF_STEP_PLACEHOLDER_SOURCE) return null;
    return startIndex + 1;
  }

  /** Format: `[01] reason(1, 3, 2) -> conclusion` */
  private parseProofStep(
    tokens: any[],
    startIndex: number,
    stepLabel: string,
  ): { obj: ProofStep; endIndex: number } | null {
    const phEnd = this.tryConsumeNewProofStepPlaceholder(tokens, startIndex);
    if (phEnd !== null) {
      return {
        obj: this.makeProofStep(stepLabel, {}),
        endIndex: phEnd,
      };
    }

    const reason = this.parseReason(tokens, startIndex);
    if (reason && tokens[reason.endIndex]?.type === "rarrow") {
      const i = reason.endIndex + 1;
      const conclusion = this.parseStatement(tokens, i);
      if (conclusion.obj.function) {
        return {
          obj: this.makeProofStep(stepLabel, {
            reason: reason.obj,
            statement: conclusion.obj,
          }),
          endIndex: conclusion.endIndex,
        };
      }
    }

    // If the line starts with a known reason, keep it as reason only — do not let
    // parseStatement treat e.g. sas(1,2,3) or sas(1,2,3) -> as a statement.
    if (reason && reason.obj.function) {
      return {
        obj: this.makeProofStep(stepLabel, { reason: reason.obj }),
        endIndex: reason.endIndex,
      };
    }

    // Incomplete step: statement without reason, e.g. `[05] con_seg(AB,CD)`.
    const statementOnly = this.parseStatement(tokens, startIndex);
    if (statementOnly.obj.function) {
      return {
        obj: this.makeProofStep(stepLabel, { statement: statementOnly.obj }),
        endIndex: statementOnly.endIndex,
      };
    }
    return null;
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
          this.assertNoMalformedObjectIdentifier(
            tokens[i],
            `reason '${reason.function}' arguments`,
          );
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
