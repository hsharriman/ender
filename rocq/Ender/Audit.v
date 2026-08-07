(** This is the complete human-audit surface for the Ender checker.  It
    intentionally imports no Ender implementation module.

    Five things carry the guarantee, and an auditor can read them in this
    order: [PublicStatement] is the theorem language; [statementMeaning] and
    [problemClaim] say what a problem asserts about Tarski geometry;
    [ProblemGrammar] says which source text states which problem; and
    [COMPLETE_VERIFIED_CHECKER] binds the implementation to all of them.
    Everything else here either serves one of those five or is marked as
    advisory data that no theorem constrains. *)
From Stdlib Require Import Ascii String List Bool.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Import ListNotations.
Local Open Scope string_scope.

(** * The problem part of a source

    Return precisely the text after the [pt:] line and before [steps:].

    Rocq string literals have no escape sequences, so a line feed can only be
    spelled through its [ascii] code. *)

Definition newlineCharacter : ascii := "010"%char.
Definition newline : string := String newlineCharacter "".

Definition after (marker text : string) : option string :=
  match index 0 marker text with
  | Some start =>
      Some (substring (start + String.length marker) (String.length text) text)
  | None => None
  end.

Definition before (marker text : string) : option string :=
  match index 0 marker text with
  | Some start => Some (substring 0 start text)
  | None => None
  end.

Definition problemPart (source : string) : option string :=
  match after "pt:" source with
  | None => None
  | Some afterPoints =>
      match after newline afterPoints with
      | None => None
      | Some afterCoordinates => before "steps:" afterCoordinates
      end
  end.

(** * The complete public theorem language

    A figure is named by the points it is drawn through. *)

Definition PointName := ascii.
Record SegmentName := segment_name {
  segment_first : PointName; segment_second : PointName
}.
Record AngleName := angle_name {
  angle_first : PointName; angle_vertex : PointName; angle_last : PointName
}.
Record TriangleName := triangle_name {
  triangle_first : PointName; triangle_second : PointName;
  triangle_third : PointName
}.
Record QuadrilateralName := quadrilateral_name {
  quadrilateral_first : PointName; quadrilateral_second : PointName;
  quadrilateral_third : PointName; quadrilateral_fourth : PointName
}.
Record CircleName := circle_name {
  circle_center : PointName; circle_radius_point : PointName
}.
Inductive ArcKind := MinorArc | MajorArc.
Record ArcName := arc_name {
  arc_kind : ArcKind; arc_circle : CircleName;
  arc_first : PointName; arc_second : PointName
}.

Inductive PublicStatement :=
| OnLine (s : SegmentName) (p : PointName)
| Transversal (a b t1 i1 c d t2 i2 : PointName)
| IntersectSeg (a b : SegmentName) (p : PointName)
| TrapezoidPremise (q : QuadrilateralName) (a b : SegmentName)
| KitePremise (q : QuadrilateralName) (a b : AngleName)
| IsosTrapezoidPremise (q : QuadrilateralName) (a b : SegmentName)
| Right (a : AngleName)
| ConSeg (a b : SegmentName)
| ConAng (a b : AngleName)
| ConTri (a b : TriangleName)
| ConRight (a b : AngleName)
| Para (a b : SegmentName)
| Isosceles (t : TriangleName)
| Perp (a b : SegmentName) (p : PointName)
| Midpt (s : SegmentName) (p : PointName)
| AngBisect (a : AngleName) (s : SegmentName)
| Rectangle (q : QuadrilateralName)
| Parallelogram (q : QuadrilateralName)
| Proportion (a b c d : SegmentName)
| SimTri (a b : TriangleName)
| Equilateral (t : TriangleName)
| Supplementary (a b : AngleName)
| Complementary (a b : AngleName)
| LinearPair (a b : AngleName)
| Equiangular (t : TriangleName)
| Circumcenter (p : PointName) (t : TriangleName)
| Incenter (p : PointName) (t : TriangleName)
| PerpBisector (a b : SegmentName) (p : PointName)
| SegBisect (a b : SegmentName) (p : PointName)
| IsosTrapezoid (q : QuadrilateralName)
| Rhombus (q : QuadrilateralName)
| Tangent (c : CircleName) (s : SegmentName) (p : PointName)
| Chord (c : CircleName) (s : SegmentName)
| ArcStatement (a : ArcName)
| Radius (c : CircleName) (p : PointName)
| Diameter (c : CircleName) (s : SegmentName)
| InscribedAngle (c : CircleName) (a : AngleName)
| RefSeg (a b : SegmentName)
| RefAng (a b : AngleName)
| ConArc (a b : ArcName).

Inductive PublicDeclaration :=
| SegmentDeclaration (s : SegmentName)
| AngleDeclaration (a : AngleName)
| TriangleDeclaration (t : TriangleName)
| QuadrilateralDeclaration (q : QuadrilateralName)
| CircleDeclaration (c : CircleName).

Record PublicProblem := public_problem {
  public_declarations : list PublicDeclaration;
  public_premises : list PublicStatement;
  public_conclusion : PublicStatement
}.

(** * What a problem means

    A problem is read against an assignment of a Tarski point to every point
    name; its claim is that the premises entail the conclusion there. *)

Section GeometryMeaning.

(** Every meaning below is stated in bare neutral dimensionless Tarski
    geometry: no decidable point equality, no upper dimension bound, no
    parallel postulate.  Those assumptions belong to proving entailments, not
    to stating them, so they appear only in [checker_sound]. *)
Context {Tn : Tarski_neutral_dimensionless}.
Variable point : PointName -> Tpoint.

Definition seg_start (s : SegmentName) := point s.(segment_first).
Definition seg_end (s : SegmentName) := point s.(segment_second).
Definition ang_start (a : AngleName) := point a.(angle_first).
Definition ang_vertex (a : AngleName) := point a.(angle_vertex).
Definition ang_end (a : AngleName) := point a.(angle_last).
Definition circ_center (c : CircleName) := point c.(circle_center).

Definition SegmentWellFormed (s : SegmentName) : Prop := seg_start s <> seg_end s.
Definition AngleWellFormed (a : AngleName) : Prop :=
  ang_start a <> ang_vertex a /\ ang_end a <> ang_vertex a.
Definition TriangleWellFormed (t : TriangleName) : Prop :=
  let A := point t.(triangle_first) in
  let B := point t.(triangle_second) in
  let C := point t.(triangle_third) in
  A <> B /\ B <> C /\ C <> A /\ ~ Col A B C.
(** Crossing diagonals put the vertices in cyclic convex order.  The [~ Col]
    conjunct excludes the remaining case in which all four vertices are
    interleaved on one line. *)
Definition QuadrilateralWellFormed (q : QuadrilateralName) : Prop :=
  let A := point q.(quadrilateral_first) in
  let B := point q.(quadrilateral_second) in
  let C := point q.(quadrilateral_third) in
  let D := point q.(quadrilateral_fourth) in
  A <> B /\ A <> C /\ A <> D /\ B <> C /\ B <> D /\ C <> D /\
  ~ Col A B C /\
  (exists X, BetS A X C /\ BetS B X D).
Definition CircleWellFormed (c : CircleName) : Prop :=
  circ_center c <> point c.(circle_radius_point).

Definition SegmentCongruent (a b : SegmentName) : Prop :=
  Cong (seg_start a) (seg_end a) (seg_start b) (seg_end b).
Definition AngleCongruent (a b : AngleName) : Prop :=
  CongA (ang_start a) (ang_vertex a) (ang_end a)
        (ang_start b) (ang_vertex b) (ang_end b).
Definition Parallel (a b : SegmentName) : Prop :=
  Par (seg_start a) (seg_end a) (seg_start b) (seg_end b).
Definition PerpendicularAt (a b : SegmentName) (p : PointName) : Prop :=
  Perp_at (point p) (seg_start a) (seg_end a) (seg_start b) (seg_end b).
Definition OnSegment (s : SegmentName) (p : PointName) : Prop :=
  Bet (seg_start s) (point p) (seg_end s).
Definition MidpointOf (s : SegmentName) (p : PointName) : Prop :=
  Midpoint (point p) (seg_start s) (seg_end s).
Definition RightAngle (a : AngleName) : Prop :=
  Per (ang_start a) (ang_vertex a) (ang_end a).

Definition side_ab (t : TriangleName) :=
  segment_name t.(triangle_first) t.(triangle_second).
Definition side_bc (t : TriangleName) :=
  segment_name t.(triangle_second) t.(triangle_third).
Definition side_ca (t : TriangleName) :=
  segment_name t.(triangle_third) t.(triangle_first).
Definition angle_a (t : TriangleName) :=
  angle_name t.(triangle_third) t.(triangle_first) t.(triangle_second).
Definition angle_b (t : TriangleName) :=
  angle_name t.(triangle_first) t.(triangle_second) t.(triangle_third).
Definition angle_c (t : TriangleName) :=
  angle_name t.(triangle_second) t.(triangle_third) t.(triangle_first).

Definition TriangleCongruent (a b : TriangleName) : Prop :=
  TriangleWellFormed a /\ TriangleWellFormed b /\
  SegmentCongruent (side_ab a) (side_ab b) /\
  SegmentCongruent (side_bc a) (side_bc b) /\
  SegmentCongruent (side_ca a) (side_ca b).
Definition TriangleSimilar (a b : TriangleName) : Prop :=
  TriangleWellFormed a /\ TriangleWellFormed b /\
  AngleCongruent (angle_a a) (angle_a b) /\
  AngleCongruent (angle_b a) (angle_b b) /\
  AngleCongruent (angle_c a) (angle_c b).
Definition IsoscelesTriangle (t : TriangleName) : Prop :=
  TriangleWellFormed t /\
  (SegmentCongruent (side_ab t) (side_bc t) \/
   SegmentCongruent (side_bc t) (side_ca t) \/
   SegmentCongruent (side_ca t) (side_ab t)).
Definition EquilateralTriangle (t : TriangleName) : Prop :=
  TriangleWellFormed t /\ SegmentCongruent (side_ab t) (side_bc t) /\
  SegmentCongruent (side_bc t) (side_ca t).
Definition EquiangularTriangle (t : TriangleName) : Prop :=
  TriangleWellFormed t /\ AngleCongruent (angle_a t) (angle_b t) /\
  AngleCongruent (angle_b t) (angle_c t).

Definition quad_ab (q : QuadrilateralName) :=
  segment_name q.(quadrilateral_first) q.(quadrilateral_second).
Definition quad_bc (q : QuadrilateralName) :=
  segment_name q.(quadrilateral_second) q.(quadrilateral_third).
Definition quad_cd (q : QuadrilateralName) :=
  segment_name q.(quadrilateral_third) q.(quadrilateral_fourth).
Definition quad_da (q : QuadrilateralName) :=
  segment_name q.(quadrilateral_fourth) q.(quadrilateral_first).
Definition quad_angle_a (q : QuadrilateralName) :=
  angle_name q.(quadrilateral_fourth) q.(quadrilateral_first)
             q.(quadrilateral_second).
Definition quad_angle_b (q : QuadrilateralName) :=
  angle_name q.(quadrilateral_first) q.(quadrilateral_second)
             q.(quadrilateral_third).
Definition quad_angle_c (q : QuadrilateralName) :=
  angle_name q.(quadrilateral_second) q.(quadrilateral_third)
             q.(quadrilateral_fourth).
Definition quad_angle_d (q : QuadrilateralName) :=
  angle_name q.(quadrilateral_third) q.(quadrilateral_fourth)
             q.(quadrilateral_first).
Definition IsParallelogram (q : QuadrilateralName) : Prop :=
  QuadrilateralWellFormed q /\ Parallel (quad_ab q) (quad_cd q) /\
  Parallel (quad_bc q) (quad_da q).
(** All four corners are stated because one right corner of a parallelogram
    does not force the others in bare neutral geometry. *)
Definition IsRectangle (q : QuadrilateralName) : Prop :=
  IsParallelogram q /\ RightAngle (quad_angle_a q) /\
  RightAngle (quad_angle_b q) /\ RightAngle (quad_angle_c q) /\
  RightAngle (quad_angle_d q).
Definition IsRhombus (q : QuadrilateralName) : Prop :=
  IsParallelogram q /\ SegmentCongruent (quad_ab q) (quad_bc q) /\
  SegmentCongruent (quad_bc q) (quad_cd q) /\
  SegmentCongruent (quad_cd q) (quad_da q).
(** Two names for the same object, as written: a segment may be spelled from
    either end, an angle from either ray. *)
Definition SameSegmentName (a b : SegmentName) : Prop :=
  (a.(segment_first) = b.(segment_first) /\
   a.(segment_second) = b.(segment_second)) \/
  (a.(segment_first) = b.(segment_second) /\
   a.(segment_second) = b.(segment_first)).
Definition SameAngleName (a b : AngleName) : Prop :=
  a.(angle_vertex) = b.(angle_vertex) /\
  ((a.(angle_first) = b.(angle_first) /\ a.(angle_last) = b.(angle_last)) \/
   (a.(angle_first) = b.(angle_last) /\ a.(angle_last) = b.(angle_first))).
Definition SameAnglePair (selected1 selected2 first second : AngleName) : Prop :=
  (SameAngleName selected1 first /\ SameAngleName selected2 second) \/
  (SameAngleName selected2 first /\ SameAngleName selected1 second).

(** A kite pairs its adjacent sides up in one of two ways: AB with DA and BC
    with CD, which meet at A and C, or AB with BC and CD with DA, which meet at
    B and D.  The premise selects the angles at the other two corners, the ones
    a kite makes congruent. *)
Definition IsKitePremise
    (q : QuadrilateralName) (selected1 selected2 : AngleName) : Prop :=
  QuadrilateralWellFormed q /\
  ((SegmentCongruent (quad_ab q) (quad_da q) /\
    SegmentCongruent (quad_bc q) (quad_cd q) /\
    SameAnglePair selected1 selected2 (quad_angle_b q) (quad_angle_d q)) \/
   (SegmentCongruent (quad_ab q) (quad_bc q) /\
    SegmentCongruent (quad_cd q) (quad_da q) /\
    SameAnglePair selected1 selected2 (quad_angle_a q) (quad_angle_c q))).
Definition IsTrapezoid (q : QuadrilateralName) : Prop :=
  QuadrilateralWellFormed q /\
  (Parallel (quad_ab q) (quad_cd q) \/ Parallel (quad_bc q) (quad_da q)).
(** Congruent diagonals avoid the inclusive/exclusive-trapezoid problems of
    congruent legs and match the catalog biconditional [isos_trap_con_diags]. *)
Definition IsIsoscelesTrapezoid (q : QuadrilateralName) : Prop :=
  IsTrapezoid q /\
  SegmentCongruent
    (segment_name q.(quadrilateral_first) q.(quadrilateral_third))
    (segment_name q.(quadrilateral_second) q.(quadrilateral_fourth)).

Definition OnCircle (c : CircleName) (p : PointName) : Prop :=
  CircleWellFormed c /\
  Cong (circ_center c) (point p) (circ_center c) (point c.(circle_radius_point)).
Definition IsChord (c : CircleName) (s : SegmentName) : Prop :=
  SegmentWellFormed s /\
  OnCircle c s.(segment_first) /\ OnCircle c s.(segment_second).
Definition IsDiameter (c : CircleName) (s : SegmentName) : Prop :=
  IsChord c s /\ Bet (seg_start s) (circ_center c) (seg_end s).
(** A degenerate segment is collinear with every point, so the tangent must
    be a genuine segment for [Col] to place it on a line at all. *)
Definition IsTangent (c : CircleName) (s : SegmentName) (p : PointName) : Prop :=
  SegmentWellFormed s /\
  OnCircle c p /\ Col (seg_start s) (seg_end s) (point p) /\
  exists Q, (Q = seg_start s \/ Q = seg_end s) /\ Q <> point p /\
            Per (circ_center c) (point p) Q.
(** The syntax names no intercepted arc or same-side relation.  It therefore
    supports [inscribed_semi], whose answer is independent of the vertex's
    arc, but [con_inscribed_angs] and [inscribed_angs] deliberately remain
    fail-closed.  See [docs/verified-checker.md]. *)
Definition IsInscribedAngle (c : CircleName) (a : AngleName) : Prop :=
  OnCircle c a.(angle_first) /\ OnCircle c a.(angle_vertex) /\
  OnCircle c a.(angle_last) /\ AngleWellFormed a.

(** As with [IsTangent], the bisector must be a genuine segment. *)
Definition SegmentBisectorAt
    (bisector target : SegmentName) (p : PointName) : Prop :=
  SegmentWellFormed bisector /\
  Col (seg_start bisector) (seg_end bisector) (point p) /\ MidpointOf target p.
Definition PerpendicularBisectorAt
    (bisector target : SegmentName) (p : PointName) : Prop :=
  SegmentBisectorAt bisector target p /\ PerpendicularAt bisector target p.
Definition AngleBisector (a : AngleName) (s : SegmentName) : Prop :=
  (s.(segment_first) = a.(angle_vertex) /\
    AngleCongruent
      (angle_name a.(angle_first) a.(angle_vertex) s.(segment_second))
      (angle_name s.(segment_second) a.(angle_vertex) a.(angle_last))) \/
  (s.(segment_second) = a.(angle_vertex) /\
    AngleCongruent
      (angle_name a.(angle_first) a.(angle_vertex) s.(segment_first))
      (angle_name s.(segment_first) a.(angle_vertex) a.(angle_last))).
Definition IsCircumcenter (p : PointName) (t : TriangleName) : Prop :=
  let P := point p in
  let A := point t.(triangle_first) in
  let B := point t.(triangle_second) in
  let C := point t.(triangle_third) in
  TriangleWellFormed t /\ Cong P A P B /\ Cong P B P C.
Definition IsIncenter (p : PointName) (t : TriangleName) : Prop :=
  let P := point p in
  let A := point t.(triangle_first) in
  let B := point t.(triangle_second) in
  let C := point t.(triangle_third) in
  TriangleWellFormed t /\
  AngleBisector (angle_a t) (segment_name t.(triangle_first) p) /\
  AngleBisector (angle_b t) (segment_name t.(triangle_second) p) /\
  AngleBisector (angle_c t) (segment_name t.(triangle_third) p) /\
  InAngle P C A B /\ InAngle P A B C /\ InAngle P B C A.

(** The four lengths lie on two rays from a common vertex, with parallel
    connecting segments.  The [~ Col O A C] conjunct prevents [Par]'s
    collinear disjunct from making arbitrary lengths proportional. *)
Definition SegmentProportion (a b c d : SegmentName) : Prop :=
  SegmentWellFormed a /\ SegmentWellFormed b /\
  SegmentWellFormed c /\ SegmentWellFormed d /\
  exists O A B C D,
    Cong O A (seg_start a) (seg_end a) /\
    Cong O B (seg_start b) (seg_end b) /\
    Cong O C (seg_start c) (seg_end c) /\
    Cong O D (seg_start d) (seg_end d) /\
    Out O A B /\ Out O C D /\ ~ Col O A C /\ Par A C B D.

Definition LinearPairMeaning (a b : AngleName) : Prop :=
  AngleWellFormed a /\ AngleWellFormed b /\ ang_vertex a = ang_vertex b /\
  let V := ang_vertex a in
  ((Out V (ang_start a) (ang_start b) /\ BetS (ang_end a) V (ang_end b)) \/
   (Out V (ang_start a) (ang_end b) /\ BetS (ang_end a) V (ang_start b)) \/
   (Out V (ang_end a) (ang_start b) /\ BetS (ang_start a) V (ang_end b)) \/
   (Out V (ang_end a) (ang_end b) /\ BetS (ang_start a) V (ang_start b))).

(** The eight arguments name the ordered transversal figure: [a], [b] flank
    [i1], [c], [d] flank [i2], and [t1], [t2] extend beyond the intersections.
    [OS] identifies which flanking points share a side of the transversal and
    keeps both crossed lines genuinely transverse to it. *)
Definition TransversalConfiguration (a b t1 i1 c d t2 i2 : PointName) : Prop :=
  let A := point a in let B := point b in
  let C := point c in let D := point d in
  let T1 := point t1 in let T2 := point t2 in
  let I1 := point i1 in let I2 := point i2 in
  BetS T1 I1 I2 /\ BetS I1 I2 T2 /\
  BetS A I1 B /\ BetS C I2 D /\
  OS I1 I2 A C.

Definition ArcWellFormed (a : ArcName) : Prop :=
  point a.(arc_first) <> point a.(arc_second) /\
  OnCircle a.(arc_circle) a.(arc_first) /\ OnCircle a.(arc_circle) a.(arc_second).
(** Arc congruence requires congruent circles as well as equal central angles;
    otherwise equal-angle arcs of different radii would compare equal.
    Matching [ArcKind] makes the central-angle test valid for major arcs too. *)
Definition ArcCongruent (a b : ArcName) : Prop :=
  ArcWellFormed a /\ ArcWellFormed b /\ a.(arc_kind) = b.(arc_kind) /\
  Cong (circ_center a.(arc_circle)) (point a.(arc_circle).(circle_radius_point))
       (circ_center b.(arc_circle)) (point b.(arc_circle).(circle_radius_point)) /\
  CongA (point a.(arc_first)) (circ_center a.(arc_circle)) (point a.(arc_second))
        (point b.(arc_first)) (circ_center b.(arc_circle)) (point b.(arc_second)).

Definition statementMeaning (s : PublicStatement) : Prop :=
  match s with
  (* Every corpus diagram places the named point on the drawn segment, so
     the meaning is endpoint-inclusive betweenness, not mere collinearity. *)
  | OnLine s p => SegmentWellFormed s /\ OnSegment s p
  | Transversal a b t1 i1 c d t2 i2 =>
      TransversalConfiguration a b t1 i1 c d t2 i2
  | IntersectSeg a b p => OnSegment a p /\ OnSegment b p
  | TrapezoidPremise q a b => IsTrapezoid q /\ Parallel a b
  | KitePremise q a b => IsKitePremise q a b
  | IsosTrapezoidPremise q a b => IsIsoscelesTrapezoid q /\ Parallel a b
  | Right a => AngleWellFormed a /\ RightAngle a
  | ConSeg a b => SegmentCongruent a b
  | ConAng a b => AngleCongruent a b
  | ConTri a b => TriangleCongruent a b
  (* Deliberately weaker than [Right]: [con_right] follows from bare
     perpendicularity, which need not make the named rays nondegenerate.
     Converting it to [ConAng] separately requires declared objects. *)
  | ConRight a b => RightAngle a /\ RightAngle b
  | Para a b => Parallel a b
  | Isosceles t => IsoscelesTriangle t
  | Perp a b p => PerpendicularAt a b p
  | Midpt s p => MidpointOf s p
  | AngBisect a s => AngleBisector a s
  | Rectangle q => IsRectangle q
  | Parallelogram q => IsParallelogram q
  | Proportion a b c d => SegmentProportion a b c d
  | SimTri a b => TriangleSimilar a b
  | Equilateral t => EquilateralTriangle t
  | Supplementary a b =>
      SuppA (ang_start a) (ang_vertex a) (ang_end a)
            (ang_start b) (ang_vertex b) (ang_end b)
  (* [SumA]'s resulting [CongA] makes [Per X Y Z] nondegenerate; [SAMS]
     excludes wraparound sums.  [SuppA] already enforces the corresponding
     restriction for supplementary angles. *)
  | Complementary a b => exists X Y Z,
      Per X Y Z /\
      SAMS (ang_start a) (ang_vertex a) (ang_end a)
           (ang_start b) (ang_vertex b) (ang_end b) /\
      SumA (ang_start a) (ang_vertex a) (ang_end a)
           (ang_start b) (ang_vertex b) (ang_end b) X Y Z
  | LinearPair a b => LinearPairMeaning a b
  | Equiangular t => EquiangularTriangle t
  | Circumcenter p t => IsCircumcenter p t
  | Incenter p t => IsIncenter p t
  | PerpBisector a b p => PerpendicularBisectorAt a b p
  | SegBisect a b p => SegmentBisectorAt a b p
  | IsosTrapezoid q => IsIsoscelesTrapezoid q
  | Rhombus q => IsRhombus q
  | Tangent c s p => IsTangent c s p
  | Chord c s => IsChord c s
  | ArcStatement a => ArcWellFormed a
  | Radius c p => OnCircle c p
  | Diameter c s => IsDiameter c s
  | InscribedAngle c a => IsInscribedAngle c a
  | RefSeg a b => SameSegmentName a b /\ SegmentCongruent a b
  | RefAng a b => SameAngleName a b /\ AngleCongruent a b
  | ConArc a b => ArcCongruent a b
  end.

Definition declarationMeaning (d : PublicDeclaration) : Prop :=
  match d with
  | SegmentDeclaration s => SegmentWellFormed s
  | AngleDeclaration a => AngleWellFormed a
  | TriangleDeclaration t => TriangleWellFormed t
  | QuadrilateralDeclaration q => QuadrilateralWellFormed q
  | CircleDeclaration c => CircleWellFormed c
  end.

Definition problemClaim (p : PublicProblem) : Prop :=
  Forall declarationMeaning p.(public_declarations) ->
  Forall statementMeaning p.(public_premises) ->
  statementMeaning p.(public_conclusion).

End GeometryMeaning.

(** * The public spelling of every statement form

    A figure is spelled as its kind tag followed by its points, so the points
    it names and the text that names it are read off one list. *)

Definition segmentPoints (s : SegmentName) :=
  [s.(segment_first); s.(segment_second)].
Definition anglePoints (a : AngleName) :=
  [a.(angle_first); a.(angle_vertex); a.(angle_last)].
Definition trianglePoints (t : TriangleName) :=
  [t.(triangle_first); t.(triangle_second); t.(triangle_third)].
Definition quadrilateralPoints (q : QuadrilateralName) :=
  [q.(quadrilateral_first); q.(quadrilateral_second);
   q.(quadrilateral_third); q.(quadrilateral_fourth)].
Definition circlePoints (c : CircleName) :=
  [c.(circle_center); c.(circle_radius_point)].
Definition arcPoints (a : ArcName) :=
  (circlePoints a.(arc_circle) ++ [a.(arc_first); a.(arc_second)])%list.

Definition call (name : string) (arguments : list string) : string :=
  name ++ "(" ++ String.concat "," arguments ++ ")".
Definition pointText (p : PointName) : string := String p "".
Definition segmentText (s : SegmentName) : string :=
  string_of_list_ascii (segmentPoints s).
Definition angleText (a : AngleName) : string :=
  "a_" ++ string_of_list_ascii (anglePoints a).
Definition triangleText (t : TriangleName) : string :=
  "t_" ++ string_of_list_ascii (trianglePoints t).
Definition quadrilateralText (q : QuadrilateralName) : string :=
  "q_" ++ string_of_list_ascii (quadrilateralPoints q).
Definition circleText (c : CircleName) : string :=
  "c_" ++ string_of_list_ascii (circlePoints c).
Definition arcText (a : ArcName) : string :=
  let kind := match a.(arc_kind) with
              | MinorArc => "minor_arc"
              | MajorArc => "major_arc"
              end in
  call kind
    [circleText a.(arc_circle); pointText a.(arc_first); pointText a.(arc_second)].

Definition statementText (s : PublicStatement) : string :=
  match s with
  | OnLine a p => call "on_line" [segmentText a; pointText p]
  | Transversal a b t1 i1 c d t2 i2 => call "transversal"
      [pointText a; pointText b; pointText t1; pointText i1;
       pointText c; pointText d; pointText t2; pointText i2]
  | IntersectSeg a b p =>
      call "intersect_seg" [segmentText a; segmentText b; pointText p]
  | TrapezoidPremise q a b =>
      call "trapezoid_premise" [quadrilateralText q; segmentText a; segmentText b]
  | KitePremise q a b =>
      call "kite_premise" [quadrilateralText q; angleText a; angleText b]
  | IsosTrapezoidPremise q a b =>
      call "isos_trapezoid_premise"
        [quadrilateralText q; segmentText a; segmentText b]
  | Right a => call "right" [angleText a]
  | ConSeg a b => call "con_seg" [segmentText a; segmentText b]
  | ConAng a b => call "con_ang" [angleText a; angleText b]
  | ConTri a b => call "con_tri" [triangleText a; triangleText b]
  | ConRight a b => call "con_right" [angleText a; angleText b]
  | Para a b => call "para" [segmentText a; segmentText b]
  | Isosceles t => call "isosceles" [triangleText t]
  | Perp a b p => call "perp" [segmentText a; segmentText b; pointText p]
  | Midpt s p => call "midpt" [segmentText s; pointText p]
  | AngBisect a s => call "ang_bisect" [angleText a; segmentText s]
  | Rectangle q => call "rectangle" [quadrilateralText q]
  | Parallelogram q => call "parallelogram" [quadrilateralText q]
  | Proportion a b c d => call "proportion"
      [segmentText a; segmentText b; segmentText c; segmentText d]
  | SimTri a b => call "sim_tri" [triangleText a; triangleText b]
  | Equilateral t => call "equilateral" [triangleText t]
  | Supplementary a b => call "supplementary" [angleText a; angleText b]
  | Complementary a b => call "complementary" [angleText a; angleText b]
  | LinearPair a b => call "linear_pair" [angleText a; angleText b]
  | Equiangular t => call "equiangular" [triangleText t]
  | Circumcenter p t => call "circumcenter" [pointText p; triangleText t]
  | Incenter p t => call "incenter" [pointText p; triangleText t]
  | PerpBisector a b p =>
      call "perp_bisector" [segmentText a; segmentText b; pointText p]
  | SegBisect a b p =>
      call "seg_bisect" [segmentText a; segmentText b; pointText p]
  | IsosTrapezoid q => call "isos_trapezoid" [quadrilateralText q]
  | Rhombus q => call "rhombus" [quadrilateralText q]
  | Tangent c s p => call "tangent" [circleText c; segmentText s; pointText p]
  | Chord c s => call "chord" [circleText c; segmentText s]
  | ArcStatement a => arcText a
  | Radius c p => call "radius" [circleText c; pointText p]
  | Diameter c s => call "diameter" [circleText c; segmentText s]
  | InscribedAngle c a => call "inscribed_angle" [circleText c; angleText a]
  | RefSeg a b => call "ref_seg" [segmentText a; segmentText b]
  | RefAng a b => call "ref_ang" [angleText a; angleText b]
  | ConArc a b => call "con_arc" [arcText a; arcText b]
  end.

Definition statementPoints (s : PublicStatement) : list PointName :=
  (match s with
   | OnLine a p => segmentPoints a ++ [p]
   | Transversal a b t1 i1 c d t2 i2 => [a; b; t1; i1; c; d; t2; i2]
   | IntersectSeg a b p => segmentPoints a ++ segmentPoints b ++ [p]
   | TrapezoidPremise q a b | IsosTrapezoidPremise q a b =>
       quadrilateralPoints q ++ segmentPoints a ++ segmentPoints b
   | KitePremise q a b => quadrilateralPoints q ++ anglePoints a ++ anglePoints b
   | Right a => anglePoints a
   | ConSeg a b | Para a b | RefSeg a b => segmentPoints a ++ segmentPoints b
   | ConAng a b | ConRight a b | Supplementary a b | Complementary a b
   | LinearPair a b | RefAng a b => anglePoints a ++ anglePoints b
   | ConTri a b | SimTri a b => trianglePoints a ++ trianglePoints b
   | Isosceles t | Equilateral t | Equiangular t => trianglePoints t
   | Perp a b p | PerpBisector a b p | SegBisect a b p =>
       segmentPoints a ++ segmentPoints b ++ [p]
   | Midpt a p => segmentPoints a ++ [p]
   | AngBisect a s => anglePoints a ++ segmentPoints s
   | Rectangle q | Parallelogram q | IsosTrapezoid q | Rhombus q =>
       quadrilateralPoints q
   | Proportion a b c d =>
       segmentPoints a ++ segmentPoints b ++ segmentPoints c ++ segmentPoints d
   | Circumcenter p t | Incenter p t => p :: trianglePoints t
   | Tangent c s p => circlePoints c ++ segmentPoints s ++ [p]
   | Chord c s | Diameter c s => circlePoints c ++ segmentPoints s
   | ArcStatement a => arcPoints a
   | Radius c p => circlePoints c ++ [p]
   | InscribedAngle c a => circlePoints c ++ anglePoints a
   | ConArc a b => arcPoints a ++ arcPoints b
   end)%list.

(** * The declarative grammar of the theorem-bearing lines

    [StatementText] and [DeclarationText] deliberately specify the accepted
    text by normalization and rendering rather than by reusing the executable
    parser. *)

(** Ender's lexical grammar admits exactly one upper-case ASCII letter as a
    point label.  Keeping this restriction explicit prevents object names from
    containing punctuation used by the surrounding grammar. *)
Definition upperCaseLetters : string := "ABCDEFGHIJKLMNOPQRSTUVWXYZ".
Definition PointNameValid (p : PointName) : Prop :=
  In p (list_ascii_of_string upperCaseLetters).

Definition whitespace (c : ascii) : bool :=
  Ascii.eqb c " "%char || Ascii.eqb c "009"%char || Ascii.eqb c "013"%char.
Fixpoint removeWhitespace (text : string) : string :=
  match text with
  | "" => ""
  | String c rest =>
      if whitespace c then removeWhitespace rest
      else String c (removeWhitespace rest)
  end.
Fixpoint codeBeforeComment (text : string) : string :=
  match text with
  | String "/"%char (String "/"%char _) => ""
  | String c rest => String c (codeBeforeComment rest)
  | "" => ""
  end.
Definition normalized (text : string) : string :=
  removeWhitespace (codeBeforeComment text).
Definition StatementText (text : string) (statement : PublicStatement) : Prop :=
  Forall PointNameValid (statementPoints statement) /\
  normalized text = statementText statement.

Definition declarationTag (d : PublicDeclaration) : string :=
  match d with
  | SegmentDeclaration _ => "seg:"
  | AngleDeclaration _ => "ang:"
  | TriangleDeclaration _ => "tri:"
  | QuadrilateralDeclaration _ => "quad:"
  | CircleDeclaration _ => "circ:"
  end.
Definition declarationObjectText (d : PublicDeclaration) : string :=
  match d with
  | SegmentDeclaration s => segmentText s
  | AngleDeclaration a => angleText a
  | TriangleDeclaration t => triangleText t
  | QuadrilateralDeclaration q => quadrilateralText q
  | CircleDeclaration c => circleText c
  end.
Definition declarationPoints (d : PublicDeclaration) : list PointName :=
  match d with
  | SegmentDeclaration s => segmentPoints s
  | AngleDeclaration a => anglePoints a
  | TriangleDeclaration t => trianglePoints t
  | QuadrilateralDeclaration q => quadrilateralPoints q
  | CircleDeclaration c => circlePoints c
  end.
Definition DeclarationText (text : string)
    (declarations : list PublicDeclaration) : Prop :=
  exists first rest,
    declarations = first :: rest /\
    Forall (fun d => declarationTag d = declarationTag first) rest /\
    Forall (fun d => Forall PointNameValid (declarationPoints d)) declarations /\
    normalized text =
      declarationTag first ++
      String.concat "" (map declarationObjectText declarations).

Definition premiseBody (line : string) : option string :=
  match before "]" line, after "]" line with
  | Some label, Some body =>
      if prefix "[g_" label || prefix "[d_" label then Some body else None
  | _, _ => None
  end.

Definition goalBody (line : string) : option string :=
  if prefix "->" (normalized line) then after "->" line else None.

(** Classification precedence makes the cases mutually exclusive. *)
Inductive HeaderContribution :=
| DeclaresObjects (declarations : list PublicDeclaration)
| StatesPremise (premise : PublicStatement)
| StatesGoal (goal : PublicStatement)
| ContributesNothing.

Inductive HeaderLine : string -> HeaderContribution -> Prop :=
| DeclarationHeaderLine : forall text declarations,
    premiseBody text = None -> goalBody text = None ->
    DeclarationText text declarations ->
    HeaderLine text (DeclaresObjects declarations)
| PremiseHeaderLine : forall line body statement,
    premiseBody line = Some body -> StatementText body statement ->
    HeaderLine line (StatesPremise statement)
| GoalHeaderLine : forall line body statement,
    premiseBody line = None ->
    goalBody line = Some body -> StatementText body statement ->
    HeaderLine line (StatesGoal statement)
| IgnoredBlankLine : forall text,
    premiseBody text = None -> goalBody text = None ->
    normalized text = "" -> HeaderLine text ContributesNothing.

Definition LineUnbroken (line : string) : Prop :=
  ~ In newlineCharacter (list_ascii_of_string line).

(** The lines of a source: put the newlines back between them and you have the
    source again.  Every source has at least one line, which is what makes the
    empty source one empty line rather than no lines at all. *)
Definition LineSplit (source : string) (lines : list string) : Prop :=
  source = String.concat newline lines /\
  Forall LineUnbroken lines /\
  lines <> [].

Inductive HeaderLines :
    list string -> list PublicDeclaration -> list PublicStatement ->
    option PublicStatement -> Prop :=
| NoHeaderLines : HeaderLines [] [] [] None
| DeclarationLines : forall line lines lineDeclarations declarations premises goal,
    HeaderLine line (DeclaresObjects lineDeclarations) ->
    HeaderLines lines declarations premises goal ->
    HeaderLines (line :: lines) (lineDeclarations ++ declarations) premises goal
| PremiseLines : forall line lines statement declarations premises goal,
    HeaderLine line (StatesPremise statement) ->
    HeaderLines lines declarations premises goal ->
    HeaderLines (line :: lines) declarations (statement :: premises) goal
| GoalLines : forall line lines statement declarations premises,
    HeaderLine line (StatesGoal statement) ->
    HeaderLines lines declarations premises None ->
    HeaderLines (line :: lines) declarations premises (Some statement)
| IgnoredLines : forall line lines declarations premises goal,
    HeaderLine line ContributesNothing ->
    HeaderLines lines declarations premises goal ->
    HeaderLines (line :: lines) declarations premises goal.

Inductive ProblemGrammar : string -> PublicProblem -> Prop :=
| ProblemGrammarLines : forall source lines declarations premises conclusion,
    LineSplit source lines ->
    HeaderLines lines declarations premises (Some conclusion) ->
    ProblemGrammar source (public_problem declarations premises conclusion).

(** * The designated public API

    These data are deliberately independent of the implementation's parser,
    proof AST, and reason kernel.  [Extract.v] names only the concrete
    operations in this signature as extraction roots; the distribution layer
    must likewise expose only those named roots. *)
Inductive Verdict := FailedToParseProblem | RejectedProof | Accepted.

(** Presentation syntax is intentionally not part of theorem meaning.  Decimal
    spellings are preserved exactly; JavaScript may interpret them for layout
    without affecting checker soundness.  Generic calls let the presentation
    parser retain unsupported and diagram-only vocabulary. *)
Record SurfaceCall := surface_call {
  surface_call_name : string;
  surface_call_arguments : list string
}.
Record DisplayPoint := display_point {
  display_point_name : PointName;
  display_point_x : string;
  display_point_y : string;
  display_point_offset : option string
}.
Inductive DisplayObjectKind :=
| DisplaySegment | DisplayAngle | DisplayTriangle
| DisplayQuadrilateral | DisplayCircle.
Record DisplayDeclaration := display_declaration {
  display_declaration_kind : DisplayObjectKind;
  display_declaration_objects : list string
}.
Record LabeledSurfaceCall := labeled_surface_call {
  surface_label : string;
  surface_labeled_call : SurfaceCall
}.
Record PresentationStep := presentation_step {
  presentation_step_label : string;
  presentation_step_reason : option SurfaceCall;
  presentation_step_conclusion : option SurfaceCall
}.
Record PresentationFile := presentation_file {
  presentation_title : option string;
  presentation_points : list DisplayPoint;
  presentation_declarations : list DisplayDeclaration;
  presentation_diagram_premises : list LabeledSurfaceCall;
  presentation_givens : list LabeledSurfaceCall;
  presentation_goal : option SurfaceCall;
  presentation_steps : list PresentationStep
}.

(** Everything from here to [CheckReport] is advisory reporting data, carried
    for the host wrapper's benefit.  No theorem constrains any of it: [checker]
    projects [report_verdict] alone, through [accepted], and the contract at
    the end of this file says nothing about the remaining fields.  It is
    enumerated here because [Extract.v] may name only roots this file declares,
    not because the checker's guarantee rests on it. *)
Inductive DiagnosticPhase := ProblemParsing | ProofParsing | ProofChecking.
Inductive DiagnosticSeverity :=
| DiagnosticInfo | DiagnosticWarning | DiagnosticError.
Inductive DiagnosticCode :=
| MalformedProblem
| MalformedProof
| UnsupportedStatement
| HeaderMismatch
| ProofNotAccepted
| InvalidReason
| MissingDependency
| GoalNotProved.

Record Diagnostic := diagnostic {
  diagnostic_phase : DiagnosticPhase;
  diagnostic_severity : DiagnosticSeverity;
  diagnostic_code : DiagnosticCode;
  diagnostic_message : string
}.

Inductive StepStatus := StepAccepted | StepRejected | StepBlocked.
Record StepReport := step_report {
  step_number : nat;
  step_source : string;
  step_reason_name : option string;
  step_conclusion : option PublicStatement;
  step_status : StepStatus;
  step_dependencies : list nat;
  step_diagram_dependencies : list PublicStatement;
  step_diagnostics : list Diagnostic
}.
Record DependencyGraph := dependency_graph {
  graph_nodes : list nat;
  graph_edges : list (nat * nat);
  graph_cycles : list (list nat);
  graph_unused_steps : list nat
}.
Inductive FactOrigin :=
| PremiseOrigin (label : string)
| StepOrigin (step : nat).
Record DuplicateDerivation := duplicate_derivation {
  duplicate_statement : PublicStatement;
  duplicate_first : FactOrigin;
  duplicate_again : FactOrigin
}.
Record GoalReport := goal_report {
  goal_proved_by : option nat;
  goal_diagnostics : list Diagnostic
}.
(** JSON-shaped values preserve the extensible [details] object of Ender's
    existing TypeScript [ErrorDetails] interface without asking the unverified
    host wrapper to reconstruct checker facts. *)
Inductive JsonValue :=
| JsonNull
| JsonBool (b : bool)
| JsonNumber (n : nat)
| JsonString (s : string)
| JsonArray (items : list JsonValue)
| JsonObject (fields : list (string * JsonValue)).
Record Issue := issue {
  issue_type : nat;
  issue_code : string;
  issue_details : JsonValue
}.
Record CheckReport := check_report {
  report_verdict : Verdict;
  report_problem : option PublicProblem;
  report_presentation : option PresentationFile;
  report_steps : list StepReport;
  report_graph : DependencyGraph;
  report_duplicates : list DuplicateDerivation;
  report_goal : GoalReport;
  report_issues : list Issue;
  report_errors : list Issue;
  report_diagnostics : list Diagnostic
}.

Definition accepted (report : CheckReport) : bool :=
  match report.(report_verdict) with Accepted => true | _ => false end.

(** * The final implementation contract

    Soundness says every successfully decoded header has the independently
    specified grammar above; completeness says every grammatical header is
    decoded to exactly the specified problem.  [check] is the sole rich
    entrypoint and [checker] is its audited Boolean projection.

    [checker_sound] deliberately assumes a Euclidean plane.  [Tarski_2D] is
    needed because [OnCircle] denotes a sphere in higher dimensions, where
    the inscribed-angle theorems are false; acceptance therefore makes no
    claim about higher-dimensional Euclidean models.

    Nothing here asserts that such a geometry exists, so soundness alone does
    not rule out vacuity.  GeoCoq supplies a model construction, but current
    library-version constraints prevent instantiating it here.  See
    [docs/verified-checker.md]. *)
Module Type COMPLETE_VERIFIED_CHECKER.
  Parameter parseProblem : string -> option PublicProblem.
  Parameter parsePresentation : string -> option PresentationFile.
  Parameter check : string -> CheckReport.
  Definition checker (source : string) : bool := accepted (check source).
  Parameter parser_sound : forall source problem,
    parseProblem source = Some problem -> ProblemGrammar source problem.
  Parameter parser_complete : forall source problem,
    ProblemGrammar source problem -> parseProblem source = Some problem.

  (** Accepting a source commits to a theorem: its problem part parses, and the
      problem it parses to holds of every assignment of points. *)
  Parameter checker_sound : forall source,
    checker source = true ->
      forall part, problemPart source = Some part ->
      forall `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality},
      forall (T2D : @Tarski_2D Tn TnEQD),
      forall (TE : @Tarski_euclidean Tn TnEQD),
      exists problem, parseProblem part = Some problem /\
        forall point : PointName -> Tpoint, problemClaim point problem.
End COMPLETE_VERIFIED_CHECKER.
