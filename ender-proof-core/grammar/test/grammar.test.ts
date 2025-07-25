import { lexer } from "../parser";

// Helper function to tokenize a string and return non-whitespace tokens
function tokenize(input: string) {
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

test("tokenizes basic single-parameter statements", () => {
  const input = `stmt reflex(Segment s)
stmt right(Angle a)`;

  const tokens = tokenize(input);

  // Test reflex statement
  const reflexTokens = tokens.slice(0, 6); // "stmt reflex(Segment s)"
  expect(reflexTokens[0].type).toBe("stmt");
  expect(reflexTokens[1].type).toBe("stmt_function");
  expect(reflexTokens[1].value).toBe("reflex");
  expect(reflexTokens[2].type).toBe("lparen");
  expect(reflexTokens[3].type).toBe("param_type");
  expect(reflexTokens[3].value).toBe("Segment");
  expect(reflexTokens[4].type).toBe("param_name");
  expect(reflexTokens[4].value).toBe("s");
  expect(reflexTokens[5].type).toBe("rparen");

  // Test right statement
  const rightTokens = tokens.slice(6, 12); // "stmt right(Angle a)"
  expect(rightTokens[0].type).toBe("stmt");
  expect(rightTokens[1].type).toBe("stmt_function");
  expect(rightTokens[1].value).toBe("right");
  expect(rightTokens[2].type).toBe("lparen");
  expect(rightTokens[3].type).toBe("param_type");
  expect(rightTokens[3].value).toBe("Angle");
  expect(rightTokens[4].type).toBe("param_name");
  expect(rightTokens[4].value).toBe("a");
  expect(rightTokens[5].type).toBe("rparen");
});

test("tokenizes congruence statements with two parameters", () => {
  const input = `stmt con_seg(Segment s1, Segment s2)
stmt con_ang(Angle a1, Angle a2)
stmt con_tri(Triangle t1, Triangle t2)`;

  const tokens = tokenize(input);

  // Debug: log the actual tokens to see the structure
  console.log(
    "Congruence tokens:",
    tokens.map((t) => ({ type: t.type, value: t.value }))
  );

  // Test con_seg statement
  const conSegTokens = tokens.slice(0, 11); // "stmt con_seg(Segment s1, Segment s2)"
  expect(conSegTokens[0].type).toBe("stmt");
  expect(conSegTokens[1].type).toBe("stmt_function");
  expect(conSegTokens[1].value).toBe("con_seg");
  expect(conSegTokens[2].type).toBe("lparen");
  expect(conSegTokens[3].type).toBe("param_type");
  expect(conSegTokens[3].value).toBe("Segment");
  expect(conSegTokens[4].type).toBe("param_name");
  expect(conSegTokens[4].value).toBe("s1");
  expect(conSegTokens[5].type).toBe("comma");
  expect(conSegTokens[6].type).toBe("param_type");
  expect(conSegTokens[6].value).toBe("Segment");
  expect(conSegTokens[7].type).toBe("param_name");
  expect(conSegTokens[7].value).toBe("s2");
  expect(conSegTokens[8].type).toBe("rparen");

  // Test con_ang statement - find it in the token stream
  const conAngIndex = tokens.findIndex(
    (t) => t.type === "stmt_function" && t.value === "con_ang"
  );
  expect(conAngIndex).toBeGreaterThan(-1);
  expect(tokens[conAngIndex].type).toBe("stmt_function");
  expect(tokens[conAngIndex].value).toBe("con_ang");

  // Test con_tri statement - find it in the token stream
  const conTriIndex = tokens.findIndex(
    (t) => t.type === "stmt_function" && t.value === "con_tri"
  );
  expect(conTriIndex).toBeGreaterThan(-1);
  expect(tokens[conTriIndex].type).toBe("stmt_function");
  expect(tokens[conTriIndex].value).toBe("con_tri");
});

test("tokenizes similarity statements with multiple parameters", () => {
  const input = `stmt sim_seg(Segment s1, Segment s2, Segment s3, Segment s4)
stmt sim_tri(Triangle t1, Triangle t2)`;

  const tokens = tokenize(input);

  // Debug: log the actual tokens to see the structure
  console.log(
    "Similarity tokens:",
    tokens.map((t) => ({ type: t.type, value: t.value }))
  );

  // Test sim_seg statement - find it in the token stream
  const simSegIndex = tokens.findIndex(
    (t) => t.type === "stmt_function" && t.value === "sim_seg"
  );
  expect(simSegIndex).toBeGreaterThan(-1);
  expect(tokens[simSegIndex].type).toBe("stmt_function");
  expect(tokens[simSegIndex].value).toBe("sim_seg");

  // Test sim_tri statement - find it in the token stream
  const simTriIndex = tokens.findIndex(
    (t) => t.type === "stmt_function" && t.value === "sim_tri"
  );
  expect(simTriIndex).toBeGreaterThan(-1);
  expect(tokens[simTriIndex].type).toBe("stmt_function");
  expect(tokens[simTriIndex].value).toBe("sim_tri");

  // Test that we have the expected parameter types and names
  const paramTypeTokens = tokens.filter((t) => t.type === "param_type");
  const paramNameTokens = tokens.filter((t) => t.type === "param_name");

  // Should have 6 parameter types (4 for sim_seg, 2 for sim_tri)
  expect(paramTypeTokens).toHaveLength(6);
  expect(paramTypeTokens.filter((t) => t.value === "Segment")).toHaveLength(4);
  expect(paramTypeTokens.filter((t) => t.value === "Triangle")).toHaveLength(2);

  // Should have 6 parameter names
  expect(paramNameTokens).toHaveLength(6);
  expect(paramNameTokens.some((t) => t.value === "s1")).toBe(true);
  expect(paramNameTokens.some((t) => t.value === "s2")).toBe(true);
  expect(paramNameTokens.some((t) => t.value === "s3")).toBe(true);
  expect(paramNameTokens.some((t) => t.value === "s4")).toBe(true);
  expect(paramNameTokens.some((t) => t.value === "t1")).toBe(true);
  expect(paramNameTokens.some((t) => t.value === "t2")).toBe(true);
});

test("tokenizes geometric relationship statements", () => {
  const input = `stmt para(Segment s1, Segment s2)
stmt perp(Segment s1, Segment s2)
stmt collinear(Point p1, Point p2, Point p3)`;

  const tokens = tokenize(input);

  // Debug: log the actual tokens to see the structure
  console.log(
    "Geometric tokens:",
    tokens.map((t) => ({ type: t.type, value: t.value }))
  );

  // Test para statement - find it in the token stream
  const paraIndex = tokens.findIndex(
    (t) => t.type === "stmt_function" && t.value === "para"
  );
  expect(paraIndex).toBeGreaterThan(-1);
  expect(tokens[paraIndex].type).toBe("stmt_function");
  expect(tokens[paraIndex].value).toBe("para");

  // Test perp statement - find it in the token stream
  const perpIndex = tokens.findIndex(
    (t) => t.type === "stmt_function" && t.value === "perp"
  );
  expect(perpIndex).toBeGreaterThan(-1);
  expect(tokens[perpIndex].type).toBe("stmt_function");
  expect(tokens[perpIndex].value).toBe("perp");

  // Test collinear statement - find it in the token stream
  const collinearIndex = tokens.findIndex(
    (t) => t.type === "stmt_function" && t.value === "collinear"
  );
  expect(collinearIndex).toBeGreaterThan(-1);
  expect(tokens[collinearIndex].type).toBe("stmt_function");
  expect(tokens[collinearIndex].value).toBe("collinear");

  // Test that we have the expected parameter types and names
  const paramTypeTokens = tokens.filter((t) => t.type === "param_type");
  const paramNameTokens = tokens.filter((t) => t.type === "param_name");

  // Should have 7 parameter types (2 for para, 2 for perp, 3 for collinear)
  expect(paramTypeTokens).toHaveLength(7);
  expect(paramTypeTokens.filter((t) => t.value === "Segment")).toHaveLength(4);
  expect(paramTypeTokens.filter((t) => t.value === "Point")).toHaveLength(3);

  // Should have 7 parameter names
  expect(paramNameTokens).toHaveLength(7);
  expect(paramNameTokens.filter((t) => t.value === "s1")).toHaveLength(2);
  expect(paramNameTokens.filter((t) => t.value === "s2")).toHaveLength(2);
  expect(paramNameTokens.some((t) => t.value === "p1")).toBe(true);
  expect(paramNameTokens.some((t) => t.value === "p2")).toBe(true);
  expect(paramNameTokens.some((t) => t.value === "p3")).toBe(true);
});

test("tokenizes mixed parameter type statements", () => {
  const input = `stmt midpoint(Segment s, Point p)`;

  const tokens = tokenize(input);

  // Test midpoint statement with mixed parameter types
  expect(tokens[0].type).toBe("stmt");
  expect(tokens[1].type).toBe("stmt_function");
  expect(tokens[1].value).toBe("midpoint");
  expect(tokens[2].type).toBe("lparen");
  expect(tokens[3].type).toBe("param_type");
  expect(tokens[3].value).toBe("Segment");
  expect(tokens[4].type).toBe("param_name");
  expect(tokens[4].value).toBe("s");
  expect(tokens[5].type).toBe("comma");
  expect(tokens[6].type).toBe("param_type");
  expect(tokens[6].value).toBe("Point");
  expect(tokens[7].type).toBe("param_name");
  expect(tokens[7].value).toBe("p");
  expect(tokens[8].type).toBe("rparen");
});

test("tokenizes edge case with 'intersect' parameter name", () => {
  const input = `stmt intersect_seg(Segment s1, Segment s2, Point intersect)`;

  const tokens = tokenize(input);

  // Test intersect_seg statement with 'intersect' as parameter name
  expect(tokens[0].type).toBe("stmt");
  expect(tokens[1].type).toBe("stmt_function");
  expect(tokens[1].value).toBe("intersect_seg");
  expect(tokens[2].type).toBe("lparen");
  expect(tokens[3].type).toBe("param_type");
  expect(tokens[3].value).toBe("Segment");
  expect(tokens[4].type).toBe("param_name");
  expect(tokens[4].value).toBe("s1");
  expect(tokens[5].type).toBe("comma");
  expect(tokens[6].type).toBe("param_type");
  expect(tokens[6].value).toBe("Segment");
  expect(tokens[7].type).toBe("param_name");
  expect(tokens[7].value).toBe("s2");
  expect(tokens[8].type).toBe("comma");
  expect(tokens[9].type).toBe("param_type");
  expect(tokens[9].value).toBe("Point");
  expect(tokens[10].type).toBe("param_name");
  expect(tokens[10].value).toBe("intersect");
  expect(tokens[11].type).toBe("rparen");
});

test("tokenizes all parameter types correctly", () => {
  const input = `stmt test(Segment s, Angle a, Triangle t, Point p)`;

  const tokens = tokenize(input);

  // Test that all parameter types are recognized
  const paramTypeTokens = tokens.filter((t) => t.type === "param_type");
  expect(paramTypeTokens).toHaveLength(4);
  expect(paramTypeTokens[0].value).toBe("Segment");
  expect(paramTypeTokens[1].value).toBe("Angle");
  expect(paramTypeTokens[2].value).toBe("Triangle");
  expect(paramTypeTokens[3].value).toBe("Point");
});

test("tokenizes parameter names with numbers correctly", () => {
  const input = `stmt test(Segment s1, Segment s2, Segment s10, Segment s42)`;

  const tokens = tokenize(input);

  // Test that parameter names with numbers are recognized
  const paramNameTokens = tokens.filter((t) => t.type === "param_name");
  expect(paramNameTokens).toHaveLength(4);
  expect(paramNameTokens[0].value).toBe("s1");
  expect(paramNameTokens[1].value).toBe("s2");
  expect(paramNameTokens[2].value).toBe("s10");
  expect(paramNameTokens[3].value).toBe("s42");
});

test("tokenizes statement function names with underscores correctly", () => {
  const input = `stmt con_seg(Segment s)
stmt con_ang(Angle a)
stmt con_tri(Triangle t)
stmt con_right(Angle a)
stmt sim_seg(Segment s)
stmt sim_tri(Triangle t)
stmt intersect_seg(Segment s)`;

  const tokens = tokenize(input);

  // Test that function names with underscores are recognized
  const stmtFunctionTokens = tokens.filter((t) => t.type === "stmt_function");
  expect(stmtFunctionTokens).toHaveLength(7);
  expect(stmtFunctionTokens[0].value).toBe("con_seg");
  expect(stmtFunctionTokens[1].value).toBe("con_ang");
  expect(stmtFunctionTokens[2].value).toBe("con_tri");
  expect(stmtFunctionTokens[3].value).toBe("con_right");
  expect(stmtFunctionTokens[4].value).toBe("sim_seg");
  expect(stmtFunctionTokens[5].value).toBe("sim_tri");
  expect(stmtFunctionTokens[6].value).toBe("intersect_seg");
});
