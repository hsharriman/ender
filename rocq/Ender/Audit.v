(**
  This is the complete human-audit surface for the verified checker slice.
  It intentionally imports no Ender implementation module.
*)
From Coq Require Import Ascii String List ClassicalDescription.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Import ListNotations.
Local Open Scope string_scope.

Module EnderGrammar.

Definition PointId := ascii.

Record Segment := segment { seg_start : PointId; seg_end : PointId }.
Record Angle := angle { ang_left : PointId; ang_vertex : PointId; ang_right : PointId }.
Record Triangle := triangle { tri_a : PointId; tri_b : PointId; tri_c : PointId }.

Inductive Statement :=
| ConSeg : Segment -> Segment -> Statement
| ConAng : Angle -> Angle -> Statement
| ConTri : Triangle -> Triangle -> Statement
| RefSeg : Segment -> Segment -> Statement
| RefAng : Angle -> Angle -> Statement
.

Inductive Reason :=
| Given : string -> Reason
| Reflex : Reason
| SAS : nat -> nat -> nat -> Reason
| SSS : nat -> nat -> nat -> Reason
| ASA : nat -> nat -> nat -> Reason
| AAS : nat -> nat -> nat -> Reason
| CPCTC : nat -> Reason.

Record Premise := premise { premise_label : string; premise_statement : Statement }.
Record Step := step { step_reason : Reason; step_conclusion : Statement }.
Record ProblemHeader := problem_header {
  header_triangles : list Triangle;
  header_premises : list Premise;
  header_goal : Statement
}.
Record Problem := problem {
  problem_triangles : list Triangle;
  problem_premises : list Premise;
  problem_goal : Statement;
  problem_steps : list Step
}.


End EnderGrammar.

Import EnderGrammar.

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

(**
  The intended completed public language.  The executable development below
  this section currently implements only the smaller [EnderGrammar] slice;
  these definitions are the target contract, not an assertion of coverage.
*)
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
Record ArcName := arc_name {
  arc_circle : CircleName; arc_first : PointName; arc_second : PointName
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
| SimSeg : SegmentName -> SegmentName -> PublicStatement
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
| ArcStatement : CircleName -> PointName -> PointName -> PublicStatement
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

Definition statementMeaning (s : PublicStatement) : option Prop :=
  match s with
  | OnLine s p => Some (SegmentWellFormed s /\ Col (seg_start s) (seg_end s) (point p))
  | Transversal a b t1 i1 c d t2 i2 =>
      Some (point a <> point b /\ point c <> point d /\ point t1 <> point t2 /\
        Col (point a) (point b) (point i1) /\
        Col (point c) (point d) (point i2) /\
        Col (point t1) (point t2) (point i1) /\
        Col (point t1) (point t2) (point i2) /\ point i1 <> point i2)
  | IntersectSeg a b p => Some (OnSegment a p /\ OnSegment b p)
  | TrapezoidPremise q a b => Some (IsTrapezoid q /\ Parallel a b)
  | KitePremise _ _ _ => None
  | IsosTrapezoidPremise q a b => Some (IsIsoscelesTrapezoid q /\ Parallel a b)
  | Right a => Some (AngleWellFormed a /\ RightAngle a)
  | ConSeg a b => Some (SegmentCongruent a b)
  | ConAng a b => Some (AngleCongruent a b)
  | ConTri a b => Some (TriangleCongruent a b)
  | ConRight a b => Some (RightAngle a /\ RightAngle b)
  | Para a b => Some (Parallel a b)
  | Isosceles t => Some (IsoscelesTriangle t)
  | Perp a b p => Some (PerpendicularAt a b p)
  | Midpt s p => Some (MidpointOf s p)
  | AngBisect a s => Some (AngleBisector a s)
  | Rectangle q => Some (IsRectangle q)
  | Parallelogram q => Some (IsParallelogram q)
  | SimSeg _ _ => None
  | SimTri a b => Some (TriangleSimilar a b)
  | Equilateral t => Some (EquilateralTriangle t)
  | Supplementary a b =>
      Some (SuppA (ang_start a) (ang_vertex a) (ang_end a)
                  (ang_start b) (ang_vertex b) (ang_end b))
  | Complementary a b => Some (exists X Y Z,
      Per X Y Z /\ SumA (ang_start a) (ang_vertex a) (ang_end a)
                         (ang_start b) (ang_vertex b) (ang_end b) X Y Z)
  | LinearPair _ _ => None
  | Equiangular t => Some (EquiangularTriangle t)
  | Circumcenter p t => Some (IsCircumcenter p t)
  | Incenter p t => Some (IsIncenter p t)
  | PerpBisector a b p => Some (PerpendicularBisectorAt a b p)
  | SegBisect a b p => Some (SegmentBisectorAt a b p)
  | IsosTrapezoid q => Some (IsIsoscelesTrapezoid q)
  | Rhombus q => Some (IsRhombus q)
  | Tangent c s p => Some (IsTangent c s p)
  | Chord c s => Some (IsChord c s)
  | ArcStatement _ _ _ => None
  | Radius c p => Some (OnCircle c p)
  | Diameter c s => Some (IsDiameter c s)
  | InscribedAngle c a => Some (IsInscribedAngle c a)
  | RefSeg a b => Some (((a.(segment_first) = b.(segment_first) /\
                           a.(segment_second) = b.(segment_second)) \/
                          (a.(segment_first) = b.(segment_second) /\
                           a.(segment_second) = b.(segment_first))) /\
                         SegmentCongruent a b)
  | RefAng a b => Some ((a.(angle_vertex) = b.(angle_vertex) /\
                         ((a.(angle_first) = b.(angle_first) /\ a.(angle_last) = b.(angle_last)) \/
                          (a.(angle_first) = b.(angle_last) /\ a.(angle_last) = b.(angle_first)))) /\
                        AngleCongruent a b)
  | ConArc _ _ => None
  end.

Definition declarationMeaning (d : PublicDeclaration) : Prop :=
  match d with
  | SegmentDeclaration s => SegmentWellFormed s
  | AngleDeclaration a => AngleWellFormed a
  | TriangleDeclaration t => TriangleWellFormed t
  | QuadrilateralDeclaration q => QuadrilateralWellFormed q
  | CircleDeclaration c => CircleWellFormed c
  end.

Definition optionHolds (meaning : option Prop) : Prop :=
  match meaning with Some claim => claim | None => False end.

Definition statementSupported (s : PublicStatement) : bool :=
  match s with
  | KitePremise _ _ _ | SimSeg _ _ | LinearPair _ _
  | ArcStatement _ _ _ | ConArc _ _ => false
  | _ => true
  end.

Definition problemSupported (p : PublicProblem) : bool :=
  forallb statementSupported p.(public_premises) &&
  statementSupported p.(public_conclusion).

Definition problemClaim (p : PublicProblem) : Prop :=
  Forall declarationMeaning p.(public_declarations) ->
  Forall (fun premise => optionHolds (statementMeaning premise)) p.(public_premises) ->
  optionHolds (statementMeaning p.(public_conclusion)).

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
  "arc(" ++ circleText a.(arc_circle) ++ "," ++ pointText a.(arc_first) ++
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
  | SimSeg a b => call "sim_seg" [segmentText a; segmentText b]
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
  | ArcStatement c a b => call "arc" [circleText c; pointText a; pointText b]
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
Inductive HeaderLine : string -> (list PublicDeclaration * list PublicStatement * option PublicStatement) -> Prop :=
| DeclarationHeaderLine : forall text declarations,
    DeclarationText text declarations -> HeaderLine text (declarations, [], None)
| PremiseHeaderLine : forall label body statement,
    (String.prefix "[g_" label = true \/ String.prefix "[d_" label = true) ->
    StatementText body statement ->
    HeaderLine (label ++ "]" ++ body) ([], [statement], None)
| GoalHeaderLine : forall body statement,
    StatementText body statement -> HeaderLine ("->" ++ body) ([], [], Some statement)
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

Section CompleteMeaning.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.

Definition meaning (source : string) : option Prop :=
  match excluded_middle_informative (exists! problem, ProblemGrammar source problem) with
  | left unique =>
      let problem := proj1_sig (constructive_definite_description _ unique) in
      if problemSupported problem
      then Some (forall point : PointName -> Tpoint, problemClaim point problem)
      else None
  | right _ => None
  end.

End CompleteMeaning.

(** Final implementation contract.  It is intentionally stronger than the
    currently inhabited slice contract below. *)
Module Type COMPLETE_VERIFIED_CHECKER.
  Parameter parseProblem : string -> option PublicProblem.
  Parameter checker : string -> bool.
  Parameter parser_correct : forall source problem,
    parseProblem source = Some problem <-> ProblemGrammar source problem.
  Parameter checker_sound : forall source,
    checker source = true ->
    forall part, problemPart source = Some part ->
      forall `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality},
      forall `{T2D : Tarski_2D},
      forall `{TE : @Tarski_euclidean Tn TnEQD},
        exists claim : Prop, meaning part = Some claim /\ claim.
End COMPLETE_VERIFIED_CHECKER.

End FinalAudit.

Section Meaning.

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

Definition statementMeaning (s : Statement) : Prop :=
  match s with
  | ConSeg a b | RefSeg a b =>
      Cong (point a.(seg_start)) (point a.(seg_end))
           (point b.(seg_start)) (point b.(seg_end))
  | ConAng a b | RefAng a b =>
      CongA (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right))
            (point b.(ang_left)) (point b.(ang_vertex)) (point b.(ang_right))
  | ConTri a b => triangle_congruence a b
  end.

Definition headerMeaning (h : ProblemHeader) : Prop :=
  (forall t, In t h.(header_triangles) ->
     ~ Col (point t.(tri_a)) (point t.(tri_b)) (point t.(tri_c))) ->
  Forall (fun p => statementMeaning p.(premise_statement)) h.(header_premises) ->
  statementMeaning h.(header_goal).

End Meaning.

(**
  The implementation must inhabit this signature.  A reviewer checks this
  file; Rocq checks the implementation and the proof body elsewhere.
*)
Module Type VERIFIED_SLICE_CHECKER.
  Parameter parseProblemPart : string -> option ProblemHeader.
  Parameter check : string -> bool.

  Parameter sound : forall source part header,
    problemPart source = Some part ->
    parseProblemPart part = Some header ->
    check source = true ->
    forall `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}
           (point : PointId -> Tpoint),
      headerMeaning point header.
End VERIFIED_SLICE_CHECKER.
