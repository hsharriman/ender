From Coq Require Import Ascii String List Bool Nat.
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
  | [] => [rev current]
  | c :: rest =>
      if Ascii.eqb c "010"%char
      then rev current :: split_lines rest []
      else split_lines rest (c :: current)
  end.

Fixpoint split_on (separator : ascii) (text current : chars) : list chars :=
  match text with
  | [] => [rev current]
  | c :: rest =>
      if Ascii.eqb c separator
      then rev current :: split_on separator rest []
      else split_on separator rest (c :: current)
  end.

Fixpoint point_tokens (text : chars) : list Triangle :=
  match text with
  | "t"%char :: "_"%char :: a :: b :: c :: rest =>
      triangle a b c :: point_tokens rest
  | _ :: rest => point_tokens rest
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

Definition strip_call (name : string) (text : chars) : option chars :=
  let prefix := list_ascii_of_string (name ++ "(") in
  if starts_with prefix text then
    let body := drop_chars (length prefix) text in
    match rev body with
    | ")"%char :: reversed => Some (rev reversed)
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
  let parse_midpt body :=
    match split_on ","%char body [] with
    | [a; [p]] =>
        match parse_segment a with
        | Some x => Some (MidptOf x p)
        | None => None
        end
    | _ => None
    end in
  let parse_perp body :=
    match split_on ","%char body [] with
    | [a; b; [p]] =>
        match parse_segment a, parse_segment b with
        | Some x, Some y => Some (PerpAt x y p)
        | _, _ => None
        end
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
  (try_call "midpt" text parse_midpt None)))))))).

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
  let parse_one constructor body :=
    match parse_nat body with
    | Some i => Some (constructor i)
    | None => None
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
      (try_call "def_midpt" text (parse_one DefMidpt) None))))))))))
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
                        state.(hs_premises) state.(hs_goal))
      else if starts_with ["["%char] compact then
        match parse_labeled_premise line with
        | Some prem => parse_header_lines rest
            (header_state state.(hs_triangles) (state.(hs_premises) ++ [prem]) state.(hs_goal))
        | None => None
        end
      else if starts_with (list_ascii_of_string "->") compact then
        match state.(hs_goal), split_arrow line with
        | None, Some (_, goal_text) =>
            match parse_statement_chars goal_text with
            | Some goal => parse_header_lines rest
                (header_state state.(hs_triangles) state.(hs_premises) (Some goal))
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
                           (header_state [] [] None) with
  | Some header =>
      match header.(hs_goal) with
      | Some goal => Some (problem_header header.(hs_triangles)
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
          Some (problem header.(header_triangles) header.(header_premises)
                        header.(header_goal) steps)
      | _, _ => None
      end
  | _, _ => None
  end.

Definition check_source (source : string) : bool :=
  match parse_problem source with Some p => check_problem p | None => false end.

Section SourceSoundness.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : PointId -> Tpoint.

Theorem check_source_sound : forall source p,
  parse_problem source = Some p -> check_source source = true ->
  declarations_well_formed point p.(problem_triangles) ->
  Forall (interp_premise point) p.(problem_premises) ->
  interp_statement point p.(problem_goal).
Proof.
  intros source p Hparse Hcheck Hwf Hprem.
  unfold check_source in Hcheck. rewrite Hparse in Hcheck.
  now eapply check_problem_sound.
Qed.

End SourceSoundness.
