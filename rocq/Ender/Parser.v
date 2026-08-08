From Stdlib Require Import Ascii String List Bool Nat.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Syntax Ender.Semantics Ender.Checker.
Import ListNotations.
Import EnderSyntax.
Open Scope string_scope.

Definition chars := list ascii.

Definition is_space (c : ascii) : bool :=
  Ascii.eqb c " "%char || Ascii.eqb c "009"%char || Ascii.eqb c "013"%char.

Fixpoint remove_space (text : chars) : chars :=
  match text with
  | [] => []
  | c :: rest => if is_space c then remove_space rest else c :: remove_space rest
  end.

Fixpoint starts_with (prefix text : chars) : bool :=
  match prefix, text with
  | [], _ => true
  | _, [] => false
  | p :: ps, c :: cs => if Ascii.eqb p c then starts_with ps cs else false
  end.

Fixpoint drop_chars (n : nat) (text : chars) : chars :=
  match n, text with
  | O, _ => text
  | S _, [] => []
  | S n', _ :: rest => drop_chars n' rest
  end.

Fixpoint find_after (marker text : chars) : option chars :=
  match text with
  | [] => if starts_with marker [] then Some [] else None
  | _ :: rest =>
      if starts_with marker text then Some (drop_chars (length marker) text)
      else find_after marker rest
  end.

Fixpoint take_before (marker text : chars) : option chars :=
  match text with
  | [] => if starts_with marker [] then Some [] else None
  | c :: rest =>
      if starts_with marker text then Some []
      else match take_before marker rest with
           | Some prefix => Some (c :: prefix)
           | None => None
           end
  end.

Fixpoint take_until (stop : ascii) (text : chars) : chars :=
  match text with
  | [] => []
  | c :: rest => if Ascii.eqb c stop then [] else c :: take_until stop rest
  end.

Fixpoint split_lines (text current : chars) : list chars :=
  match text with
  | [] => [rev' current]
  | c :: rest =>
      if Ascii.eqb c "010"%char
      then rev' current :: split_lines rest []
      else split_lines rest (c :: current)
  end.

Fixpoint split_on (separator : ascii) (text current : chars) : list chars :=
  match text with
  | [] => [rev' current]
  | c :: rest =>
      if Ascii.eqb c separator
      then rev' current :: split_on separator rest []
      else split_on separator rest (c :: current)
  end.

Fixpoint point_tokens (text : chars) : list Triangle :=
  match text with
  | "t"%char :: "_"%char :: a :: b :: c :: rest =>
      triangle a b c :: point_tokens rest
  | _ :: rest => point_tokens rest
  | [] => []
  end.

Fixpoint angle_tokens (text : chars) : list Angle :=
  match text with
  | "a"%char :: "_"%char :: a :: b :: c :: rest =>
      angle a b c :: angle_tokens rest
  | _ :: rest => angle_tokens rest
  | [] => []
  end.

Fixpoint quad_tokens (text : chars) : list Quadrilateral :=
  match text with
  | "q"%char :: "_"%char :: a :: b :: c :: d :: rest =>
      quadrilateral a b c d :: quad_tokens rest
  | _ :: rest => quad_tokens rest
  | [] => []
  end.

Definition parse_segment (text : chars) : option Segment :=
  match text with
  | [a; b] => Some (segment a b)
  | _ => None
  end.

Definition parse_angle (text : chars) : option Angle :=
  match text with
  | ["a"%char; "_"%char; a; b; c] => Some (angle a b c)
  | _ => None
  end.

Definition parse_triangle (text : chars) : option Triangle :=
  match text with
  | ["t"%char; "_"%char; a; b; c] => Some (triangle a b c)
  | _ => None
  end.

(** The audited parser reads a [seg:] line with its spaces removed as
    consecutive character pairs, so a kernel header must decode it the same
    way or [declarations_eqb] will refuse the problem. *)
Fixpoint seg_tokens (text : chars) : list Segment :=
  match text with
  | a :: b :: rest => segment a b :: seg_tokens rest
  | _ => []
  end.

Fixpoint circ_tokens (text : chars) : list Circle :=
  match text with
  | "c"%char :: "_"%char :: a :: b :: rest =>
      circle a b :: circ_tokens rest
  | _ :: rest => circ_tokens rest
  | [] => []
  end.

Definition parse_circle (text : chars) : option Circle :=
  match text with
  | ["c"%char; "_"%char; a; b] => Some (circle a b)
  | _ => None
  end.

(** Arc spellings nest a circle call inside the arc call, so splitting a
    statement body at commas must ignore commas inside parentheses. *)
Fixpoint split_top_commas (text current : chars) (depth : nat) : list chars :=
  match text with
  | [] => [rev' current]
  | c :: rest =>
      if Ascii.eqb c "("%char
      then split_top_commas rest (c :: current) (S depth)
      else if Ascii.eqb c ")"%char
      then split_top_commas rest (c :: current) (Nat.pred depth)
      else match depth with
           | O => if Ascii.eqb c ","%char
                  then rev' current :: split_top_commas rest [] depth
                  else split_top_commas rest (c :: current) depth
           | S _ => split_top_commas rest (c :: current) depth
           end
  end.

Definition parse_arc_body (kind : Audit.ArcKind) (body : chars) : option Arc :=
  match split_on ","%char body [] with
  | [c; [p]; [q]] =>
      match parse_circle c with
      | Some x => Some (arc kind x p q)
      | None => None
      end
  | _ => None
  end.

Definition parse_quadrilateral (text : chars) : option Quadrilateral :=
  match text with
  | ["q"%char; "_"%char; a; b; c; d] => Some (quadrilateral a b c d)
  | _ => None
  end.

Definition strip_call (name : string) (text : chars) : option chars :=
  let prefix := list_ascii_of_string (name ++ "(") in
  if starts_with prefix text then
    let body := drop_chars (length prefix) text in
    match rev' body with
    | ")"%char :: reversed => Some (rev' reversed)
    | _ => None
    end
  else None.

(** Each recognized call name is tried in turn; [strip_call] matches the whole
    name followed by [(], so no name can shadow a longer one. *)
Definition try_call {A : Type} (name : string) (text : chars)
    (build : chars -> option A) (fallback : option A) : option A :=
  match strip_call name text with
  | Some body => build body
  | None => fallback
  end.

Definition parse_arc (text : chars) : option Arc :=
  match strip_call "minor_arc" text with
  | Some body => parse_arc_body Audit.MinorArc body
  | None =>
      match strip_call "major_arc" text with
      | Some body => parse_arc_body Audit.MajorArc body
      | None => None
      end
  end.

Definition parse_statement_chars (raw : chars) : option Statement :=
  let text := remove_space (take_until "/"%char raw) in
  let parse_segments constructor body :=
    match split_on ","%char body [] with
    | [a; b] =>
        match parse_segment a, parse_segment b with
        | Some x, Some y => Some (constructor x y)
        | _, _ => None
        end
    | _ => None
    end in
  let parse_angles constructor body :=
    match split_on ","%char body [] with
    | [a; b] =>
        match parse_angle a, parse_angle b with
        | Some x, Some y => Some (constructor x y)
        | _, _ => None
        end
    | _ => None
    end in
  let parse_triangles constructor body :=
    match split_on ","%char body [] with
    | [a; b] =>
        match parse_triangle a, parse_triangle b with
        | Some x, Some y => Some (constructor x y)
        | _, _ => None
        end
    | _ => None
    end in
  let parse_right body :=
    match parse_angle body with
    | Some a => Some (RightAng a)
    | None => None
    end in
  let parse_shape constructor body :=
    match parse_triangle body with
    | Some t => Some (constructor t)
    | None => None
    end in
  let parse_point_at constructor body :=
    match split_on ","%char body [] with
    | [a; [p]] =>
        match parse_segment a with
        | Some x => Some (constructor x p)
        | None => None
        end
    | _ => None
    end in
  let parse_midpt := parse_point_at MidptOf in
  let parse_ang_bisect body :=
    match split_on ","%char body [] with
    | [a; b] =>
        match parse_angle a, parse_segment b with
        | Some x, Some y => Some (AngBisectOf x y)
        | _, _ => None
        end
    | _ => None
    end in
  let parse_perp_like constructor body :=
    match split_on ","%char body [] with
    | [a; b; [p]] =>
        match parse_segment a, parse_segment b with
        | Some x, Some y => Some (constructor x y p)
        | _, _ => None
        end
    | _ => None
    end in
  let parse_perp := parse_perp_like PerpAt in
  let parse_quad_shape constructor body :=
    match parse_quadrilateral body with
    | Some q => Some (constructor q)
    | None => None
    end in
  let parse_quad_segments constructor body :=
    match split_on ","%char body [] with
    | [q; a; b] =>
        match parse_quadrilateral q, parse_segment a, parse_segment b with
        | Some x, Some y, Some z => Some (constructor x y z)
        | _, _, _ => None
        end
    | _ => None
    end in
  let parse_quad_angles constructor body :=
    match split_on ","%char body [] with
    | [q; a; b] =>
        match parse_quadrilateral q, parse_angle a, parse_angle b with
        | Some x, Some y, Some z => Some (constructor x y z)
        | _, _, _ => None
        end
    | _ => None
    end in
  let parse_transversal body :=
    match split_on ","%char body [] with
    | [[a]; [b]; [t1]; [i1]; [c]; [d]; [t2]; [i2]] =>
        Some (Transv a b t1 i1 c d t2 i2)
    | _ => None
    end in
  try_call "con_seg" text (parse_segments ConSeg)
  (try_call "ref_seg" text (parse_segments RefSeg)
  (try_call "con_ang" text (parse_angles ConAng)
  (try_call "ref_ang" text (parse_angles RefAng)
  (try_call "con_tri" text (parse_triangles ConTri)
  (try_call "con_right" text (parse_angles ConRight)
  (try_call "right" text parse_right
  (try_call "perp" text parse_perp
  (try_call "midpt" text parse_midpt
  (try_call "intersect_seg" text (parse_perp_like IntersectSeg)
  (try_call "seg_bisect" text (parse_perp_like SegBisectOf)
  (try_call "sim_tri" text (parse_triangles SimTri)
  (try_call "ang_bisect" text parse_ang_bisect
  (try_call "on_line" text (parse_point_at OnLine)
  (try_call "isosceles" text (parse_shape IsoscelesTri)
  (try_call "equilateral" text (parse_shape EquilateralTri)
  (try_call "equiangular" text (parse_shape EquiangularTri)
  (try_call "supplementary" text (parse_angles Supplementary)
  (try_call "complementary" text (parse_angles Complementary)
  (try_call "linear_pair" text (parse_angles LinearPair)
  (try_call "para" text (parse_segments Para)
  (try_call "parallelogram" text (parse_quad_shape Pgram)
  (try_call "rectangle" text (parse_quad_shape Rect)
  (try_call "rhombus" text (parse_quad_shape Rhomb)
  (try_call "isos_trapezoid" text (parse_quad_shape IsosTrap)
  (try_call "trapezoid_premise" text (parse_quad_segments TrapPremise)
  (try_call "isos_trapezoid_premise" text (parse_quad_segments IsosTrapPremise)
  (try_call "kite_premise" text (parse_quad_angles KiteP)
  (try_call "transversal" text parse_transversal
  (try_call "radius" text (fun body =>
     match split_on ","%char body [] with
     | [c; [p]] =>
         match parse_circle c with
         | Some x => Some (RadiusOf x p)
         | None => None
         end
     | _ => None
     end)
  (try_call "chord" text (fun body =>
     match split_on ","%char body [] with
     | [c; s] =>
         match parse_circle c, parse_segment s with
         | Some x, Some y => Some (ChordOf x y)
         | _, _ => None
         end
     | _ => None
     end)
  (try_call "diameter" text (fun body =>
     match split_on ","%char body [] with
     | [c; s] =>
         match parse_circle c, parse_segment s with
         | Some x, Some y => Some (DiameterOf x y)
         | _, _ => None
         end
     | _ => None
     end)
  (try_call "tangent" text (fun body =>
     match split_on ","%char body [] with
     | [c; s; [p]] =>
         match parse_circle c, parse_segment s with
         | Some x, Some y => Some (TangentAt x y p)
         | _, _ => None
         end
     | _ => None
     end)
  (try_call "inscribed_angle" text (fun body =>
     match split_on ","%char body [] with
     | [c; a] =>
         match parse_circle c, parse_angle a with
         | Some x, Some y => Some (InscribedAngleOf x y)
         | _, _ => None
         end
     | _ => None
     end)
  (try_call "minor_arc" text (fun body =>
     match parse_arc_body Audit.MinorArc body with
     | Some a => Some (ArcOf a)
     | None => None
     end)
  (try_call "major_arc" text (fun body =>
     match parse_arc_body Audit.MajorArc body with
     | Some a => Some (ArcOf a)
     | None => None
     end)
  (try_call "con_arc" text (fun body =>
     match split_top_commas body [] O with
     | [a1; a2] =>
         match parse_arc a1, parse_arc a2 with
         | Some x, Some y => Some (ConArc x y)
         | _, _ => None
         end
     | _ => None
     end)
    None)))))))))))))))))))))))))))))))))))).

Definition digit_value (c : ascii) : option nat :=
  if Ascii.eqb c "0"%char then Some 0 else
  if Ascii.eqb c "1"%char then Some 1 else
  if Ascii.eqb c "2"%char then Some 2 else
  if Ascii.eqb c "3"%char then Some 3 else
  if Ascii.eqb c "4"%char then Some 4 else
  if Ascii.eqb c "5"%char then Some 5 else
  if Ascii.eqb c "6"%char then Some 6 else
  if Ascii.eqb c "7"%char then Some 7 else
  if Ascii.eqb c "8"%char then Some 8 else
  if Ascii.eqb c "9"%char then Some 9 else None.

Fixpoint parse_nat_acc (text : chars) (acc : nat) : option nat :=
  match text with
  | [] => Some acc
  | c :: rest =>
      match digit_value c with
      | Some digit => parse_nat_acc rest (10 * acc + digit)
      | None => None
      end
  end.

Definition parse_nat (text : chars) : option nat :=
  match text with [] => None | _ => parse_nat_acc text 0 end.

Definition parse_reason_chars (raw : chars) : option Reason :=
  let text := remove_space (take_until "/"%char raw) in
  let parse_three constructor body :=
    match split_on ","%char body [] with
    | [a; b; c] =>
        match parse_nat a, parse_nat b, parse_nat c with
        | Some i, Some j, Some k => Some (constructor i j k)
        | _, _, _ => None
        end
    | _ => None
    end in
  let parse_two constructor body :=
    match split_on ","%char body [] with
    | [a; b] =>
        match parse_nat a, parse_nat b with
        | Some i, Some j => Some (constructor i j)
        | _, _ => None
        end
    | _ => None
    end in
  let parse_six_def_con_tri body :=
    match split_on ","%char body [] with
    | [a; b; c; d; e; f] =>
        match parse_nat a, parse_nat b, parse_nat c,
              parse_nat d, parse_nat e, parse_nat f with
        | Some i1, Some i2, Some i3, Some i4, Some i5, Some i6 =>
            Some (DefConTri i1 i2 i3 i4 i5 i6)
        | _, _, _, _, _, _ => None
        end
    | _ => None
    end in
  let parse_one constructor body :=
    match parse_nat body with
    | Some i => Some (constructor i)
    | None => None
    end in
  (** Historical parallel-angle proofs sometimes also cite the diagram
      transversal after the step dependency.  The executable rule already
      searches and validates the transversal premise, so this second token is
      compatibility metadata rather than an additional logical dependency. *)
  let parse_one_with_diagram constructor body :=
    match split_on ","%char body [] with
    | [one] => parse_one constructor one
    | [one; _diagram] => parse_one constructor one
    | _ => None
    end in
  match strip_call "given" text with
  | Some label => Some (Given (string_of_list_ascii label))
  | None => match strip_call "reflex" text with
    | Some [] => Some Reflex
    | _ =>
      try_call "sas" text (parse_three SAS)
      (try_call "sss" text (parse_three SSS)
      (try_call "asa" text (parse_three ASA)
      (try_call "aas" text (parse_three AAS)
      (try_call "cpctc" text (parse_one CPCTC)
      (try_call "con_seg_transitive" text (parse_two ConSegTrans)
      (try_call "con_ang_transitive" text (parse_two ConAngTrans)
      (try_call "con_tri_transitive" text (parse_two ConTriTrans)
      (try_call "def_con_right" text (parse_two DefConRight)
      (try_call "perp_con_ang" text (parse_one PerpConAng)
      (try_call "def_midpt" text (parse_one DefMidpt)
      (try_call "vert_ang" text
        (fun body => Some (VertAng (string_of_list_ascii body)))
        (try_call "def_ang_bisect" text (parse_one DefAngBisect)
        (try_call "ang_bisect_conv" text (parse_one AngBisectConv)
        (try_call "rhl" text (parse_three RHL)
        (try_call "midpt_conv" text (parse_one MidptConv)
        (try_call "third_angle" text (parse_two ThirdAngle)
        (try_call "def_con_tri" text parse_six_def_con_tri
        (try_call "def_isosceles" text (parse_one DefIsosceles)
        (try_call "base_angle_conv" text (parse_one BaseAngleConv)
        (try_call "base_angle" text (parse_one BaseAngle)
        (try_call "def_equilateral" text (parse_three DefEquilateral)
        (try_call "def_equiangular" text (parse_three DefEquiangular)
        (try_call "equilat_equiang" text (parse_one EquilatEquiang)
        (try_call "def_perp" text (parse_one DefPerp)
        (try_call "con_supplements_same" text (parse_two ConSupplementsSame)
        (try_call "con_supplements" text (parse_three ConSupplements)
        (try_call "con_complements_same" text (parse_two ConComplementsSame)
        (try_call "con_complements" text (parse_three ConComplements)
        (try_call "def_linear_pair" text (parse_one DefLinearPair)
        (try_call "equiang_equilat" text (parse_one EquiangEquilat)
        (try_call "def_parallelogram" text (parse_two DefParallelogram)
        (try_call "pgram_opp_sides" text (parse_one PgramOppSides)
        (try_call "pgram_opp_angs" text (parse_one PgramOppAngles)
        (try_call "kite_opp_con_ang" text (parse_one KiteOppConAng)
        (try_call "pgram_consec_angs_conv" text (parse_two PgramConsecAngsConv)
        (try_call "pgram_consec_angs" text (parse_one PgramConsecAngs)
        (try_call "pgram_opp_sides_conv" text (parse_two PgramOppSidesConv)
        (try_call "rect_pgram_ang" text (parse_two RectPgramAng)
        (try_call "pgram_opp_side_para" text (parse_two PgramOppSidePara)
        (try_call "rectangle_pgram" text (parse_one RectanglePgram)
        (try_call "rhombus_pgram" text (parse_one RhombusPgram)
        (try_call "rhombus_consec_sides" text (parse_two RhombusConsecSides)
        (try_call "rhombus_opp_bisect" text (parse_one RhombusOppBisect)
        (try_call "rect_diag_con" text (parse_one RectDiagCon)
        (try_call "rhombus" text (parse_one RhombusDef)
        (try_call "rectangle" text (parse_one RectangleDef)
        (try_call "altint_conv" text (parse_one_with_diagram AltIntConv)
        (try_call "altint" text (parse_one_with_diagram AltInt)
        (try_call "altext_conv" text (parse_one_with_diagram AltExtConv)
        (try_call "altext" text (parse_one_with_diagram AltExt)
        (try_call "corresp_ang_conv" text (parse_one_with_diagram CorrespAngConv)
        (try_call "corresp_ang" text (parse_one_with_diagram CorrespAng)
        (try_call "sameside_ang_conv" text (parse_one_with_diagram SamesideAngConv)
        (try_call "sameside_ang" text (parse_one_with_diagram SamesideAng)
        (try_call "para_transitive" text (parse_two ParaTrans)
        (try_call "def_radius" text (parse_one DefRadius)
        (try_call "inscribed_semi" text (parse_one InscribedSemi)
        (try_call "con_chords_intersect_arcs" text (parse_one ConChordsArcs)
        (try_call "tangent_perp_conv" text (parse_two TangentPerpConv)
        (try_call "tangent_perp" text (parse_two TangentPerp)
        (try_call "con_tangents_ext" text (parse_two ConTangentsExt)
        (try_call "radius_chord_bisect" text (parse_three RadiusChordBisect)
        (try_call "perp_bisector" text (parse_two PerpBisect)
        (try_call "isos_trap_con_diags" text (parse_two IsosTrapConDiags)
        (try_call "isos_trap_base_angs_conv" text
          (parse_one IsosTrapBaseAngsConv)
        (try_call "pgram_diag_bisect_conv" text (parse_two PgramDiagBisectConv)
        (try_call "pgram_opp_angs_conv" text (parse_two PgramOppAngsConv)
        (try_call "rect_diag_con_conv" text (parse_two RectDiagConConv)
        (try_call "rhombus_diag_perp_conv" text (parse_two RhombusDiagPerpConv)
        (try_call "rhombus_opp_bisect_conv" text
          (parse_three RhombusOppBisectConv)
        (try_call "aa_sim" text (parse_two AASim)
        None)))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))))
    end
  end.

Definition split_arrow (line : chars) : option (chars * chars) :=
  match take_before (list_ascii_of_string "->") line,
        find_after (list_ascii_of_string "->") line with
  | Some before, Some after => Some (before, after)
  | _, _ => None
  end.

Definition parse_labeled_premise (line : chars) : option Premise :=
  match line with
  | "["%char :: rest =>
      match take_before ["]"%char] rest, find_after ["]"%char] rest with
      | Some label, Some statement_text =>
          match parse_statement_chars statement_text with
          | Some statement => Some (premise (string_of_list_ascii label) statement)
          | None => None
          end
      | _, _ => None
      end
  | _ => None
  end.

Definition parse_step (line : chars) : option Step :=
  match line with
  | "["%char :: rest =>
      match find_after ["]"%char] rest with
      | Some after_number =>
          match split_arrow after_number with
          | Some (reason_text, statement_text) =>
              match parse_reason_chars reason_text, parse_statement_chars statement_text with
              | Some reason, Some statement => Some (step reason statement)
              | _, _ => None
              end
          | None => None
          end
      | None => None
      end
  | _ => None
  end.

Record HeaderState := header_state {
  hs_triangles : list Triangle;
  hs_angles : list Angle;
  hs_quadrilaterals : list Quadrilateral;
  hs_circles : list Circle;
  hs_segments : list Segment;
  hs_premises : list Premise;
  hs_goal : option Statement
}.

Fixpoint parse_header_lines (lines : list chars) (state : HeaderState)
  : option HeaderState :=
  match lines with
  | [] => Some state
  | line :: rest =>
      let compact := remove_space (take_until "/"%char line) in
      if starts_with (list_ascii_of_string "tri:") compact then
        parse_header_lines rest
          (header_state (state.(hs_triangles) ++ point_tokens line)
                        state.(hs_angles) state.(hs_quadrilaterals)
                        state.(hs_circles) state.(hs_segments)
                        state.(hs_premises) state.(hs_goal))
      else if starts_with (list_ascii_of_string "ang:") compact then
        parse_header_lines rest
          (header_state state.(hs_triangles)
                        (state.(hs_angles) ++ angle_tokens line)
                        state.(hs_quadrilaterals)
                        state.(hs_circles) state.(hs_segments)
                        state.(hs_premises) state.(hs_goal))
      else if starts_with (list_ascii_of_string "quad:") compact then
        parse_header_lines rest
          (header_state state.(hs_triangles) state.(hs_angles)
                        (state.(hs_quadrilaterals) ++ quad_tokens line)
                        state.(hs_circles) state.(hs_segments)
                        state.(hs_premises) state.(hs_goal))
      else if starts_with (list_ascii_of_string "seg:") compact then
        parse_header_lines rest
          (header_state state.(hs_triangles) state.(hs_angles)
                        state.(hs_quadrilaterals) state.(hs_circles)
                        (state.(hs_segments) ++ seg_tokens (drop_chars 4 compact))
                        state.(hs_premises) state.(hs_goal))
      else if starts_with (list_ascii_of_string "circ:") compact then
        parse_header_lines rest
          (header_state state.(hs_triangles) state.(hs_angles)
                        state.(hs_quadrilaterals)
                        (state.(hs_circles) ++ circ_tokens line)
                        state.(hs_segments)
                        state.(hs_premises) state.(hs_goal))
      else if starts_with ["["%char] compact then
        match parse_labeled_premise line with
        | Some prem => parse_header_lines rest
            (header_state state.(hs_triangles) state.(hs_angles)
                          state.(hs_quadrilaterals) state.(hs_circles)
                          state.(hs_segments)
                          (state.(hs_premises) ++ [prem]) state.(hs_goal))
        | None => None
        end
      else if starts_with (list_ascii_of_string "->") compact then
        match state.(hs_goal), split_arrow line with
        | None, Some (_, goal_text) =>
            match parse_statement_chars goal_text with
            | Some goal => parse_header_lines rest
                (header_state state.(hs_triangles) state.(hs_angles)
                              state.(hs_quadrilaterals) state.(hs_circles)
                              state.(hs_segments)
                              state.(hs_premises) (Some goal))
            | None => None
            end
        | _, _ => None
        end
      else parse_header_lines rest state
  end.

Fixpoint parse_step_lines (lines : list chars) (steps : list Step) : option (list Step) :=
  match lines with
  | [] => Some steps
  | line :: rest =>
      let compact := remove_space (take_until "/"%char line) in
      if starts_with ["["%char] compact then
        match parse_step line with
        | Some parsed => parse_step_lines rest (steps ++ [parsed])
        | None => None
        end
      else parse_step_lines rest steps
  end.

Definition parseProblemPart (part : string) : option ProblemHeader :=
  match parse_header_lines (split_lines (list_ascii_of_string part) [])
                           (header_state [] [] [] [] [] [] None) with
  | Some header =>
      match header.(hs_goal) with
      | Some goal =>
          Some (problem_header
                  (declarations header.(hs_triangles) header.(hs_angles)
                                header.(hs_quadrilaterals)
                                header.(hs_circles) header.(hs_segments))
                  header.(hs_premises) goal)
      | None => None
      end
  | None => None
  end.

Definition parse_problem (source : string) : option Problem :=
  let text := list_ascii_of_string source in
  match problemPart source,
        find_after (list_ascii_of_string "steps:") text with
  | Some part, Some step_text =>
      match parseProblemPart part,
            parse_step_lines (split_lines step_text []) [] with
      | Some header, Some steps =>
          Some (problem header.(header_declarations) header.(header_premises)
                        header.(header_goal) steps)
      | _, _ => None
      end
  | _, _ => None
  end.

Definition check_source (source : string) : bool :=
  match parse_problem source with Some p => check_problem p | None => false end.

Section SourceSoundness.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
(* [third_angle] is the one implemented rule that needs the parallel
   postulate; see the comment above its soundness lemma in [Checker.v]. *)
Context {TE : @Tarski_euclidean Tn TnEQD}.
Variable point : PointId -> Tpoint.

Theorem check_source_sound : forall source p,
  parse_problem source = Some p -> check_source source = true ->
  declarations_well_formed point p.(problem_declarations) ->
  Forall (interp_premise point) p.(problem_premises) ->
  interp_statement point p.(problem_goal).
Proof.
  intros source p Hparse Hcheck Hwf Hprem.
  unfold check_source in Hcheck. rewrite Hparse in Hcheck.
  now eapply check_problem_sound.
Qed.

End SourceSoundness.
