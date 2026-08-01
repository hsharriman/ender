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
  statementMeaning point (ConSeg s t).

Definition interp_angle_congruence (a b : Angle) : Prop :=
  statementMeaning point (ConAng a b).

Definition interp_triangle_congruence (t u : Triangle) : Prop :=
  triangle_congruence point t u.

Definition interp_statement (s : Statement) : Prop :=
  statementMeaning point s.

Definition interp_premise (p : Premise) : Prop :=
  interp_statement p.(premise_statement).

Definition triangle_well_formed (t : Triangle) : Prop :=
  ~ Col (point t.(tri_a)) (point t.(tri_b)) (point t.(tri_c)).

Definition declarations_well_formed (ts : list Triangle) : Prop :=
  forall t, In t ts -> triangle_well_formed t.

End EnderSemantics.
