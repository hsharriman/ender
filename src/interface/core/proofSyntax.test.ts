import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";
import { ProofTokenKind, tokenizeProofLine } from "./proofSyntax";

const kinds = (line: string) =>
  tokenizeProofLine(line)
    .filter((t) => t.kind !== "plain")
    .map((t) => [t.kind, t.text] as [ProofTokenKind, string]);

describe("tokenizeProofLine", () => {
  test("section and declaration keywords", () => {
    expect(kinds('title: "Tutorial #1"')).toEqual([
      ["keyword", "title:"],
      ["string", '"Tutorial #1"'],
    ]);
    expect(kinds("premises:")).toEqual([["keyword", "premises:"]]);
    expect(kinds("steps:")).toEqual([["keyword", "steps:"]]);
  });

  test("point declarations color labels, not coordinates", () => {
    expect(kinds("pt: A (5.5, 9, t), B (2, 3, l)")).toEqual([
      ["keyword", "pt:"],
      ["point", "A"],
      ["point", "B"],
    ]);
  });

  test("object declarations", () => {
    expect(kinds("seg: AB")).toEqual([
      ["keyword", "seg:"],
      ["object", "AB"],
    ]);
    expect(kinds("quad: q_ABCD")).toEqual([
      ["keyword", "quad:"],
      ["object", "q_ABCD"],
    ]);
  });

  test("premise statements and goal", () => {
    expect(kinds("[d_01] intersect_seg(AB,CD,M)")).toEqual([
      ["stepId", "[d_01]"],
      ["statement", "intersect_seg"],
      ["object", "AB"],
      ["object", "CD"],
      ["point", "M"],
    ]);
    expect(kinds("-> con_tri(t_ABC,t_ADC)")).toEqual([
      ["statement", "con_tri"],
      ["object", "t_ABC"],
      ["object", "t_ADC"],
    ]);
  });

  test("steps split reason from statement", () => {
    expect(
      kinds("[04] sas(1, 3, 2) -> con_tri(t_ABD,t_CDB)  // Missing dependency"),
    ).toEqual([
      ["stepId", "[04]"],
      ["reason", "sas"],
      ["stepId", "1"],
      ["stepId", "3"],
      ["stepId", "2"],
      ["statement", "con_tri"],
      ["object", "t_ABD"],
      ["object", "t_CDB"],
      ["comment", "// Missing dependency"],
    ]);
    expect(kinds("[01] given(g_1) -> con_seg(AB,AD)")).toEqual([
      ["stepId", "[01]"],
      ["reason", "given"],
      ["stepId", "g_1"],
      ["statement", "con_seg"],
      ["object", "AB"],
      ["object", "AD"],
    ]);
  });

  test("round-trips every line of every sample proof", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : p.endsWith(".txt") ? [p] : [];
      });
    for (const file of walk(join(__dirname, "../../checker/proofs"))) {
      for (const line of readFileSync(file, "utf8").split("\n")) {
        expect(tokenizeProofLine(line).map((t) => t.text).join("")).toBe(line);
      }
    }
  });
});
