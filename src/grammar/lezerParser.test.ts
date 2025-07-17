import { ProofParser } from "./lezerParser";

describe("ProofParser", () => {
  let parser: ProofParser;

  beforeEach(() => {
    parser = new ProofParser();
  });

  describe("basic proof structure", () => {
    test("parses title section", () => {
      const input = `title: "Simple Proof"
premises:
pt: A, B, C
steps:`;

      const result = parser.parse(input);
      expect(result.title).toBe("Simple Proof");
    });

    test("parses premises with points", () => {
      const input = `title: "Test Proof"
premises:
pt: A, B, C, D
steps:`;

      const result = parser.parse(input);
      expect(result.premises.points).toEqual(["A", "B", "C", "D"]);
    });

    test("parses premises with triangles", () => {
      const input = `title: "Test Proof"
premises:
pt: A, B, C
tri: t_ABC t_DEF
steps:`;

      const result = parser.parse(input);
      expect(result.premises.triangles).toEqual(["t_ABC", "t_DEF"]);
    });
  });

  describe("step parsing", () => {
    test("parses given statements", () => {
      const input = `title: "Test Proof"
premises:
pt: A, B, C
steps:
c(AB,AD) [01]
c(a_BAC,a_DAC) [02]`;

      const result = parser.parse(input);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0]).toEqual({
        type: "given",
        function: "c",
        arguments: ["AB", "AD"],
        stepNumber: "[01]",
        endIndex: expect.any(Number),
      });
      expect(result.steps[1]).toEqual({
        type: "given",
        function: "c",
        arguments: ["a_BAC", "a_DAC"],
        stepNumber: "[02]",
        endIndex: expect.any(Number),
      });
    });

    test("parses goal statement", () => {
      const input = `title: "Test Proof"
premises:
pt: A, B, C
steps:
c(AB,AD) [01]
-> c(t_ABC,t_ADC)`;

      const result = parser.parse(input);
      expect(result.steps).toHaveLength(2);
      expect(result.steps[1]).toEqual({
        type: "goal",
        statement: {
          function: "c",
          arguments: ["t_ABC", "t_ADC"],
          stepNumber: null,
          endIndex: expect.any(Number),
        },
      });
    });

    test("parses proof steps with reasons", () => {
      const input = `title: "Test Proof"
premises:
pt: A, B, C
steps:
c(AB,AD) [01]
c(a_BAC,a_DAC) [02]
reflex() -> c(AC, AC) [03]
sas([01], [02], [03]) -> c(t_ABC,t_ADC) [04]`;

      const result = parser.parse(input);
      expect(result.steps).toHaveLength(4);

      // Check the proof step
      expect(result.steps[2]).toEqual({
        type: "proof",
        reason: {
          function: "reflex",
          arguments: [],
          endIndex: expect.any(Number),
        },
        conclusion: {
          function: "c",
          arguments: ["AC", "AC"],
          stepNumber: "[03]",
          endIndex: expect.any(Number),
        },
        endIndex: expect.any(Number),
      });

      expect(result.steps[3]).toEqual({
        type: "proof",
        reason: {
          function: "sas",
          arguments: ["[01]", "[02]", "[03]"],
          endIndex: expect.any(Number),
        },
        conclusion: {
          function: "c",
          arguments: ["t_ABC", "t_ADC"],
          stepNumber: "[04]",
          endIndex: expect.any(Number),
        },
        endIndex: expect.any(Number),
      });
    });
  });

  describe("complex proof example", () => {
    test("parses complete proof from gemini.md", () => {
      const input = `title: "Prove Triangles Congruent (correct)"
premises:
pt: A, B, C, D
tri: t_ABC t_ADC
c(AB,AD) [01] // c = congruent
c(a_BAC,a_DAC) [02] // a prefix = object is angle
-> c(t_ABC,t_ADC)

steps:
reflex() -> c(AC, AC) [03]
sas([01], [02], [03]) -> c(t_ABC,t_ADC) [04]`;

      const result = parser.parse(input);

      expect(result.title).toBe("Prove Triangles Congruent (correct)");
      expect(result.premises.points).toEqual(["A", "B", "C", "D"]);
      expect(result.premises.triangles).toEqual(["t_ABC", "t_ADC"]);

      // Should have 2 given statements, 1 goal, and 2 proof steps
      expect(result.steps).toHaveLength(5);

      // Check given statements
      expect(result.steps[0]).toEqual({
        type: "given",
        function: "c",
        arguments: ["AB", "AD"],
        stepNumber: "[01]",
        endIndex: expect.any(Number),
      });

      expect(result.steps[1]).toEqual({
        type: "given",
        function: "c",
        arguments: ["a_BAC", "a_DAC"],
        stepNumber: "[02]",
        endIndex: expect.any(Number),
      });

      // Check goal
      expect(result.steps[2]).toEqual({
        type: "goal",
        statement: {
          function: "c",
          arguments: ["t_ABC", "t_ADC"],
          stepNumber: null,
          endIndex: expect.any(Number),
        },
      });

      // Check proof steps
      expect(result.steps[3].type).toBe("proof");
      expect(result.steps[3].reason.function).toBe("reflex");
      expect(result.steps[3].conclusion.function).toBe("c");
      expect(result.steps[3].conclusion.arguments).toEqual(["AC", "AC"]);

      expect(result.steps[4].type).toBe("proof");
      expect(result.steps[4].reason.function).toBe("sas");
      expect(result.steps[4].reason.arguments).toEqual([
        "[01]",
        "[02]",
        "[03]",
      ]);
      expect(result.steps[4].conclusion.function).toBe("c");
      expect(result.steps[4].conclusion.arguments).toEqual(["t_ABC", "t_ADC"]);
    });
  });

  describe("error handling", () => {
    test("handles malformed input gracefully", () => {
      const input = `title: "Test"
premises:
pt: A, B
steps:
invalid syntax here`;

      const result = parser.parse(input);
      expect(result.title).toBe("Test");
      expect(result.premises.points).toEqual(["A", "B"]);
      // Should not crash and should parse what it can
    });

    test("handles empty input", () => {
      const input = "";
      const result = parser.parse(input);
      expect(result.title).toBeNull();
      expect(result.premises.points).toEqual([]);
      expect(result.steps).toEqual([]);
    });
  });
});
