const moo = require("moo");
const { reasonKeywords } = require("./parser");

describe("reasonKeywords moo tokenizer", () => {
  function tokenize(input) {
    const lexer = moo.compile(reasonKeywords);
    lexer.reset(input);
    const tokens = [];
    let token;
    while ((token = lexer.next())) {
      if (
        token.type !== "ws" &&
        token.type !== "nl" &&
        token.type !== "comment"
      ) {
        tokens.push(token);
      }
    }
    return tokens;
  }

  test("debug: print tokens for reason given()", () => {
    const input = "reason given()";
    const lexer = moo.compile(reasonKeywords);
    lexer.reset(input);
    let token;
    const tokens = [];
    try {
      while ((token = lexer.next())) {
        tokens.push(token);
      }
    } catch (error) {
      console.log("Error:", error.message);
      console.log("Input:", input);
      console.log("Error position:", lexer.index);
      console.log("Character at error:", input[lexer.index]);
      console.log("Tokens so far:", tokens);
    }
    console.log("All tokens:", tokens);
    expect(tokens.length).toBeGreaterThan(0);
  });

  test("tokenizes reason with no requirements or conclusions", () => {
    const input = "reason given()";
    const tokens = tokenize(input);
    expect(tokens.map((t) => t.type)).toEqual([
      "reason",
      "reason_function",
      "lparen",
      "rparen",
    ]);
    expect(tokens[1].value).toBe("given");
  });

  test("tokenizes reason with requirements and multiple conclusions", () => {
    const input = "reason reflex() -> reflex, con_seg";
    const tokens = tokenize(input);
    expect(tokens.map((t) => t.type)).toEqual([
      "reason",
      "reason_function",
      "lparen",
      "rparen",
      "rarrow",
      "stmt_name",
      "comma",
      "stmt_name",
    ]);
    expect(tokens[1].value).toBe("reflex");
    expect(tokens[5].value).toBe("reflex");
    expect(tokens[7].value).toBe("con_seg");
  });

  test("tokenizes reason with multiple requirements and single conclusion", () => {
    const input = "reason sss(con_seg, con_ang, con_seg) -> con_tri";
    const tokens = tokenize(input);
    expect(tokens.map((t) => t.type)).toEqual([
      "reason",
      "reason_function",
      "lparen",
      "stmt_name",
      "comma",
      "stmt_name",
      "comma",
      "stmt_name",
      "rparen",
      "rarrow",
      "stmt_name",
    ]);
    expect(tokens[1].value).toBe("sss");
    expect(tokens[3].value).toBe("con_seg");
    expect(tokens[5].value).toBe("con_ang");
    expect(tokens[7].value).toBe("con_seg");
    expect(tokens[10].value).toBe("con_tri");
  });

  test("tokenizes reason with underscores and numbers in names", () => {
    const input = "reason vert_ang(intersect_seg) -> con_ang";
    const tokens = tokenize(input);
    expect(tokens.map((t) => t.type)).toEqual([
      "reason",
      "reason_function",
      "lparen",
      "stmt_name",
      "rparen",
      "rarrow",
      "stmt_name",
    ]);
    expect(tokens[1].value).toBe("vert_ang");
    expect(tokens[3].value).toBe("intersect_seg");
    expect(tokens[6].value).toBe("con_ang");
  });

  test("tokenizes reason with multiple conclusions", () => {
    const input = "reason cpctc(con_tri) -> con_seg, con_ang";
    const tokens = tokenize(input);
    expect(tokens.map((t) => t.type)).toEqual([
      "reason",
      "reason_function",
      "lparen",
      "stmt_name",
      "rparen",
      "rarrow",
      "stmt_name",
      "comma",
      "stmt_name",
    ]);
    expect(tokens[1].value).toBe("cpctc");
    expect(tokens[3].value).toBe("con_tri");
    expect(tokens[6].value).toBe("con_seg");
    expect(tokens[8].value).toBe("con_ang");
  });

  test("tokenizes reason with no requirements and one conclusion", () => {
    const input = "reason reflex() -> reflex";
    const tokens = tokenize(input);
    expect(tokens.map((t) => t.type)).toEqual([
      "reason",
      "reason_function",
      "lparen",
      "rparen",
      "rarrow",
      "stmt_name",
    ]);
    expect(tokens[1].value).toBe("reflex");
    expect(tokens[5].value).toBe("reflex");
  });
});
