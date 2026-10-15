From Stdlib Require Import Ascii String List Bool Nat.
Require Export Ender.Audit.
Import ListNotations.

Module EnderSyntax.

(** The kernel reasons about the audited statements themselves: there is one
    [Statement] type, [Audit.Statement], read with its audited meaning.  What
    is defined here is the structure of a proof around it -- reasons, steps,
    and the declarations that supply nondegeneracy. *)
Definition PointId := ascii.

Inductive Reason :=
| Given : string -> Reason | Reflex : Reason
| SAS : nat -> nat -> nat -> Reason | SSS : nat -> nat -> nat -> Reason
| ASA : nat -> nat -> nat -> Reason | AAS : nat -> nat -> nat -> Reason
| CPCTC : nat -> Reason
| ConSegTrans : nat -> nat -> Reason
| ConAngTrans : nat -> nat -> Reason
| ConTriTrans : nat -> nat -> Reason
| DefConRight : nat -> nat -> Reason
| PerpConAng : nat -> Reason
| DefMidpt : nat -> Reason
| VertAng : string -> Reason
| DefAngBisect : nat -> Reason
| AngBisectConv : nat -> Reason
| RHL : nat -> nat -> nat -> Reason
| MidptConv : nat -> Reason
| ThirdAngle : nat -> nat -> Reason
| DefConTri : nat -> nat -> nat -> nat -> nat -> nat -> Reason
| DefIsosceles : nat -> Reason
| BaseAngle : nat -> Reason
| BaseAngleConv : nat -> Reason
| DefEquilateral : nat -> nat -> nat -> Reason
| DefEquiangular : nat -> nat -> nat -> Reason
| EquilatEquiang : nat -> Reason
| EquiangEquilat : nat -> Reason
| ConSupplements : nat -> nat -> nat -> Reason
| ConSupplementsSame : nat -> nat -> Reason
| ConComplements : nat -> nat -> nat -> Reason
| ConComplementsSame : nat -> nat -> Reason
| DefLinearPair : nat -> Reason
| DefPerp : nat -> Reason
| DefParallelogram : nat -> nat -> Reason
| PgramOppSides : nat -> Reason
| PgramOppAngles : nat -> Reason
| PgramConsecAngs : nat -> Reason
| KiteOppConAng : nat -> Reason
| PgramOppSidesConv : nat -> nat -> Reason
| PgramConsecAngsConv : nat -> nat -> Reason
| RectPgramAng : nat -> nat -> Reason
| PgramOppSidePara : nat -> nat -> Reason
| RectanglePgram : nat -> Reason
| RhombusPgram : nat -> Reason
| RhombusConsecSides : nat -> nat -> Reason
| RhombusDef : nat -> Reason
| RhombusOppBisect : nat -> Reason
| RectDiagCon : nat -> Reason
| RectangleDef : nat -> Reason
| AltInt : nat -> Reason
| AltExt : nat -> Reason
| CorrespAng : nat -> Reason
| SamesideAng : nat -> Reason
| AltIntConv : nat -> Reason
| AltExtConv : nat -> Reason
| CorrespAngConv : nat -> Reason
| SamesideAngConv : nat -> Reason
| ParaTrans : nat -> nat -> Reason
| DefRadius : nat -> Reason
| InscribedSemi : nat -> Reason
| ConChordsArcs : nat -> Reason
| TangentPerp : nat -> nat -> Reason
| TangentPerpConv : nat -> nat -> Reason
| ConTangentsExt : nat -> nat -> Reason
| RadiusChordBisect : nat -> nat -> nat -> Reason
| PerpBisect : nat -> nat -> Reason
| IsosTrapConDiags : nat -> nat -> Reason
| IsosTrapBaseAngs : nat -> nat -> Reason
| IsosTrapBaseAngsConv : nat -> Reason
| PgramDiagBisectConv : nat -> nat -> Reason
| PgramOppAngsConv : nat -> nat -> Reason
| RectDiagConConv : nat -> nat -> Reason
| RhombusDiagPerpConv : nat -> nat -> Reason
| RhombusOppBisectConv : nat -> nat -> nat -> Reason
| AASim : nat -> nat -> Reason
| LinearPairConv : nat -> Reason
| PgramDiagBisect : nat -> Reason
| RhombusDiagPerp : nat -> Reason
| KiteDiagPerp : nat -> Reason
| ChordBisectConv : nat -> nat -> Reason
| DefRadiusConv : nat -> Reason.

Record Premise := premise { premise_label : string; premise_statement : Statement }.
Record Step := step { step_reason : Reason; step_conclusion : Statement }.

(** Declared objects, bundled because every rule that needs one of them needs
    the others too: they are the kernel's only source of nondegeneracy. *)
Record Declarations := declarations {
  decl_triangles : list TriangleName;
  decl_angles : list AngleName;
  decl_quadrilaterals : list QuadrilateralName;
  decl_circles : list CircleName;
  decl_segments : list SegmentName
}.

Record ProblemHeader := problem_header {
  header_declarations : Declarations; header_premises : list Premise;
  header_goal : Statement
}.
Record Problem := problem {
  problem_declarations : Declarations; problem_premises : list Premise;
  problem_goal : Statement; problem_steps : list Step
}.

Definition ascii_eqb := Ascii.eqb.

Definition segment_eqb (x y : SegmentName) : bool :=
  ascii_eqb x.(segment_first) y.(segment_first) && ascii_eqb x.(segment_second) y.(segment_second).

Definition angle_eqb (x y : AngleName) : bool :=
  ascii_eqb x.(angle_first) y.(angle_first) &&
  ascii_eqb x.(angle_vertex) y.(angle_vertex) &&
  ascii_eqb x.(angle_last) y.(angle_last).

Definition triangle_eqb (x y : TriangleName) : bool :=
  ascii_eqb x.(triangle_first) y.(triangle_first) && ascii_eqb x.(triangle_second) y.(triangle_second) &&
  ascii_eqb x.(triangle_third) y.(triangle_third).

Definition quadrilateral_eqb (x y : QuadrilateralName) : bool :=
  ascii_eqb x.(quadrilateral_first) y.(quadrilateral_first) && ascii_eqb x.(quadrilateral_second) y.(quadrilateral_second) &&
  ascii_eqb x.(quadrilateral_third) y.(quadrilateral_third) && ascii_eqb x.(quadrilateral_fourth) y.(quadrilateral_fourth).

Definition circle_eqb (x y : CircleName) : bool :=
  ascii_eqb x.(circle_center) y.(circle_center) && ascii_eqb x.(circle_radius_point) y.(circle_radius_point).

Definition arc_kind_eqb (x y : Audit.ArcKind) : bool :=
  match x, y with
  | Audit.MinorArc, Audit.MinorArc | Audit.MajorArc, Audit.MajorArc => true
  | _, _ => false
  end.

Definition arc_eqb (x y : ArcName) : bool :=
  arc_kind_eqb x.(arc_kind) y.(arc_kind) && circle_eqb x.(arc_circle) y.(arc_circle) &&
  ascii_eqb x.(arc_first) y.(arc_first) && ascii_eqb x.(arc_second) y.(arc_second).

Definition statement_eqb (x y : Statement) : bool :=
  match x, y with
  | ConSeg a b, ConSeg c d | RefSeg a b, RefSeg c d =>
      segment_eqb a c && segment_eqb b d
  | ConAng a b, ConAng c d | RefAng a b, RefAng c d =>
      angle_eqb a c && angle_eqb b d
  | ConTri a b, ConTri c d | ConTriOrdered a b, ConTriOrdered c d
  | SimTri a b, SimTri c d =>
      triangle_eqb a c && triangle_eqb b d
  | Right a, Right b => angle_eqb a b
  | ConRight a b, ConRight c d => angle_eqb a c && angle_eqb b d
  | Perp a b p, Perp c d q =>
      segment_eqb a c && segment_eqb b d && ascii_eqb p q
  | Midpt a p, Midpt b q => segment_eqb a b && ascii_eqb p q
  | IntersectSeg a b p, IntersectSeg c d q =>
      segment_eqb a c && segment_eqb b d && ascii_eqb p q
  | AngBisect a b, AngBisect c d => angle_eqb a c && segment_eqb b d
  | SegBisect a b p, SegBisect c d q =>
      segment_eqb a c && segment_eqb b d && ascii_eqb p q
  | OnLine a p, OnLine b q => segment_eqb a b && ascii_eqb p q
  | Isosceles a, Isosceles b | Equilateral a, Equilateral b
  | Equiangular a, Equiangular b => triangle_eqb a b
  | Supplementary a b, Supplementary c d
  | Complementary a b, Complementary c d => angle_eqb a c && angle_eqb b d
  | LinearPair a b, LinearPair c d => angle_eqb a c && angle_eqb b d
  | Para a b, Para c d => segment_eqb a c && segment_eqb b d
  | Parallelogram a, Parallelogram b | Rectangle a, Rectangle b | Rhombus a, Rhombus b
  | IsosTrapezoid a, IsosTrapezoid b => quadrilateral_eqb a b
  | TrapezoidPremise q a b, TrapezoidPremise r c d
  | IsosTrapezoidPremise q a b, IsosTrapezoidPremise r c d =>
      quadrilateral_eqb q r && segment_eqb a c && segment_eqb b d
  | KitePremise q a b, KitePremise r c d =>
      quadrilateral_eqb q r && angle_eqb a c && angle_eqb b d
  | Transversal a b t1 i1 c d t2 i2, Transversal a' b' t1' i1' c' d' t2' i2' =>
      ascii_eqb a a' && ascii_eqb b b' && ascii_eqb t1 t1' &&
      ascii_eqb i1 i1' && ascii_eqb c c' && ascii_eqb d d' &&
      ascii_eqb t2 t2' && ascii_eqb i2 i2'
  | Radius c p, Radius c' p' | OnCirclePoint c p, OnCirclePoint c' p' =>
      circle_eqb c c' && ascii_eqb p p'
  | Chord c s, Chord c' s' | Diameter c s, Diameter c' s'
  | CenterOnLine c s, CenterOnLine c' s' =>
      circle_eqb c c' && segment_eqb s s'
  | Tangent c s p, Tangent c' s' p' =>
      circle_eqb c c' && segment_eqb s s' && ascii_eqb p p'
  | InscribedAngle c a, InscribedAngle c' a'
  | MinorInscribedAngle c a, MinorInscribedAngle c' a'
  | MajorInscribedAngle c a, MajorInscribedAngle c' a' =>
      circle_eqb c c' && angle_eqb a a'
  | ArcStatement a, ArcStatement a' => arc_eqb a a'
  | ConArc a b, ConArc a' b' => arc_eqb a a' && arc_eqb b b'
  | Proportion a b c d, Proportion a' b' c' d' =>
      segment_eqb a a' && segment_eqb b b' && segment_eqb c c' && segment_eqb d d'
  | Circumcenter p t, Circumcenter p' t' | Incenter p t, Incenter p' t' =>
      ascii_eqb p p' && triangle_eqb t t'
  | PerpBisector a b p, PerpBisector a' b' p' =>
      segment_eqb a a' && segment_eqb b b' && ascii_eqb p p'
  | _, _ => false
  end.

Lemma segment_eqb_eq : forall x y, segment_eqb x y = true <-> x = y.
Proof.
  intros [a b] [c d].
  change (Ascii.eqb a c && Ascii.eqb b d = true <-> segment_name a b = segment_name c d).
  rewrite andb_true_iff, !Ascii.eqb_eq.
  split.
  - intros [-> ->]. reflexivity.
  - intros H. inversion H. split; reflexivity.
Qed.

Lemma angle_eqb_eq : forall x y, angle_eqb x y = true <-> x = y.
Proof.
  intros [a b c] [d e f].
  change (Ascii.eqb a d && Ascii.eqb b e && Ascii.eqb c f = true <->
          angle_name a b c = angle_name d e f).
  rewrite !andb_true_iff, !Ascii.eqb_eq.
  split.
  - intros [[-> ->] ->]. reflexivity.
  - intros H. inversion H. repeat split; reflexivity.
Qed.

Lemma triangle_eqb_eq : forall x y, triangle_eqb x y = true <-> x = y.
Proof.
  intros [a b c] [d e f].
  change (Ascii.eqb a d && Ascii.eqb b e && Ascii.eqb c f = true <->
          triangle_name a b c = triangle_name d e f).
  rewrite !andb_true_iff, !Ascii.eqb_eq.
  split.
  - intros [[-> ->] ->]. reflexivity.
  - intros H. inversion H. repeat split; reflexivity.
Qed.

Lemma circle_eqb_eq : forall x y, circle_eqb x y = true <-> x = y.
Proof.
  intros [a b] [c d].
  change (Ascii.eqb a c && Ascii.eqb b d = true <-> circle_name a b = circle_name c d).
  rewrite andb_true_iff, !Ascii.eqb_eq.
  split.
  - intros [-> ->]. reflexivity.
  - intros H. inversion H. split; reflexivity.
Qed.

Lemma arc_kind_eqb_eq : forall x y, arc_kind_eqb x y = true <-> x = y.
Proof.
  intros [|] [|]; cbn; split; intro H; congruence.
Qed.

Lemma arc_eqb_eq : forall x y, arc_eqb x y = true <-> x = y.
Proof.
  intros [k c a b] [k' c' a' b']. unfold arc_eqb. cbn.
  rewrite !andb_true_iff, arc_kind_eqb_eq, circle_eqb_eq.
  unfold ascii_eqb. rewrite !Ascii.eqb_eq.
  split.
  - intros [[[-> ->] ->] ->]. reflexivity.
  - intros H. inversion H. repeat split; reflexivity.
Qed.

Lemma quadrilateral_eqb_eq : forall x y, quadrilateral_eqb x y = true <-> x = y.
Proof.
  intros [a b c d] [e f g h].
  change (Ascii.eqb a e && Ascii.eqb b f && Ascii.eqb c g && Ascii.eqb d h
            = true <-> quadrilateral_name a b c d = quadrilateral_name e f g h).
  rewrite !andb_true_iff, !Ascii.eqb_eq.
  split.
  - intros [[[-> ->] ->] ->]. reflexivity.
  - intros H. inversion H. repeat split; reflexivity.
Qed.

Lemma statement_eqb_eq : forall x y, statement_eqb x y = true <-> x = y.
Proof.
  destruct x, y; cbn; unfold ascii_eqb;
    rewrite ?andb_true_iff, ?segment_eqb_eq, ?angle_eqb_eq, ?triangle_eqb_eq,
      ?quadrilateral_eqb_eq, ?circle_eqb_eq, ?arc_eqb_eq, ?Ascii.eqb_eq;
    split; intro H; solve [discriminate | intuition congruence].
Qed.

Definition triangle_mem (t : TriangleName) (ts : list TriangleName) : bool :=
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
