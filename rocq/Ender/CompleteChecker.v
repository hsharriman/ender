From Stdlib Require Import Ascii List String Bool Numbers.DecimalString.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Audit Ender.PublicParser Ender.Syntax Ender.Geometry
  Ender.Semantics Ender.Checker Ender.Parser Ender.PresentationParser.
Import ListNotations.
Import EnderSyntax.
Open Scope string_scope.

Definition project_segment (s : Audit.SegmentName) : Segment :=
  segment s.(Audit.segment_first) s.(Audit.segment_second).
Definition project_angle (a : Audit.AngleName) : Angle :=
  angle a.(Audit.angle_first) a.(Audit.angle_vertex) a.(Audit.angle_last).
Definition project_triangle (t : Audit.TriangleName) : Triangle :=
  triangle t.(Audit.triangle_first) t.(Audit.triangle_second) t.(Audit.triangle_third).

Definition project_quadrilateral (q : Audit.QuadrilateralName) : Quadrilateral :=
  quadrilateral q.(Audit.quadrilateral_first) q.(Audit.quadrilateral_second)
                q.(Audit.quadrilateral_third) q.(Audit.quadrilateral_fourth).

Definition project_circle (c : Audit.CircleName) : Circle :=
  circle c.(Audit.circle_center) c.(Audit.circle_radius_point).

Definition project_arc (a : Audit.ArcName) : Arc :=
  arc a.(Audit.arc_kind) (project_circle a.(Audit.arc_circle))
      a.(Audit.arc_first) a.(Audit.arc_second).

(** Statements usable as premises by the currently implemented kernel.  A
    public [con_tri] premise carries both triangles' noncollinearity together
    with the three side congruences, which is exactly the SSS hypothesis, so
    the kernel's stronger side-and-angle reading of [ConTri] is justified. *)
Definition project_premise_statement (s : Audit.PublicStatement) : option Statement :=
  match s with
  | Audit.ConSeg a b => Some (ConSeg (project_segment a) (project_segment b))
  | Audit.ConAng a b => Some (ConAng (project_angle a) (project_angle b))
  | Audit.ConTri a b => Some (ConTri (project_triangle a) (project_triangle b))
  | Audit.RefSeg a b => Some (RefSeg (project_segment a) (project_segment b))
  | Audit.RefAng a b => Some (RefAng (project_angle a) (project_angle b))
  | Audit.Right a => Some (RightAng (project_angle a))
  | Audit.ConRight a b => Some (ConRight (project_angle a) (project_angle b))
  | Audit.Perp a b p => Some (PerpAt (project_segment a) (project_segment b) p)
  | Audit.Midpt s p => Some (MidptOf (project_segment s) p)
  | Audit.IntersectSeg a b p =>
      Some (IntersectSeg (project_segment a) (project_segment b) p)
  | Audit.AngBisect a s => Some (AngBisectOf (project_angle a) (project_segment s))
  | Audit.OnLine s p => Some (OnLine (project_segment s) p)
  | Audit.Isosceles t => Some (IsoscelesTri (project_triangle t))
  | Audit.Equilateral t => Some (EquilateralTri (project_triangle t))
  | Audit.Equiangular t => Some (EquiangularTri (project_triangle t))
  | Audit.Supplementary a b => Some (Supplementary (project_angle a) (project_angle b))
  | Audit.Complementary a b => Some (Complementary (project_angle a) (project_angle b))
  | Audit.LinearPair a b => Some (LinearPair (project_angle a) (project_angle b))
  | Audit.Para a b => Some (Para (project_segment a) (project_segment b))
  | Audit.Parallelogram q => Some (Pgram (project_quadrilateral q))
  | Audit.Rectangle q => Some (Rect (project_quadrilateral q))
  | Audit.Rhombus q => Some (Rhomb (project_quadrilateral q))
  | Audit.IsosTrapezoid q => Some (IsosTrap (project_quadrilateral q))
  | Audit.TrapezoidPremise q a b =>
      Some (TrapPremise (project_quadrilateral q)
              (project_segment a) (project_segment b))
  | Audit.IsosTrapezoidPremise q a b =>
      Some (IsosTrapPremise (project_quadrilateral q)
              (project_segment a) (project_segment b))
  | Audit.KitePremise q a b =>
      Some (KiteP (project_quadrilateral q) (project_angle a) (project_angle b))
  | Audit.Transversal a b t1 i1 c d t2 i2 =>
      Some (Transv a b t1 i1 c d t2 i2)
  | Audit.Radius c p => Some (RadiusOf (project_circle c) p)
  | Audit.Chord c s => Some (ChordOf (project_circle c) (project_segment s))
  | Audit.Diameter c s =>
      Some (DiameterOf (project_circle c) (project_segment s))
  | Audit.Tangent c s p =>
      Some (TangentAt (project_circle c) (project_segment s) p)
  | Audit.InscribedAngle c a =>
      Some (InscribedAngleOf (project_circle c) (project_angle a))
  | Audit.ArcStatement a => Some (ArcOf (project_arc a))
  | Audit.ConArc a b => Some (ConArc (project_arc a) (project_arc b))
  | _ => None
  end.

(** Reflexive goals carry extra public same-object meaning not supplied merely
    by internal congruence, so this adapter conservatively rejects them.  The
    right-angle and perpendicularity statements below are defined to have
    exactly their audited meanings, so they project in both directions.  The
    quadrilateral shapes and [para] carry the audited meanings verbatim, so
    they too project both ways; the [*_premise] forms are premise-only
    surface vocabulary and stay out of goals. *)
Definition project_goal_statement (s : Audit.PublicStatement) : option Statement :=
  match s with
  | Audit.ConSeg a b => Some (ConSeg (project_segment a) (project_segment b))
  | Audit.ConAng a b => Some (ConAng (project_angle a) (project_angle b))
  | Audit.ConTri a b => Some (ConTri (project_triangle a) (project_triangle b))
  | Audit.Right a => Some (RightAng (project_angle a))
  | Audit.ConRight a b => Some (ConRight (project_angle a) (project_angle b))
  | Audit.Perp a b p => Some (PerpAt (project_segment a) (project_segment b) p)
  | Audit.Midpt s p => Some (MidptOf (project_segment s) p)
  | Audit.IntersectSeg a b p =>
      Some (IntersectSeg (project_segment a) (project_segment b) p)
  | Audit.AngBisect a s => Some (AngBisectOf (project_angle a) (project_segment s))
  | Audit.OnLine s p => Some (OnLine (project_segment s) p)
  | Audit.Isosceles t => Some (IsoscelesTri (project_triangle t))
  | Audit.Equilateral t => Some (EquilateralTri (project_triangle t))
  | Audit.Equiangular t => Some (EquiangularTri (project_triangle t))
  | Audit.Supplementary a b => Some (Supplementary (project_angle a) (project_angle b))
  | Audit.Complementary a b => Some (Complementary (project_angle a) (project_angle b))
  | Audit.LinearPair a b => Some (LinearPair (project_angle a) (project_angle b))
  | Audit.Para a b => Some (Para (project_segment a) (project_segment b))
  | Audit.Parallelogram q => Some (Pgram (project_quadrilateral q))
  | Audit.Rectangle q => Some (Rect (project_quadrilateral q))
  | Audit.Rhombus q => Some (Rhomb (project_quadrilateral q))
  | Audit.IsosTrapezoid q => Some (IsosTrap (project_quadrilateral q))
  | Audit.Radius c p => Some (RadiusOf (project_circle c) p)
  | Audit.Chord c s => Some (ChordOf (project_circle c) (project_segment s))
  | Audit.Diameter c s =>
      Some (DiameterOf (project_circle c) (project_segment s))
  | Audit.Tangent c s p =>
      Some (TangentAt (project_circle c) (project_segment s) p)
  | Audit.InscribedAngle c a =>
      Some (InscribedAngleOf (project_circle c) (project_angle a))
  | Audit.ArcStatement a => Some (ArcOf (project_arc a))
  | Audit.ConArc a b => Some (ConArc (project_arc a) (project_arc b))
  | _ => None
  end.

Fixpoint project_premise_statements (ss : list Audit.PublicStatement)
    : option (list Statement) :=
  match ss with
  | [] => Some []
  | s :: rest =>
      match project_premise_statement s, project_premise_statements rest with
      | Some x, Some xs => Some (x :: xs)
      | _, _ => None
      end
  end.

Definition projected_triangles (ds : list Audit.PublicDeclaration) : list Triangle :=
  fold_right (fun d rest => match d with
    | Audit.TriangleDeclaration t => project_triangle t :: rest
    | _ => rest
    end) [] ds.

Definition projected_angles (ds : list Audit.PublicDeclaration) : list Angle :=
  fold_right (fun d rest => match d with
    | Audit.AngleDeclaration a => project_angle a :: rest
    | _ => rest
    end) [] ds.

Definition projected_quadrilaterals (ds : list Audit.PublicDeclaration)
    : list Quadrilateral :=
  fold_right (fun d rest => match d with
    | Audit.QuadrilateralDeclaration q => project_quadrilateral q :: rest
    | _ => rest
    end) [] ds.

Definition projected_circles (ds : list Audit.PublicDeclaration)
    : list Circle :=
  fold_right (fun d rest => match d with
    | Audit.CircleDeclaration c => project_circle c :: rest
    | _ => rest
    end) [] ds.

Definition projected_declarations (ds : list Audit.PublicDeclaration) : Declarations :=
  declarations (projected_triangles ds) (projected_angles ds)
               (projected_quadrilaterals ds) (projected_circles ds).

Fixpoint statement_list_eqb (a b : list Statement) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => statement_eqb x y && statement_list_eqb xs ys
  | _, _ => false
  end.

Fixpoint triangle_list_eqb (a b : list Triangle) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => triangle_eqb x y && triangle_list_eqb xs ys
  | _, _ => false
  end.

Fixpoint angle_list_eqb (a b : list Angle) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => angle_eqb x y && angle_list_eqb xs ys
  | _, _ => false
  end.

Fixpoint quadrilateral_list_eqb (a b : list Quadrilateral) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => quadrilateral_eqb x y && quadrilateral_list_eqb xs ys
  | _, _ => false
  end.

Fixpoint circle_list_eqb (a b : list Circle) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => circle_eqb x y && circle_list_eqb xs ys
  | _, _ => false
  end.

Definition declarations_eqb (a b : Declarations) : bool :=
  triangle_list_eqb a.(decl_triangles) b.(decl_triangles) &&
  angle_list_eqb a.(decl_angles) b.(decl_angles) &&
  quadrilateral_list_eqb a.(decl_quadrilaterals) b.(decl_quadrilaterals) &&
  circle_list_eqb a.(decl_circles) b.(decl_circles).

Definition premise_statements (ps : list Premise) : list Statement :=
  map premise_statement ps.

Definition goal_declarations_valid (goal : Audit.PublicStatement)
    (decls : Declarations) : bool :=
  match goal with
  | Audit.ConTri a b => triangle_declared decls (project_triangle a) &&
                     triangle_declared decls (project_triangle b)
  | _ => true
  end.

Definition build_kernel_problem (public : Audit.PublicProblem)
    (header : ProblemHeader) (steps : list Step) : option Problem :=
  match project_premise_statements public.(Audit.public_premises),
        project_goal_statement public.(Audit.public_conclusion) with
  | Some premises, Some goal =>
      if declarations_eqb (projected_declarations public.(Audit.public_declarations))
                          header.(header_declarations) &&
         statement_list_eqb premises (premise_statements header.(header_premises)) &&
         statement_eqb goal header.(header_goal) &&
         goal_declarations_valid public.(Audit.public_conclusion)
           header.(header_declarations)
      then Some (problem header.(header_declarations) header.(header_premises)
                        goal steps)
      else None
  | _, _ => None
  end.

Inductive CheckResult := ParseFailure | ProofRejected | ProofAccepted.

Definition classify_source (source : string) : CheckResult :=
  let text := list_ascii_of_string source in
  match problemPart source with
  | Some part =>
      match parsePublicProblem part with
      | Some public =>
          match Parser.find_after (list_ascii_of_string "steps:") text,
                parseProblemPart part with
          | Some stepText, Some header =>
              match parse_step_lines (Parser.split_lines stepText []) [] with
              | Some steps =>
                  match build_kernel_problem public header steps with
                  | Some p =>
                      if check_problem p then ProofAccepted else ProofRejected
                  | None => ProofRejected
                  end
              | None => ProofRejected
              end
          | _, _ => ProofRejected
          end
      | None => ParseFailure
      end
  | None => ParseFailure
  end.

Definition complete_checker (source : string) : bool :=
  match classify_source source with ProofAccepted => true | _ => false end.

(** Rich public reporting façade.  The current vertical slice has no
    step-local recovery yet, so those lists are empty rather than fabricated.
    Their types are already part of the stable audited API. *)
Definition empty_graph : Audit.DependencyGraph :=
  Audit.dependency_graph [] [] [] [].

Definition public_problem_of_source (source : string) : option Audit.PublicProblem :=
  match problemPart source with
  | Some part => parsePublicProblem part
  | None => None
  end.

Definition public_verdict (result : CheckResult) : Audit.Verdict :=
  match result with
  | ParseFailure => Audit.FailedToParseProblem
  | ProofRejected => Audit.RejectedProof
  | ProofAccepted => Audit.Accepted
  end.

Definition verdict_diagnostics (result : CheckResult) : list Audit.Diagnostic :=
  match result with
  | ParseFailure =>
      [Audit.diagnostic Audit.ProblemParsing Audit.DiagnosticError Audit.MalformedProblem
        "the theorem-bearing problem header could not be parsed"]
  | ProofRejected =>
      [Audit.diagnostic Audit.ProofChecking Audit.DiagnosticError Audit.ProofNotAccepted
        "the proof was not accepted by the verified reason kernel"]
  | ProofAccepted => []
  end.

Inductive ExpectedFact :=
| ExpectedSegment | ExpectedAngle | ExpectedTriangle
| ExpectedRight | ExpectedPerpendicular | ExpectedMidpoint
| ExpectedAngleBisector | ExpectedConRight
| ExpectedEquilateral | ExpectedEquiangular | ExpectedSupplementary
| ExpectedComplementary
| ExpectedLinearPair | ExpectedRhombus | ExpectedRectangle
| ExpectedParallelogram.

Definition statement_function (s : Statement) : string :=
  match s with
  | ConSeg _ _ => "con_seg" | ConAng _ _ => "con_ang"
  | ConTri _ _ => "con_tri" | RefSeg _ _ => "ref_seg"
  | RefAng _ _ => "ref_ang" | RightAng _ => "right"
  | ConRight _ _ => "con_right" | PerpAt _ _ _ => "perp"
  | MidptOf _ _ => "midpt" | IntersectSeg _ _ _ => "intersect_seg"
  | AngBisectOf _ _ => "ang_bisect" | OnLine _ _ => "on_line"
  | IsoscelesTri _ => "isosceles" | EquilateralTri _ => "equilateral"
  | EquiangularTri _ => "equiangular" | Supplementary _ _ => "supplementary"
  | Complementary _ _ => "complementary"
  | LinearPair _ _ => "linear_pair"
  | Para _ _ => "para" | Pgram _ => "parallelogram"
  | Rect _ => "rectangle" | Rhomb _ => "rhombus"
  | IsosTrap _ => "isos_trapezoid" | TrapPremise _ _ _ => "trapezoid_premise"
  | IsosTrapPremise _ _ _ => "isos_trapezoid_premise"
  | KiteP _ _ _ => "kite_premise"
  | Transv _ _ _ _ _ _ _ _ => "transversal"
  | RadiusOf _ _ => "radius" | ChordOf _ _ => "chord"
  | DiameterOf _ _ => "diameter" | TangentAt _ _ _ => "tangent"
  | InscribedAngleOf _ _ => "inscribed_angle"
  | ArcOf _ => "arc" | ConArc _ _ => "con_arc"
  end.

Definition expected_function (expected : ExpectedFact) : string :=
  match expected with
  | ExpectedSegment => "con_seg" | ExpectedAngle => "con_ang"
  | ExpectedTriangle => "con_tri" | ExpectedRight => "right"
  | ExpectedPerpendicular => "perp" | ExpectedMidpoint => "midpt"
  | ExpectedAngleBisector => "ang_bisect" | ExpectedConRight => "con_right"
  | ExpectedEquilateral => "equilateral"
  | ExpectedEquiangular => "equiangular"
  | ExpectedSupplementary => "supplementary"
  | ExpectedComplementary => "complementary"
  | ExpectedLinearPair => "linear_pair"
  | ExpectedRhombus => "rhombus"
  | ExpectedRectangle => "rectangle"
  | ExpectedParallelogram => "parallelogram"
  end.

Definition allowed_functions (expected : ExpectedFact) : list string :=
  match expected with
  | ExpectedSegment => ["ref_seg"]
  | ExpectedAngle => ["ref_ang"; "con_right"]
  | ExpectedTriangle | ExpectedRight | ExpectedPerpendicular
  | ExpectedMidpoint | ExpectedAngleBisector | ExpectedConRight
  | ExpectedEquilateral | ExpectedEquiangular | ExpectedSupplementary => []
  | ExpectedComplementary => []
  | ExpectedLinearPair => []
  | ExpectedRhombus => []
  | ExpectedRectangle => []
  | ExpectedParallelogram => []
  end.

Definition fact_has_expected_type (expected : ExpectedFact) (s : Statement) : bool :=
  match expected, s with
  | ExpectedSegment, ConSeg _ _ | ExpectedSegment, RefSeg _ _
  | ExpectedAngle, ConAng _ _ | ExpectedAngle, RefAng _ _
  | ExpectedAngle, ConRight _ _
  | ExpectedTriangle, ConTri _ _ | ExpectedRight, RightAng _
  | ExpectedPerpendicular, PerpAt _ _ _ | ExpectedMidpoint, MidptOf _ _
  | ExpectedAngleBisector, AngBisectOf _ _ | ExpectedConRight, ConRight _ _
  | ExpectedEquilateral, EquilateralTri _
  | ExpectedEquiangular, EquiangularTri _
  | ExpectedSupplementary, Supplementary _ _ => true
  | ExpectedComplementary, Complementary _ _ => true
  | ExpectedLinearPair, LinearPair _ _ => true
  | ExpectedRhombus, Rhomb _ => true
  | ExpectedRectangle, Rect _ => true
  | ExpectedParallelogram, Pgram _ => true
  | _, _ => false
  end.

Definition nat_text (n : nat) : string := NilZero.string_of_uint (Nat.to_uint n).
Definition json_strings (xs : list string) : list Audit.JsonValue :=
  map Audit.JsonString xs.

Definition dependency_type_issue (facts : list Statement) (reason : string)
    (index reference : nat) (expected : ExpectedFact) (step_number : nat)
    : option Audit.Issue :=
  match lookup_step facts reference with
  | Some received =>
      if fact_has_expected_type expected received then None else
      Some (Audit.issue 12 "reason_dep_type_mismatch" (Audit.JsonObject
        [("reason", Audit.JsonString reason);
         ("index", Audit.JsonNumber index);
         ("ref", Audit.JsonString (nat_text reference));
         ("expectedType", Audit.JsonString (expected_function expected));
         ("allowedTypes", Audit.JsonArray (json_strings (allowed_functions expected)));
         ("receivedType", Audit.JsonString (statement_function received));
         ("steps", Audit.JsonArray [Audit.JsonString (nat_text step_number)])]))
  | None => None
  end.

Definition first_issue (a b : option Audit.Issue) : option Audit.Issue :=
  match a with Some _ => a | None => b end.

Definition reason_dependency_issue (facts : list Statement) (reason : Reason)
    (step_number : nat) : option Audit.Issue :=
  match reason with
  | SAS i j k =>
      first_issue (dependency_type_issue facts "sas" 0 i ExpectedSegment step_number)
       (first_issue (dependency_type_issue facts "sas" 1 j ExpectedAngle step_number)
                    (dependency_type_issue facts "sas" 2 k ExpectedSegment step_number))
  | SSS i j k =>
      first_issue (dependency_type_issue facts "sss" 0 i ExpectedSegment step_number)
       (first_issue (dependency_type_issue facts "sss" 1 j ExpectedSegment step_number)
                    (dependency_type_issue facts "sss" 2 k ExpectedSegment step_number))
  | ASA i j k =>
      first_issue (dependency_type_issue facts "asa" 0 i ExpectedAngle step_number)
       (first_issue (dependency_type_issue facts "asa" 1 j ExpectedSegment step_number)
                    (dependency_type_issue facts "asa" 2 k ExpectedAngle step_number))
  | AAS i j k =>
      first_issue (dependency_type_issue facts "aas" 0 i ExpectedAngle step_number)
       (first_issue (dependency_type_issue facts "aas" 1 j ExpectedAngle step_number)
                    (dependency_type_issue facts "aas" 2 k ExpectedSegment step_number))
  | CPCTC i => dependency_type_issue facts "cpctc" 0 i ExpectedTriangle step_number
  | RHL i j k =>
      first_issue (dependency_type_issue facts "rhl" 0 i ExpectedConRight step_number)
       (first_issue (dependency_type_issue facts "rhl" 1 j ExpectedSegment step_number)
                    (dependency_type_issue facts "rhl" 2 k ExpectedSegment step_number))
  | ConSegTrans i j =>
      first_issue
        (dependency_type_issue facts "con_seg_transitive" 0 i ExpectedSegment step_number)
        (dependency_type_issue facts "con_seg_transitive" 1 j ExpectedSegment step_number)
  | ConAngTrans i j =>
      first_issue
        (dependency_type_issue facts "con_ang_transitive" 0 i ExpectedAngle step_number)
        (dependency_type_issue facts "con_ang_transitive" 1 j ExpectedAngle step_number)
  | ConTriTrans i j =>
      first_issue
        (dependency_type_issue facts "con_tri_transitive" 0 i ExpectedTriangle step_number)
        (dependency_type_issue facts "con_tri_transitive" 1 j ExpectedTriangle step_number)
  | DefConRight i j =>
      first_issue
        (dependency_type_issue facts "def_con_right" 0 i ExpectedRight step_number)
        (dependency_type_issue facts "def_con_right" 1 j ExpectedRight step_number)
  | PerpConAng i =>
      dependency_type_issue facts "perp_con_ang" 0 i ExpectedPerpendicular step_number
  | DefMidpt i =>
      dependency_type_issue facts "def_midpt" 0 i ExpectedMidpoint step_number
  | MidptConv i =>
      dependency_type_issue facts "midpt_conv" 0 i ExpectedSegment step_number
  | DefPerp i =>
      dependency_type_issue facts "def_perp" 0 i ExpectedRight step_number
  | ConSupplements i j k =>
      first_issue
        (dependency_type_issue facts "con_supplements" 0 i ExpectedSupplementary
           step_number)
        (first_issue
          (dependency_type_issue facts "con_supplements" 1 j ExpectedSupplementary
             step_number)
          (dependency_type_issue facts "con_supplements" 2 k ExpectedAngle
             step_number))
  | ConSupplementsSame i j =>
      first_issue
        (dependency_type_issue facts "con_supplements_same" 0 i
           ExpectedSupplementary step_number)
        (dependency_type_issue facts "con_supplements_same" 1 j
           ExpectedSupplementary step_number)
  | DefLinearPair i =>
      dependency_type_issue facts "def_linear_pair" 0 i ExpectedLinearPair step_number
  | RhombusDef i =>
      dependency_type_issue facts "rhombus" 0 i ExpectedRhombus step_number
  | RhombusOppBisect i =>
      dependency_type_issue facts "rhombus_opp_bisect" 0 i ExpectedRhombus
        step_number
  | RectDiagCon i =>
      dependency_type_issue facts "rect_diag_con" 0 i ExpectedRectangle
        step_number
  | PgramConsecAngs i =>
      dependency_type_issue facts "pgram_consec_angs" 0 i ExpectedParallelogram
        step_number
  | RectangleDef i =>
      dependency_type_issue facts "rectangle" 0 i ExpectedRectangle step_number
  | DefIsosceles i =>
      dependency_type_issue facts "def_isosceles" 0 i ExpectedSegment step_number
  | BaseAngle i =>
      dependency_type_issue facts "base_angle" 0 i ExpectedSegment step_number
  | BaseAngleConv i =>
      dependency_type_issue facts "base_angle_conv" 0 i ExpectedAngle step_number
  | EquilatEquiang i =>
      dependency_type_issue facts "equilat_equiang" 0 i ExpectedEquilateral
        step_number
  | EquiangEquilat i =>
      dependency_type_issue facts "equiang_equilat" 0 i ExpectedEquiangular
        step_number
  | ThirdAngle i j =>
      first_issue
        (dependency_type_issue facts "third_angle" 0 i ExpectedAngle step_number)
        (dependency_type_issue facts "third_angle" 1 j ExpectedAngle step_number)
  | DefAngBisect i =>
      dependency_type_issue facts "def_ang_bisect" 0 i ExpectedAngleBisector
        step_number
  | AngBisectConv i =>
      dependency_type_issue facts "ang_bisect_conv" 0 i ExpectedAngle step_number
  | _ => None
  end.

Definition generic_rejection_issue (step_number : nat) : Audit.Issue :=
  Audit.issue 1 "reason_application_error"
    (Audit.JsonObject [("steps", Audit.JsonArray [Audit.JsonString (nat_text step_number)])]).

Fixpoint diagnose_steps (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (steps : list Step) (step_number : nat)
    : list Audit.Issue :=
  match steps with
  | [] =>
      [Audit.issue 4 "goal_not_reached" (Audit.JsonObject [])]
  | current :: rest =>
      if rule_valid decls premises facts current.(step_reason) current.(step_conclusion)
      then diagnose_steps decls premises (facts ++ [current.(step_conclusion)])
             rest (S step_number)
      else match reason_dependency_issue facts current.(step_reason) step_number with
           | Some reported => [reported]
           | None => [generic_rejection_issue step_number]
           end
  end.

Definition rejected_proof_issues (source : string) : list Audit.Issue :=
  let text := list_ascii_of_string source in
  match problemPart source with
  | Some part =>
      match parsePublicProblem part,
            Parser.find_after (list_ascii_of_string "steps:") text,
            parseProblemPart part with
      | Some public, Some stepText, Some header =>
          match parse_step_lines (Parser.split_lines stepText []) [] with
          | Some steps =>
              match build_kernel_problem public header steps with
              | Some p => diagnose_steps p.(problem_declarations) p.(problem_premises)
                            [] p.(problem_steps) 1
              | None => [generic_rejection_issue 0]
              end
          | None => [Audit.issue 3 "parser_error" (Audit.JsonObject [])]
          end
      | _, _, _ => [Audit.issue 3 "parser_error" (Audit.JsonObject [])]
      end
  | None => [Audit.issue 3 "parser_error" (Audit.JsonObject [])]
  end.

Definition report_issues_for (source : string) (result : CheckResult) : list Audit.Issue :=
  match result with ProofRejected => rejected_proof_issues source | _ => [] end.
Definition report_errors_for (result : CheckResult) : list Audit.Issue :=
  match result with
  | ParseFailure => [Audit.issue 3 "parser_error" (Audit.JsonObject [])]
  | _ => []
  end.

(** * Advisory report content

    Nothing below is trusted.  [accepted] reads the verdict alone, so these
    fields cannot make a rejected proof look accepted; they exist so the
    interface can say which step failed, what fed it, and what was never
    used.  They are written to be honest about their own limits: a step after
    the first failure is reported [StepBlocked] rather than judged, because
    its dependency was never established. *)

Definition unproject_segment (s : Segment) : Audit.SegmentName :=
  Audit.segment_name s.(seg_start) s.(seg_end).
Definition unproject_angle (a : Angle) : Audit.AngleName :=
  Audit.angle_name a.(ang_left) a.(ang_vertex) a.(ang_right).
Definition unproject_triangle (t : Triangle) : Audit.TriangleName :=
  Audit.triangle_name t.(tri_a) t.(tri_b) t.(tri_c).
Definition unproject_quadrilateral (q : Quadrilateral) : Audit.QuadrilateralName :=
  Audit.quadrilateral_name q.(quad_a) q.(quad_b) q.(quad_c) q.(quad_d).
Definition unproject_circle (c : Circle) : Audit.CircleName :=
  Audit.circle_name c.(circle_c) c.(circle_r).
Definition unproject_arc (a : Arc) : Audit.ArcName :=
  Audit.arc_name a.(arc_k) (unproject_circle a.(arc_circ)) a.(arc_p1) a.(arc_p2).

(** The kernel representation carries no more than the public one, so every
    internal statement names a public statement again. *)
Definition public_of_statement (s : Statement) : Audit.PublicStatement :=
  match s with
  | ConSeg a b => Audit.ConSeg (unproject_segment a) (unproject_segment b)
  | ConAng a b => Audit.ConAng (unproject_angle a) (unproject_angle b)
  | ConTri a b => Audit.ConTri (unproject_triangle a) (unproject_triangle b)
  | RefSeg a b => Audit.RefSeg (unproject_segment a) (unproject_segment b)
  | RefAng a b => Audit.RefAng (unproject_angle a) (unproject_angle b)
  | RightAng a => Audit.Right (unproject_angle a)
  | ConRight a b => Audit.ConRight (unproject_angle a) (unproject_angle b)
  | PerpAt a b p => Audit.Perp (unproject_segment a) (unproject_segment b) p
  | MidptOf s p => Audit.Midpt (unproject_segment s) p
  | IntersectSeg a b p =>
      Audit.IntersectSeg (unproject_segment a) (unproject_segment b) p
  | AngBisectOf a s => Audit.AngBisect (unproject_angle a) (unproject_segment s)
  | OnLine s p => Audit.OnLine (unproject_segment s) p
  | IsoscelesTri t => Audit.Isosceles (unproject_triangle t)
  | EquilateralTri t => Audit.Equilateral (unproject_triangle t)
  | EquiangularTri t => Audit.Equiangular (unproject_triangle t)
  | Supplementary a b => Audit.Supplementary (unproject_angle a) (unproject_angle b)
  | Complementary a b => Audit.Complementary (unproject_angle a) (unproject_angle b)
  | LinearPair a b => Audit.LinearPair (unproject_angle a) (unproject_angle b)
  | Para a b => Audit.Para (unproject_segment a) (unproject_segment b)
  | Pgram q => Audit.Parallelogram (unproject_quadrilateral q)
  | Rect q => Audit.Rectangle (unproject_quadrilateral q)
  | Rhomb q => Audit.Rhombus (unproject_quadrilateral q)
  | IsosTrap q => Audit.IsosTrapezoid (unproject_quadrilateral q)
  | TrapPremise q a b =>
      Audit.TrapezoidPremise (unproject_quadrilateral q)
        (unproject_segment a) (unproject_segment b)
  | IsosTrapPremise q a b =>
      Audit.IsosTrapezoidPremise (unproject_quadrilateral q)
        (unproject_segment a) (unproject_segment b)
  | KiteP q a b =>
      Audit.KitePremise (unproject_quadrilateral q)
        (unproject_angle a) (unproject_angle b)
  | Transv a b t1 i1 c d t2 i2 => Audit.Transversal a b t1 i1 c d t2 i2
  | RadiusOf c p => Audit.Radius (unproject_circle c) p
  | ChordOf c s => Audit.Chord (unproject_circle c) (unproject_segment s)
  | DiameterOf c s => Audit.Diameter (unproject_circle c) (unproject_segment s)
  | TangentAt c s p => Audit.Tangent (unproject_circle c) (unproject_segment s) p
  | InscribedAngleOf c a =>
      Audit.InscribedAngle (unproject_circle c) (unproject_angle a)
  | ArcOf a => Audit.ArcStatement (unproject_arc a)
  | ConArc a b => Audit.ConArc (unproject_arc a) (unproject_arc b)
  end.

Definition reason_name (r : Reason) : string :=
  match r with
  | Given _ => "given" | Reflex => "reflex"
  | SAS _ _ _ => "sas" | SSS _ _ _ => "sss"
  | ASA _ _ _ => "asa" | AAS _ _ _ => "aas"
  | CPCTC _ => "cpctc"
  | ConSegTrans _ _ => "con_seg_transitive"
  | ConAngTrans _ _ => "con_ang_transitive"
  | ConTriTrans _ _ => "con_tri_transitive"
  | DefConRight _ _ => "def_con_right"
  | PerpConAng _ => "perp_con_ang"
  | DefMidpt _ => "def_midpt"
  | VertAng _ => "vert_ang"
  | DefAngBisect _ => "def_ang_bisect"
  | AngBisectConv _ => "ang_bisect_conv"
  | RHL _ _ _ => "rhl"
  | MidptConv _ => "midpt_conv"
  | ThirdAngle _ _ => "third_angle"
  | DefConTri _ _ _ _ _ _ => "def_con_tri"
  | DefIsosceles _ => "def_isosceles"
  | BaseAngle _ => "base_angle"
  | BaseAngleConv _ => "base_angle_conv"
  | DefEquilateral _ _ _ => "def_equilateral"
  | DefEquiangular _ _ _ => "def_equiangular"
  | EquilatEquiang _ => "equilat_equiang"
  | EquiangEquilat _ => "equiang_equilat"
  | ConSupplements _ _ _ => "con_supplements"
  | ConSupplementsSame _ _ => "con_supplements_same"
  | ConComplements _ _ _ => "con_complements"
  | ConComplementsSame _ _ => "con_complements_same"
  | DefLinearPair _ => "def_linear_pair"
  | DefPerp _ => "def_perp"
  | DefParallelogram _ _ => "def_parallelogram"
  | PgramOppSides _ => "pgram_opp_sides"
  | PgramOppAngles _ => "pgram_opp_angs"
  | PgramConsecAngs _ => "pgram_consec_angs"
  | PgramOppSidePara _ _ => "pgram_opp_side_para"
  | RectanglePgram _ => "rectangle_pgram"
  | RhombusPgram _ => "rhombus_pgram"
  | RhombusConsecSides _ _ => "rhombus_consec_sides"
  | RhombusDef _ => "rhombus"
  | RhombusOppBisect _ => "rhombus_opp_bisect"
  | RectDiagCon _ => "rect_diag_con"
  | RectangleDef _ => "rectangle"
  | AltInt _ => "altint" | AltExt _ => "altext"
  | CorrespAng _ => "corresp_ang" | SamesideAng _ => "sameside_ang"
  | AltIntConv _ => "altint_conv" | AltExtConv _ => "altext_conv"
  | CorrespAngConv _ => "corresp_ang_conv"
  | SamesideAngConv _ => "sameside_ang_conv"
  | ParaTrans _ _ => "para_transitive"
  | DefRadius _ => "def_radius"
  | InscribedSemi _ => "inscribed_semi"
  | ConChordsArcs _ => "con_chords_intersect_arcs"
  | TangentPerp _ _ => "tangent_perp"
  end.

(** The step numbers a reason cites.  [given] and [vert_ang] cite a premise
    label rather than a step, and [reflex] cites nothing. *)
Definition reason_dependencies (r : Reason) : list nat :=
  match r with
  | Given _ | Reflex | VertAng _ => []
  | CPCTC i | PerpConAng i | DefMidpt i | DefAngBisect i | AngBisectConv i
  | MidptConv i | DefIsosceles i | BaseAngle i | BaseAngleConv i
  | EquilatEquiang i | EquiangEquilat i | DefLinearPair i | DefPerp i
  | PgramOppSides i | PgramOppAngles i | PgramConsecAngs i | RectanglePgram i
  | RhombusPgram i | RhombusDef i | RhombusOppBisect i | RectDiagCon i
  | RectangleDef i | AltInt i | AltExt i | CorrespAng i | SamesideAng i
  | AltIntConv i | AltExtConv i | CorrespAngConv i | SamesideAngConv i
  | DefRadius i | InscribedSemi i | ConChordsArcs i => [i]
  | ConSegTrans i j | ConAngTrans i j | ConTriTrans i j | DefConRight i j
  | ThirdAngle i j | ConSupplementsSame i j | ConComplementsSame i j
  | DefParallelogram i j | PgramOppSidePara i j | RhombusConsecSides i j
  | ParaTrans i j | TangentPerp i j => [i; j]
  | SAS i j k | SSS i j k | ASA i j k | AAS i j k | RHL i j k
  | DefEquilateral i j k | DefEquiangular i j k | ConSupplements i j k
  | ConComplements i j k => [i; j; k]
  | DefConTri i j k l m n => [i; j; k; l; m; n]
  end.

Definition nat_eqb_report (a b : nat) : bool := Nat.eqb a b.

Definition step_failure_diagnostic : Audit.Diagnostic :=
  Audit.diagnostic Audit.ProofChecking Audit.DiagnosticError Audit.InvalidReason
    "the verified reason kernel did not accept this step".

Definition step_blocked_diagnostic : Audit.Diagnostic :=
  Audit.diagnostic Audit.ProofChecking Audit.DiagnosticWarning
    Audit.MissingDependency
    "a step this one cites was not accepted, so this step was not judged".

(** Every step is checked on its own, exactly as the kernel would check it.
    What a failure does to the steps *after* it is decided by the graph rather
    than by position: a step that cites one which was not accepted is
    [StepBlocked], because its input was never established, and a step that
    cites nothing broken is judged on its own merits however far down it
    sits.  Marking everything below a failure would send the reader to lines
    that are perfectly fine. *)
Definition dependency_blocked (statuses : list (nat * Audit.StepStatus))
    (dependencies : list nat) : bool :=
  existsb (fun d =>
    match find (fun entry => nat_eqb_report (fst entry) d) statuses with
    | Some (_, Audit.StepAccepted) => false
    | Some _ => true
    | None => false
    end) dependencies.

Fixpoint step_statuses (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (steps : list Step) (number : nat)
    (statuses : list (nat * Audit.StepStatus))
    : list (nat * Audit.StepStatus) :=
  match steps with
  | [] => statuses
  | current :: rest =>
      let status :=
        if negb (rule_valid decls premises facts current.(step_reason)
                   current.(step_conclusion))
        then Audit.StepRejected
        else if dependency_blocked statuses
                  (reason_dependencies current.(step_reason))
        then Audit.StepBlocked
        else Audit.StepAccepted in
      step_statuses decls premises (List.app facts [current.(step_conclusion)])
        rest (S number) (List.app statuses [(number, status)])
  end.

Definition status_of (statuses : list (nat * Audit.StepStatus)) (number : nat)
    : Audit.StepStatus :=
  match find (fun entry => nat_eqb_report (fst entry) number) statuses with
  | Some (_, status) => status
  | None => Audit.StepBlocked
  end.

Fixpoint step_reports (statuses : list (nat * Audit.StepStatus))
    (steps : list (string * Step)) (number : nat) : list Audit.StepReport :=
  match steps with
  | [] => []
  | (source, current) :: rest =>
      let status := status_of statuses number in
      Audit.step_report number source (Some (reason_name current.(step_reason)))
        (Some (public_of_statement current.(step_conclusion))) status
        (reason_dependencies current.(step_reason)) []
        (match status with
         | Audit.StepRejected => [step_failure_diagnostic]
         | Audit.StepBlocked => [step_blocked_diagnostic]
         | Audit.StepAccepted => []
         end) []
      :: step_reports statuses rest (S number)
  end.

Definition successors (edges : list (nat * nat)) (node : nat) : list nat :=
  map snd (filter (fun e => nat_eqb_report (fst e) node) edges).

(** The path is the search stack, so meeting a node already on it closes a
    cycle, and the cycle is the tail of the path from that node onward. *)
Fixpoint cycle_tail (node : nat) (path : list nat) : list nat :=
  match path with
  | [] => []
  | x :: rest => if nat_eqb_report x node then x :: rest else cycle_tail node rest
  end.

(** Depth-first search bounded by the node count, which is enough fuel to
    reach any node on a simple path and keeps the recursion structural. *)
Fixpoint find_cycle (edges : list (nat * nat)) (fuel : nat) (path : list nat)
    (node : nat) : option (list nat) :=
  match fuel with
  | O => None
  | S remaining =>
      if existsb (nat_eqb_report node) path then Some (cycle_tail node path)
      else
        let extended := List.app path [node] in
        let fix scan (candidates : list nat) : option (list nat) :=
          match candidates with
          | [] => None
          | next :: rest =>
              match find_cycle edges remaining extended next with
              | Some found => Some found
              | None => scan rest
              end
          end in
        scan (successors edges node)
  end.

Definition same_cycle (a b : list nat) : bool :=
  Nat.eqb (List.length a) (List.length b) &&
  forallb (fun x => existsb (nat_eqb_report x) b) a.

(** A step may only cite facts proved before it, so an accepted proof has no
    cycles.  A rejected one can: the edges are the step numbers as written,
    and a proof that cites forwards -- or in a ring -- is exactly the case
    worth naming rather than leaving the reader to find. *)
Definition graph_cycles (nodes : list nat) (edges : list (nat * nat))
    : list (list nat) :=
  fold_left (fun found node =>
    match find_cycle edges (S (List.length nodes)) [] node with
    | Some cycle =>
        if existsb (same_cycle cycle) found then found
        else List.app found [cycle]
    | None => found
    end) nodes [].

(** A step is unused when nothing cites it and it does not state the goal.
    Whether that step was *accepted* is beside the point here -- a failed last
    step is the one the writer was trying to finish on, not a stray. *)
Definition step_graph (reports : list Audit.StepReport) (stated_by : option nat)
    : Audit.DependencyGraph :=
  let nodes := map Audit.step_number reports in
  let edges :=
    flat_map (fun r =>
      map (fun d => (d, r.(Audit.step_number))) r.(Audit.step_dependencies))
      reports in
  let cited n := existsb (fun e => nat_eqb_report (fst e) n) edges in
  let goal_step n :=
    match stated_by with Some g => nat_eqb_report g n | None => false end in
  Audit.dependency_graph nodes edges (graph_cycles nodes edges)
    (filter (fun n => negb (cited n || goal_step n)) nodes).

(** A fact proved twice.  Sameness is the checker's own [fact_eqb], so a
    congruence restated with its sides exchanged counts, as it should.

    A [given] step restating the premise it cites is not a second derivation
    of anything -- it is how the language spells "use this premise" -- so the
    premise a step names is not counted against it.  A second [given] of the
    same premise still is. *)
Definition origin_is_cited (r : Reason) (origin : Audit.FactOrigin) : bool :=
  match r, origin with
  | Given label, Audit.PremiseOrigin cited => String.eqb label cited
  | _, _ => false
  end.

Fixpoint duplicate_scan (seen : list (Audit.FactOrigin * Statement))
    (later : list (Audit.FactOrigin * Reason * Statement))
    : list Audit.DuplicateDerivation :=
  match later with
  | [] => []
  | (origin, r, s) :: rest =>
      let earlier :=
        filter (fun p => fact_eqb (snd p) s && negb (origin_is_cited r (fst p)))
          seen in
      (match earlier with
       | [] => []
       | (first, _) :: _ =>
           [Audit.duplicate_derivation (public_of_statement s) first origin]
       end) ++ duplicate_scan (seen ++ [(origin, s)]) rest
  end.

Fixpoint numbered_step_facts (steps : list Step) (number : nat)
    : list (Audit.FactOrigin * Reason * Statement) :=
  match steps with
  | [] => []
  | current :: rest =>
      (Audit.StepOrigin number, current.(step_reason), current.(step_conclusion))
      :: numbered_step_facts rest (S number)
  end.

Definition premise_facts (premises : list Premise)
    : list (Audit.FactOrigin * Statement) :=
  map (fun p => (Audit.PremiseOrigin p.(premise_label), p.(premise_statement)))
      premises.

(** Which step states the goal, matched exactly as the checker matches it.
    With [require_accepted], the step must also stand up: [provedBy] names the
    step the goal *rests on*, so a rejected step -- or one whose own input was
    never established -- cannot be it.  Reporting the two separately tells
    apart the two ways a proof falls short: never stating the goal, and
    stating it on a step that did not hold. *)
Fixpoint goal_stated_by (goal : Statement) (steps : list Step) (number : nat)
    (statuses : list (nat * Audit.StepStatus)) (require_accepted : bool)
    : option nat :=
  match steps with
  | [] => None
  | current :: rest =>
      let usable :=
        if require_accepted then
          match status_of statuses number with
          | Audit.StepAccepted => true
          | _ => false
          end
        else true in
      if usable && fact_eqb goal current.(step_conclusion) then Some number
      else goal_stated_by goal rest (S number) statuses require_accepted
  end.

Definition goal_missing_diagnostic : Audit.Diagnostic :=
  Audit.diagnostic Audit.ProofChecking Audit.DiagnosticError Audit.GoalNotProved
    "no step states the goal".

Definition goal_unproved_diagnostic : Audit.Diagnostic :=
  Audit.diagnostic Audit.ProofChecking Audit.DiagnosticError Audit.GoalNotProved
    "the step that states the goal was not accepted".

Definition goal_report_for (p : Problem)
    (statuses : list (nat * Audit.StepStatus)) : Audit.GoalReport :=
  match goal_stated_by p.(problem_goal) p.(problem_steps) 1 statuses true with
  | Some n => Audit.goal_report (Some n) [] []
  | None =>
      match goal_stated_by p.(problem_goal) p.(problem_steps) 1 statuses false with
      | Some _ => Audit.goal_report None [goal_unproved_diagnostic] []
      | None => Audit.goal_report None [goal_missing_diagnostic] []
      end
  end.

(** Keep each step's own source line beside it, so a report can quote the line
    it is talking about. *)
Fixpoint parse_sourced_step_lines (lines : list chars)
    (steps : list (string * Step)) : option (list (string * Step)) :=
  match lines with
  | [] => Some steps
  | line :: rest =>
      let compact := Parser.remove_space (Parser.take_until "/"%char line) in
      if Parser.starts_with ["["%char] compact then
        match Parser.parse_step line with
        | Some parsed =>
            parse_sourced_step_lines rest
              (steps ++ [(string_of_list_ascii line, parsed)])
        | None => None
        end
      else parse_sourced_step_lines rest steps
  end.

Definition report_content (source : string)
    : list Audit.StepReport * Audit.DependencyGraph *
      list Audit.DuplicateDerivation * Audit.GoalReport :=
  let empty := ([], empty_graph, [], Audit.goal_report None [] []) in
  let text := list_ascii_of_string source in
  match problemPart source with
  | Some part =>
      match parsePublicProblem part,
            Parser.find_after (list_ascii_of_string "steps:") text,
            parseProblemPart part with
      | Some public, Some stepText, Some header =>
          match parse_sourced_step_lines (Parser.split_lines stepText []) [] with
          | Some sourced =>
              match build_kernel_problem public header (map snd sourced) with
              | Some p =>
                  let statuses :=
                    step_statuses p.(problem_declarations) p.(problem_premises)
                      [] p.(problem_steps) 1 [] in
                  let reports := step_reports statuses sourced 1 in
                  let goal := goal_report_for p statuses in
                  let stated :=
                    goal_stated_by p.(problem_goal) p.(problem_steps) 1
                      statuses false in
                  (reports, step_graph reports stated,
                   duplicate_scan (premise_facts p.(problem_premises))
                     (numbered_step_facts p.(problem_steps) 1),
                   goal)
              | None => empty
              end
          | None => empty
          end
      | _, _, _ => empty
      end
  | None => empty
  end.

Definition check_report (source : string) : Audit.CheckReport :=
  let result := classify_source source in
  let content := report_content source in
  Audit.check_report (public_verdict result) (public_problem_of_source source)
    (PresentationParser.parsePresentation source)
    (fst (fst (fst content))) (snd (fst (fst content))) (snd (fst content))
    (snd content)
    (report_issues_for source result) (report_errors_for result)
    (verdict_diagnostics result).

Lemma check_report_accepted : forall source,
  Audit.accepted (check_report source) = complete_checker source.
Proof.
  intro source. unfold check_report, Audit.accepted, complete_checker.
  destruct (classify_source source); reflexivity.
Qed.

Lemma statement_list_eqb_eq : forall a b,
  statement_list_eqb a b = true <-> a = b.
Proof.
  induction a as [|x xs IH]; destruct b as [|y ys]; cbn; try easy.
  rewrite andb_true_iff, statement_eqb_eq, IH. split.
  - intros [-> ->]. reflexivity.
  - intros H. inversion H. auto.
Qed.

Lemma triangle_list_eqb_eq : forall a b,
  triangle_list_eqb a b = true <-> a = b.
Proof.
  induction a as [|x xs IH]; destruct b as [|y ys]; cbn; try easy.
  rewrite andb_true_iff, triangle_eqb_eq, IH. split.
  - intros [-> ->]. reflexivity.
  - intros H. inversion H. auto.
Qed.

Lemma angle_list_eqb_eq : forall a b, angle_list_eqb a b = true <-> a = b.
Proof.
  induction a as [|x xs IH]; destruct b as [|y ys]; cbn; try easy.
  rewrite andb_true_iff, angle_eqb_eq, IH. split.
  - intros [-> ->]. reflexivity.
  - intros H. inversion H. auto.
Qed.

Lemma quadrilateral_list_eqb_eq : forall a b,
  quadrilateral_list_eqb a b = true <-> a = b.
Proof.
  induction a as [|x xs IH]; destruct b as [|y ys]; cbn; try easy.
  rewrite andb_true_iff, quadrilateral_eqb_eq, IH. split.
  - intros [-> ->]. reflexivity.
  - intros H. inversion H. auto.
Qed.

Lemma circle_list_eqb_eq : forall a b, circle_list_eqb a b = true <-> a = b.
Proof.
  induction a as [|x xs IH]; destruct b as [|y ys]; cbn; try easy.
  rewrite andb_true_iff, circle_eqb_eq, IH. split.
  - intros [-> ->]. reflexivity.
  - intros H. inversion H. auto.
Qed.

Lemma declarations_eqb_eq : forall a b, declarations_eqb a b = true <-> a = b.
Proof.
  intros [t1 a1 q1 c1] [t2 a2 q2 c2]. unfold declarations_eqb. cbn.
  rewrite !andb_true_iff, triangle_list_eqb_eq, angle_list_eqb_eq,
    quadrilateral_list_eqb_eq, circle_list_eqb_eq. split.
  - intros [[[-> ->] ->] ->]. reflexivity.
  - intros H. inversion H. auto.
Qed.

Section Bridge.
Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : Audit.PointName -> Tpoint.

Lemma projected_triangle_meaning : forall ds,
  Forall (Audit.declarationMeaning point) ds ->
  declarations_well_formed point (projected_declarations ds).
Proof.
  intros ds Hall. split; [|split; [|split]].
  - intros t Hin. induction Hall as [|d rest Hd Hrest IH]; cbn in Hin.
    + contradiction.
    + destruct d; cbn in *; try now apply IH.
      destruct Hin as [<-|Hin]; [exact (proj2 (proj2 (proj2 Hd)))|now apply IH].
  - intros an Hin. induction Hall as [|d rest Hd Hrest IH]; cbn in Hin.
    + contradiction.
    + destruct d; cbn in *; try now apply IH.
      destruct Hin as [<-|Hin]; [exact Hd|now apply IH].
  - intros qd Hin. induction Hall as [|d rest Hd Hrest IH]; cbn in Hin.
    + contradiction.
    + destruct d; cbn in *; try now apply IH.
      destruct Hin as [<-|Hin]; [exact Hd|now apply IH].
  - intros cd Hin. induction Hall as [|d rest Hd Hrest IH]; cbn in Hin.
    + contradiction.
    + destruct d; cbn in *; try now apply IH.
      destruct Hin as [<-|Hin]; [exact Hd|now apply IH].
Qed.

Lemma projected_premise_meaning : forall public internal,
  project_premise_statement public = Some internal ->
  Audit.statementMeaning point public -> interp_statement point internal.
Proof.
  destruct public; cbn; intros internal Hproject Hmeaning; try discriminate;
    injection Hproject as <-; cbn in *; try exact Hmeaning; try tauto.
  (* [con_tri]: the audited meaning supplies noncollinearity and the three
     corresponding sides, so SSS recovers the kernel's angle components. *)
  unfold Audit.TriangleCongruent, Audit.TriangleWellFormed, Audit.SegmentCongruent,
    Audit.side_ab, Audit.side_bc, Audit.side_ca, Audit.seg_start, Audit.seg_end in Hmeaning.
  cbn in Hmeaning.
  destruct Hmeaning as [[_ [_ [_ Hncol]]] [_ [Hab [Hbc Hca]]]].
  now apply ender_sss.
Qed.

Lemma projected_premises_meaning : forall publics internals premises,
  project_premise_statements publics = Some internals ->
  premise_statements premises = internals ->
  Forall (Audit.statementMeaning point) publics ->
  Forall (interp_premise point) premises.
Proof.
  intros publics. induction publics as [|s rest IH]; intros internals premises Hproject Heq Hall.
  - cbn in Hproject. injection Hproject as <-. destruct premises; cbn in Heq;
      [constructor|discriminate].
  - cbn in Hproject. destruct (project_premise_statement s) as [x|] eqn:Hs;
      try discriminate. destruct (project_premise_statements rest) as [xs|] eqn:Hrest;
      try discriminate. injection Hproject as <-.
    inversion Hall as [|? ? Hsmeaning Hrestmeaning]; subst.
    destruct premises as [|p ps]; cbn in Heq; try discriminate.
    injection Heq as Hhead Htail. constructor.
    + unfold interp_premise. rewrite Hhead.
      eapply projected_premise_meaning; eauto.
    + eapply IH; eauto.
Qed.

Lemma noncol_well_formed : forall A B C,
  ~ Col A B C -> A <> B /\ B <> C /\ C <> A /\ ~ Col A B C.
Proof.
  intros A B C H. pose proof (not_col_distincts A B C H) as Hd.
  destruct Hd as [Hn [Hab [Hbc Hac]]]. repeat split; auto; congruence.
Qed.

Lemma projected_goal_meaning : forall public internal decls,
  project_goal_statement public = Some internal ->
  interp_statement point internal ->
  declarations_well_formed point decls ->
  goal_declarations_valid public decls = true ->
  Audit.statementMeaning point public.
Proof.
  destruct public; cbn; intros internal decls Hproject Hmeaning Hwf Hdecl;
    try discriminate;
    injection Hproject as <-; cbn in *; try exact Hmeaning.
  apply andb_true_iff in Hdecl. destruct Hdecl as [Ha Hb].
  pose proof (triangle_declared_sound point _ _ Hwf Ha) as Hwa.
  pose proof (triangle_declared_sound point _ _ Hwf Hb) as Hwb.
  apply noncol_well_formed in Hwa. apply noncol_well_formed in Hwb.
  unfold triangle_congruence in Hmeaning. cbn in Hmeaning.
  destruct Hmeaning as [Hab [Hbc [Hca Hangles]]].
  unfold Audit.TriangleCongruent. cbn.
  exact (conj Hwa (conj Hwb (conj Hab (conj Hbc Hca)))).
Qed.

End Bridge.

Theorem complete_checker_problem_sound : forall source part public,
  problemPart source = Some part ->
  parsePublicProblem part = Some public ->
  complete_checker source = true ->
  forall `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality},
  forall (TE : @Tarski_euclidean Tn TnEQD),
  forall point : Audit.PointName -> Tpoint,
    Audit.problemClaim point public.
Proof.
  intros source part public Hpart Hpublic Hcheck Tn TnEQD TE point.
  unfold complete_checker, classify_source in Hcheck. rewrite Hpart, Hpublic in Hcheck.
  destruct (Parser.find_after (list_ascii_of_string "steps:")
              (list_ascii_of_string source)) as [stepText|] eqn:HstepText;
    try discriminate.
  destruct (parseProblemPart part) as [header|] eqn:Hheader; try discriminate.
  destruct (parse_step_lines (Parser.split_lines stepText []) []) as [steps|]
    eqn:Hsteps; try discriminate.
  unfold build_kernel_problem in Hcheck.
  destruct (project_premise_statements (Audit.public_premises public)) as [premises|]
    eqn:HprojectPremises; try discriminate.
  destruct (project_goal_statement (Audit.public_conclusion public)) as [goal|]
    eqn:HprojectGoal; try discriminate.
  destruct (declarations_eqb (projected_declarations (Audit.public_declarations public))
              (header_declarations header) &&
            statement_list_eqb premises (premise_statements (header_premises header)) &&
            statement_eqb goal (header_goal header) &&
            goal_declarations_valid (Audit.public_conclusion public)
              (header_declarations header)) eqn:Hmatches; try discriminate.
  apply andb_true_iff in Hmatches. destruct Hmatches as [Hrest HgoalDeclared].
  apply andb_true_iff in Hrest. destruct Hrest as [Hrest Hgoal].
  apply andb_true_iff in Hrest. destruct Hrest as [Htriangles Hpremises].
  apply declarations_eqb_eq in Htriangles.
  apply statement_list_eqb_eq in Hpremises.
  apply statement_eqb_eq in Hgoal.
  unfold Audit.problemClaim. intros Hdeclarations HpublicPremises.
  pose proof (projected_triangle_meaning point _ Hdeclarations) as Hwf.
  rewrite Htriangles in Hwf.
  assert (HkernelPremises :
      Forall (interp_premise point) (header_premises header)).
  { eapply projected_premises_meaning.
    - exact HprojectPremises.
    - symmetry. exact Hpremises.
    - exact HpublicPremises. }
  destruct (check_problem
    (problem (header_declarations header) (header_premises header) goal steps))
    eqn:HkernelCheck; try discriminate.
  pose proof (check_problem_sound point
    (problem (header_declarations header) (header_premises header) goal steps)
    HkernelCheck Hwf HkernelPremises) as HkernelGoal.
  eapply projected_goal_meaning; eauto.
Qed.

Module CompleteVerifiedChecker <: Audit.COMPLETE_VERIFIED_CHECKER.
  Definition parseProblem := parsePublicProblem.
  Definition parsePresentation := PresentationParser.parsePresentation.
  Definition check := check_report.
  Definition checker (source : string) : bool := Audit.accepted (check source).
  Definition parser_sound := parsePublicProblem_sound.
  Definition parser_complete := parsePublicProblem_complete.

  Theorem checker_sound : forall source,
    checker source = true ->
      forall part, problemPart source = Some part ->
      forall `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality},
      forall (T2D : @Tarski_2D Tn TnEQD),
      forall (TE : @Tarski_euclidean Tn TnEQD),
      exists problem, parseProblem part = Some problem /\
        forall point : Audit.PointName -> Tpoint, Audit.problemClaim point problem.
  Proof.
    intros source Hcheck part Hpart Tn TnEQD T2D TE.
    change (Audit.accepted (check_report source) = true) in Hcheck.
    rewrite check_report_accepted in Hcheck.
    unfold parseProblem.
    destruct (parsePublicProblem part) as [public|] eqn:Hpublic.
    - exists public. split; [reflexivity|].
      intros point. exact (@complete_checker_problem_sound source part public
        Hpart Hpublic Hcheck Tn TnEQD TE point).
    - exfalso. unfold checker, complete_checker, classify_source in Hcheck.
      rewrite Hpart, Hpublic in Hcheck. discriminate.
  Qed.
End CompleteVerifiedChecker.
