From Stdlib Require Import List String Bool Numbers.DecimalString.
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
  | Audit.Para a b => Some (Para (project_segment a) (project_segment b))
  | Audit.Parallelogram q => Some (Pgram (project_quadrilateral q))
  | Audit.Rectangle q => Some (Rect (project_quadrilateral q))
  | Audit.Rhombus q => Some (Rhomb (project_quadrilateral q))
  | Audit.IsosTrapezoid q => Some (IsosTrap (project_quadrilateral q))
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

Definition projected_declarations (ds : list Audit.PublicDeclaration) : Declarations :=
  declarations (projected_triangles ds) (projected_angles ds)
               (projected_quadrilaterals ds).

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

Definition declarations_eqb (a b : Declarations) : bool :=
  triangle_list_eqb a.(decl_triangles) b.(decl_triangles) &&
  angle_list_eqb a.(decl_angles) b.(decl_angles) &&
  quadrilateral_list_eqb a.(decl_quadrilaterals) b.(decl_quadrilaterals).

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
| ExpectedEquilateral | ExpectedEquiangular | ExpectedSupplementary.

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
  | Para _ _ => "para" | Pgram _ => "parallelogram"
  | Rect _ => "rectangle" | Rhomb _ => "rhombus"
  | IsosTrap _ => "isos_trapezoid" | TrapPremise _ _ _ => "trapezoid_premise"
  | IsosTrapPremise _ _ _ => "isos_trapezoid_premise"
  | KiteP _ _ _ => "kite_premise"
  | Transv _ _ _ _ _ _ _ _ => "transversal"
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
  end.

Definition allowed_functions (expected : ExpectedFact) : list string :=
  match expected with
  | ExpectedSegment => ["ref_seg"]
  | ExpectedAngle => ["ref_ang"; "con_right"]
  | ExpectedTriangle | ExpectedRight | ExpectedPerpendicular
  | ExpectedMidpoint | ExpectedAngleBisector | ExpectedConRight
  | ExpectedEquilateral | ExpectedEquiangular | ExpectedSupplementary => []
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

Definition check_report (source : string) : Audit.CheckReport :=
  let result := classify_source source in
  Audit.check_report (public_verdict result) (public_problem_of_source source)
    (PresentationParser.parsePresentation source)
    [] empty_graph [] (Audit.goal_report None [] [])
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

Lemma declarations_eqb_eq : forall a b, declarations_eqb a b = true <-> a = b.
Proof.
  intros [t1 a1 q1] [t2 a2 q2]. unfold declarations_eqb. cbn.
  rewrite !andb_true_iff, triangle_list_eqb_eq, angle_list_eqb_eq,
    quadrilateral_list_eqb_eq. split.
  - intros [[-> ->] ->]. reflexivity.
  - intros H. inversion H. auto.
Qed.

Section Bridge.
Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : Audit.PointName -> Tpoint.

Lemma projected_triangle_meaning : forall ds,
  Forall (Audit.declarationMeaning point) ds ->
  declarations_well_formed point (projected_declarations ds).
Proof.
  intros ds Hall. split; [|split].
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
      forall (TE : @Tarski_euclidean Tn TnEQD),
      exists problem, parseProblem part = Some problem /\
        forall point : Audit.PointName -> Tpoint, Audit.problemClaim point problem.
  Proof.
    intros source Hcheck part Hpart Tn TnEQD TE.
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
