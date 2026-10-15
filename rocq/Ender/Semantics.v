From Stdlib Require Import List.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Syntax Ender.Geometry.
Import ListNotations.
Import EnderSyntax.

(** The six orderings of a triangle's vertices. *)
Notation triangle_orderings := Audit.triangleOrderings.

(** Reading an audited meaning back as the GeoCoq relations it is built from:
    [cbn] unfolds these whenever they are applied, so a congruence reads as
    [Cong], a right angle as [Per], and so on. *)
Arguments Audit.seg_start {Tn} point s /.
Arguments Audit.seg_end {Tn} point s /.
Arguments Audit.ang_start {Tn} point a /.
Arguments Audit.ang_vertex {Tn} point a /.
Arguments Audit.ang_end {Tn} point a /.
Arguments Audit.SegmentWellFormed {Tn} point s /.
Arguments Audit.AngleWellFormed {Tn} point a /.
Arguments Audit.SegmentCongruent {Tn} point a b /.
Arguments Audit.AngleCongruent {Tn} point a b /.
Arguments Audit.RightAngle {Tn} point a /.
Arguments Audit.OnSegment {Tn} point s p /.
Arguments Audit.MidpointOf {Tn} point s p /.
Arguments Audit.PerpendicularAt {Tn} point a b p /.
Arguments Audit.TriangleWellFormed {Tn} point t /.
Arguments Audit.IsoscelesTriangle {Tn} point t /.
Arguments Audit.EquilateralTriangle {Tn} point t /.
Arguments Audit.EquiangularTriangle {Tn} point t /.
Arguments Audit.AngleBisector {Tn} point a s /.
Arguments Audit.SegmentBisectorAt {Tn} point bisector target p /.
Arguments Audit.side_ab t /.
Arguments Audit.side_bc t /.
Arguments Audit.side_ca t /.
Arguments Audit.angle_a t /.
Arguments Audit.angle_b t /.
Arguments Audit.angle_c t /.

Section EnderSemantics.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : PointId -> Tpoint.

(** All six corresponding parts, which is what [cpctc] reads off an ordered
    congruence.  The audited [TriangleCongruent] states three sides and
    nondegeneracy; SSS recovers the angles ([ordered_congruence_parts]). *)
Definition triangle_congruence (t u : TriangleName) : Prop :=
  Cong (point t.(triangle_first)) (point t.(triangle_second))
       (point u.(triangle_first)) (point u.(triangle_second)) /\
  Cong (point t.(triangle_second)) (point t.(triangle_third))
       (point u.(triangle_second)) (point u.(triangle_third)) /\
  Cong (point t.(triangle_third)) (point t.(triangle_first))
       (point u.(triangle_third)) (point u.(triangle_first)) /\
  CongA (point t.(triangle_second)) (point t.(triangle_first)) (point t.(triangle_third))
        (point u.(triangle_second)) (point u.(triangle_first)) (point u.(triangle_third)) /\
  CongA (point t.(triangle_first)) (point t.(triangle_second)) (point t.(triangle_third))
        (point u.(triangle_first)) (point u.(triangle_second)) (point u.(triangle_third)) /\
  CongA (point t.(triangle_first)) (point t.(triangle_third)) (point t.(triangle_second))
        (point u.(triangle_first)) (point u.(triangle_third)) (point u.(triangle_second)).

(** Kept identical to the audited [AngleWellFormed] so that public [right]
    statements project both ways. *)
Definition angle_well_formed (a : AngleName) : Prop :=
  point a.(angle_first) <> point a.(angle_vertex) /\
  point a.(angle_last) <> point a.(angle_vertex).

Definition right_angle (a : AngleName) : Prop :=
  Per (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last)).

(** Kept identical to the audited [TriangleWellFormed]. *)
Definition triangle_nondegenerate (t : TriangleName) : Prop :=
  point t.(triangle_first) <> point t.(triangle_second) /\
  point t.(triangle_second) <> point t.(triangle_third) /\
  point t.(triangle_third) <> point t.(triangle_first) /\
  ~ Col (point t.(triangle_first)) (point t.(triangle_second)) (point t.(triangle_third)).

(** A statement means what the audit surface says it means. *)
Definition statement_meaning (s : Statement) : Prop :=
  Audit.statementMeaning point s.

Definition segment_points (s : SegmentName) :=
  (point s.(segment_first), point s.(segment_second)).

Definition interp_segment_congruence (s t : SegmentName) : Prop :=
  statement_meaning (ConSeg s t).

Definition interp_angle_congruence (a b : AngleName) : Prop :=
  statement_meaning (ConAng a b).

Definition interp_triangle_congruence (t u : TriangleName) : Prop :=
  triangle_congruence t u.

Definition interp_statement (s : Statement) : Prop :=
  statement_meaning s.

Definition interp_premise (p : Premise) : Prop :=
  interp_statement p.(premise_statement).

Definition triangle_well_formed (t : TriangleName) : Prop :=
  ~ Col (point t.(triangle_first)) (point t.(triangle_second)) (point t.(triangle_third)).

Lemma triangle_well_formed_nondegenerate : forall t,
  triangle_well_formed t -> triangle_nondegenerate t.
Proof.
  intros t H. unfold triangle_well_formed in H. unfold triangle_nondegenerate.
  apply not_col_distincts in H. destruct H as [Hncol [Hab [Hbc Hac]]].
  repeat split; auto.
Qed.

Definition declarations_well_formed (d : Declarations) : Prop :=
  (forall t, In t d.(decl_triangles) -> triangle_well_formed t) /\
  (forall a, In a d.(decl_angles) -> angle_well_formed a) /\
  (forall q, In q d.(decl_quadrilaterals) ->
     Audit.QuadrilateralWellFormed point q) /\
  (forall c, In c d.(decl_circles) ->
     Audit.CircleWellFormed point c) /\
  (* A [seg:] line is audited as [SegmentWellFormed]: its endpoints differ. *)
  (forall s, In s d.(decl_segments) ->
     point s.(segment_first) <> point s.(segment_second)).

End EnderSemantics.

(** The kernel's names for audited conditions unfold with them. *)
Arguments triangle_nondegenerate {Tn} point t /.
Arguments angle_well_formed {Tn} point a /.
Arguments right_angle {Tn} point a /.
