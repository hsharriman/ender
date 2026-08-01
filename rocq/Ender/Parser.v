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
  match strip_call "con_seg" text with
  | Some body => parse_segments ConSeg body
  | None => match strip_call "ref_seg" text with
    | Some body => parse_segments RefSeg body
    | None => match strip_call "con_ang" text with
      | Some body => parse_angles ConAng body
      | None => match strip_call "ref_ang" text with
        | Some body => parse_angles RefAng body
        | None => match strip_call "con_tri" text with
          | Some body =>
              match split_on ","%char body [] with
              | [a; b] =>
                  match parse_triangle a, parse_triangle b with
                  | Some x, Some y => Some (ConTri x y)
                  | _, _ => None
                  end
              | _ => None
              end
          | None => None
          end
        end
      end
    end
  end.

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
  match strip_call "given" text with
  | Some label => Some (Given (string_of_list_ascii label))
  | None => match strip_call "reflex" text with
    | Some [] => Some Reflex
    | _ => match strip_call "sas" text with
      | Some body => parse_three SAS body
      | None => match strip_call "sss" text with
        | Some body => parse_three SSS body
        | None => match strip_call "asa" text with
          | Some body => parse_three ASA body
          | None => match strip_call "aas" text with
            | Some body => parse_three AAS body
            | None => match strip_call "cpctc" text with
              | Some body => match parse_nat body with
                             | Some i => Some (CPCTC i) | None => None end
              | None => None
              end
            end
          end
        end
      end
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

Theorem audit_sound : forall source part header,
  problemPart source = Some part ->
  parseProblemPart part = Some header ->
  check_source source = true ->
  forall `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}
         (point : PointId -> Tpoint),
    headerMeaning point header.
Proof.
  intros source part header Hpart Hheader Hcheck Tn TnEQD point.
  unfold check_source, parse_problem in Hcheck. rewrite Hpart in Hcheck.
  destruct (find_after (list_ascii_of_string "steps:")
                       (list_ascii_of_string source)) as [step_text|] eqn:Hsteps;
    try discriminate.
  rewrite Hheader in Hcheck.
  destruct (parse_step_lines (split_lines step_text []) []) as [steps|] eqn:Hparsed;
    try discriminate.
  unfold headerMeaning. intros Hwf Hprem.
  change (interp_statement point header.(header_goal)).
  refine (check_problem_sound point
            (problem header.(header_triangles) header.(header_premises)
                     header.(header_goal) steps) Hcheck _ _).
  - exact Hwf.
  - exact Hprem.
Qed.

Module VerifiedChecker <: VERIFIED_SLICE_CHECKER.
  Definition parseProblemPart := parseProblemPart.
  Definition check := check_source.
  Definition sound := audit_sound.
End VerifiedChecker.
