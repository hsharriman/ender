import { Obj, ParseObj } from "../../geometry-object";
import { normalizeProofObj } from "../normalizeProofObj";
import { ErrorType } from "../errors/errorConstants";
import {
  ErrorDetails,
  ParseError,
  ParseResult,
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
    "circle",
  ]);

  private lexer: any;
  private reasonDefinitions: Map<string, ReasonDefinition>;
  private statementDefinitions: Map<string, StatementDefinition>;

  constructor() {
    this.lexer = lexer;
    this.reasonDefinitions = loadReasonDefinitions();
    this.statementDefinitions = loadStatementDefinitions().statements;
  }

  private parserError = (code: string, token: string): ParseError => {
    return {
      ok: false,
      failure: {
        type: ErrorType.ParserError,
        code,
        details: { token },
      },
    };
  };

  private validateSegmentLabel = (segment: string): undefined | ParseError => {
    if (segment[0] === segment[1]) {
      return this.parserError("invalid_segment", segment);
    }
  };

  private checkObj = (obj: ParseObj): ParseError | undefined => {
    const validate = (code: string, size: number) => {
      if (obj.v.length !== size) {
        return this.parserError(code, obj.v);
      }
      if (new Set(obj.v).size !== size) {
        return this.parserError(code, obj.v);
      }
    };
    if (obj.type === Obj.Point) {
      return undefined;
    } else if (obj.type === Obj.Angle) {
      return validate("invalid_angle", 3);
    } else if (obj.type === Obj.Triangle) {
      return validate("invalid_triangle", 3);
    } else if (obj.type === Obj.Quadrilateral) {
      return validate("invalid_quadrilateral", 4);
    } else if (obj.type === Obj.Segment) {
      return this.validateSegmentLabel(obj.v);
    } else if (obj.type === Obj.Circle) {
      return validate("invalid_circle", 2);
    }
    return this.parserError("invalid_object_type", obj.type);
  };

  // Helper function to parse objects
  private parseObj = (arg: string): ParseObj | undefined => {
    if (arg.startsWith("a_")) {
      const v = arg.slice(2);
      return { type: Obj.Angle, v };
    }
    if (arg.startsWith("t_")) {
      const v = arg.slice(2);
      return { type: Obj.Triangle, v };
    }
    if (arg.startsWith("q_")) {
      const v = arg.slice(2);
      return { type: Obj.Quadrilateral, v };
    }
    if (arg.startsWith("c_")) {
      const v = arg.slice(2);
      return { type: Obj.Circle, v };
    }
    if (arg.length === 2) {
      return { type: Obj.Segment, v: arg };
    }
    if (arg.length === 1) {
      return { type: Obj.Point, v: arg };
    }
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
    expected:
      | "point"
      | "segment"
      | "angle"
      | "triangle"
      | "quadrilateral"
      | "circle",
    humanReadable: string,
  ) => {
    if (i >= tokens.length) return undefined;
    const t = tokens[i];
    if (!ProofParser.geomPremiseTokenTypes.has(t.type)) return undefined;
    if (t.type !== expected) {
      return this.parserError(
        "wrong_premise_type",
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
    if (/^[atqc]_/.test(v)) return v;
    return null;
  };

  private assertNoMalformedObjectIdentifier = (
    token: any,
    context: string,
  ): ParseError | undefined => {
    const malformed = this.asMalformedObjectIdentifier(token);
    if (malformed)
      return this.parserError(
        "malformed_identifier",
        `Malformed object '${malformed}' in ${context}: use 'a_' with 3 points, 't_' with 3 points, 'q_' with 4 points, or 'c_' with 2 points`,
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

  parse(input: string): ParseResult {
    this.lexer.reset(input);
    const tokens: any[] = [];
    let token;
    while ((token = this.lexer.next())) {
      if (token.type !== "ws" && token.type !== "nl") tokens.push(token);
    }
    const res = this.parseBasicStructure(tokens);
    return { ok: res.errors.length === 0, value: res, failure: res.errors };
  }

  private parsePointPlacement(
    tokens: any[],
    startIndex: number,
  ): {
    pt: [number, number];
    offsetCode: string;
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
    let parsedOffsetCode: string | null = null;
    if (
      i < tokens.length &&
      (tokens[i].type === "identifier" || tokens[i].type === "param_name")
    ) {
      parsedOffsetCode = String(tokens[i].value).toLowerCase();
      i++;
    }
    if (!parsedOffsetCode) return null;
    if (i >= tokens.length || tokens[i].type !== "rparen") return null;
    i++;
    return {
      pt: [x, y],
      offsetCode: parsedOffsetCode,
      endIndex: i,
    };
  }

  private parseBasicStructure(tokens: any[]): ProofObj {
    const result: ProofObj = {
      title: "",
      premises: {
        points: [],
        triangles: [],
        quadrilaterals: [],
        segments: [],
        angles: [],
        circles: [],
        diagramStatements: [],
      },
      steps: [],
      goal: undefined,
      errors: [],
      isCorrect: false,
    };
    const floatErrors = (e: ErrorDetails[]) => {
      e.forEach((err) => result.errors.push(err));
      return result;
    };
    const floatError = (e: ParseError) => {
      result.errors.push(e.failure);
      return result;
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
                const e0 = this.assertPremiseListHead(
                  tokens,
                  i,
                  "pt",
                  "point",
                  "single-letter points (then coordinates in parentheses)",
                );
                if (e0) return floatError(e0);
                while (i < tokens.length && tokens[i].type === "point") {
                  const pointLabel = tokens[i].value;
                  i++;
                  const placement = this.parsePointPlacement(tokens, i);
                  if (!placement)
                    return floatError(
                      this.parserError("missing_coordinates", pointLabel),
                    );
                  result.premises.points.push({
                    type: Obj.Point,
                    v: pointLabel,
                    pt: placement.pt,
                    offsetCode: placement.offsetCode,
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
                const e1 = this.assertPremiseListHead(
                  tokens,
                  i,
                  "tri",
                  "triangle",
                  "triangles (t_XYZ)",
                );
                if (e1) return floatError(e1);
                while (i < tokens.length && tokens[i].type === "triangle") {
                  const tri = this.parseObj(tokens[i].value as string);
                  if (tri) {
                    const err = this.checkObj(tri);
                    if (err) return floatError(err);
                    result.premises.triangles.push(tri);
                  }
                  i++;
                }
              }
            } else if (tokens[i].type === "quad") {
              i++;
              if (i < tokens.length && tokens[i].type === "colon") {
                i++;
                const e2 = this.assertPremiseListHead(
                  tokens,
                  i,
                  "quad",
                  "quadrilateral",
                  "quadrilaterals (q_WXYZ)",
                );
                if (e2) return floatError(e2);
                while (
                  i < tokens.length &&
                  tokens[i].type === "quadrilateral"
                ) {
                  const quad = this.parseObj(tokens[i].value as string);
                  if (quad) {
                    const err = this.checkObj(quad);
                    if (err) return floatError(err);
                    result.premises.quadrilaterals.push(quad);
                  }
                  i++;
                }
              }
            } else if (tokens[i].type === "seg") {
              i++;
              if (i < tokens.length && tokens[i].type === "colon") {
                i++;
                const e3 = this.assertPremiseListHead(
                  tokens,
                  i,
                  "seg",
                  "segment",
                  "segments (two capital letters, e.g. AB)",
                );
                if (e3) return floatError(e3);
                while (i < tokens.length && tokens[i].type === "segment") {
                  const seg = this.parseObj(tokens[i].value as string);
                  if (seg) {
                    const err = this.checkObj(seg);
                    if (err) return floatError(err);
                    result.premises.segments.push(seg);
                  }
                  i++;
                }
              }
            } else if (tokens[i].type === "ang") {
              i++;
              if (i < tokens.length && tokens[i].type === "colon") {
                i++;
                const e4 = this.assertPremiseListHead(
                  tokens,
                  i,
                  "ang",
                  "angle",
                  "angles (a_XYZ)",
                );
                if (e4) return floatError(e4);
                while (i < tokens.length && tokens[i].type === "angle") {
                  const ang = this.parseObj(tokens[i].value as string);
                  if (ang) {
                    const err = this.checkObj(ang);
                    if (err) return floatError(err);
                    result.premises.angles.push(ang);
                  }
                  i++;
                }
              }
            } else if (tokens[i].type === "circ") {
              i++;
              if (i < tokens.length && tokens[i].type === "colon") {
                i++;
                const e5 = this.assertPremiseListHead(
                  tokens,
                  i,
                  "circ",
                  "circle",
                  "circles (c_XY)",
                );
                if (e5) return floatError(e5);
                while (i < tokens.length && tokens[i].type === "circle") {
                  const circ = this.parseObj(tokens[i].value as string);
                  if (circ) {
                    const err = this.checkObj(circ);
                    if (err) return floatError(err);
                    result.premises.circles.push(circ);
                  }
                  i++;
                }
              }
            } else if (tokens[i].type === "diagramPremiseRef") {
              const diagramLabel = tokens[i].value as string;
              i++;
              const statement = this.parseStatement(tokens, i);
              if (statement.err.length > 0) return floatErrors(statement.err);
              result.premises.diagramStatements.push({
                type: "diagram",
                statement: statement.stmt,
                stepNumber: diagramLabel,
                errors: [],
              });
              i = statement.endIndex;
            } else if (tokens[i].type === "givenPremiseDefRef") {
              const premiseLabel = tokens[i].value as string;
              i++;
              const statement = this.parseStatement(tokens, i);
              if (statement.err.length > 0) return floatErrors(statement.err);
              result.steps.push({
                type: "given",
                statement: statement.stmt,
                stepNumber: premiseLabel,
                errors: [],
              });
              i = statement.endIndex;
            } else if (tokens[i].type === "rarrow") {
              // Goal statement in premises
              i++;
              const goal = this.parseStatement(tokens, i);
              if (goal.err.length > 0) return floatErrors(goal.err);
              result.goal = goal.stmt;
              i = goal.endIndex;
            } else if (ProofParser.geomPremiseTokenTypes.has(tokens[i].type)) {
              return floatError(
                this.parserError("unexpected_token", tokens[i].value as string),
              );
            } else if (
              tokens[i].type === "comma" ||
              tokens[i].type === "comment"
            ) {
              i++;
            } else {
              const e = this.assertNoMalformedObjectIdentifier(
                tokens[i],
                "premises",
              );
              if (e) return floatError(e);
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
              if (goal.err.length > 0) return floatErrors(goal.err);
              result.goal = goal.stmt;
              break;
            } else if (tokens[i].type === "stepNumber") {
              const label = tokens[i].value as string;
              i++;
              const step = this.parseProofStep(tokens, i, label);
              if (step.err.length > 0) return floatErrors(step.err);
              if (step.step) {
                result.steps.push(step.step);
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
  ): { stmt: Stmt; endIndex: number; err: ErrorDetails[] } {
    let i = startIndex;
    const res = {
      stmt: {
        function: "",
        arguments: [],
      } as Stmt,
      endIndex: i,
      err: [] as ErrorDetails[],
    };
    const floatError = (e: ParseError) => {
      res.err.push(e.failure);
      return res;
    };

    if (i < tokens.length && tokens[i].type === "stmt_function") {
      res.stmt.function = tokens[i].value;
      i++;
      if (i < tokens.length && tokens[i].type === "lparen") {
        i++;
        // Parse arguments
        while (i < tokens.length && tokens[i].type !== "rparen") {
          const e = this.assertNoMalformedObjectIdentifier(
            tokens[i],
            `statement '${res.stmt.function}' arguments`,
          );
          if (e) return floatError(e);
          if (tokens[i].type === "point") {
            // Check if this is part of a segment (two consecutive points)
            if (i + 1 < tokens.length && tokens[i + 1].type === "point") {
              const r = this.parseObj(tokens[i].value + tokens[i + 1].value);
              if (r) {
                const err = this.checkObj(r);
                if (err) return floatError(err);
                res.stmt.arguments.push(r);
              }
              i += 2;
            } else {
              const r = this.parseObj(tokens[i].value);
              if (r) {
                const err = this.checkObj(r);
                if (err) return floatError(err);
                res.stmt.arguments.push(r);
              }
              i++;
            }
          } else if (
            tokens[i].type === "segment" ||
            tokens[i].type === "angle" ||
            tokens[i].type === "triangle" ||
            tokens[i].type === "quadrilateral" ||
            tokens[i].type === "circle" ||
            tokens[i].type === "stepNumber"
          ) {
            const r = this.parseObj(tokens[i].value);
            if (r) {
              const err = this.checkObj(r);
              if (err) return floatError(err);
              res.stmt.arguments.push(r);
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

    if (res.stmt.function) {
      const isReason = this.reasonDefinitions.has(res.stmt.function);
      const isStatement = this.statementDefinitions.has(res.stmt.function);
      if (isReason && !isStatement) {
        return floatError(
          this.parserError("reason_as_statement", res.stmt.function),
        );
      }
      if (!isStatement) {
        return floatError(
          this.parserError("unknown_function", res.stmt.function),
        );
      }
    }

    return { ...res, endIndex: i };
  }

  /** Format: `[01] reason(1, 3, 2) -> conclusion` */
  private parseProofStep(
    tokens: any[],
    startIndex: number,
    stepLabel: string,
  ): { step?: ProofStep; endIndex: number; err: ErrorDetails[] } {
    const res = {
      endIndex: startIndex,
      err: [] as ErrorDetails[],
    };
    const reason = this.parseReason(tokens, startIndex);
    if (reason.err.length > 0) return reason;
    if (reason.reason.function && tokens[reason.endIndex]?.type === "rarrow") {
      const i = reason.endIndex + 1;
      const conclusion = this.parseStatement(tokens, i);
      if (conclusion.err.length > 0) return conclusion;
      if (conclusion.stmt.function) {
        return {
          ...res,
          step: this.makeProofStep(stepLabel, {
            reason: reason.reason,
            statement: conclusion.stmt,
          }),
          endIndex: conclusion.endIndex,
        };
      }
    }

    // If the line starts with a known reason, keep it as reason only — do not let
    // parseStatement treat e.g. sas(1,2,3) or sas(1,2,3) -> as a statement.
    if (reason.reason.function) {
      return {
        ...res,
        step: this.makeProofStep(stepLabel, { reason: reason.reason }),
        endIndex: reason.endIndex,
      };
    }

    // Incomplete step: statement without reason, e.g. `[05] con_seg(AB,CD)`.
    const statementOnly = this.parseStatement(tokens, startIndex);
    if (statementOnly.err.length > 0) return statementOnly;
    if (statementOnly.stmt.function) {
      return {
        ...res,
        step: this.makeProofStep(stepLabel, {
          statement: statementOnly.stmt,
        }),
        endIndex: statementOnly.endIndex,
      };
    }
    return res;
  }

  private parseReason(
    tokens: any[],
    startIndex: number,
  ): { reason: Reason; endIndex: number; err: ErrorDetails[] } {
    let i = startIndex;
    const res = {
      reason: {
        function: "",
        arguments: [],
      } as Reason,
      endIndex: i,
      err: [] as ErrorDetails[],
    };

    const floatError = (e: ErrorDetails) => {
      res.err.push(e);
      return res;
    };

    if (
      i < tokens.length &&
      tokens[i].type === "stmt_function" &&
      this.isReasonFunction(tokens[i].value)
    ) {
      res.reason.function = tokens[i].value;
      i++;
      if (i < tokens.length && tokens[i].type === "lparen") {
        i++;
        // Parse arguments
        while (i < tokens.length && tokens[i].type !== "rparen") {
          const e = this.assertNoMalformedObjectIdentifier(
            tokens[i],
            `reason '${res.reason.function}' arguments`,
          );
          if (e) return floatError(e.failure);
          if (
            tokens[i].type === "givenPremiseRef" ||
            tokens[i].type === "diagramPremiseRef"
          ) {
            res.reason.arguments.push(tokens[i].value as string);
            i++;
          } else if (tokens[i].type === "float_literal") {
            const value = tokens[i].value as string;
            if (/^\d+$/.test(value)) {
              res.reason.arguments.push(this.normalizeNumericRef(value));
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

    return { ...res, endIndex: i };
  }

  private isReasonFunction(functionName: string): boolean {
    // Check if the function name exists in the loaded reason definitions
    return this.reasonDefinitions.has(functionName);
  }
}
