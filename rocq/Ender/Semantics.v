From Coq Require Import List.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Syntax Ender.Geometry.
Import ListNotations.
Import EnderSyntax.

Section EnderSemantics.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : PointId -> Tpoint.

Definition segment_points (s : Segment) :=
  (point s.(seg_start), point s.(seg_end)).

Definition interp_segment_congruence (s t : Segment) : Prop :=
  Cong (point s.(seg_start)) (point s.(seg_end))
       (point t.(seg_start)) (point t.(seg_end)).

Definition interp_angle_congruence (a b : Angle) : Prop :=
  CongA (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right))
        (point b.(ang_left)) (point b.(ang_vertex)) (point b.(ang_right)).

Definition interp_triangle_congruence (t u : Triangle) : Prop :=
  TriangleCongruent
    (point t.(tri_a)) (point t.(tri_b)) (point t.(tri_c))
    (point u.(tri_a)) (point u.(tri_b)) (point u.(tri_c)).

Definition interp_statement (s : Statement) : Prop :=
  match s with
  | ConSeg a b | RefSeg a b => interp_segment_congruence a b
  | ConAng a b | RefAng a b => interp_angle_congruence a b
  | ConTri a b => interp_triangle_congruence a b
  end.

Definition interp_premise (p : Premise) : Prop :=
  interp_statement p.(premise_statement).

Definition triangle_well_formed (t : Triangle) : Prop :=
  ~ Col (point t.(tri_a)) (point t.(tri_b)) (point t.(tri_c)).

Definition declarations_well_formed (ts : list Triangle) : Prop :=
  forall t, In t ts -> triangle_well_formed t.

End EnderSemantics.
