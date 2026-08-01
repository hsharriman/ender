(** This is the complete human-audit surface for the Ender checker.  It
    intentionally imports no Ender implementation module. *)
From Coq Require Import Ascii String List Bool.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Import ListNotations.
Local Open Scope string_scope.

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

(** The complete public theorem language. *)
Module FinalAudit.

Local Open Scope string_scope.

Definition PointName := ascii.
Record SegmentName := segment_name { segment_first : PointName; segment_second : PointName }.
Record AngleName := angle_name {
  angle_first : PointName; angle_vertex : PointName; angle_last : PointName
}.
Record TriangleName := triangle_name {
  triangle_first : PointName; triangle_second : PointName; triangle_third : PointName
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
| OnLine : SegmentName -> PointName -> PublicStatement
| Transversal : PointName -> PointName -> PointName -> PointName ->
    PointName -> PointName -> PointName -> PointName -> PublicStatement
| IntersectSeg : SegmentName -> SegmentName -> PointName -> PublicStatement
| TrapezoidPremise : QuadrilateralName -> SegmentName -> SegmentName -> PublicStatement
| KitePremise : QuadrilateralName -> AngleName -> AngleName -> PublicStatement
| IsosTrapezoidPremise : QuadrilateralName -> SegmentName -> SegmentName -> PublicStatement
| Right : AngleName -> PublicStatement
| ConSeg : SegmentName -> SegmentName -> PublicStatement
| ConAng : AngleName -> AngleName -> PublicStatement
| ConTri : TriangleName -> TriangleName -> PublicStatement
| ConRight : AngleName -> AngleName -> PublicStatement
| Para : SegmentName -> SegmentName -> PublicStatement
| Isosceles : TriangleName -> PublicStatement
| Perp : SegmentName -> SegmentName -> PointName -> PublicStatement
| Midpt : SegmentName -> PointName -> PublicStatement
| AngBisect : AngleName -> SegmentName -> PublicStatement
| Rectangle : QuadrilateralName -> PublicStatement
| Parallelogram : QuadrilateralName -> PublicStatement
| Proportion : SegmentName -> SegmentName -> SegmentName -> SegmentName -> PublicStatement
| SimTri : TriangleName -> TriangleName -> PublicStatement
| Equilateral : TriangleName -> PublicStatement
| Supplementary : AngleName -> AngleName -> PublicStatement
| Complementary : AngleName -> AngleName -> PublicStatement
| LinearPair : AngleName -> AngleName -> PublicStatement
| Equiangular : TriangleName -> PublicStatement
| Circumcenter : PointName -> TriangleName -> PublicStatement
| Incenter : PointName -> TriangleName -> PublicStatement
| PerpBisector : SegmentName -> SegmentName -> PointName -> PublicStatement
| SegBisect : SegmentName -> SegmentName -> PointName -> PublicStatement
| IsosTrapezoid : QuadrilateralName -> PublicStatement
| Rhombus : QuadrilateralName -> PublicStatement
| Tangent : CircleName -> SegmentName -> PointName -> PublicStatement
| Chord : CircleName -> SegmentName -> PublicStatement
| ArcStatement : ArcName -> PublicStatement
| Radius : CircleName -> PointName -> PublicStatement
| Diameter : CircleName -> SegmentName -> PublicStatement
| InscribedAngle : CircleName -> AngleName -> PublicStatement
| RefSeg : SegmentName -> SegmentName -> PublicStatement
| RefAng : AngleName -> AngleName -> PublicStatement
| ConArc : ArcName -> ArcName -> PublicStatement.

Inductive PublicDeclaration :=
| SegmentDeclaration : SegmentName -> PublicDeclaration
| AngleDeclaration : AngleName -> PublicDeclaration
| TriangleDeclaration : TriangleName -> PublicDeclaration
| QuadrilateralDeclaration : QuadrilateralName -> PublicDeclaration
| CircleDeclaration : CircleName -> PublicDeclaration.

Record PublicProblem := public_problem {
  public_declarations : list PublicDeclaration;
  public_premises : list PublicStatement;
  public_conclusion : PublicStatement
}.

Section GeometryMeaning.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : PointName -> Tpoint.

Definition seg_start (s : SegmentName) := point s.(segment_first).
Definition seg_end (s : SegmentName) := point s.(segment_second).
Definition ang_start (a : AngleName) := point a.(angle_first).
Definition ang_vertex (a : AngleName) := point a.(angle_vertex).
Definition ang_end (a : AngleName) := point a.(angle_last).

Definition SegmentWellFormed (s : SegmentName) : Prop := seg_start s <> seg_end s.
Definition AngleWellFormed (a : AngleName) : Prop :=
  ang_start a <> ang_vertex a /\ ang_end a <> ang_vertex a.
Definition TriangleWellFormed (t : TriangleName) : Prop :=
  point t.(triangle_first) <> point t.(triangle_second) /\
  point t.(triangle_second) <> point t.(triangle_third) /\
  point t.(triangle_third) <> point t.(triangle_first) /\
  ~ Col (point t.(triangle_first)) (point t.(triangle_second))
        (point t.(triangle_third)).
Definition QuadrilateralWellFormed (q : QuadrilateralName) : Prop :=
  let A := point q.(quadrilateral_first) in
  let B := point q.(quadrilateral_second) in
  let C := point q.(quadrilateral_third) in
  let D := point q.(quadrilateral_fourth) in
  A <> B /\ A <> C /\ A <> D /\ B <> C /\ B <> D /\ C <> D /\
  (exists X, BetS A X C /\ BetS B X D).
Definition CircleWellFormed (c : CircleName) : Prop :=
  point c.(circle_center) <> point c.(circle_radius_point).

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
Definition IsParallelogram (q : QuadrilateralName) : Prop :=
  QuadrilateralWellFormed q /\ Parallel (quad_ab q) (quad_cd q) /\
  Parallel (quad_bc q) (quad_da q).
Definition IsRectangle (q : QuadrilateralName) : Prop :=
  IsParallelogram q /\
  RightAngle (angle_name q.(quadrilateral_fourth)
                         q.(quadrilateral_first) q.(quadrilateral_second)).
Definition IsRhombus (q : QuadrilateralName) : Prop :=
  IsParallelogram q /\ SegmentCongruent (quad_ab q) (quad_bc q) /\
  SegmentCongruent (quad_bc q) (quad_cd q) /\
  SegmentCongruent (quad_cd q) (quad_da q).
Definition SameAngleName (a b : AngleName) : Prop :=
  a.(angle_vertex) = b.(angle_vertex) /\
  ((a.(angle_first) = b.(angle_first) /\ a.(angle_last) = b.(angle_last)) \/
   (a.(angle_first) = b.(angle_last) /\ a.(angle_last) = b.(angle_first))).
Definition IsKitePremise
    (q : QuadrilateralName) (selected1 selected2 : AngleName) : Prop :=
  QuadrilateralWellFormed q /\
  ((SegmentCongruent (quad_ab q) (quad_da q) /\
    SegmentCongruent (quad_bc q) (quad_cd q) /\
    ((SameAngleName selected1
        (angle_name q.(quadrilateral_first) q.(quadrilateral_second)
                    q.(quadrilateral_third)) /\
      SameAngleName selected2
        (angle_name q.(quadrilateral_third) q.(quadrilateral_fourth)
                    q.(quadrilateral_first))) \/
     (SameAngleName selected2
        (angle_name q.(quadrilateral_first) q.(quadrilateral_second)
                    q.(quadrilateral_third)) /\
      SameAngleName selected1
        (angle_name q.(quadrilateral_third) q.(quadrilateral_fourth)
                    q.(quadrilateral_first))))) \/
   (SegmentCongruent (quad_ab q) (quad_bc q) /\
    SegmentCongruent (quad_cd q) (quad_da q) /\
    ((SameAngleName selected1
        (angle_name q.(quadrilateral_fourth) q.(quadrilateral_first)
                    q.(quadrilateral_second)) /\
      SameAngleName selected2
        (angle_name q.(quadrilateral_second) q.(quadrilateral_third)
                    q.(quadrilateral_fourth))) \/
     (SameAngleName selected2
        (angle_name q.(quadrilateral_fourth) q.(quadrilateral_first)
                    q.(quadrilateral_second)) /\
      SameAngleName selected1
        (angle_name q.(quadrilateral_second) q.(quadrilateral_third)
                    q.(quadrilateral_fourth)))))).
Definition IsTrapezoid (q : QuadrilateralName) : Prop :=
  QuadrilateralWellFormed q /\
  (Parallel (quad_ab q) (quad_cd q) \/ Parallel (quad_bc q) (quad_da q)).
Definition IsIsoscelesTrapezoid (q : QuadrilateralName) : Prop :=
  IsTrapezoid q /\
  (SegmentCongruent (quad_bc q) (quad_da q) \/
   SegmentCongruent (quad_ab q) (quad_cd q)).

Definition OnCircle (c : CircleName) (p : PointName) : Prop :=
  CircleWellFormed c /\
  Cong (point c.(circle_center)) (point p)
       (point c.(circle_center)) (point c.(circle_radius_point)).
Definition IsChord (c : CircleName) (s : SegmentName) : Prop :=
  SegmentWellFormed s /\ OnCircle c s.(segment_first) /\ OnCircle c s.(segment_second).
Definition IsDiameter (c : CircleName) (s : SegmentName) : Prop :=
  IsChord c s /\ Bet (seg_start s) (point c.(circle_center)) (seg_end s).
Definition IsTangent (c : CircleName) (s : SegmentName) (p : PointName) : Prop :=
  OnCircle c p /\ Col (seg_start s) (seg_end s) (point p) /\
  exists Q, (Q = seg_start s \/ Q = seg_end s) /\ Q <> point p /\
            Per (point c.(circle_center)) (point p) Q.
Definition IsInscribedAngle (c : CircleName) (a : AngleName) : Prop :=
  OnCircle c a.(angle_first) /\ OnCircle c a.(angle_vertex) /\
  OnCircle c a.(angle_last) /\ AngleWellFormed a.

Definition SegmentBisectorAt (bisector target : SegmentName) (p : PointName) : Prop :=
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
  TriangleWellFormed t /\
  Cong (point p) (point t.(triangle_first))
       (point p) (point t.(triangle_second)) /\
  Cong (point p) (point t.(triangle_second))
       (point p) (point t.(triangle_third)).
Definition IsIncenter (p : PointName) (t : TriangleName) : Prop :=
  TriangleWellFormed t /\
  AngleBisector (angle_a t) (segment_name t.(triangle_first) p) /\
  AngleBisector (angle_b t) (segment_name t.(triangle_second) p) /\
  AngleBisector (angle_c t) (segment_name t.(triangle_third) p) /\
  InAngle (point p) (point t.(triangle_third)) (point t.(triangle_first))
                    (point t.(triangle_second)) /\
  InAngle (point p) (point t.(triangle_first)) (point t.(triangle_second))
                    (point t.(triangle_third)) /\
  InAngle (point p) (point t.(triangle_second)) (point t.(triangle_third))
                    (point t.(triangle_first)).

Definition SegmentProportion
    (a b c d : SegmentName) : Prop :=
  SegmentWellFormed a /\ SegmentWellFormed b /\
  SegmentWellFormed c /\ SegmentWellFormed d /\
  exists O A B C D,
    Cong O A (seg_start a) (seg_end a) /\
    Cong O B (seg_start b) (seg_end b) /\
    Cong O C (seg_start c) (seg_end c) /\
    Cong O D (seg_start d) (seg_end d) /\
    Out O A B /\ Out O C D /\ Par A C B D.

Definition LinearPairMeaning (a b : AngleName) : Prop :=
  AngleWellFormed a /\ AngleWellFormed b /\
  point a.(angle_vertex) = point b.(angle_vertex) /\
  let V := point a.(angle_vertex) in
  ((Out V (point a.(angle_first)) (point b.(angle_first)) /\
    BetS (point a.(angle_last)) V (point b.(angle_last))) \/
   (Out V (point a.(angle_first)) (point b.(angle_last)) /\
    BetS (point a.(angle_last)) V (point b.(angle_first))) \/
   (Out V (point a.(angle_last)) (point b.(angle_first)) /\
    BetS (point a.(angle_first)) V (point b.(angle_last))) \/
   (Out V (point a.(angle_last)) (point b.(angle_last)) /\
    BetS (point a.(angle_first)) V (point b.(angle_first)))).

Definition ArcWellFormed (a : ArcName) : Prop :=
  point a.(arc_first) <> point a.(arc_second) /\
  OnCircle a.(arc_circle) a.(arc_first) /\ OnCircle a.(arc_circle) a.(arc_second).
Definition ArcCongruent (a b : ArcName) : Prop :=
  ArcWellFormed a /\ ArcWellFormed b /\ a.(arc_kind) = b.(arc_kind) /\
  CongA (point a.(arc_first)) (point a.(arc_circle).(circle_center)) (point a.(arc_second))
        (point b.(arc_first)) (point b.(arc_circle).(circle_center)) (point b.(arc_second)).

Definition statementMeaning (s : PublicStatement) : Prop :=
  match s with
  | OnLine s p => SegmentWellFormed s /\ Col (seg_start s) (seg_end s) (point p)
  | Transversal a b t1 i1 c d t2 i2 =>
      point a <> point b /\ point c <> point d /\ point t1 <> point t2 /\
        Col (point a) (point b) (point i1) /\
        Col (point c) (point d) (point i2) /\
        Col (point t1) (point t2) (point i1) /\
        Col (point t1) (point t2) (point i2) /\ point i1 <> point i2
  | IntersectSeg a b p => OnSegment a p /\ OnSegment b p
  | TrapezoidPremise q a b => IsTrapezoid q /\ Parallel a b
  | KitePremise q a b => IsKitePremise q a b
  | IsosTrapezoidPremise q a b => IsIsoscelesTrapezoid q /\ Parallel a b
  | Right a => AngleWellFormed a /\ RightAngle a
  | ConSeg a b => SegmentCongruent a b
  | ConAng a b => AngleCongruent a b
  | ConTri a b => TriangleCongruent a b
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
  | Complementary a b => exists X Y Z,
      Per X Y Z /\ SumA (ang_start a) (ang_vertex a) (ang_end a)
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
  | RefSeg a b => ((a.(segment_first) = b.(segment_first) /\
                     a.(segment_second) = b.(segment_second)) \/
                    (a.(segment_first) = b.(segment_second) /\
                     a.(segment_second) = b.(segment_first))) /\
                   SegmentCongruent a b
  | RefAng a b => (a.(angle_vertex) = b.(angle_vertex) /\
                   ((a.(angle_first) = b.(angle_first) /\ a.(angle_last) = b.(angle_last)) \/
                    (a.(angle_first) = b.(angle_last) /\ a.(angle_last) = b.(angle_first)))) /\
                  AngleCongruent a b
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

(** The public spelling of every statement form is part of the audit. *)
Definition pointText (p : PointName) : string := string_of_list_ascii [p].
Definition segmentText (s : SegmentName) : string :=
  pointText s.(segment_first) ++ pointText s.(segment_second).
Definition angleText (a : AngleName) : string :=
  "a_" ++ pointText a.(angle_first) ++ pointText a.(angle_vertex) ++ pointText a.(angle_last).
Definition triangleText (t : TriangleName) : string :=
  "t_" ++ pointText t.(triangle_first) ++ pointText t.(triangle_second) ++ pointText t.(triangle_third).
Definition quadrilateralText (q : QuadrilateralName) : string :=
  "q_" ++ pointText q.(quadrilateral_first) ++ pointText q.(quadrilateral_second) ++
  pointText q.(quadrilateral_third) ++ pointText q.(quadrilateral_fourth).
Definition circleText (c : CircleName) : string :=
  "c_" ++ pointText c.(circle_center) ++ pointText c.(circle_radius_point).
Definition arcText (a : ArcName) : string :=
  let name := match a.(arc_kind) with MinorArc => "minor_arc" | MajorArc => "major_arc" end in
  name ++ "(" ++ circleText a.(arc_circle) ++ "," ++ pointText a.(arc_first) ++
  "," ++ pointText a.(arc_second) ++ ")".
Definition call (name : string) (arguments : list string) : string :=
  name ++ "(" ++ String.concat "," arguments ++ ")".

Definition statementText (s : PublicStatement) : string :=
  match s with
  | OnLine a p => call "on_line" [segmentText a; pointText p]
  | Transversal a b t1 i1 c d t2 i2 => call "transversal"
      [pointText a; pointText b; pointText t1; pointText i1;
       pointText c; pointText d; pointText t2; pointText i2]
  | IntersectSeg a b p => call "intersect_seg" [segmentText a; segmentText b; pointText p]
  | TrapezoidPremise q a b => call "trapezoid_premise" [quadrilateralText q; segmentText a; segmentText b]
  | KitePremise q a b => call "kite_premise" [quadrilateralText q; angleText a; angleText b]
  | IsosTrapezoidPremise q a b => call "isos_trapezoid_premise" [quadrilateralText q; segmentText a; segmentText b]
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
  | PerpBisector a b p => call "perp_bisector" [segmentText a; segmentText b; pointText p]
  | SegBisect a b p => call "seg_bisect" [segmentText a; segmentText b; pointText p]
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

(**
  Declarative grammar.  [StatementText] deliberately specifies accepted text
  by normalization and rendering rather than by reusing the executable parser.
*)
Definition whitespace (c : ascii) : bool :=
  Ascii.eqb c " "%char || Ascii.eqb c "009"%char || Ascii.eqb c "013"%char.
Fixpoint removeWhitespace (text : list ascii) : list ascii :=
  match text with
  | [] => []
  | c :: rest => if whitespace c then removeWhitespace rest else c :: removeWhitespace rest
  end.
Fixpoint codeBeforeComment (text : list ascii) : list ascii :=
  match text with
  | "/"%char :: "/"%char :: _ => []
  | c :: rest => c :: codeBeforeComment rest
  | [] => []
  end.
Definition normalized (text : string) : list ascii :=
  removeWhitespace (codeBeforeComment (list_ascii_of_string text)).
Definition StatementText (text : string) (statement : PublicStatement) : Prop :=
  normalized text = list_ascii_of_string (statementText statement).

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
Definition DeclarationText (text : string) (declarations : list PublicDeclaration) : Prop :=
  exists first rest,
    declarations = first :: rest /\
    Forall (fun declaration => declarationTag declaration = declarationTag first) rest /\
    normalized text = list_ascii_of_string
      (declarationTag first ++ String.concat "" (map declarationObjectText declarations)).

(** Relations for the exact theorem-bearing header language. *)
Definition premiseBody (line : string) : option string :=
  let text := list_ascii_of_string line in
  match ProblemPart.take_before ["]"%char] text,
        ProblemPart.find_after ["]"%char] text with
  | Some label, Some body =>
      if ProblemPart.starts_with (list_ascii_of_string "[g_") label ||
         ProblemPart.starts_with (list_ascii_of_string "[d_") label
      then Some (string_of_list_ascii body) else None
  | _, _ => None
  end.

Definition goalBody (line : string) : option string :=
  let compact := normalized line in
  if ProblemPart.starts_with (list_ascii_of_string "->") compact
  then match ProblemPart.find_after (list_ascii_of_string "->")
                                    (list_ascii_of_string line) with
       | Some body => Some (string_of_list_ascii body)
       | None => None
       end
  else None.

Inductive HeaderLine : string -> (list PublicDeclaration * list PublicStatement * option PublicStatement) -> Prop :=
| DeclarationHeaderLine : forall text declarations,
    DeclarationText text declarations -> HeaderLine text (declarations, [], None)
| PremiseHeaderLine : forall line body statement,
    premiseBody line = Some body -> StatementText body statement ->
    HeaderLine line ([], [statement], None)
| GoalHeaderLine : forall line body statement,
    goalBody line = Some body -> StatementText body statement ->
    HeaderLine line ([], [], Some statement)
| IgnoredBlankLine : forall text,
    normalized text = [] -> HeaderLine text ([], [], None).

Fixpoint splitLineChars (text current : list ascii) : list (list ascii) :=
  match text with
  | [] => [rev current]
  | c :: rest =>
      if Ascii.eqb c "010"%char
      then rev current :: splitLineChars rest []
      else splitLineChars rest (c :: current)
  end.
Definition splitLines (source : string) : list string :=
  map string_of_list_ascii (splitLineChars (list_ascii_of_string source) []).

Inductive HeaderLines :
    list string -> list PublicDeclaration -> list PublicStatement ->
    option PublicStatement -> Prop :=
| NoHeaderLines : HeaderLines [] [] [] None
| MoreHeaderLines : forall line lines lineDeclarations linePremises lineGoal
                           declarations premises goal,
    HeaderLine line (lineDeclarations, linePremises, lineGoal) ->
    HeaderLines lines declarations premises goal ->
    (lineGoal = None \/ goal = None) ->
    HeaderLines (line :: lines)
      (lineDeclarations ++ declarations) (linePremises ++ premises)
      (match lineGoal with Some statement => Some statement | None => goal end).

Inductive ProblemGrammar : string -> PublicProblem -> Prop :=
| ProblemGrammarLines : forall source declarations premises conclusion,
    HeaderLines (splitLines source) declarations premises (Some conclusion) ->
    ProblemGrammar source (public_problem declarations premises conclusion).

(** Final implementation contract.  Parser soundness is the trust-relevant
    direction: every successfully decoded header has the independently
    specified grammar above.  Accepting every grammatical spelling is a
    usability property, not a premise of checker soundness. *)
Module Type COMPLETE_VERIFIED_CHECKER.
  Parameter parseProblem : string -> option PublicProblem.
  Parameter checker : string -> bool.
  Parameter parser_sound : forall source problem,
    parseProblem source = Some problem -> ProblemGrammar source problem.

  Definition meaning
      `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}
      (source : string) : option Prop :=
    match parseProblem source with
    | Some problem =>
        Some (forall point : PointName -> Tpoint, problemClaim point problem)
    | None => None
    end.

  Parameter checker_sound : forall source,
    checker source = true ->
      forall part, problemPart source = Some part ->
      forall `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality},
      forall (T2D : @Tarski_2D Tn TnEQD),
      forall (TE : @Tarski_euclidean Tn TnEQD),
        exists claim : Prop, meaning part = Some claim /\ claim.
End COMPLETE_VERIFIED_CHECKER.

End FinalAudit.
