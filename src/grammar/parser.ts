import moo from "moo";

export const basicSymbols: moo.Rules = {
  ws: /[ \t]+/,
  nl: { match: /\r\n|\r|\n/, lineBreaks: true },
  rarrow: "->",
  lparen: "(",
  rparen: ")",
  comma: ",",
  float_literal:
    /[+-]?(?:\d+(?:[.]\d*)?(?:[eE][+-]?\d+)?|[.]\d+(?:[eE][+-]?\d+)?)/,
  comment: /\/\/.*?$/,
  multiline_comment: {
    match: /\/\*(?:[\s\S]*?)\*\//,
    lineBreaks: true,
  },
  dot: ".",
  lbracket: "[",
  rbracket: "]",
  lbrace: "{",
  rbrace: "}",
  assignment: "=",
  plus: "+",
  exp: "^",
  minus: "-",
  multiply: "*",
  divide: "/",
  colon: ":",
  semi: ";",
  question: "?",
};

const reasonKeywords: moo.Rules = {
  // Whitespace
  ws: /[ \t]+/,

  // Reason keyword
  reason: "reason",

  // Reason function names: start with a letter or underscore, may contain numbers/underscores, and are immediately followed by '('
  reason_function: {
    match: /[A-Za-z_][A-Za-z0-9_]*(?=\()/,
    value: (x: string) => x,
  },

  // Symbols for structure
  lparen: "(",
  rparen: ")",
  comma: ",",
  rarrow: "->",

  // Statement names in requirements and conclusions: lowercase, may include underscores and numbers
  stmt_name: {
    match: /[a-z][a-z0-9_]*/,
    value: (x: string) => x,
  },
};

const stmtKeywords: moo.Rules = {
  // Statement keyword
  stmt: "stmt",

  // Statement function names: start with a letter (upper/lower), may contain underscores or capital letters, and are immediately followed by '('.
  stmt_function: {
    match: /[A-Za-z_][A-Za-z0-9_]*?(?=\()/,
    value: (x: string) => x,
  },

  // Parameter names: lowercase with optional numbers, or 'intersect', only if followed by ',' or ')' (optionally with whitespace)
  param_name: {
    match: /(?:[a-z][a-z0-9]*|intersect)(?=\s*[,)])/,
    value: (x: string) => x,
  },

  // Parameter types (capitalized)
  param_type: /Segment|Angle|Triangle|Point/,
};

const proofKeywords: moo.Rules = {
  ...basicSymbols,
  stepNumber: /\[0*(?:\d+)\]/,
  triangle: /^t_(?:[A-Z]{3})$/,
  angle: /^a_(?:[A-Z]{3})$/,
  segment: /^(?:[A-Z]{2})$/,
  point: /^(?:[A-Z]{1})$/,
  coordinate: /^\(-?(?:\d+(?:\.\d+)?),\s*-?(?:\d+(?:\.\d+)?)\)$/,
};

const lexer = moo.compile({
  ...basicSymbols,
  ...stmtKeywords,
  ...proofKeywords,
  identifier: {
    match: /[A-z_][A-Za-z_0-9]*/,
    type: moo.keywords({
      // NOTE: the next line add type annotation keywords into the keyword set and thereby forbidding users to use keywords like `shape`
      // "type-keyword": styleTypes,
      title: "title",
      premises: "premises",
      auxiliary: "auxiliary",
      steps: "steps",
      points: "pt",
      triangles: "tri",
      segments: "seg",
      angles: "ang",
    }),
  },
});

// Export the lexer for testing
export { lexer, reasonKeywords };

// Basic parser object for compatibility with existing tests
export const parser = {
  parse: (input: string) => {
    lexer.reset(input);
    return {
      topNode: {
        getChild: (name: string) => {
          // Simple mock implementation for existing tests
          return name === "Title" || name === "Premises" || name === "Steps"
            ? { type: name }
            : null;
        },
      },
    };
  },
};
