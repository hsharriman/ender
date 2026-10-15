# Checker Error Codes

This is untrusted human-readable metadata for the solver/feedback prompts. It
does not drive proof acceptance. Every code below is emitted by
`rocq/Ender/CompleteChecker.v`, except `unexpected_error`, which comes from the
TypeScript wrappers; keep this file in sync with those sites.

`npm run checkProof` and `POST /check` return one of two shapes:

- `{ "isCorrect": ..., "issues": [...] }` once the problem header parses. A
  proof can be accepted and still carry `unused_step` or
  `duplicate_conclusion` issues; neither is fatal.
- `{ "isCorrect": false, "errors": [...] }` when the header does not parse.
  `errors` holds exactly one `parser_error`, `unknown_function`, or
  `stmt_arg_type_invalid` issue naming the offending `line`.

Each issue is `{ type, code, details }`. Most `details` carry a `message`
explaining the problem in words, and step-level issues name the step in
`step` or `steps` using the number written in brackets.

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

## Parsing

| Code | Type | Meaning |
|---|---|---|
| `parser_error` | 3 | A line could not be read. In the header: the file has no `pt:` or `steps:` line, has no goal (or more than one), a line is not a declaration, premise, or goal, or a statement is missing a parenthesis or has trailing text. In a step: the line lacks `[n]`, a reason, or `->`, a `given` citation could not be read, or its dependency numbers could not be read. |
| `unknown_function` | 3 | A statement name (header or step) or a reason name is not one the checker knows. `details.token` holds the name. |
| `stmt_arg_type_invalid` | 11 | A known statement has arguments of the wrong number or kind; `details.message` gives the signature it takes. |
| `non_consecutive_step_numbers` | 3 | Step labels do not run 1, 2, 3, ... Dependencies are counted by position, so every citation after the gap points somewhere else. |

## Steps

Every step is judged on its own. A step that is not accepted gets exactly one
issue, and the steps after it are still judged.

A step that does not parse gets `parser_error`, `unknown_function`, or
`stmt_arg_type_invalid` (above), or one of:

| Code | Type | Meaning |
|---|---|---|
| `invalid_given_dep` | 13 | A premise label such as `g_1` is cited by a reason other than `given`; it is cited with `given` in a step of its own, and that step's number is what other reasons cite. |
| `reason_dep_missing` | 9 | The reason cites the wrong number of dependencies (`expectedLength`, `receivedLength`). |

A step that parses but cites a step that was not accepted is blocked:

| Code | Type | Meaning |
|---|---|---|
| `upstream_dep_error` | 6 | The step was not judged; `details.dependsOn` lists the cited steps that were not accepted. |

A step that parses and is rejected gets the first of these that applies, in
this order:

| Code | Type | Meaning |
|---|---|---|
| `forward_reference` | 7 | The step cites itself or a later step. |
| `invalid_given_dep` | 13 | `given` cites a label no premise has. |
| `stmt_arg_type_invalid` | 11 | `given(g_n)` restates `g_n`'s statement with different arguments. |
| `reason_stmt_mismatch` | 10 | `given(g_n)` concludes a different statement from `g_n`; or, later in this order, the conclusion is not a statement the reason can conclude (`details.legalStatements`). |
| `reason_dep_type_mismatch` | 12 | A cited dependency states the wrong kind of fact for its slot: `details.index` is the slot, `expectedType` and `allowedTypes` what it accepts, `receivedType` what the cited step states. |
| `invalid_duplicate_stmt` | 14 | Two dependency slots cite the same fact; or, after the conclusion's statement is checked, the conclusion names one object twice. |
| *rule-specific code* | 1 | See the next table. |
| `reason_application_error` | 1 | The rule did not accept the step and nothing more specific applies. `details.message`, when present, says what the rule needs. Also emitted, without a step, when the steps do not match the problem's premises and goal. |

### Rule-specific causes (type 1)

These replace `reason_application_error` when the checker can say more about
why a particular rule did not accept the step.

| Code | Reasons | Meaning |
|---|---|---|
| `objs_not_equal` | `reflex` | The two segments or angles are different objects. |
| `angle_not_declared` | `reflex`, `perp_con_ang` | An angle in the conclusion is not declared on an `ang:` line, which is what makes its rays genuine. |
| `triangle_not_declared` | `sas`, `sss`, `asa`, `aas`, `rhl` | A triangle in the conclusion is not declared on a `tri:` line. |
| `criterion_parts_dont_match_triangles` | `sas`, `sss`, `asa`, `aas`, `rhl` | The cited steps do not state the criterion's parts of the two triangles, in corresponding order. |
| `parts_not_corresponding_in_triangles` | `cpctc` | The conclusion pairs parts that do not correspond under the triangle congruence. |
| `no_correspondence_established` | `cpctc` | The cited `con_tri` names no vertex correspondence and no earlier step establishes one. |
| `segs_not_subsegments_meeting_at_midpt` | `def_midpt` | The conclusion is not the two halves the midpoint makes. |
| `bisector_not_in_both_half_angles` | `def_ang_bisect` | The conclusion is not the two angles between the bisector and each side. |
| `angle_centers_dont_match` | `def_ang_bisect` | The concluded angles do not have their vertex at the bisected angle's vertex. |
| `right_angles_dont_match_conclusion` | `def_con_right` | The conclusion does not relate the two cited right angles. |
| `angles_dont_share_centerpt` | `perp_con_ang` | The angles are not right angles at the crossing point, between the perpendicular segments. |
| `no_shared_congruent_element` | `con_seg_transitive`, `con_ang_transitive`, `con_tri_transitive` | The two cited congruences share no segment, angle, or triangle. |
| `no_shared_angle_bw_supp_pairs` | `con_supplements_same`, `con_complements_same` | The two cited pairs have no angle in common. |
| `non_shared_angles_dont_match_con_ang_conclusion` | `con_supplements_same`, `con_complements_same` | The conclusion does not relate the two angles the pairs do not share. |
| `equilateral_and_equiangular_not_the_same_triangle` | `equilat_equiang`, `equiang_equilat` | The cited step and the conclusion are about different triangles. |
| `no_intersecting_seg_produces_vert_angles` | `vert_ang` | The cited premise is not an `intersect_seg` whose crossing makes the concluded angles vertical. |
| `transversal_angles_or_parallel_segs_dont_form_valid_config` | `altint`, `altext`, `corresp_ang`, `sameside_ang`, and their converses | No `transversal` premise crosses the two lines with the concluded angles in the pair the reason is about, or the problem has no `transversal` premise. |
| `segs_not_opp_sides_of_quad` | `pgram_opp_sides`, `def_parallelogram` | The segments are not opposite sides of the parallelogram. |
| `angles_not_opp_angles_of_quad` | `pgram_opp_angs`, `kite_opp_con_ang` | The angles are not the opposite corners the quadrilateral premise selects. |
| `angles_not_consecutive_in_quad` | `pgram_consec_angs` | The angles are not two corners sharing a side. |
| `angle_or_seg_not_within_quad` | `rhombus_opp_bisect` | The segment is not a diagonal bisecting the named corner. |
| `angles_not_base_angle_pair_of_trap` | `isos_trap_base_angs_conv` | The angles are not the two corners at either end of a parallel side. |
| `conclusion_elements_not_in_quad` | `rectangle` | The conclusion names neither corners nor opposite sides of the rectangle. |
| `quad_stmts_refer_to_diff_quads` | `rectangle_pgram`, `rhombus_pgram`, and the rules that cite a parallelogram or trapezoid to conclude a rhombus, rectangle, or isosceles trapezoid | The cited and concluded quadrilaterals are different figures. |
| `segs_not_both_diagonals_of_quad` | `isos_trap_con_diags`, `pgram_diag_bisect`, `rhombus_diag_perp`, `kite_diag_perp` | The cited congruence, or the conclusion, is not about the two diagonals. |
| `no_intersect_seg_premise_for_diagonals_at_this_point` | `pgram_diag_bisect`, `rhombus_diag_perp`, `kite_diag_perp` | No `intersect_seg` premise puts the concluded point where the two diagonals cross. |
| `segs_not_radii_of_circle` | `def_radius` | The conclusion is not the congruence the cited radius gives. |
| `tangent_segs_have_no_common_ext_pt` | `con_tangents_ext` | The cited tangents do not share their outside endpoint. |
| `tangent_and_radius_have_diff_tangency_pts` | `tangent_perp`, `tangent_perp_conv` | The tangent and radius do not meet at the point of tangency on the same circle. |

## Whole proof

| Code | Type | Meaning |
|---|---|---|
| `goal_not_reached` | 4 | The proof was not accepted and no accepted step states the goal. `details.message` says whether no step states it or which step states it without being accepted. |
| `cycle` | 8 | Steps depend on each other in a cycle; `details.steps` lists them. |
| `unused_step` | 5 | Steps no path to the goal uses. Not fatal. |
| `duplicate_conclusion` | 14 | A step restates a fact a premise or earlier step already gives (`details.duplicateOf`). Not fatal. |
| `unexpected_error` | 16 | An exception escaped the CLI (`proofCheckerCli.ts`) or HTTP server (`server.ts`); `details.msg` holds its message. |
