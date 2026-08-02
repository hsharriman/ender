From Coq Require Import List.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Syntax Ender.Geometry.
Import ListNotations.
Import EnderSyntax.

Section EnderSemantics.

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

(** Kept identical to the audited [AngleWellFormed] so that public [right]
    statements project both ways. *)
Definition angle_well_formed (a : Angle) : Prop :=
  point a.(ang_left) <> point a.(ang_vertex) /\
  point a.(ang_right) <> point a.(ang_vertex).

Definition right_angle (a : Angle) : Prop :=
  Per (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right)).

Definition statement_meaning (s : Statement) : Prop :=
  match s with
  | ConSeg a b | RefSeg a b =>
      Cong (point a.(seg_start)) (point a.(seg_end))
           (point b.(seg_start)) (point b.(seg_end))
  | ConAng a b | RefAng a b =>
      CongA (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right))
            (point b.(ang_left)) (point b.(ang_vertex)) (point b.(ang_right))
  | ConTri a b => triangle_congruence a b
  | RightAng a => angle_well_formed a /\ right_angle a
  | ConRight a b => right_angle a /\ right_angle b
  | PerpAt a b p =>
      Perp_at (point p) (point a.(seg_start)) (point a.(seg_end))
              (point b.(seg_start)) (point b.(seg_end))
  | MidptOf s p => Midpoint (point p) (point s.(seg_start)) (point s.(seg_end))
  | IntersectSeg a b p =>
      Bet (point a.(seg_start)) (point p) (point a.(seg_end)) /\
      Bet (point b.(seg_start)) (point p) (point b.(seg_end))
  end.

Definition segment_points (s : Segment) :=
  (point s.(seg_start), point s.(seg_end)).

Definition interp_segment_congruence (s t : Segment) : Prop :=
  statement_meaning (ConSeg s t).

Definition interp_angle_congruence (a b : Angle) : Prop :=
  statement_meaning (ConAng a b).

Definition interp_triangle_congruence (t u : Triangle) : Prop :=
  triangle_congruence t u.

Definition interp_statement (s : Statement) : Prop :=
  statement_meaning s.

Definition interp_premise (p : Premise) : Prop :=
  interp_statement p.(premise_statement).

Definition triangle_well_formed (t : Triangle) : Prop :=
  ~ Col (point t.(tri_a)) (point t.(tri_b)) (point t.(tri_c)).

Definition declarations_well_formed (ts : list Triangle) : Prop :=
  forall t, In t ts -> triangle_well_formed t.

End EnderSemantics.
