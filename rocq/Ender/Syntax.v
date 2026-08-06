From Stdlib Require Import Ascii String List Bool Nat.
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
Record Quadrilateral := quadrilateral {
  quad_a : PointId; quad_b : PointId; quad_c : PointId; quad_d : PointId
}.

Inductive Statement :=
| ConSeg : Segment -> Segment -> Statement
| ConAng : Angle -> Angle -> Statement
| ConTri : Triangle -> Triangle -> Statement
| RefSeg : Segment -> Segment -> Statement
| RefAng : Angle -> Angle -> Statement
| RightAng : Angle -> Statement
| ConRight : Angle -> Angle -> Statement
| PerpAt : Segment -> Segment -> PointId -> Statement
| MidptOf : Segment -> PointId -> Statement
| IntersectSeg : Segment -> Segment -> PointId -> Statement
| AngBisectOf : Angle -> Segment -> Statement
| OnLine : Segment -> PointId -> Statement
| IsoscelesTri : Triangle -> Statement
| EquilateralTri : Triangle -> Statement
| EquiangularTri : Triangle -> Statement
| Supplementary : Angle -> Angle -> Statement
(** Quadrilateral and parallelism statements.  Kernel meanings for these are
    the audited meanings verbatim (see [Semantics.v]), so the two layers
    cannot drift. *)
| Para : Segment -> Segment -> Statement
| Pgram : Quadrilateral -> Statement
| Rect : Quadrilateral -> Statement
| Rhomb : Quadrilateral -> Statement
| IsosTrap : Quadrilateral -> Statement
| TrapPremise : Quadrilateral -> Segment -> Segment -> Statement
| IsosTrapPremise : Quadrilateral -> Segment -> Segment -> Statement
| KiteP : Quadrilateral -> Angle -> Angle -> Statement
| Transv : PointId -> PointId -> PointId -> PointId ->
           PointId -> PointId -> PointId -> PointId -> Statement.

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
| DefPerp : nat -> Reason
| DefParallelogram : nat -> nat -> Reason
| PgramOppSides : nat -> Reason
| PgramOppSidePara : nat -> nat -> Reason
| RectanglePgram : nat -> Reason
| RhombusPgram : nat -> Reason
| RhombusConsecSides : nat -> nat -> Reason
| AltInt : nat -> Reason
| AltExt : nat -> Reason
| CorrespAng : nat -> Reason
| SamesideAng : nat -> Reason
| AltIntConv : nat -> Reason
| AltExtConv : nat -> Reason
| CorrespAngConv : nat -> Reason
| SamesideAngConv : nat -> Reason
| ParaTrans : nat -> nat -> Reason.

Record Premise := premise { premise_label : string; premise_statement : Statement }.
Record Step := step { step_reason : Reason; step_conclusion : Statement }.

(** Declared objects, bundled because every rule that needs one of them needs
    the others too: they are the kernel's only source of nondegeneracy. *)
Record Declarations := declarations {
  decl_triangles : list Triangle;
  decl_angles : list Angle;
  decl_quadrilaterals : list Quadrilateral
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

Definition segment_eqb (x y : Segment) : bool :=
  ascii_eqb x.(seg_start) y.(seg_start) && ascii_eqb x.(seg_end) y.(seg_end).

Definition angle_eqb (x y : Angle) : bool :=
  ascii_eqb x.(ang_left) y.(ang_left) &&
  ascii_eqb x.(ang_vertex) y.(ang_vertex) &&
  ascii_eqb x.(ang_right) y.(ang_right).

Definition triangle_eqb (x y : Triangle) : bool :=
  ascii_eqb x.(tri_a) y.(tri_a) && ascii_eqb x.(tri_b) y.(tri_b) &&
  ascii_eqb x.(tri_c) y.(tri_c).

Definition quadrilateral_eqb (x y : Quadrilateral) : bool :=
  ascii_eqb x.(quad_a) y.(quad_a) && ascii_eqb x.(quad_b) y.(quad_b) &&
  ascii_eqb x.(quad_c) y.(quad_c) && ascii_eqb x.(quad_d) y.(quad_d).

Definition statement_eqb (x y : Statement) : bool :=
  match x, y with
  | ConSeg a b, ConSeg c d | RefSeg a b, RefSeg c d =>
      segment_eqb a c && segment_eqb b d
  | ConAng a b, ConAng c d | RefAng a b, RefAng c d =>
      angle_eqb a c && angle_eqb b d
  | ConTri a b, ConTri c d => triangle_eqb a c && triangle_eqb b d
  | RightAng a, RightAng b => angle_eqb a b
  | ConRight a b, ConRight c d => angle_eqb a c && angle_eqb b d
  | PerpAt a b p, PerpAt c d q =>
      segment_eqb a c && segment_eqb b d && ascii_eqb p q
  | MidptOf a p, MidptOf b q => segment_eqb a b && ascii_eqb p q
  | IntersectSeg a b p, IntersectSeg c d q =>
      segment_eqb a c && segment_eqb b d && ascii_eqb p q
  | AngBisectOf a b, AngBisectOf c d => angle_eqb a c && segment_eqb b d
  | OnLine a p, OnLine b q => segment_eqb a b && ascii_eqb p q
  | IsoscelesTri a, IsoscelesTri b | EquilateralTri a, EquilateralTri b
  | EquiangularTri a, EquiangularTri b => triangle_eqb a b
  | Supplementary a b, Supplementary c d => angle_eqb a c && angle_eqb b d
  | Para a b, Para c d => segment_eqb a c && segment_eqb b d
  | Pgram a, Pgram b | Rect a, Rect b | Rhomb a, Rhomb b
  | IsosTrap a, IsosTrap b => quadrilateral_eqb a b
  | TrapPremise q a b, TrapPremise r c d
  | IsosTrapPremise q a b, IsosTrapPremise r c d =>
      quadrilateral_eqb q r && segment_eqb a c && segment_eqb b d
  | KiteP q a b, KiteP r c d =>
      quadrilateral_eqb q r && angle_eqb a c && angle_eqb b d
  | Transv a b t1 i1 c d t2 i2, Transv a' b' t1' i1' c' d' t2' i2' =>
      ascii_eqb a a' && ascii_eqb b b' && ascii_eqb t1 t1' &&
      ascii_eqb i1 i1' && ascii_eqb c c' && ascii_eqb d d' &&
      ascii_eqb t2 t2' && ascii_eqb i2 i2'
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

Lemma quadrilateral_eqb_eq : forall x y, quadrilateral_eqb x y = true <-> x = y.
Proof.
  intros [a b c d] [e f g h].
  change (Ascii.eqb a e && Ascii.eqb b f && Ascii.eqb c g && Ascii.eqb d h
            = true <-> quadrilateral a b c d = quadrilateral e f g h).
  rewrite !andb_true_iff, !Ascii.eqb_eq.
  split.
  - intros [[[-> ->] ->] ->]. reflexivity.
  - intros H. inversion H. repeat split; reflexivity.
Qed.

Lemma statement_eqb_eq : forall x y, statement_eqb x y = true <-> x = y.
Proof.
  destruct x, y; cbn; unfold ascii_eqb;
    rewrite ?andb_true_iff, ?segment_eqb_eq, ?angle_eqb_eq, ?triangle_eqb_eq,
      ?quadrilateral_eqb_eq, ?Ascii.eqb_eq;
    split; intro H; solve [discriminate | intuition congruence].
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
