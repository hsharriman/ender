(**
  This is the complete human-audit surface for the verified checker slice.
  It intentionally imports no Ender implementation module.
*)
From Coq Require Import Ascii String List.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Import ListNotations.
Local Open Scope string_scope.

Module EnderGrammar.

Definition PointId := ascii.

Record Segment := segment { seg_start : PointId; seg_end : PointId }.
Record Angle := angle { ang_left : PointId; ang_vertex : PointId; ang_right : PointId }.
Record Triangle := triangle { tri_a : PointId; tri_b : PointId; tri_c : PointId }.

Inductive Statement :=
| ConSeg : Segment -> Segment -> Statement
| RefSeg : Segment -> Segment -> Statement
| ConAng : Angle -> Angle -> Statement
| RefAng : Angle -> Angle -> Statement
| ConTri : Triangle -> Triangle -> Statement.

Inductive Reason :=
| Given : string -> Reason
| Reflex : Reason
| SAS : nat -> nat -> nat -> Reason
| SSS : nat -> nat -> nat -> Reason
| ASA : nat -> nat -> nat -> Reason
| AAS : nat -> nat -> nat -> Reason
| CPCTC : nat -> Reason.

Record Premise := premise { premise_label : string; premise_statement : Statement }.
Record Step := step { step_reason : Reason; step_conclusion : Statement }.
Record ProblemHeader := problem_header {
  header_triangles : list Triangle;
  header_premises : list Premise;
  header_goal : Statement
}.
Record Problem := problem {
  problem_triangles : list Triangle;
  problem_premises : list Premise;
  problem_goal : Statement;
  problem_steps : list Step
}.

End EnderGrammar.

Import EnderGrammar.

(** Return precisely the text after the [pt:] line and before [steps:]. *)
Module ProblemPart.

Definition chars := list ascii.

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

Definition problemPart (source : string) : option string :=
  match find_after (list_ascii_of_string "pt:") (list_ascii_of_string source) with
  | None => None
  | Some after_pt =>
      match find_after ["010"%char] after_pt with
      | None => None
      | Some after_coordinates =>
          match take_before (list_ascii_of_string "steps:") after_coordinates with
          | Some part => Some (string_of_list_ascii part)
          | None => None
          end
      end
  end.

End ProblemPart.

Export ProblemPart.

Section Meaning.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : PointId -> Tpoint.

Definition triangle_congruence (t u : Triangle) : Prop :=
  Cong (point t.(tri_a)) (point t.(tri_b))
       (point u.(tri_a)) (point u.(tri_b)) /\
  Cong (point t.(tri_b)) (point t.(tri_c))
       (point u.(tri_b)) (point u.(tri_c)) /\
  Cong (point t.(tri_c)) (point t.(tri_a))
       (point u.(tri_c)) (point u.(tri_a)) /\
  CongA (point t.(tri_b)) (point t.(tri_a)) (point t.(tri_c))
        (point u.(tri_b)) (point u.(tri_a)) (point u.(tri_c)) /\
  CongA (point t.(tri_a)) (point t.(tri_b)) (point t.(tri_c))
        (point u.(tri_a)) (point u.(tri_b)) (point u.(tri_c)) /\
  CongA (point t.(tri_a)) (point t.(tri_c)) (point t.(tri_b))
        (point u.(tri_a)) (point u.(tri_c)) (point u.(tri_b)).

Definition statementMeaning (s : Statement) : Prop :=
  match s with
  | ConSeg a b | RefSeg a b =>
      Cong (point a.(seg_start)) (point a.(seg_end))
           (point b.(seg_start)) (point b.(seg_end))
  | ConAng a b | RefAng a b =>
      CongA (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right))
            (point b.(ang_left)) (point b.(ang_vertex)) (point b.(ang_right))
  | ConTri a b => triangle_congruence a b
  end.

Definition headerMeaning (h : ProblemHeader) : Prop :=
  (forall t, In t h.(header_triangles) ->
     ~ Col (point t.(tri_a)) (point t.(tri_b)) (point t.(tri_c))) ->
  Forall (fun p => statementMeaning p.(premise_statement)) h.(header_premises) ->
  statementMeaning h.(header_goal).

End Meaning.

(**
  The implementation must inhabit this signature.  A reviewer checks this
  file; Rocq checks the implementation and the proof body elsewhere.
*)
Module Type VERIFIED_CHECKER.
  Parameter parseProblemPart : string -> option ProblemHeader.
  Parameter check : string -> bool.

  Parameter sound : forall source part header,
    problemPart source = Some part ->
    parseProblemPart part = Some header ->
    check source = true ->
    forall `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}
           (point : PointId -> Tpoint),
      headerMeaning point header.
End VERIFIED_CHECKER.
