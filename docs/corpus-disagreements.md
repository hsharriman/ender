# Where the two checkers disagree

Every corpus proof that the legacy TypeScript checker accepted and the verified
checker does not, with what causes each one. It is meant to be read in one
sitting and decided on: most entries are a defect in the proof file rather than
a missing capability, and the ones that are not are called out.

Counts are from the corpora as they stand: 160 bundled fixtures in
`src/checker/proofs/`, 108 textbook proofs in the `geo-proof-dataset`
submodule. Regenerate with `npm run reasonCoverage -- --write`; the live
classification comes from `node scripts/reason-coverage.mjs --json`.

Nothing marked `// fail` is accepted by the verified checker, in either corpus.
Every disagreement below is in the same direction: the old checker said yes and
the new one says no.

## Summary

| Cause | Files | Whose defect |
|---|---|---|
| Triangle correspondence not established | 8 | proof file |
| Degenerate `transversal` premise | 6 | proof file |
| Statement spelled in vocabulary the language does not have | 6 | proof file, or the language |
| Truncated proof labelled `// pass` | 2 | proof file |
| Quadrilateral named but not declared | 1 | proof file |
| Point named on no premise | 1 | proof file |
| Nondegeneracy never declared | 1 | arguably the checker |
| `on_line` names the wrong segment | 1 | proof file |
| Premise line carries a trailing step reference | 1 | proof file, or the grammar |
| Reason not yet implemented | 24 | the checker, and only time |

The first nine rows are the ones needing a decision: 27 files. The last row is
work not yet done, listed separately at the end.

## Triangle correspondence not established — 8 files

`con_tri(t_ABC,t_DEF)` means the ordered correspondence `A-D`, `B-E`, `C-F`.
These proofs conclude one correspondence from dependencies that establish a
different one, then use the correct one at the next step.

`examples/s2c2.txt` step 7 concludes `con_tri(t_ABD,t_BCD)` from an SAS
argument establishing `A-C`, `B-B`, `D-D`. Step 8 then reads `con_seg` off the
correspondence the argument actually proves, not the one step 7 stated.

The legacy checker matched the two triangles up to independent permutation,
which is exactly what makes `con_tri` unsound as an ordered claim: under that
reading `con_tri` says only "these six parts pair up somehow", and CPCTC may
then draw a conclusion the proof never justified. Widening the search to
recover these proofs would give that back. Correspondence search already covers
all six readings of a *conclusion*; what it will not do is permute the two
triangles independently.

- `examples/s1c3.txt`, `examples/s2c1.txt`, `examples/s2c2.txt`
- `geo-proof-dataset` `s1c3.txt`, `s2c1.txt`, `s2c2.txt` (the same three)
- `geo-proof-dataset` `holt_s4-3_cio4_c1.txt` — concludes `con_tri(t_JKN,t_MLN)`
  where SSS gives `t_LMN`, the last two vertices transposed
- `geo-proof-dataset` `holt_s4-6_exer9_c1.txt` — concludes `con_tri(t_WXZ,t_YZX)`
  where the argument gives `t_YXZ`

**Decision:** fix the eight files, or accept that these stay rejected.

## Degenerate `transversal` premise — 6 files

The audited `transversal` takes eight points: for each of the two lines, the
two named points that flank the crossing, the crossing point itself, and a
point outside. It asserts the drawn figure — `BetS T1 I1 I2`, `BetS I1 I2 T2`,
`BetS A I1 B`, `BetS C I2 D`, and that the first-named points share a side.

These files repeat points so that the crossing point is also a flank point and
the exterior point:

```
[d_02] transversal(A, C, A, A, B, D, B, B)     s1c1.txt
[d_01] transversal(K,L,L,J,J,M,J,L)            holt_s6-3_theorem6-3-1_c1.txt
```

`BetS A A C` holds of no figure, so no configuration satisfies the premise as
written. The legacy checker treated the transversal label as metadata and never
read it; the parallel-line rules now do, because *which side of the transversal
each point lies on* is the only thing separating alternate from corresponding
from same-side angles, and those have different conclusions.

- `geo-proof-dataset` `s1c1.txt`, `holt_s6-2_theorem6-2-1_p1_c1.txt`,
  `holt_s6-2_theorem6-2-1_p2_c1.txt`, `holt_s6-3_theorem6-3-1_c1.txt`,
  `holt_s6-3_theorem6-3-2_c1.txt`, `holt_s6-3_theorem6-3-4_c1.txt`

**Decision:** respell the six premises with the figure's actual points.

## Statement spelled in vocabulary the language does not have — 6 files

Four different spellings, all rejected before checking begins:

- **`sim_seg(AB, DE)`** — `triangles/sas_sim_correct.txt`,
  `triangles/sss_sim_correct.txt`. `sim_seg` is in the untrusted catalog
  (`stmts.defs.ts`) but has no audited spelling: the audited language has
  `proportion` over four segments and `sim_tri` over two triangles, and nothing
  for two similar segments. **This one is a gap in the audited language, not in
  the files** — worth deciding on when the similarity family is taken up.
- **`inscribed_angle(a_ACB, AB)`** — `geo-proof-dataset`
  `holt_s11-4_exer32_c1.txt`, `holt_s11-6_cio6_c1.txt`. An older two-argument
  spelling naming an angle and its chord; the audited form is
  `inscribed_angle(circle, angle)`. These two also need `con_inscribed_angs`,
  which is blocked on the open arc question, so respelling alone will not
  accept them.
- **`inscribed_tri(c_OB, t_BDR)` and `con_arc(BR_OB, YD_OB)`** —
  `circles/reg1.txt`, `circles/reg1v2.txt`. `inscribed_tri` appears in no
  catalog and no audit file, and `BR_OB` is the legacy arc token the current
  syntax replaced with `minor_arc(c_OB, B, R)`. Both files read as exploratory
  scratch — one carries the comment "generates several possible statements that
  can be used in the proof though..." — and are marked `// pass` optimistically.
- **`transversal(A, C, A, B, D, B)`** — `geo-proof-dataset` `s1c1_wp1.txt`. Six
  arguments where the audited form takes eight.

**Decision:** three of these are stale files; the `sim_seg` one is a real hole
in the audited statement language.

## The remaining single cases

**Truncated proofs labelled `// pass` — 2 files.** `geo-proof-dataset`
`s1c1incomplete.txt` and `s2c2incomplete.txt` end with empty step lines:

```
[05]
[06]
```

They are deliberately unfinished, and our own copy of the first is correctly
marked `// fail incomplete`. The submodule's marker is simply wrong.

**Quadrilateral named but not declared — 1 file.**
`examples/buggypgram_opp_angs.txt` declares `quad: q_ABCD` and then states
`parallelogram(q_BCAD)`. `BCAD` is not a rotation of `ABCD`, so it names a
different quadrilateral, with different diagonals — and an undeclared one, so
nothing supplies its well-formedness. The file's own name says `buggy`; its
marker says `// pass`.

**Point named on no premise — 1 file.** `geo-proof-dataset`
`holt_s6-4_cio4_c1.txt` concludes `ang_bisect(a_QPS, PR)` for a rhombus
`q_PQTS`, whose diagonal from `P` is `PT`. `R` is meant to be on that diagonal,
but no premise places it anywhere. Our own copy of this proof,
`examples/rhombusOutside.txt`, adds `[d_1] on_line(PR, T)` and is accepted.

**Nondegeneracy never declared — 1 file.** `geo-proof-dataset`
`holt_s2-7_cio3_c1.txt` proves the vertical angles theorem from
`intersect_seg(AC,BD,E)`, declaring only `seg: AC BD`. Vertical angles need
their rays nondegenerate, and nothing here says `A`, `B`, `C`, `D` differ from
the crossing point `E`. Its companion `holt_s2-7_ex3_c1.txt` declares
`seg: AC BD AE EB CE ED` and *is* accepted, since two declared segments sharing
a vertex are an angle's two rays. **This is the one entry that is arguably ours
rather than the file's**: the proof is mathematically fine, and only the
declaration is missing.

**`on_line` names the wrong segment — 1 file.** `geo-proof-dataset`
`overlap.txt` declares `on_line(ED, F)`. In the figure `E` and `D` are both at
`y = 9` while `F` is at `y = 5.5`, so `F` is not on `ED`; it is on `EG`. Our own
copy already says `on_line(EG, F)` and is accepted.

**Premise line carries a trailing step reference — 1 file.**
`examples/s2inc1corrected.txt` writes premises as

```
[g_1] perp(LU, PS, S) [01]
```

The trailing `[01]` is not in the audited header grammar. Either the file drops
it or the grammar admits it.

## Not a disagreement: reasons not yet implemented — 24 files

These fail only because a rule is not written yet. No decision needed; they
resolve as the reason campaign continues, except where noted.

- **Circles — 10 files**, two each for `con_inscribed_angs`,
  `con_tangents_ext`, `radius_chord_bisect`, `radius_chord_bisect_conv`, and
  `tangent_perp_conv`. The inscribed-angle pair is blocked on the open arc
  question in [`verified-checker.md`](verified-checker.md); the other three are
  ordinary priority-3 work. Four of these ten are textbook proofs, and they are
  the only textbook proofs still held up by a missing rule.
- **Quadrilaterals and lines — 13 files**, one each for
  `pgram_diag_bisect(_conv)`, `pgram_opp_angs_conv`, `rect_diag_con_conv`,
  `rhombus_diag_perp(_conv)`, `rhombus_opp_bisect_conv`, `kite_diag_perp`, the
  three trapezoid rules, `linear_pair_conv`, and `perp_bisector`. All bundled
  fixtures; none is a textbook proof.
- **Similarity — 1 file**, for `aa_sim`. The `sas_sim` and `sss_sim` fixtures
  are counted above instead, since they fail to parse before their reason is
  ever reached.

Note that the diagonal rules carry a hazard the corpus shares: their
conclusions name a crossing point, and
`quadrilaterals/pgram_diag_bisect_correct.txt` concludes
`seg_bisect(AC, BD, M)` with nothing tying `M` to the figure. Implementing the
rule will not accept that fixture, for the same reason `holt_s6-4_cio4_c1`
above is rejected.
