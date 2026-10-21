# Checker Error Codes

This is untrusted, human-readable documentation of what the checker reports.
It does not drive proof acceptance. Every code below is emitted by
`rocq/Ender/CompleteChecker.v`, except `unexpected_error`, which comes from the
TypeScript wrappers; keep this file in sync with those sites.

The checker emits only codes and structured details, never prose. This file is
where the explanations live.

`npm run checkProof` and `POST /check` return one of two shapes:

- `{ "isCorrect": ..., "issues": [...] }` once the problem header parses. A
  proof can be accepted and still carry `unused_step` or
  `duplicate_conclusion` issues; neither is fatal.
- `{ "isCorrect": false, "errors": [...] }` when the header does not parse.
  `errors` holds exactly one issue, for the first header line that does not
  read or for what the header is missing as a whole.

Each issue is `{ type, code, details }`. Step-level issues name the step in
`details.steps`, using the number written in brackets. Header-level issues
name the offending line in `details.line`. The other detail fields are listed
with each code.

## Issue types

| Type | Meaning |
|---|---|
| 1 | A reason's rule did not accept the step |
| 3 | Parser error |
| 4 | Goal not reached |
| 5 | Unused step |
| 6 | Upstream dependency error |
| 7 | Forward reference |
| 8 | Cycle |
| 9 | Wrong number of dependencies |
| 10 | Conclusion not allowed for the reason |
| 11 | Invalid statement arguments |
| 12 | Dependency of the wrong kind |
| 13 | Premise label cited outside `given` |
| 14 | Duplicate statement |
| 16 | Unexpected error |

Types 2 and 15 are no longer emitted.

## The problem header

These go in `errors`. A header line that is a premise or the goal but whose
statement does not read gets one of the statement codes in the next section,
with `details.line`.

| Code | Type | Meaning |
|---|---|---|
| `missing_points_line` | 3 | The file has no `pt:` line. |
| `missing_steps_line` | 3 | The file has a `pt:` line but no `steps:` line after it. |
| `unrecognized_line` | 3 | A header line is not a declaration (`pt:`, `seg:`, `ang:`, `tri:`, `quad:`, `circ:`), a premise (`[g_n]`, `[d_n]`), or the goal (`-> ...`). |
| `missing_goal` | 3 | No header line states the goal. |
| `multiple_goals` | 3 | More than one header line states a goal. |
| `parser_error` | 3 | Every line reads and there is exactly one goal, but the header as a whole still is not a problem the audited grammar accepts. The checker has nothing more specific to say. |

## Statements

Used for a statement in a premise, the goal, or a step's conclusion.
`details.text` is the statement with spaces and any `//` comment removed.

| Code | Type | Meaning |
|---|---|---|
| `empty_statement` | 3 | A step has a reason and `->` but nothing after it, as in `[01] sas(1, 2, 3) ->`. |
| `malformed_statement` | 3 | The text is not of the form `name(arguments)`. |
| `unclosed_parenthesis` | 3 | A `(` is never closed. |
| `trailing_text` | 3 | Something follows the statement's closing parenthesis; `details.trailing` holds it. |
| `unknown_function` | 3 | The statement name is not one the checker knows; `details.token` holds it. Also used for an unknown reason name. |
| `stmt_arg_type_invalid` | 11 | A known statement has arguments of the wrong number or kind. `details.statement` is its name and `details.parameters` the kinds it takes, such as `["segment", "point"]`. Also emitted when a `given(g_n)` step restates `g_n` with different arguments; `details.expected` and `details.actual` are the two statements. |

## Steps

Every step is judged on its own. A step that is not accepted gets exactly one
issue, and the steps after it are still judged.

### A step that does not parse

Spaces and a trailing `//` comment are ignored, so `[04]  // todo` is an
empty step.

| Code | Type | Meaning |
|---|---|---|
| `empty_step` | 3 | The line holds only a step number, as in `[01]`, or a number and a bare `->`. |
| `empty_reason` | 3 | Nothing comes before the `->`, as in `[01] -> con_seg(AB, BC)`. |
| `missing_step_number` | 3 | The line does not start with a step number in brackets. |
| `unclosed_step_number` | 3 | The step number's `]` is missing. |
| `missing_arrow` | 3 | The line has a reason or statement but no `->` between them. |
| `unknown_function` | 3 | The reason name is not one the checker has a rule for; `details.token` holds it. |
| `unreadable_given_citation` | 3 | A `given(...)` citation could not be read; `details.text` holds the reason. |
| `unreadable_dependencies` | 3 | The reason's dependency numbers could not be read; `details.text` holds the reason. |
| `invalid_given_dep` | 13 | A premise label such as `g_1` is cited by a reason other than `given`. It is cited with `given` in a step of its own, and that step's number is what other reasons cite. `details.ref` is the label. |
| `reason_dep_missing` | 9 | The reason cites the wrong number of dependencies (`expectedLength`, `receivedLength`). |

The statement codes above also apply to the step's conclusion.

### A step that cites a step that was not accepted

| Code | Type | Meaning |
|---|---|---|
| `upstream_dep_error` | 6 | The step was not judged; `details.dependsOn` lists the cited steps that were not accepted. |

### A step that parses and is rejected

It gets the first of these that applies, in this order.

| Code | Type | Meaning |
|---|---|---|
| `forward_reference` | 7 | The step cites itself or a later step; `details.ref` is the citation. |
| `invalid_given_dep` | 13 | `given` cites a label no premise has; `details.ref` is the label. |
| `stmt_arg_type_invalid` | 11 | `given(g_n)` restates `g_n`'s statement with different arguments. |
| `reason_stmt_mismatch` | 10 | `given(g_n)` concludes a different statement from `g_n` (`details.ref`); or, later in this order, the conclusion is not a statement the reason can conclude. `details.legalStatements` lists what it can conclude and `details.actualStatement` what the step wrote. |
| `reason_dep_type_mismatch` | 12 | A cited dependency states the wrong kind of fact for its slot: `details.index` is the slot, `expectedType` and `allowedTypes` what it accepts, `ref` the cited step, and `receivedType` what that step states. |
| `invalid_duplicate_stmt` | 14 | Two dependency slots cite the same fact (`firstIndex`, `secondIndex`); or, after the conclusion's statement is checked, the conclusion names one object twice (`statement`, `argument`). |
| *rule-specific code* | 1 | See the next table. |
| `reason_application_error` | 1 | The rule did not accept the step and nothing more specific applies. `details.reason` names the reason; what each one needs is listed [below](#what-each-rule-needs). Also emitted, with no step, when the steps do not match the problem's premises and goal. |

### Rule-specific causes (type 1)

These replace `reason_application_error` when the checker can say more about
why a particular rule did not accept the step. Every one carries
`details.reason` and `details.steps`.

| Code | Reasons | Meaning | Other details |
|---|---|---|---|
| `objs_not_equal` | `reflex` | `reflex` relates a segment or angle to itself, and these are different objects. | `pair` |
| `angle_not_declared` | `reflex`, `perp_con_ang` | An angle in the conclusion is not declared on an `ang:` line, which is what makes its rays genuine. `con_right` from `perp_con_ang` needs no declaration. | `angle` (`reflex`) or `angles` (`perp_con_ang`) |
| `triangle_not_declared` | `sas`, `sss`, `asa`, `aas`, `rhl` | Both triangles must be declared on a `tri:` line, which is what says they are genuine triangles. | `tri1`, `tri2` |
| `criterion_parts_dont_match_triangles` | `sas`, `sss`, `asa`, `aas`, `rhl` | The criterion needs the parts it names (`sas`: two sides and the angle between them; `sss`: all three sides; `asa`: two angles and the side between them; `aas`: two angles and a side not between them; `rhl`: a right angle, the hypotenuse, and a leg) of `tri1` congruent to the corresponding parts of `tri2`, cited in that order, and the cited steps do not state them. | `tri1`, `tri2` |
| `parts_not_corresponding_in_triangles` | `cpctc` | The conclusion pairs parts that do not correspond when the triangles are matched vertex by vertex, or in the way the earlier steps match them. | `tri1`, `tri2`, and `expected`: the part that does correspond to the conclusion's first object, when there is one |
| `no_correspondence_established` | `cpctc` | `con_tri` does not say which vertices correspond, and none of the earlier steps establishes a correspondence. A given congruence meant for `cpctc` is written `con_tri_ordered`. | `tri1`, `tri2` |
| `segs_not_subsegments_meeting_at_midpt` | `def_midpt` | The conclusion is not the two halves the midpoint makes. | `expected` |
| `bisector_not_in_both_half_angles` | `def_ang_bisect` | The bisector splits the angle into the two angles between it and each side, and the conclusion is not those two. | `angle`, `bisector` |
| `angle_centers_dont_match` | `def_ang_bisect` | Both halves of the bisected angle have their vertex at its vertex, and the concluded angles do not. | `vertex` |
| `right_angles_dont_match_conclusion` | `def_con_right` | The conclusion does not relate the two cited right angles. | `expected` |
| `angles_dont_share_centerpt` | `perp_con_ang` | Both angles must be right angles at the crossing point, between the perpendicular segments. | `point` |
| `no_shared_congruent_element` | `con_seg_transitive`, `con_ang_transitive`, `con_tri_transitive` | Transitivity needs the two congruences to share a segment, angle, or triangle. | |
| `no_shared_angle_bw_supp_pairs` | `con_supplements_same`, `con_complements_same` | The two cited pairs need an angle in common. | |
| `non_shared_angles_dont_match_con_ang_conclusion` | `con_supplements_same`, `con_complements_same` | The conclusion must relate the two angles the cited pairs do not share. | |
| `equilateral_and_equiangular_not_the_same_triangle` | `equilat_equiang`, `equiang_equilat` | The cited step and the conclusion are about different triangles. | `tri1`, `tri2` |
| `no_intersecting_seg_produces_vert_angles` | `vert_ang` | `vert_ang` cites just the `intersect_seg` diagram premise whose crossing makes the angles vertical, as in `vert_ang(d_01)`; the cited label is not one, names something else, or its crossing does not make the concluded angles opposite. | `label`, and `premise` when the label names one |
| `transversal_angles_or_parallel_segs_dont_form_valid_config` | `altint`, `altext`, `corresp_ang`, `sameside_ang`, and their converses | The parallel-line rules read the figure from a `transversal` diagram premise. Either the problem has none, or none crosses the two lines with the concluded angles as the pair the reason is about. | `hasTransversal` |
| `segs_not_opp_sides_of_quad` | `pgram_opp_sides`, `def_parallelogram` | `pgram_opp_sides`: the concluded segments are not opposite sides. `def_parallelogram`: the cited steps must state both pairs of opposite sides parallel. | `quad`, `oppositeSides`, and `pair` for `pgram_opp_sides` |
| `angles_not_opp_angles_of_quad` | `pgram_opp_angs`, `kite_opp_con_ang` | The concluded angles are not opposite corners (`pgram_opp_angs`), or not the two corners the kite premise selects (`kite_opp_con_ang`). | `quad`, and `pair` and `oppositeAngles`, or `expected` |
| `angles_not_consecutive_in_quad` | `pgram_consec_angs` | Two corners are supplementary when they share a side, and these do not. | `a1`, `a2`, `quad` |
| `angle_or_seg_not_within_quad` | `rhombus_opp_bisect` | A rhombus diagonal bisects the two corners it joins, and the concluded segment and angle are not such a pair. | `angle`, `segment`, `quad` |
| `angles_not_base_angle_pair_of_trap` | `isos_trap_base_angs_conv` | The base angles of an isosceles trapezoid are the two corners at either end of one of its parallel sides. | `quad` |
| `conclusion_elements_not_in_quad` | `rectangle` | A rectangle's corners are right angles and its opposite sides congruent; the conclusion must name corners or opposite sides of it. | `quad` |
| `quad_stmts_refer_to_diff_quads` | `rectangle_pgram`, `rhombus_pgram`, and the rules that cite a parallelogram or trapezoid to conclude a rhombus, rectangle, or isosceles trapezoid | The cited and concluded quadrilaterals are different figures. A quadrilateral may be named by any rotation or reversal of its letters. | `pair` |
| `segs_not_both_diagonals_of_quad` | `isos_trap_con_diags`, `pgram_diag_bisect`, `rhombus_diag_perp`, `kite_diag_perp` | The cited congruence, or the conclusion, is not about the two diagonals. | `s1`, `s2`, `quad`, `diagonals` |
| `no_intersect_seg_premise_for_diagonals_at_this_point` | `pgram_diag_bisect`, `rhombus_diag_perp`, `kite_diag_perp` | The conclusion is about the two diagonals at a point no `intersect_seg` premise places at their crossing. Without it the point could sit anywhere in the figure. | `expected`: the premise that would place it |
| `segs_not_radii_of_circle` | `def_radius` | The conclusion is not the congruence the cited radius gives. | `expected` |
| `tangent_segs_have_no_common_ext_pt` | `con_tangents_ext` | Two tangents to one circle from one outside point are congruent; the cited tangents must share their outside endpoint. | |
| `tangent_and_radius_have_diff_tangency_pts` | `tangent_perp`, `tangent_perp_conv` | The tangent and the radius must meet at the point of tangency, on the same circle, and the perpendicular is between those two segments there. | |

### What each rule needs

What `reason_application_error` means for the rules whose failures have no
more specific code.

| Reason | Needs |
|---|---|
| `aa_sim` | Two triangles with two pairs of congruent angles are similar: cite `con_ang` of two corresponding pairs and conclude `sim_tri` with the vertices in corresponding order. |
| `ang_bisect_conv` | A ray splitting an angle into two congruent halves bisects it: cite `con_ang` of exactly the two halves and conclude `ang_bisect` of the whole angle and the ray. |
| `base_angle` | A triangle with two congruent sides has the angles opposite them congruent: cite `con_seg` of the two legs from the apex and conclude `con_ang` of the base angles. |
| `base_angle_conv` | A triangle with two congruent angles has the sides opposite them congruent: cite `con_ang` of the base angles and conclude `con_seg` of the two legs from the apex. |
| `chord_bisect_conv` | The perpendicular bisector of a chord passes through the centre: cite the `perp_bisector` and the `chord` it bisects, and conclude `center_on_line` of the circle and the bisector. |
| `con_chords_intersect_arcs` | Congruent arcs of one circle have congruent chords: cite `con_arc` of the two arcs and conclude `con_seg` of their chords. |
| `con_complements` | Angles complementary to congruent angles are congruent: cite two complementary pairs and the `con_ang` relating one angle of each, and conclude `con_ang` of the other two. |
| `con_inscribed_angs` | Inscribed angles on one chord intercepting the same arc are congruent: cite two `minor_inscribed_ang` or two `major_inscribed_ang` steps on the same circle and chord, and conclude `con_ang` of the two angles. |
| `con_supplements` | Angles supplementary to congruent angles are congruent: cite two supplementary pairs and the `con_ang` relating one angle of each, and conclude `con_ang` of the other two. |
| `def_con_tri` | Triangles with all six corresponding parts congruent are congruent: cite the three side and three angle congruences, in corresponding order. |
| `def_equiangular` | A triangle whose three angles are congruent is equiangular: cite congruences covering each of its angles. |
| `def_equilateral` | A triangle whose three sides are congruent is equilateral: cite congruences covering each of its sides. |
| `def_linear_pair` | The two angles of a linear pair are supplementary: conclude `supplementary` of exactly the two angles of the cited `linear_pair`. |
| `def_radius_conv` | A segment from a line through the centre to a point on the circle is a radius: cite `center_on_line` of the circle and a segment, with a premise placing the segment's end on the circle, and conclude `radius` of that end. |
| `inscribed_semi` | An angle inscribed in a semicircle is right: cite the diameter whose endpoints the angle's rays reach, with the `inscribed_angle` premise placing its vertex on the circle. |
| `isos_trap_base_angs` | A trapezoid with congruent base angles is isosceles: cite `con_ang` of the two corners at one end of a parallel side, and the trapezoid premise. |
| `linear_pair_conv` | Two supplementary angles sharing a ray form a linear pair when their other rays are opposite: cite `supplementary` of the two angles, with an `on_line` premise placing their common vertex on the segment between the two other points, and conclude `linear_pair` of the same angles. |
| `para_transitive` | Two lines parallel to a third are parallel: cite two `para` statements sharing a segment and conclude `para` of the other two. |
| `perp_bisector` | A point on the perpendicular bisector of a segment is as far from both ends: cite the `perp` at the midpoint and the `midpt`, and conclude `con_seg` of the two distances. |
| `pgram_opp_angs_conv` | Both pairs of opposite angles congruent make a parallelogram: cite `con_ang` of each pair of opposite corners. |
| `pgram_opp_side_para` | One pair of opposite sides parallel and congruent makes a parallelogram: cite `con_seg` and `para` of the same two opposite sides. |
| `pgram_opp_sides_conv` | Both pairs of opposite sides congruent make a parallelogram: cite `con_seg` of each pair of opposite sides. |
| `radius_chord_bisect` | A radius perpendicular to a chord bisects it: cite the `perp`, the `radius`, and the `chord`, and conclude `seg_bisect` of the radius's line, the chord, and the foot. |
| `rect_diag_con` | A rectangle's diagonals are congruent: conclude `con_seg` of its two diagonals. |
| `rect_diag_con_conv` | A parallelogram with congruent diagonals is a rectangle: cite `con_seg` of its two diagonals and the parallelogram. |
| `rhombus` | A rhombus's sides are congruent: conclude `con_seg` of two of its sides. |
| `rhombus_consec_sides` | A parallelogram with two consecutive sides congruent is a rhombus: cite the parallelogram and `con_seg` of two sides that share a corner. |
| `supplementary_inscribed_angs` | Inscribed angles on one chord intercepting opposite arcs are supplementary: cite one `minor_inscribed_ang` and one `major_inscribed_ang` step on the same circle and chord, and conclude `supplementary` of the two angles. |
| `third_angle` | Two triangles with two pairs of congruent angles have congruent third angles: cite the two pairs and conclude `con_ang` of the remaining corners. |

## Whole proof

| Code | Type | Meaning |
|---|---|---|
| `non_consecutive_step_numbers` | 3 | Step labels do not run 1, 2, 3, ... Dependencies are counted by position, so every citation after the gap points somewhere else. `details.expected` and `details.found` say where it went wrong. |
| `goal_not_reached` | 4 | The proof was not accepted and no accepted step states the goal. `details.goal` is the goal; `details.statedBy` is the step that states it without being accepted, absent when no step states it at all. |
| `cycle` | 8 | Steps depend on each other in a cycle; `details.steps` lists them. |
| `unused_step` | 5 | Steps no path to the goal uses. Not fatal. |
| `duplicate_conclusion` | 14 | A step restates a fact a premise or earlier step already gives (`details.duplicateOf`). Not fatal. |
| `unexpected_error` | 16 | An exception escaped the CLI (`proofCheckerCli.ts`) or HTTP server (`server.ts`); `details.msg` holds its message. |
