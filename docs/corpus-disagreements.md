# Where the two checkers disagree

A complete inventory of every corpus proof on which the legacy TypeScript
checker (branch `main`) and the verified checker (this branch) reach different
outcomes — in **both** directions. It is meant to be read in one sitting and
decided on. Every file named below appears in exactly one place, and the counts
in each section add up to the totals in the table.

The corpora are the 160 bundled fixtures in `src/checker/proofs/` and the 108
textbook proofs in the `geo-proof-dataset` submodule: 268 files. `DS` marks a
`geo-proof-dataset/proofs/` file below; everything else is under
`src/checker/proofs/`.

Each checker lands in one of three outcomes per file: **accepts**, **rejects**,
or **no verdict** — the input never got as far as a judgement. For the verified
checker that is always a parse failure. For the legacy checker it is either a
parse failure (4 files) or a thrown exception during context construction
(6 files); both are grouped as "no verdict" because neither yields an answer.

Two invariants hold across the whole corpus and are worth stating up front:

- **No file marked `// fail` is accepted by the verified checker,** in either
  corpus. One file marked `// fail` *is* accepted by the legacy checker.
- The proof-file `// pass` / `// fail` markers are **not** the same axis as
  either checker's verdict. 13 `// pass` files are refused by *both* checkers;
  they are not disagreements, and they are listed in their own section at the
  end so their diagnoses are not lost.

## The table

Rows are the legacy checker, columns the verified one.

| legacy ↓ / verified → | no verdict | rejects | accepts | total |
|---|---|---|---|---|
| **no verdict** | 4 | 3 | 3 | 10 |
| **rejects** | 8 | 82 | 4 | 94 |
| **accepts** | 3 | 36 | 125 | 164 |
| **total** | 15 | 121 | 132 | 268 |

**211 files agree** (the diagonal); **57 disagree**. 41 of the 57 are bundled
fixtures and 16 are textbook proofs.

The six off-diagonal cells are the six sections that follow. Reproduction
instructions are in the [appendix](#appendix-reproducing-the-table).

## Legacy accepts, verified rejects — 36 files

The largest cell by far. 24 of the 36 are waiting on rules that are not written
yet, 11 need a decision, and 1 is a bug in the legacy checker.

### Reason not yet implemented — 24 files

These fail only because the reason has no executable Rocq rule, so the step's
reason does not parse and the step fails closed. No decision needed; they
resolve as the reason campaign continues, except where noted. Each of the 19
fixtures named `<reason>_correct.txt` has an `_incorrect.txt` twin, and every one
of those twins is rejected by both checkers, so none of them is a disagreement.

- **Circles — 6 files.** `circles/con_inscribed_angs_correct.txt` and
  `examples/inscribed_angles.txt` (`con_inscribed_angs`),
  `circles/con_tangents_ext_correct.txt`,
  `circles/radius_chord_bisect_correct.txt`,
  `circles/radius_chord_bisect_conv_correct.txt`,
  `circles/tangent_perp_conv_correct.txt`. The inscribed-angle pair is blocked
  on the open arc question in
  [`verified-checker.md`](verified-checker.md); the rest is ordinary priority-3
  work.
- **Circles, textbook — 4 files.** `DS holt_s11-1_exer29_c1.txt`
  (`tangent_perp_conv`), `DS holt_s11-1_exer30_c1.txt` (`con_tangents_ext`),
  `DS holt_s11-2_exer42_c1.txt` (`radius_chord_bisect`),
  `DS holt_s11-2_exer43_c1.txt` (`radius_chord_bisect_conv`). These are the only
  textbook proofs still held up by a missing rule.
- **Quadrilaterals — 11 files**, each named `quadrilaterals/<reason>_correct.txt`
  for one of `isos_trap_base_angs`, `isos_trap_base_angs_conv`,
  `isos_trap_con_diags`, `kite_diag_perp`, `pgram_diag_bisect`,
  `pgram_diag_bisect_conv`, `pgram_opp_angs_conv`, `rect_diag_con_conv`,
  `rhombus_diag_perp`, `rhombus_diag_perp_conv`, `rhombus_opp_bisect_conv`.
- **Lines — 2 files.** `lines_angles/linear_pair_conv_correct.txt` and
  `lines_angles/perp_bisector_correct.txt`.
- **Similarity — 1 file.** `triangles/aa_sim_correct.txt`. The `sas_sim` and
  `sss_sim` fixtures are counted two sections down instead, because they fail to
  parse before their reason is ever reached.

The diagonal rules carry a hazard the corpus shares: their conclusions name a
crossing point, and `quadrilaterals/pgram_diag_bisect_correct.txt` concludes
`seg_bisect(AC, BD, M)` with nothing tying `M` to the figure. Implementing the
rule will not accept that fixture, for the same reason
`DS holt_s6-4_cio4_c1.txt` is rejected.

### Triangle correspondence not established — 8 files

`con_tri(t_ABC,t_DEF)` means the ordered correspondence `A-D`, `B-E`, `C-F`.
These proofs conclude one correspondence from dependencies that establish a
different one, then use the correct one at the next step.

`examples/s2c2.txt` step 7 concludes `con_tri(t_ABD,t_BCD)` from an SAS argument
establishing `A-C`, `B-B`, `D-D`. Step 8 then reads `con_seg` off the
correspondence the argument actually proves, not the one step 7 stated.

The legacy checker matched the two triangles up to independent permutation,
which is exactly what makes `con_tri` unsound as an ordered claim: under that
reading `con_tri` says only "these six parts pair up somehow", and CPCTC may
then draw a conclusion the proof never justified. Widening the search to recover
these proofs would give that back. Correspondence search already covers all six
readings of a *conclusion*; what it will not do is permute the two triangles
independently.

- `examples/s1c3.txt`, `examples/s2c1.txt`, `examples/s2c2.txt`
- `DS s1c3.txt`, `DS s2c1.txt`, `DS s2c2.txt` (the same three)
- `DS holt_s4-3_cio4_c1.txt` — concludes `con_tri(t_JKN,t_MLN)` where SSS gives
  `t_LMN`, the last two vertices transposed
- `DS holt_s4-6_exer9_c1.txt` — concludes `con_tri(t_WXZ,t_YZX)` where the
  argument gives `t_YXZ`

**Decision:** fix the eight files, or accept that these stay rejected.

### Degenerate `transversal` premise — 1 file

The audited `transversal(a, b, t1, i1, c, d, t2, i2)` names the ordered figure:
`a` and `b` flank the crossing `i1`, `c` and `d` flank the crossing `i2`, and
`t1`, `t2` extend beyond the two crossings. It asserts `BetS T1 I1 I2`,
`BetS I1 I2 T2`, `BetS A I1 B`, `BetS C I2 D`, and `OS I1 I2 A C` — see
`TransversalConfiguration` in [`../rocq/Ender/Audit.v`](../rocq/Ender/Audit.v).

`DS holt_s6-3_theorem6-3-4_c1.txt` repeats points until the crossing point is
also a flank point and the exterior point:

```
[d_01] transversal(S, P, Q, P, Q, R, P, Q)
[d_02] transversal(P, Q, S, P, S, R, P, S)
```

`BetS Q P Q` and `BetS S P S` hold of no figure. Its step 3,
`sameside_ang_conv(1) -> para(SP,QR)`, is rejected because the audited rule
needs to know which side of the transversal each point lies on — that is the
only thing separating alternate from corresponding from same-side angles, and
those have different conclusions.

Note what a degenerate premise means for soundness: the premise is
*unsatisfiable*, so the theorem it heads is vacuously true and **either verdict
is sound**. `examples/s1c1.txt` writes an equally degenerate
`transversal(A, C, A, A, D, B, B, B)` and is accepted by both checkers, while
`DS s1c1.txt` writes `transversal(A, C, A, A, B, D, B, B)` and is rejected by
both. Which way a degenerate file falls depends on which conjunct the rule
happens to need, not on anything meaningful. Five more files with the same
defect are rejected by both checkers and appear
[at the end](#not-disagreements-pass-files-both-checkers-refuse).

**Decision:** respell these premises with the figure's actual points. This is
the one cause where agreement between the checkers is not evidence of anything.

### Quadrilateral named but not declared — 1 file

`examples/buggypgram_opp_angs.txt` declares `quad: q_ABCD` and then states
`parallelogram(q_BCAD)`. `BCAD` is not a rotation of `ABCD`, so it names a
different quadrilateral, with different diagonals — and an undeclared one, so
nothing supplies its well-formedness. The file's own name says `buggy`; its
marker says `// pass`.

### Nondegeneracy never declared — 1 file

`DS holt_s2-7_cio3_c1.txt` proves the vertical angles theorem from
`intersect_seg(AC,BD,E)`, declaring only `seg: AC BD`. Vertical angles need
their rays nondegenerate, and nothing here says `A`, `B`, `C`, `D` differ from
the crossing point `E`. Its companion `DS holt_s2-7_ex3_c1.txt` declares
`seg: AC BD AE EB CE ED` and *is* accepted, since two declared segments sharing
a vertex are an angle's two rays. **This is the one entry in this cell that is
arguably ours rather than the file's**: the proof is mathematically fine, and
only the declaration is missing.

### A legacy soundness gap — 1 file

`lines_angles/para_transitive_incorrect.txt` is marked `// fail on step 3` and
the legacy checker **accepts** it. It gives `para(AB, CD)` and `para(EF, GH)` and
concludes `para(AB, GH)` by `para_transitive` — with no line shared between the
two facts, so the conclusion does not follow. The verified checker rejects step
3. This is the only file in the corpus where the legacy checker accepts a proof
its own marker calls wrong, and it needs no decision: it is the behaviour the
new checker exists to fix.

## Legacy accepts, verified has no verdict — 3 files

Spellings the legacy grammar admitted and the audited grammar does not.

**`sim_seg(AB, DE)` — `triangles/sas_sim_correct.txt`,
`triangles/sss_sim_correct.txt`.** `sim_seg` is in the untrusted catalog
(`stmts.defs.ts`) but has no audited spelling: the audited language has
`proportion` over four segments and `sim_tri` over two triangles, and nothing
for two similar segments. **This is a gap in the audited language, not in the
files** — worth deciding on when the similarity family is taken up. (Their
`_incorrect` twins are in the next section.)

**A premise line carrying a trailing step reference — 1 file.**
`examples/s2inc1corrected.txt` writes premises as

```
[g_1] perp(LU, PS, S) [01]
```

The trailing `[01]` is not in the audited header grammar. Either the file drops
it or the grammar admits it. Five more files share this defect and are in the
next section.

This file needs a **second** fix beyond the grammar question. With the trailing
references stripped it parses but is still rejected, at step 9:

```
[09] sas(2, 7, 8) -> con_tri(t_LNU, t_UQL)
```

Step 7 is `cpctc(6) -> con_ang(a_SLP, a_SUP)`, which names its angles by points
on the triangles' rays rather than by the triangles' own vertices — `a_SLP` is
the same angle as `a_NLU` only because `N` lies on `LP` and `S` lies on `LU`. The
file declares `on_line(LP, N)` but never places `S` on `LU`. Adding
`[d_3] on_line(LU, S)` makes it **accepted**. So this file is two small edits
from passing, and neither is a limitation of the kernel.

## Legacy has no verdict, verified rejects — 3 files

Three `// fail` fixtures the legacy checker could not even reach a verdict on,
where the verified checker correctly rejects the intended bad step. Both
checkers refuse them, so nothing needs deciding; the cell is listed for
completeness, and it shows the verified checker giving a *useful* answer where
the old one gave none.

- `circles/con_chords_intersect_arcs_incorrect.txt` — legacy parse error,
  `unexpected_token: c_OB`; verified rejects step 2.
- `circles/inscribed_semi_incorrect.txt` — legacy threw `Angle BRD: segment BR
  or RD not found in context`; verified rejects step 2.
- `lines_angles/ang_bisect_conv_incorrect.txt` — legacy threw `Angle ABD:
  segment AB or BD not found in context`; verified rejects step 2.

## Legacy has no verdict, verified accepts — 3 files

The `// pass` twins of the three above. Each is a legacy limitation the verified
checker does not have.

- `circles/con_chords_intersect_arcs_correct.txt` — the legacy grammar has no
  `minor_arc(c_OB, B, R)` spelling; it only knew the older `BR_OB` arc token.
- `circles/inscribed_semi_correct.txt` and
  `lines_angles/ang_bisect_conv_correct.txt` — the legacy checker could only
  build an angle when both of its rays were declared under `seg:`. These files
  supply the rays through an `inscribed_angle` premise and an `ang:`
  declaration respectively, which the verified checker reads.

## Legacy rejects, verified accepts — 4 files

Four `// pass` files the legacy checker got wrong. The first three are legacy
limitations the verified checker does not have; the fourth is a genuine
**policy** difference worth ruling on.

- `circles/def_radius_correct.txt` — legacy reported
  `object_not_in_premises` for `OA` and `OB`, demanding both be declared as
  segments. The verified checker derives them from `circ: c_OA` together with
  `radius(c_OA, B)`.
- `examples/goal_reversed_correct.txt` — the goal is `con_seg(MA, BM)` and the
  proof concludes `con_seg(AM, MB)`. Legacy reported `Goal not reached in any
  proof step`; the verified checker knows segment congruence is invariant under
  reversing each segment.
- `examples/z_figure.txt` — legacy rejected step 3's `altint` with
  `transversal_angles_or_parallel_segs_dont_form_valid_config`. Both
  `transversal` premises here are well formed, and the verified checker accepts
  the whole proof.
- `DS transversal_test.txt` — **a policy difference, not a limitation.** The
  file proves `para(AB,CD)` three separate ways, so steps 5 and 6 restate step
  4's conclusion and go unused. Legacy treated `Unused steps` and
  `duplicate_conclusion` as fatal and rejected. The verified checker reports
  both as findings — `unusedSteps: [5, 6]` and two duplicate entries — and still
  returns `accepted`, because neither is a flaw in the *proof*.
  **Decision:** confirm that unused steps and duplicated conclusions should be
  reported but not fatal. That is what the harness does today.

## Legacy rejects, verified has no verdict — 8 files

Both checkers refuse these; only the route differs. Seven are marked `// fail`,
so no decision is needed for them beyond the grammar question — but the audited
grammar rejects them for a *header* defect rather than for the step the marker
names, so a reader who wants to see that step judged has to fix the header
first.

**Trailing step references on premise lines — 5 files.** `examples/s1inc3.txt`,
`examples/s2inc1.txt`, `DS s1inc2.txt`, `DS s1inc3.txt`, `DS s2inc1.txt`. Same
`[g_1] right(a_KLM) [01]` shape as `examples/s2inc1corrected.txt` above. I
confirmed that stripping the trailing reference is the *only* parse blocker in
all six files: each then parses and is rejected on its merits, which for these
five is what their `// fail` markers predict.

**`sim_seg` — 2 files.** `triangles/sas_sim_incorrect.txt`,
`triangles/sss_sim_incorrect.txt`. Same audited-language gap as their `// pass`
twins.

**A six-argument `transversal` — 1 file.** `DS s1c1_wp1.txt` writes
`transversal(A, C, A, B, D, B)` where the audited form takes eight arguments.
This is the only `// pass` file in this cell.

## Not disagreements: `// pass` files both checkers refuse

13 files carry a `// pass` marker that neither checker honours. They are not
disagreements — both checkers say no — but they are the files most likely to be
mistaken for regressions, so their diagnoses are recorded here.

**Degenerate `transversal` premises — 5 files.** `DS s1c1.txt`,
`DS holt_s6-2_theorem6-2-1_p1_c1.txt`,
`DS holt_s6-2_theorem6-2-1_p2_c1.txt`,
`DS holt_s6-3_theorem6-3-1_c1.txt`, `DS holt_s6-3_theorem6-3-2_c1.txt`. The same
defect as `DS holt_s6-3_theorem6-3-4_c1.txt` above — `[d_01]
transversal(K,L,L,J,J,M,J,L)` in the `6-3-1` file, for instance, needs
`BetS L L J`. The legacy checker rejects these too, with its own
`alt_int_angles_not_on_alternating_sides` and
`transversal_angles_or_parallel_segs_dont_form_valid_config` errors, so both
checkers read the transversal — they just read it differently.
**Decision:** respell all six premises (these five plus the one disagreement)
with the figure's actual points.

**Truncated proofs — 2 files.** `DS s1c1incomplete.txt` and
`DS s2c2incomplete.txt` end with empty step lines:

```
[05]
[06]
```

They are deliberately unfinished, and our own copies are correctly marked
`// fail incomplete`. The submodule's markers are simply wrong.

**Point named on no premise — 1 file.** `DS holt_s6-4_cio4_c1.txt` concludes
`ang_bisect(a_QPS, PR)` for a rhombus `q_PQTS`, whose diagonal from `P` is `PT`.
`R` is meant to be on that diagonal, but no premise places it anywhere. Our own
copy of this proof, `examples/rhombusOutside.txt`, adds `[d_1] on_line(PR, T)`
and is accepted by both checkers.

**`on_line` names the wrong segment — 1 file.** `DS overlap.txt` declares
`on_line(ED, F)`. In the figure `E` and `D` are both at `y = 9` while `F` is at
`y = 5.5`, so `F` is not on `ED`; it is on `EG`. Our own copy already says
`on_line(EG, F)` and is accepted by both.

**Vocabulary in no catalog and no audit file — 2 files.** `circles/reg1.txt` and
`circles/reg1v2.txt` use `inscribed_tri(c_OB, t_BDR)` and the legacy arc token
`con_arc(BR_OB, YD_OB)`. `inscribed_tri` appears nowhere, and `BR_OB` is what
the current syntax replaced with `minor_arc(c_OB, B, R)`. Both files read as
exploratory scratch — one carries the comment "generates several possible
statements that can be used in the proof though..." — and are marked `// pass`
optimistically. Legacy rejects them with `unknown_function: inscribed_tri`.

**An older `inscribed_angle` spelling — 2 files.** `DS holt_s11-4_exer32_c1.txt`
and `DS holt_s11-6_cio6_c1.txt` write `inscribed_angle(a_ACB, AB)`, naming an
angle and its chord, where the audited form is
`inscribed_angle(circle, angle)`. Both also need `con_inscribed_angs`, which is
blocked on the open arc question, so respelling alone will not accept them. The
legacy checker throws on both.

## Decisions in one list

| # | Decision | Files | Whose defect |
|---|---|---|---|
| 1 | Fix the triangle correspondences, or accept the rejections | 8 | proof file |
| 2 | Respell the degenerate `transversal` premises | 6 (1 disagreement, 5 not) | proof file |
| 3 | Give the audited language a `sim_seg`, or drop it from the catalog | 4 | the language |
| 4 | Admit trailing step references in the header grammar, or strip them | 6 | proof file, or the grammar |
| 5 | Declare `q_BCAD`, or fix the file to say `q_ABCD` | 1 | proof file |
| 6 | Declare the nondegeneracy in `holt_s2-7_cio3`, or relax the rule | 1 | arguably the checker |
| 7 | Confirm unused steps and duplicate conclusions are non-fatal | 1 | policy |
| 8 | Respell `DS s1c1_wp1.txt`'s six-argument `transversal` | 1 | proof file |
| 9 | Fix the markers on the two truncated textbook proofs | 2 | proof file |
| 10 | Retire or respell `reg1`/`reg1v2` and the two `inscribed_angle` files | 4 | proof file |

Everything not in that list is either a reason with no rule yet (24 files, which
only time fixes) or a file both checkers already agree about.

## Appendix: reproducing the table

Both halves take under a second. There is no committed command yet, because the
legacy checker does not exist on this branch — `src/checker/proofChecker.ts` and
its grammar were removed — so the comparison needs a `main` worktree beside it.

```bash
# 1. The verified half: a verdict for all 268 files.
make -C rocq                                   # if not already built
node scripts/reason-coverage.mjs --json > /tmp/parity.json

# 2. The legacy half needs branch `main` checked out somewhere.
git worktree add /tmp/ender-main main
cd /tmp/ender-main && npm ci && cd -

# 3. Cross-tabulate (script below).
cp /tmp/compare.ts /tmp/ender-main/compare.ts
cd /tmp/ender-main && npx tsx compare.ts > /tmp/matrix.json
```

`/tmp/compare.ts`, which must live inside the `main` worktree so its imports
resolve:

```ts
import { readFileSync } from "fs";
import { ProofParser } from "./src/checker/grammar/lezerParser";
import { runProofChecker, collectProofCheckerIssues } from "./src/checker/proofChecker";

type Outcome = "no_verdict" | "accepts" | "rejects";
const branchRoot = "/path/to/this/branch";          // edit me
const parity = JSON.parse(readFileSync("/tmp/parity.json", "utf8"));
const items = [...parity.parity, ...parity.datasetParity];
const parser = new ProofParser();

const outcomes: Outcome[] = ["no_verdict", "rejects", "accepts"];
const matrix = Object.fromEntries(
  outcomes.map((o) => [o, Object.fromEntries(outcomes.map((p) => [p, 0]))]),
);
const rows = items.map((item: any) => {
  const source = readFileSync(`${branchRoot}/${item.file}`, "utf8");
  let legacy: Outcome;
  let detail = "";
  try {
    const parsed = parser.parse(source);
    if (!parsed.ok) {
      legacy = "no_verdict";
      detail = JSON.stringify(parsed.failure);
    } else {
      const issues = collectProofCheckerIssues(runProofChecker(parsed.value));
      legacy = issues.length === 0 ? "accepts" : "rejects";
      detail = issues.join(" | ");
    }
  } catch (error) {
    legacy = "no_verdict";                          // thrown, not a parse error
    detail = error instanceof Error ? error.message : String(error);
  }
  const verified: Outcome =
    item.verdict === "accepted"
      ? "accepts"
      : item.verdict === "failed_to_parse_problem"
        ? "no_verdict"
        : "rejects";
  matrix[legacy][verified]++;
  return { file: item.file, legacy, verified, detail };
});

console.log(JSON.stringify({ total: rows.length, matrix, rows }, null, 2));
```

Then group the disagreements:

```bash
node -e 'const m=require("/tmp/matrix.json");
const cells={};
for(const r of m.rows) if(r.legacy!==r.verified)
  (cells[`${r.legacy} -> ${r.verified}`] ??= []).push(r.file);
for(const [k,v] of Object.entries(cells))
  console.log(`\n${k} (${v.length})\n  ${v.join("\n  ")}`);'
```

Per-file explanations of the *verified* side come from
`rocq/_build/bin/ender-checker --report <file>`, whose `steps[].diagnostics`,
`goal.diagnostics`, `graph`, and `duplicates` fields say exactly what it did and
did not accept. The `unsupported` field of each `scripts/reason-coverage.mjs`
entry is what separates "a rule is missing" from "the proof is wrong".
