From Stdlib Require Import List.
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

(** Kept identical to the audited [TriangleWellFormed]. *)
Definition triangle_nondegenerate (t : Triangle) : Prop :=
  point t.(tri_a) <> point t.(tri_b) /\
  point t.(tri_b) <> point t.(tri_c) /\
  point t.(tri_c) <> point t.(tri_a) /\
  ~ Col (point t.(tri_a)) (point t.(tri_b)) (point t.(tri_c)).

(** Kernel names converted to audited names.  The quadrilateral and
    parallelism statements below carry the audited meanings verbatim through
    these conversions, so the two layers cannot drift. *)
Definition seg_name (s : Segment) : Audit.SegmentName :=
  Audit.segment_name s.(seg_start) s.(seg_end).
Definition ang_name (a : Angle) : Audit.AngleName :=
  Audit.angle_name a.(ang_left) a.(ang_vertex) a.(ang_right).
Definition quad_name (q : Quadrilateral) : Audit.QuadrilateralName :=
  Audit.quadrilateral_name q.(quad_a) q.(quad_b) q.(quad_c) q.(quad_d).
Definition circ_name (c : Circle) : Audit.CircleName :=
  Audit.circle_name c.(circle_c) c.(circle_r).
Definition arc_names (a : Arc) : Audit.ArcName :=
  Audit.arc_name a.(arc_k) (circ_name a.(arc_circ)) a.(arc_p1) a.(arc_p2).

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
  (* Mirrors the audited [AngleBisector]: which endpoint of the ray names the
     vertex is a condition on point *names*, exactly as in [Audit.v]. *)
  | AngBisectOf a s =>
      (s.(seg_start) = a.(ang_vertex) /\
        CongA (point a.(ang_left)) (point a.(ang_vertex)) (point s.(seg_end))
              (point s.(seg_end)) (point a.(ang_vertex)) (point a.(ang_right))) \/
      (s.(seg_end) = a.(ang_vertex) /\
        CongA (point a.(ang_left)) (point a.(ang_vertex)) (point s.(seg_start))
              (point s.(seg_start)) (point a.(ang_vertex)) (point a.(ang_right)))
  | OnLine s p =>
      point s.(seg_start) <> point s.(seg_end) /\
      Bet (point s.(seg_start)) (point p) (point s.(seg_end))
  (* The three shape statements mirror the audited meanings exactly, including
     the audited angle vertex order, so that they project both ways. *)
  | IsoscelesTri t =>
      triangle_nondegenerate t /\
      (Cong (point t.(tri_a)) (point t.(tri_b))
            (point t.(tri_b)) (point t.(tri_c)) \/
       Cong (point t.(tri_b)) (point t.(tri_c))
            (point t.(tri_c)) (point t.(tri_a)) \/
       Cong (point t.(tri_c)) (point t.(tri_a))
            (point t.(tri_a)) (point t.(tri_b)))
  | EquilateralTri t =>
      triangle_nondegenerate t /\
      Cong (point t.(tri_a)) (point t.(tri_b))
           (point t.(tri_b)) (point t.(tri_c)) /\
      Cong (point t.(tri_b)) (point t.(tri_c))
           (point t.(tri_c)) (point t.(tri_a))
  | EquiangularTri t =>
      triangle_nondegenerate t /\
      CongA (point t.(tri_c)) (point t.(tri_a)) (point t.(tri_b))
            (point t.(tri_a)) (point t.(tri_b)) (point t.(tri_c)) /\
      CongA (point t.(tri_a)) (point t.(tri_b)) (point t.(tri_c))
            (point t.(tri_b)) (point t.(tri_c)) (point t.(tri_a))
  | Supplementary a b =>
      SuppA (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right))
            (point b.(ang_left)) (point b.(ang_vertex)) (point b.(ang_right))
  (* The audited meaning verbatim: [SAMS] is what says the two together make
     the right angle, rather than wrapping past it. *)
  | Complementary a b => exists X Y Z,
      Per X Y Z /\
      SAMS (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right))
           (point b.(ang_left)) (point b.(ang_vertex)) (point b.(ang_right)) /\
      SumA (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right))
           (point b.(ang_left)) (point b.(ang_vertex)) (point b.(ang_right))
           X Y Z
  | LinearPair a b => Audit.LinearPairMeaning point (ang_name a) (ang_name b)
  | Para a b => Audit.Parallel point (seg_name a) (seg_name b)
  | Pgram q => Audit.IsParallelogram point (quad_name q)
  | Rect q => Audit.IsRectangle point (quad_name q)
  | Rhomb q => Audit.IsRhombus point (quad_name q)
  | IsosTrap q => Audit.IsIsoscelesTrapezoid point (quad_name q)
  | TrapPremise q a b =>
      Audit.IsTrapezoid point (quad_name q) /\
      Audit.Parallel point (seg_name a) (seg_name b)
  | IsosTrapPremise q a b =>
      Audit.IsIsoscelesTrapezoid point (quad_name q) /\
      Audit.Parallel point (seg_name a) (seg_name b)
  | KiteP q a b =>
      Audit.IsKitePremise point (quad_name q) (ang_name a) (ang_name b)
  | Transv a b t1 i1 c d t2 i2 =>
      Audit.TransversalConfiguration point a b t1 i1 c d t2 i2
  | RadiusOf c p => Audit.OnCircle point (circ_name c) p
  | ChordOf c s => Audit.IsChord point (circ_name c) (seg_name s)
  | DiameterOf c s => Audit.IsDiameter point (circ_name c) (seg_name s)
  | TangentAt c s p => Audit.IsTangent point (circ_name c) (seg_name s) p
  | InscribedAngleOf c a =>
      Audit.IsInscribedAngle point (circ_name c) (ang_name a)
  | ArcOf a => Audit.ArcWellFormed point (arc_names a)
  | ConArc a b => Audit.ArcCongruent point (arc_names a) (arc_names b)
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
     Audit.QuadrilateralWellFormed point (quad_name q)) /\
  (forall c, In c d.(decl_circles) ->
     Audit.CircleWellFormed point (circ_name c)) /\
  (* A [seg:] line is audited as [SegmentWellFormed]: its endpoints differ. *)
  (forall s, In s d.(decl_segments) ->
     point s.(seg_start) <> point s.(seg_end)).

End EnderSemantics.
