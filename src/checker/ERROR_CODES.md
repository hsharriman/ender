# Checker Error Codes

Every error the checker emits is an `ErrorDetails` object (`src/checker/types/checkerTypes.ts`) whose `code` field is one of the strings below. Codes are grouped by the pipeline stage that emits them. Keep this file in sync with `src/checker/checker/` and `src/checker/grammar/`.

## Parser (`grammar/lezerParser.ts`)

| Code | Meaning |
|---|---|
| `invalid_segment` | A segment label repeats the same point letter (e.g. `AA`); segments need two distinct points. |
| `invalid_angle` | An angle label (`a_XYZ`) does not have exactly 3 distinct point letters. |
| `invalid_triangle` | A triangle label (`t_XYZ`) does not have exactly 3 distinct point letters. |
| `invalid_quadrilateral` | A quadrilateral label (`q_WXYZ`) does not have exactly 4 distinct point letters. |
| `invalid_circle` | A circle label (`c_XY`) does not have exactly 2 distinct point letters. |
| `invalid_object_type` | Fallback when a parsed object's type is none of the known kinds (point, segment, angle, triangle, quad, circle). |
| `wrong_premise_type` | The token right after a premise section head (`pt:`, `tri:`, `seg:`, `ang:`, `quad:`, `circ:`) is a geometric literal of a different kind. |
| `malformed_identifier` | A prefixed object (`a_`/`t_`/`q_`/`c_`) has the wrong number of points (e.g. `t_RA`), so the lexer saw it as a plain identifier. |
| `missing_coordinates` | A point in the `pt:` section is not followed by a valid `(x, y, offsetCode)` placement. |
| `unexpected_token` | A bare geometric literal appears in the premises outside of any recognized section. |
| `reason_as_statement` | A known reason name (e.g. `sas`) is used where a statement is expected (premise, goal, or step conclusion). |
| `unknown_function` | A statement function name is not found in the statement definitions (`stmts.defs.ts`). |

## Premise building (`checker/premises.ts`)

| Code | Meaning |
|---|---|
| `parser_error` | Premise construction failed; `details.message` explains why: unknown statement function, point not defined in `pt:`, statement needing its `_premise` counterpart, `ang_bisect` segment not overlapping the angle, invalid trapezoid bases, or a `transversal` statement without exactly 8 defined points. |

## Structural validation (`checker/validators.ts`, `checker/graph.ts`)

| Code | Meaning |
|---|---|
| `reason_stmt_mismatch` | The step's conclusion statement is not legal for its reason: not in the reason's allowed conclusions, doesn't match the cited `g_n` premise's function, or the statement is diagram-only/premises-only. |
| `stmt_arg_num_args_incorrect` | A `given(g_n)` step's conclusion has a different argument count than the cited given premise. |
| `stmt_arg_type_invalid` | A `given(g_n)` step's conclusion argument differs in type or value from the corresponding argument of the cited given premise. |
| `reason_dep_missing` | The reason has the wrong number of dependency refs, or a ref points to a step that doesn't exist or has no statement. |
| `reason_dep_type_mismatch` | A cited dependency's statement function doesn't match the type the reason expects in that slot (including allowed group substitutions). |
| `object_not_in_premises` | A statement argument names a geometric object (point, segment, angle, triangle, quad, circle) that doesn't exist in the geometry built from the premises. |
| `invalid_duplicate_stmt` | Two arguments of one statement resolve to the same geometric object (when the statement disallows duplicates), or two dependency slots of a reason cite the same statement. |
| `duplicate_step` | Two proof steps are identical: same reason, reason arguments, statement function, and statement arguments. |
| `duplicate_step_number` | The same step number label (e.g. `[03]`) is used by more than one proof step. |
| `invalid_step_number_labels` | Some proof step labels are not numeric, so sequential numbering can't be checked. |
| `no_step_numbers` | The proof contains no numbered proof steps at all. |
| `non_consecutive_step_numbers` | Sorted proof step numbers don't increase by exactly 1 from the first step (gaps or out-of-sequence labels). |
| `illegal_diagram_dep` | A `[d_xx]` diagram premise uses a statement that isn't marked `isDiagramOnly`; such statements belong in given or proof steps. |
| `forward_reference` | A proof step cites its own step number or a later one; steps may only depend on earlier numbered steps. |
| `invalid_given_dep` | A `g_n` given-premise ref is used as a dependency of a reason other than `given(...)`. |
| `upstream_dep_error` | The step itself may be fine, but a cited dependency step was already marked incorrect, so this step cannot be validated. |

## Proof-level results (`proofChecker.ts`)

| Code | Meaning |
|---|---|
| `goal_not_reached` | No proof step's statement exactly matches the goal (same function and same arguments in order). |
| `cycle` | The step dependency graph contains a cycle (steps directly or indirectly depend on each other). |
| `unused_step` | Steps whose conclusions are never used on any dependency path reaching the goal step. |
| `unused_step_goal_already_met` | Unused steps that appear after the step where the goal was already reached. |
| `unexpected_error` | An uncaught exception escaped the checking pipeline (CLI `proofCheckerCli.ts` / HTTP `server.ts`); `details.msg` holds the exception message. |
| `reason_application_error` | A reason's geometric check itself threw an exception (`reasonApplication.ts` catch-all), usually from malformed or missing geometry. |

## Reason application — shared helpers (`checker/reasonChecks/utils.ts`)

| Code | Meaning |
|---|---|
| `objs_not_equal` | Two objects that the reason requires to be identical (same segment, angle, circle, quadrilateral, or point) are not equal. Used where no more specific code applies (e.g. `reflex`, inscribed angles' circles). |
| `no_shared_congruent_element` | Transitivity: the two congruence dependencies share no common element, or the two non-shared elements don't match the concluded pair. |
| `angles_dont_share_centerpt` | Right-angle-on-perpendicular check: the angle's vertex is not the intersection point of the two perpendicular segments. |
| `shared_side_not_on_perp_segs` | Right-angle-on-perpendicular check: no name variant of the angle has its two outer points lying one on each perpendicular segment. |

## Reason application — angles (`checker/reasonChecks/angleChecks.ts`)

| Code | Meaning |
|---|---|
| `angles_not_linear_pair` | The supplementary pair doesn't equal the linear-pair angles (in either order). |
| `no_shared_angle_bw_supp_pairs` | The two supplementary statements have no angle in common. |
| `non_shared_angles_dont_match_con_ang_conclusion` | After removing the shared (or congruent) angles from each supplementary pair, the remaining angles don't equal the concluded congruent pair. |
| `con_angles_appear_in_same_supp_pair` | Each angle of the given congruent pair must appear in exactly one supplementary statement; one appears in both or in neither. |
| `con_angles_not_distributed_across_pairs` | Both angles of the given congruent pair fall in the same supplementary statement; they must be split across the two statements. |
| `no_intersecting_seg_produces_vert_angles` | No `intersect_seg` diagram premise makes the concluded angles vertical: distinct angles, vertices at the intersection point, rays along both segments. |
| `angle_centers_dont_match` | `def_ang_bisect`: the two concluded angles and the bisected angle don't all share the same vertex. |
| `bisector_not_in_both_half_angles` | `def_ang_bisect`: the bisecting segment is not a ray of both concluded half-angles. |
| `right_angles_dont_match_conclusion` | `def_con_right`: the two right angles don't equal the concluded congruent angle pair (in either order). |

## Reason application — lines & transversals (`checker/reasonChecks/lineChecks.ts`)

| Code | Meaning |
|---|---|
| `no_transversal_produces_alt_int_angles` | No `transversal` diagram premise validates the angles as alternate interior angles (emitted only if no transversal produced a more specific failure). |
| `no_transversal_produces_alt_ext_angles` | Same as above, for alternate exterior angles. |
| `no_transversal_produces_same_side_int_angles` | Same as above, for same-side interior angles. |
| `no_transversal_produces_corresp_angles` | Same as above, for corresponding angles. |
| `transversal_angles_or_parallel_segs_dont_form_valid_config` | Transversal setup is invalid: angles are equal, segments coincide, the parallel statement's segments don't match the crossed segments, or intersection points aren't on the crossed lines. |
| `alt_int_angle_ctrs_not_at_inner_intersections` | Alt-interior: angle vertices are not at the declared intersection points (`i1`, `i2`) of the transversal statement. |
| `alt_int_angles_not_directed_inward` | Alt-interior: each angle must have a ray toward the other declared intersection point (along the transversal's inner part). |
| `alt_int_angles_not_on_alternating_sides` | Alt-interior: the angles open toward the same side of the transversal instead of opposite sides. |
| `alt_ext_transversal_endpt_at_intersection` | Alt-exterior: a transversal endpoint coincides with an intersection point, so no exterior ray exists there. |
| `alt_ext_intersections_not_on_transversal_line` | Alt-exterior: the intersection points don't lie on the transversal's line. |
| `alt_ext_angle_ctrs_or_rays_not_at_outer_pts` | Alt-exterior: angle vertices aren't at the intersections, or their rays don't extend toward the transversal's outer endpoints. |
| `alt_ext_angles_not_on_alternating_sides` | Alt-exterior: the angles are not on alternating sides of the transversal. |
| `same_side_angle_ctrs_not_at_intersections` | Same-side interior: angle vertices are not at the two intersection points. |
| `same_side_angles_not_directed_inward` | Same-side interior: each angle must have a ray toward the other intersection point. |
| `same_side_angles_not_on_same_side` | Same-side interior: the angles don't open toward the same side of the transversal. |
| `corresp_transversal_endpt_at_intersection` | Corresponding: a transversal endpoint coincides with an intersection point. |
| `corresp_intersections_not_on_transversal_line` | Corresponding: the intersection points don't lie on the transversal's line. |
| `corresp_angle_ctrs_not_at_intersections` | Corresponding: angle vertices are not at the two intersection points. |
| `corresp_angles_not_in_corresponding_directions` | Corresponding: the angles don't point the same way along the transversal (one toward the other intersection, the other toward its outer endpoint). |
| `corresp_angles_not_on_same_side` | Corresponding: the angles are not on the same side of the transversal. |
| `segs_not_subsegments_meeting_at_midpt` | `midpt`: the concluded segments aren't two distinct subsegments of the bisected segment that both contain the midpoint. |
| `points_do_not_share_intersection_on_both_segs` | `intersect_seg`: the two point-on statements don't name the same point lying on both segments and matching the intersection point. |
| `no_intersect_pt_in_perp_stmt` | The cited `perp` statement has no intersection point, so perpendicularity checks can't proceed. |
| `angles_not_adj_at_perp` | `perp_con_ang`: both right angles sit at the perpendicular, but they share no outer-ray endpoint, so they aren't adjacent. |
| `midpt_not_at_perp_intersection` | `perp_bisector`: the midpoint is not the same point as the perpendicular intersection. |
| `bisected_halves_dont_match_con_segs` | The concluded congruent segments aren't the two halves of the bisected segment split at the bisection point. |

## Reason application — triangles (`checker/reasonChecks/triangleChecks.ts`)

| Code | Meaning |
|---|---|
| `element_not_assignable_to_either_triangle` | A congruent-pair element (segment or angle) can't be matched into either cited triangle under any assignment or angle-name variant. |
| `con_pair_not_assigned_to_separate_triangles` | The pair's elements don't map exclusively one-per-triangle; a shared (identical) element is allowed only if it belongs to both triangles. |
| `angle_center_not_bw_both_con_segs` | SAS: the congruent angle's vertex is not an endpoint of both congruent segments, so it isn't the included angle. |
| `seg_touches_both_or_neither_con_angle` | AAS: the congruent segment must touch exactly one of the two congruent angles' vertices; it touches both or neither. |
| `seg_not_bw_both_con_angles` | ASA: the congruent segment doesn't have both congruent angles' vertices as endpoints, so it isn't the included side. |
| `rhl_first_seg_must_be_hypotenuse_and_second_must_be_leg` | RHL: the leg must contain the right-angle vertex and the hypotenuse must not; the given segments violate this. |
| `segs_not_corresponding_in_triangles` | CPCTC: the two segments occupy different side positions in the (ordered) triangles, so they don't correspond. |
| `angles_not_corresponding_in_triangles` | CPCTC: the two angles occupy different angle positions in the (ordered) triangles, so they don't correspond. |
| `conclusion_must_be_con_seg_or_con_ang` | CPCTC: the conclusion statement is neither `con_seg` nor `con_ang`. |
| `con_pairs_dont_cover_each_side_and_angle_of_both_triangles_exactly_once` | `def_con_tri`: the three segment pairs and three angle pairs don't cover each triangle's sides and angles exactly once each. |
| `triangle_not_found_from_con_angles` | No triangle (or no two distinct triangles) in the diagram contains the cited congruent angles. |
| `con_angle_pairs_dont_cover_each_angle_of_both_triangles_exactly_once` | Third-angle: the three angle pairs don't cover each triangle's three angles exactly once each. |
| `con_segs_not_two_distinct_sides_of_isosceles_triangle` | The concluded congruent segments aren't two distinct sides of the cited isosceles triangle. |
| `base_angle_vertex_not_at_endpoint_of_exactly_one_leg` | Base angles: the segments aren't sides of the triangle, or an angle's vertex doesn't appear in exactly one congruent leg (apex angles fail this). |
| `equilateral_and_equiangular_not_the_same_triangle` | The equilateral and equiangular statements refer to different triangles. |
| `not_all_sides_appear_exactly_twice_in_con_segs` | Equilateral: some side of the triangle doesn't appear exactly twice among the six congruent-segment operands. |
| `not_all_angles_appear_exactly_twice_in_con_angs` | Equiangular: some angle of the triangle doesn't appear exactly twice among the six congruent-angle operands. |

## Reason application — circles (`checker/reasonChecks/circleChecks.ts`)

| Code | Meaning |
|---|---|
| `tangent_and_radius_on_diff_circles` | The tangent and radius statements refer to different circles. |
| `tangent_and_radius_have_diff_tangency_pts` | The tangent statement's tangency point is not the same point the radius statement touches on the circle. |
| `perp_intersect_pt_doesnt_match_tangency_pt` | The `perp` statement's intersection point is not the tangency point. |
| `tangent_seg_not_in_perp_stmt` | Neither segment of the `perp` statement matches the tangent segment (including sub/parent segment variants). |
| `other_perp_seg_not_a_radius_to_tangency_pt` | The non-tangent perpendicular segment doesn't contain both the circle's center and the tangency point, so it isn't the radius. |
| `tangent_stmts_on_diff_circles` | The two tangent statements refer to different circles. |
| `tangent_stmts_share_same_tangency_pt` | The two tangent statements touch the circle at the same point; congruent tangents need two distinct tangency points. |
| `con_segs_dont_match_tangent_segs` | The concluded congruent segments aren't the two tangent segments (in either order). |
| `tangent_segs_have_no_common_ext_pt` | The two tangent segments' non-tangency endpoints are different points; congruent tangents must share one external endpoint. |
| `radius_and_chord_on_diff_circles` | The radius and chord statements refer to different circles. |
| `neither_perp_seg_matches_the_chord` | Neither segment of the `perp` statement equals the chord from the `chord` statement. |
| `radius_dir_seg_doesnt_contain_circle_center` | The non-chord perpendicular segment doesn't contain the circle's center, so it can't lie along a radius. |
| `conclusion_segs_dont_match_chord_and_radius_dir_segs` | The `seg_bisect` conclusion doesn't reference both the chord and the radius-direction segment. |
| `conclusion_midpt_doesnt_match_perp_intersect_pt` | The `seg_bisect` conclusion's bisection point is not the perpendicular intersection point. |
| `conclusion_and_chord_on_diff_circles` | The concluded radius statement's circle differs from the chord statement's circle. |
| `bisected_seg_not_the_chord` | The segment bisected by the `perp_bisector` statement is not the chord. |
| `conclusion_pt_not_endpoint_of_perp_bisector` | The concluded radius point is not an endpoint of the perpendicular bisecting segment. |
| `inscribed_angles_dont_match_con_ang_conclusion` | The concluded congruent angles aren't the two cited inscribed angles (in either order). |
| `inscribed_angles_dont_have_same_endpoints` | The two inscribed angles don't share the same endpoints, so they don't subtend the same arc. |
| `angle_not_inscribed_in_circle` | A concluded inscribed angle has a point (vertex or endpoint) that does not lie on the circle. |

## Reason application — quadrilaterals (`checker/reasonChecks/polyChecks.ts`)

| Code | Meaning |
|---|---|
| `conclusion_elements_not_in_quad` | Rectangle reason: the concluded angles/segments aren't contained in the quadrilateral, or the conclusion statement type isn't supported. |
| `angle_not_contained_in_rect` | The cited right angle is not one of the rectangle's angles. |
| `rect_and_pgram_are_diff_quads` | The rectangle and parallelogram statements refer to different quadrilaterals. |
| `segs_not_opp_sides_of_quad` | The segment pair is not a pair of opposite sides of the quadrilateral. |
| `opp_side_pair_must_match_in_both_stmts` | `pgram_opp_side_para`: the congruent and parallel statements must cite the same opposite-side pair, but they differ. |
| `both_pairs_are_the_same_opp_side_pair` | Parallelogram converse: the two statements cite the same opposite-side pair; two different pairs are required. |
| `angles_not_opp_angles_of_quad` | The angle pair is not a pair of opposite angles of the quadrilateral (also used for kite opposite-angle mismatches). |
| `both_pairs_are_the_same_angle_pair` | The two angle statements cite the same pair; two different angle pairs are required. |
| `angles_not_consecutive_in_quad` | The angles aren't consecutive in the quadrilateral, or the supplementary statements don't share exactly one angle whose neighbors are the other two. |
| `segs_not_both_diagonals_of_quad` | At least one of the concluded segments is not a diagonal of the quadrilateral. |
| `seg_not_a_diagonal_of_quad` | A bisecting segment is not exactly a diagonal of the quadrilateral (no sub/parent substitution allowed in `pgram_diag_bisect`). |
| `bisect_stmts_have_diff_midpts` | The two `seg_bisect` statements have different bisection points; the diagonals must bisect each other at one shared point. |
| `bisect_stmts_have_diff_seg_pairs` | The two `seg_bisect` statements cite different segment pairs; both must bisect the same two diagonals. |
| `segs_are_not_the_same_diagonal` | Rhombus angle-bisect: the two bisecting segments differ, or the segment is not a diagonal of the quadrilateral. |
| `angle_or_seg_not_within_quad` | Rhombus angle-bisect (single form): the angle is not in the quadrilateral, or the segment is not one of its diagonals. |
| `segs_not_consecutive_sides_of_quad` | The concluded congruent segments are not consecutive sides of the rhombus. |
| `angles_not_base_angle_pair_of_trap` | The angles are not a base-angle pair of the (isosceles) trapezoid. |
| `trap_and_isos_trap_are_diff_quads` | The trapezoid and isosceles-trapezoid statements refer to different quadrilaterals. |
| `quad_stmts_refer_to_diff_quads` | Two quadrilateral-classification statements (e.g. parallelogram and rectangle) that must describe the same quadrilateral refer to different ones. |
