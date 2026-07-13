import { readFileSync } from "fs";
import { join } from "path";
import { Obj } from "geometry-object";
import { runProofCheckerFromText } from "../../../proofChecker";
import { Stmt } from "../../../types/checkerTypes";
import { canonicalKey } from "../canonical";
import { FactIndex } from "../factIndex";

const S1C1 = join(__dirname, "../../../proofs/tests/examples/s1c1.txt");

const seg = (v: string) => ({ type: Obj.Segment, v }) as const;
const ang = (v: string) => ({ type: Obj.Angle, v }) as const;
const tri = (v: string) => ({ type: Obj.Triangle, v }) as const;

const stmt = (fn: string, args: Array<{ type: any; v: string }>): Stmt => ({
  function: fn,
  arguments: args as Stmt["arguments"],
});

describe("canonicalKey", () => {
  const { ctx } = runProofCheckerFromText(readFileSync(S1C1, "utf-8"));

  test("segment order and argument order are normalized", () => {
    const a = canonicalKey(stmt("con_seg", [seg("AM"), seg("BM")]), ctx);
    const b = canonicalKey(stmt("con_seg", [seg("MB"), seg("MA")]), ctx);
    expect(a).toBe(b);
  });

  test("asymmetric statements keep argument order", () => {
    const a = canonicalKey(stmt("seg_bisect", [seg("AB"), seg("CD")]), ctx);
    const b = canonicalKey(stmt("seg_bisect", [seg("CD"), seg("AB")]), ctx);
    expect(a).not.toBe(b);
  });

  test("angle overlap variants merge (CAB ≡ CAM)", () => {
    // M lies on segment AB, so ray A→M and ray A→B name the same angle.
    const a = canonicalKey(stmt("con_ang", [ang("CAM"), ang("DBM")]), ctx);
    const b = canonicalKey(stmt("con_ang", [ang("CAB"), ang("DBA")]), ctx);
    expect(a).toBe(b);
  });

  test("triangle pair swap and vertex permutations merge", () => {
    const a = canonicalKey(stmt("con_tri", [tri("ACM"), tri("BDM")]), ctx);
    const b = canonicalKey(stmt("con_tri", [tri("BDM"), tri("ACM")]), ctx);
    const c = canonicalKey(stmt("con_tri", [tri("CAM"), tri("DBM")]), ctx);
    expect(a).toBe(b);
    expect(a).toBe(c);
  });

  test("different facts stay distinct", () => {
    const a = canonicalKey(stmt("con_seg", [seg("AM"), seg("BM")]), ctx);
    const b = canonicalKey(stmt("con_seg", [seg("CM"), seg("DM")]), ctx);
    expect(a).not.toBe(b);
  });
});

describe("FactIndex", () => {
  const { ctx } = runProofCheckerFromText(readFileSync(S1C1, "utf-8"));

  test("deduplicates semantically identical facts", () => {
    const index = new FactIndex(ctx);
    const first = index.add("1", stmt("con_seg", [seg("AM"), seg("BM")]));
    const dupe = index.add("2", stmt("con_seg", [seg("MB"), seg("MA")]));
    expect(first.added).toBe(true);
    expect(dupe.added).toBe(false);
    expect(dupe.record.ref).toBe("1");
    expect(index.size()).toBe(1);
  });

  test("findMatching resolves across substitutable functions", () => {
    const index = new FactIndex(ctx);
    index.add("1", stmt("con_right", [ang("CMA"), ang("DMB")]));
    // A con_ang lookup that allows con_right (group expansion) hits the fact.
    const hit = index.findMatching(
      stmt("con_ang", [ang("AMC"), ang("BMD")]),
      ["con_ang", "ref_ang", "con_right"],
    );
    expect(hit?.ref).toBe("1");
    // Without the extension it misses.
    const miss = index.findMatching(stmt("con_ang", [ang("AMC"), ang("BMD")]), [
      "con_ang",
    ]);
    expect(miss).toBeUndefined();
  });

  test("byFunctionAndObject indexes join lookups", () => {
    const index = new FactIndex(ctx);
    index.add("1", stmt("con_seg", [seg("AM"), seg("BM")]));
    index.add("2", stmt("con_seg", [seg("CM"), seg("DM")]));
    const am = index.byFunctionAndObject(["con_seg"], "AM");
    expect(am).toHaveLength(1);
    expect(am[0].ref).toBe("1");
  });
});
