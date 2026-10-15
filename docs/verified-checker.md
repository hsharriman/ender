# Verified Ender checker

Ender proofs are parsed and checked by Rocq code, proved sound, and extracted
to native OCaml and WebAssembly. It is the only checker: a statement or reason
it has no rule for is rejected, never guessed at.

## What is proved, and what is trusted

[`Audit.v`](../rocq/Ender/Audit.v) is the single file a human has to audit. It
imports no implementation file and states:

1. `problemPart`, the text between the `pt:` line and `steps:`;
2. every public statement form and declaration form, with its canonical
   spelling and a declarative header grammar;
3. the meaning of each, in Tarski geometry, with explicit nondegeneracy
   conditions;
4. `meaning : string -> option Prop`, partial only because parsing can fail;
   and
5. the signatures the implementation must prove: parser soundness, checker
   soundness, and that a Euclidean plane exists.

Checker soundness says:

```text
problemPart source = Some part
and checker source = true
imply that meaning part returns a proposition which holds in every Euclidean
Tarski plane.
```

The statement meanings assume only `Tarski_neutral_dimensionless`. The
soundness theorem quantifies over decidable point equality,
`Tarski_euclidean`, and `Tarski_2D` as hypotheses, not axioms. The plane is
needed only for circles: the audited `OnCircle` is equidistance from a center,
which in three dimensions is a sphere, so some circle theorems are false
without it. Individual rules assume the parallel postulate and the plane only
where they need them; `Checker.v` introduces `Tarski_euclidean` just above the
first rule that needs it and `Tarski_2D` just above `chord_bisect_conv`, the
only rule that does, so every rule above each point is visibly free of it.

Because the hypotheses are universally quantified, soundness would hold
vacuously if no model satisfied them. The contract therefore also requires
`euclidean_plane_exists`, three non-collinear points in a structure satisfying
all of them, and [`Model.v`](../rocq/Ender/Model.v) discharges it with GeoCoq's
model over the real algebraic numbers. It is in `Prop`, so extraction erases
it.

`make -C rocq test` and `nix flake check` fail if `Print Assumptions` reports
any axiom for either theorem. Some GeoCoq routes rest on `Eqdep.Eq_rect_eq`
(`par_2_plg`, `plg_per_rect`, `rect_per`, `midpoint_thales`, the `CopR`
reflection in `par_trans`, `l12_21_a`); the development proves the same facts
another way.

What Rocq cannot check is that the audited meanings say what a reader means
by them, which is why they live in one short file. Beyond that, the trusted
base is the usual one for extracted code: Rocq's kernel checks the proofs, and
extraction, the OCaml compiler, and `wasm_of_ocaml` produce the programs.

## Source map

| File | Role |
|---|---|
| `Audit.v` | The audited contract described above. |
| `PublicParser.v` | The header parser, proved to accept only what `ProblemGrammar` describes. |
| `Syntax.v` | Reasons, steps, and declarations around the audited `Statement` type. |
| `Semantics.v` | A statement's kernel meaning, defined as its audited meaning. |
| `Geometry.v` | Geometry lemmas the rules need beyond GeoCoq: the triangle criteria, Playfair-based parallel facts, quadrilateral translations. |
| `Checker.v` | The reason kernel: one executable rule per reason, each with its soundness lemma. |
| `Parser.v` | The step parser. |
| `CompleteChecker.v` | Implements the contract, and builds the advisory report. |
| `PresentationParser.v` | Display-only parser for the interface; it decides nothing. |
| `Model.v` | The Euclidean plane over the real algebraic numbers. |
| `CertifiedAPI.v`, `Extract.v` | The extracted entry points. |
| `Chars.v` | Character-list helpers used by the parsers. |
| `Tests.v` | Positive and negative examples, and the axiom check. |

`rocq/runtime/` wraps the extracted checker as the `ender-checker` command and
the Wasm API the interface and Node code load.

## Reading statements

These are the conventions a proof author is most likely to trip over. The
audited meanings in `Audit.v` are authoritative.

- **Names are unoriented.** `AB` and `BA` are one segment, `a_XYZ` and `a_ZYX`
  one angle, and a congruence may be written either way round. A
  quadrilateral may be named from any corner, walking either way; the other
  orders of its four letters name a self-crossing figure and do not match.
- **Triangle congruence.** `con_tri_ordered(t_ABC, t_DEF)` pairs the vertices
  as written. `con_tri` says only that the triangles are congruent, so either
  may be written in any order. The congruence criteria conclude either.
  `cpctc` on an unordered `con_tri` uses a correspondence the earlier steps
  establish, such as a criterion's three parts; a given congruence meant for
  `cpctc` is written `con_tri_ordered`.
- **Nondegeneracy comes from declarations.** A rule that needs a nondegenerate
  angle or segment gets it from a `tri:`, `quad:`, `ang:`, or `seg:`
  declaration, or from an `intersect_seg` premise, and nowhere else; with none
  to draw on, it rejects. A quadrilateral supplies it for any three of its
  vertices, and two declared segments sharing an endpoint are an angle's two
  rays. A crossing is strict, so `intersect_seg(AC, BD, E)` counts as
  declaring `AC`, `BD`, and the four half-segments `AE`, `EC`, `BE`, and
  `ED`. This is why, for
  example, `reflex` concludes `ref_ang` only for a declared angle, and
  `perp_con_ang` concludes `con_ang` (rather than `con_right`) only for
  declared angles.
- **Diagram premises.** `on_line(s, p)` puts `p` on the drawn segment `s`,
  endpoints included, not anywhere on its line. `intersect_seg(s, t, p)` says
  `s` and `t` cross at a point strictly inside both, never at an endpoint. `transversal(a, b, t1, i1, c,
  d, t2, i2)` describes the whole figure: `a` and `b` flank the crossing `i1`,
  `c` and `d` flank `i2`, `t1` and `t2` extend past the crossings, and `a` and
  `c` lie on the same side of the transversal. A part left undrawn is spelled
  by repeating the crossing's letter, as in `transversal(A, C, A, A, D, B, B,
  B)`. Which side each point is on is what separates alternate, corresponding,
  and same-side angles, so a point in the wrong slot makes the rule reject.
- **`para`** is GeoCoq's `Par`, which admits coincident lines; inside a
  transversal figure that case cannot arise.
- **`complementary`** means the two angles together make a right angle, not
  merely that their measures sum to one modulo a full turn.
- **Some rules need a diagram premise.** `vert_ang` cites the `intersect_seg`
  premise whose crossing makes the angles vertical; `midpt_conv` needs an
  `on_line` or `intersect_seg` premise placing the point between the
  endpoints; `def_perp` needs an `on_line` premise placing the foot on the
  target line; `linear_pair_conv` needs an `on_line` premise placing the
  common vertex between the two angles' other points; `pgram_diag_bisect`,
  `rhombus_diag_perp`, and `kite_diag_perp` need an `intersect_seg` premise
  of the two diagonals at the point they conclude about, since the
  quadrilateral alone does not name where its diagonals cross. `rhl` accepts
  the hypotenuse and the leg cited in either order.
- **Circles.** `on_circle(c, p)` and `radius(c, p)` mean the same thing: `p`
  is on the circle. Every circle statement puts the points it names on the
  circle, except the centre and a tangent's far end, so a rule that needs a
  point on the circle, like `def_radius_conv`, finds it in any of them.
  `center_on_line(c, s)` says the centre lies on the line through `s`.

Coordinates on the `pt:` line are display-only and contribute nothing to a
theorem's meaning.

## Reasons that always reject

The kernel has a rule for 81 of the 93 reasons in the
[catalog](../src/checker/grammar/defs/reasons.defs.ts). The other 12 reject
every step that cites them.

Two are false as the corpus spells them, so no rule can be written until
the language changes:

- **`con_inscribed_angs`, `inscribed_angs`.** Two inscribed angles on one
  chord are congruent when their vertices are on the same arc and
  supplementary when they are on opposite arcs, and
  `inscribed_angle(c_OA, a_APB)` does not say which. The fact relates the two
  vertices, so no stronger meaning for one inscribed angle can supply it. The
  options are a same-side premise such as `sameside(AB, P, Q)`, or having
  `inscribed_angle` name its intercepted arc; either way the rule also needs
  the arc condition that separates the two cases.

`sas_sim` and `sss_sim` cite `proportion`, which the kernel has no rules
for yet. The remaining eight (`con_arc`, `csstp`, `incenter`, `para_con_arcs`,
`rect_para_right_opp`, `sim_tri_transitive`, `square`, `tangent_diam_perp`)
have no fixtures and have not been designed.

## Reports

`ender-checker FILE`, `npm run checkProof`, and the checker server's `POST
/check` print `{isCorrect, issues}`, or `{isCorrect, errors}` when the problem
header does not parse; the codes are in
[`ERROR_CODES.md`](../src/checker/ERROR_CODES.md). `ender-checker` exits 0, 1,
or 2 for accepted, rejected, and unparsed.

`ender-checker --report FILE` (or `enderCheckReport` in Wasm) prints the full
`CheckReport` from `Audit.v`: each step's status, dependencies, and the
diagram premises it consulted; the dependency graph with cycles and unused
steps; duplicate derivations; and the step the goal rests on. A failure
spreads only along the graph: a step citing one that was not accepted is
`blocked`, and every other step is still judged.

None of the report is proved, and none of it is trusted: the verdict alone
decides acceptance. Each diagram premise a report names comes from the same
search the rule ran, so it cannot name one the rule did not use, and the test
suite checks every corpus file's report names only premises the file states.
Editor hints about what a reason relates (`src/interface/core/waysToProve.ts`)
read the untrusted catalog and the display geometry, so they are computed in
TypeScript rather than reported.

## Building

Build inside the Nix development shell, which supplies Rocq 9.1, GeoCoq,
MathComp, OCaml, and `wasm_of_ocaml` at the versions the build needs:

```sh
nix develop
make -C rocq
```

`make -C rocq` kernel-checks the development, runs the axiom check, extracts
the checker, and builds the native program and the Wasm bundle into
`rocq/_build/`. Building without Nix means reproducing all of that by hand:
GeoCoq at the pinned commit with both patches applied, its `Coinc`, `Main`,
`Axioms`, and `Algebraic` layers installed, and MathComp 2.5 with
`mathcomp-real-closed`.

The flake's packages run the same Makefile over a clean checkout:

```sh
nix flake check -L                                # proofs, axiom check, and integration tests
nix run . -- src/checker/proofs/examples/tutorial.txt
nix build .#ender-checker-wasm                    # the bundle, under result/share/ender-checker-wasm/
nix run .#serve                                   # the interface at http://localhost:3000/ender/
```

GeoCoq is pinned to
[`1b1e7ad`](https://github.com/GeoCoq/GeoCoq/commit/1b1e7ad51d9139b6c98cde48a4516b78546cae9d),
its Rocq 9 port, because upstream `master` does not build on Rocq 9. Two
patches apply on top:

- [`geocoq-axioms-layering.patch`](../nix/geocoq-axioms-layering.patch) leaves
  `gelertner_inspired_axioms.v`, an example that imports `Main`, out of the
  `Axioms` layer, so the layers build in order.
- [`geocoq-algebraic-mathcomp25.patch`](../nix/geocoq-algebraic-mathcomp25.patch)
  ports the two `Algebraic` files `Model.v` needs to MathComp 2.5: the
  `ssreflect` import path moved, a local notation collides with a new MathComp
  one, and two rewrite chains no longer apply.
