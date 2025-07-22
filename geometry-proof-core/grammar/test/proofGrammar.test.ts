const moo = require("moo");
const { proofKeywords } = require("./parser");

describe("proofKeywords moo tokenizer", () => {
  const simpleProof = `
title: "Simple Proof"
premises:
pt: A, B, C
tri: t_ABC
// This is a comment
steps:
// Another comment
`;

  function tokenize(input) {
    const lexer = moo.compile(proofKeywords);
    lexer.reset(input);
    const tokens = [];
    let token;
    while ((token = lexer.next())) {
      if (token.type !== "ws" && token.type !== "nl") {
        tokens.push(token);
      }
    }
    return tokens;
  }

  test("tokenizes proof structure keywords", () => {
    const tokens = tokenize(simpleProof);
    const types = tokens.map((t) => t.type);
    expect(types).toContain("title");
    expect(types).toContain("premises");
    expect(types).toContain("steps");
    expect(types).toContain("pt");
    expect(types).toContain("tri");
  });

  test("tokenizes comments", () => {
    const tokens = tokenize(simpleProof);
    const comments = tokens.filter((t) => t.type === "comment");
    expect(comments.length).toBeGreaterThan(0);
    expect(comments[0].value).toContain("This is a comment");
  });

  test("tokenizes geometric objects", () => {
    const tokens = tokenize(simpleProof);
    expect(
      tokens.some((t) => t.type === "triangle" && t.value === "t_ABC")
    ).toBe(true);
    expect(tokens.some((t) => t.type === "point" && t.value === "A")).toBe(
      true
    );
    expect(tokens.some((t) => t.type === "point" && t.value === "B")).toBe(
      true
    );
    expect(tokens.some((t) => t.type === "point" && t.value === "C")).toBe(
      true
    );
  });

  test("tokenizes quoted strings", () => {
    const tokens = tokenize(simpleProof);
    const quotedStrings = tokens.filter((t) => t.type === "quoted_string");
    expect(quotedStrings.length).toBeGreaterThan(0);
    expect(quotedStrings[0].value).toBe("Simple Proof");
  });
});
