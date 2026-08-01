From Coq Require Import Ascii String List Bool Nat.
Require Export Ender.Audit.
Import ListNotations.

Module EnderSyntax.

(** Internal representation used by the currently implemented reason kernel.
    These are implementation details and therefore deliberately absent from
    the human-audit surface. *)
Definition PointId := ascii.
Record Segment := segment { seg_start : PointId; seg_end : PointId }.
Record Angle := angle { ang_left : PointId; ang_vertex : PointId; ang_right : PointId }.
Record Triangle := triangle { tri_a : PointId; tri_b : PointId; tri_c : PointId }.

Inductive Statement :=
| ConSeg : Segment -> Segment -> Statement
| ConAng : Angle -> Angle -> Statement
| ConTri : Triangle -> Triangle -> Statement
| RefSeg : Segment -> Segment -> Statement
| RefAng : Angle -> Angle -> Statement.

Inductive Reason :=
| Given : string -> Reason | Reflex : Reason
| SAS : nat -> nat -> nat -> Reason | SSS : nat -> nat -> nat -> Reason
| ASA : nat -> nat -> nat -> Reason | AAS : nat -> nat -> nat -> Reason
| CPCTC : nat -> Reason.

Record Premise := premise { premise_label : string; premise_statement : Statement }.
Record Step := step { step_reason : Reason; step_conclusion : Statement }.
Record ProblemHeader := problem_header {
  header_triangles : list Triangle; header_premises : list Premise;
  header_goal : Statement
}.
Record Problem := problem {
  problem_triangles : list Triangle; problem_premises : list Premise;
  problem_goal : Statement; problem_steps : list Step
}.

Definition ascii_eqb := Ascii.eqb.

Definition segment_eqb (x y : Segment) : bool :=
  ascii_eqb x.(seg_start) y.(seg_start) && ascii_eqb x.(seg_end) y.(seg_end).

Definition angle_eqb (x y : Angle) : bool :=
  ascii_eqb x.(ang_left) y.(ang_left) &&
  ascii_eqb x.(ang_vertex) y.(ang_vertex) &&
  ascii_eqb x.(ang_right) y.(ang_right).

Definition triangle_eqb (x y : Triangle) : bool :=
  ascii_eqb x.(tri_a) y.(tri_a) && ascii_eqb x.(tri_b) y.(tri_b) &&
  ascii_eqb x.(tri_c) y.(tri_c).

Definition statement_eqb (x y : Statement) : bool :=
  match x, y with
  | ConSeg a b, ConSeg c d | RefSeg a b, RefSeg c d =>
      segment_eqb a c && segment_eqb b d
  | ConAng a b, ConAng c d | RefAng a b, RefAng c d =>
      angle_eqb a c && angle_eqb b d
  | ConTri a b, ConTri c d => triangle_eqb a c && triangle_eqb b d
  | _, _ => false
  end.

Lemma segment_eqb_eq : forall x y, segment_eqb x y = true <-> x = y.
Proof.
  intros [a b] [c d].
  change (Ascii.eqb a c && Ascii.eqb b d = true <-> segment a b = segment c d).
  rewrite andb_true_iff, !Ascii.eqb_eq.
  split.
  - intros [-> ->]. reflexivity.
  - intros H. inversion H. split; reflexivity.
Qed.

Lemma angle_eqb_eq : forall x y, angle_eqb x y = true <-> x = y.
Proof.
  intros [a b c] [d e f].
  change (Ascii.eqb a d && Ascii.eqb b e && Ascii.eqb c f = true <->
          angle a b c = angle d e f).
  rewrite !andb_true_iff, !Ascii.eqb_eq.
  split.
  - intros [[-> ->] ->]. reflexivity.
  - intros H. inversion H. repeat split; reflexivity.
Qed.

Lemma triangle_eqb_eq : forall x y, triangle_eqb x y = true <-> x = y.
Proof.
  intros [a b c] [d e f].
  change (Ascii.eqb a d && Ascii.eqb b e && Ascii.eqb c f = true <->
          triangle a b c = triangle d e f).
  rewrite !andb_true_iff, !Ascii.eqb_eq.
  split.
  - intros [[-> ->] ->]. reflexivity.
  - intros H. inversion H. repeat split; reflexivity.
Qed.

Lemma statement_eqb_eq : forall x y, statement_eqb x y = true <-> x = y.
Proof.
  destruct x, y; cbn; try (split; [discriminate|congruence]);
    rewrite andb_true_iff, ?segment_eqb_eq, ?angle_eqb_eq, ?triangle_eqb_eq;
    split.
  all: try (intros [H1 H2]; subst; reflexivity).
  all: intros H; inversion H; split; reflexivity.
Qed.

Definition triangle_mem (t : Triangle) (ts : list Triangle) : bool :=
  existsb (triangle_eqb t) ts.

Lemma triangle_mem_spec : forall t ts,
  triangle_mem t ts = true <-> In t ts.
Proof.
  intros t ts. unfold triangle_mem. rewrite existsb_exists.
  split.
  - intros [u [Hu Heq]]. apply triangle_eqb_eq in Heq. now subst.
  - intros Hin. exists t. split; [assumption|]. apply triangle_eqb_eq. reflexivity.
Qed.

End EnderSyntax.
