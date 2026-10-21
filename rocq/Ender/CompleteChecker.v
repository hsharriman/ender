From Stdlib Require Import Ascii List String Bool Numbers.DecimalString.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Audit Ender.PublicParser Ender.Syntax Ender.Geometry
  Ender.Semantics Ender.Checker Ender.Parser Ender.PresentationParser.
(** Required but deliberately not imported: [Model.v] is written in MathComp,
    whose [ssreflect] replaces the [rewrite] this file's proofs use.  Loading
    it without importing keeps its plane reachable by qualified name and its
    notations and tactics out of the way. *)
Require Ender.Model.
Import ListNotations.
Import EnderSyntax.
Open Scope string_scope.

(** The kernel reads a problem's declarations into its bundle, by kind. *)
Definition projected_triangles (ds : list Audit.PublicDeclaration) : list TriangleName :=
  fold_right (fun d rest => match d with
    | Audit.TriangleDeclaration t => t :: rest
    | _ => rest
    end) [] ds.

Definition projected_angles (ds : list Audit.PublicDeclaration) : list AngleName :=
  fold_right (fun d rest => match d with
    | Audit.AngleDeclaration a => a :: rest
    | _ => rest
    end) [] ds.

Definition projected_quadrilaterals (ds : list Audit.PublicDeclaration)
    : list QuadrilateralName :=
  fold_right (fun d rest => match d with
    | Audit.QuadrilateralDeclaration q => q :: rest
    | _ => rest
    end) [] ds.

Definition projected_circles (ds : list Audit.PublicDeclaration)
    : list CircleName :=
  fold_right (fun d rest => match d with
    | Audit.CircleDeclaration c => c :: rest
    | _ => rest
    end) [] ds.

Definition projected_segments (ds : list Audit.PublicDeclaration) : list SegmentName :=
  fold_right (fun d rest => match d with
    | Audit.SegmentDeclaration s => s :: rest
    | _ => rest
    end) [] ds.

Definition projected_declarations (ds : list Audit.PublicDeclaration) : Declarations :=
  declarations (projected_triangles ds) (projected_angles ds)
               (projected_quadrilaterals ds) (projected_circles ds)
               (projected_segments ds).

Fixpoint statement_list_eqb (a b : list Statement) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => statement_eqb x y && statement_list_eqb xs ys
  | _, _ => false
  end.

Fixpoint triangle_list_eqb (a b : list TriangleName) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => triangle_eqb x y && triangle_list_eqb xs ys
  | _, _ => false
  end.

Fixpoint angle_list_eqb (a b : list AngleName) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => angle_eqb x y && angle_list_eqb xs ys
  | _, _ => false
  end.

Fixpoint quadrilateral_list_eqb (a b : list QuadrilateralName) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => quadrilateral_eqb x y && quadrilateral_list_eqb xs ys
  | _, _ => false
  end.

Fixpoint circle_list_eqb (a b : list CircleName) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => circle_eqb x y && circle_list_eqb xs ys
  | _, _ => false
  end.

Fixpoint segment_list_eqb (a b : list SegmentName) : bool :=
  match a, b with
  | [], [] => true
  | x :: xs, y :: ys => segment_eqb x y && segment_list_eqb xs ys
  | _, _ => false
  end.

Definition declarations_eqb (a b : Declarations) : bool :=
  triangle_list_eqb a.(decl_triangles) b.(decl_triangles) &&
  angle_list_eqb a.(decl_angles) b.(decl_angles) &&
  quadrilateral_list_eqb a.(decl_quadrilaterals) b.(decl_quadrilaterals) &&
  circle_list_eqb a.(decl_circles) b.(decl_circles) &&
  segment_list_eqb a.(decl_segments) b.(decl_segments).

Definition premise_statements (ps : list Premise) : list Statement :=
  map premise_statement ps.

(** The kernel checks the audited problem itself.  The header pass supplies
    what the audited problem does not carry -- the labels steps cite premises
    by -- and must agree with the audited parse on everything else. *)
Definition build_kernel_problem (public : Audit.PublicProblem)
    (header : ProblemHeader) (steps : list Step) : option Problem :=
  if declarations_eqb (projected_declarations public.(Audit.public_declarations))
                      header.(header_declarations) &&
     statement_list_eqb public.(Audit.public_premises)
                        (premise_statements header.(header_premises)) &&
     statement_eqb public.(Audit.public_conclusion) header.(header_goal)
  then Some (problem header.(header_declarations) header.(header_premises)
                     public.(Audit.public_conclusion) steps)
  else None.

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
  | ConTri _ _ => "con_tri" | ConTriOrdered _ _ => "con_tri_ordered"
  | SimTri _ _ => "sim_tri"
  | RefSeg _ _ => "ref_seg"
  | RefAng _ _ => "ref_ang" | Right _ => "right"
  | ConRight _ _ => "con_right" | Perp _ _ _ => "perp"
  | Midpt _ _ => "midpt" | IntersectSeg _ _ _ => "intersect_seg"
  | AngBisect _ _ => "ang_bisect" | SegBisect _ _ _ => "seg_bisect"
  | OnLine _ _ => "on_line"
  | Isosceles _ => "isosceles" | Equilateral _ => "equilateral"
  | Equiangular _ => "equiangular" | Supplementary _ _ => "supplementary"
  | Complementary _ _ => "complementary"
  | LinearPair _ _ => "linear_pair"
  | Para _ _ => "para" | Parallelogram _ => "parallelogram"
  | Rectangle _ => "rectangle" | Rhombus _ => "rhombus"
  | IsosTrapezoid _ => "isos_trapezoid" | TrapezoidPremise _ _ _ => "trapezoid_premise"
  | IsosTrapezoidPremise _ _ _ => "isos_trapezoid_premise"
  | KitePremise _ _ _ => "kite_premise"
  | Transversal _ _ _ _ _ _ _ _ => "transversal"
  | Radius _ _ => "radius" | Chord _ _ => "chord"
  | Diameter _ _ => "diameter" | Tangent _ _ _ => "tangent"
  | InscribedAngle _ _ => "inscribed_angle"
  | OnCirclePoint _ _ => "on_circle" | CenterOnLine _ _ => "center_on_line"
  | MinorInscribedAngle _ _ => "minor_inscribed_ang"
  | MajorInscribedAngle _ _ => "major_inscribed_ang"
  | ArcStatement _ => "arc" | ConArc _ _ => "con_arc"
  | Proportion _ _ _ _ => "proportion" | Circumcenter _ _ => "circumcenter"
  | Incenter _ _ => "incenter" | PerpBisector _ _ _ => "perp_bisector"
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
  | ExpectedTriangle, ConTri _ _ | ExpectedTriangle, ConTriOrdered _ _
  | ExpectedRight, Right _
  | ExpectedPerpendicular, Perp _ _ _ | ExpectedMidpoint, Midpt _ _
  | ExpectedAngleBisector, AngBisect _ _ | ExpectedConRight, ConRight _ _
  | ExpectedEquilateral, Equilateral _
  | ExpectedEquiangular, Equiangular _
  | ExpectedSupplementary, Supplementary _ _ => true
  | ExpectedComplementary, Complementary _ _ => true
  | ExpectedLinearPair, LinearPair _ _ => true
  | ExpectedRhombus, Rhombus _ => true
  | ExpectedRectangle, Rectangle _ => true
  | ExpectedParallelogram, Parallelogram _ => true
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
  | LinearPairConv i =>
      dependency_type_issue facts "linear_pair_conv" 0 i ExpectedSupplementary
        step_number
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
  | PgramOppSidesConv i j =>
      first_issue
        (dependency_type_issue facts "pgram_opp_sides_conv" 0 i ExpectedSegment
           step_number)
        (dependency_type_issue facts "pgram_opp_sides_conv" 1 j ExpectedSegment
           step_number)
  | PgramConsecAngsConv i j =>
      first_issue
        (dependency_type_issue facts "pgram_consec_angs_conv" 0 i
           ExpectedSupplementary step_number)
        (dependency_type_issue facts "pgram_consec_angs_conv" 1 j
           ExpectedSupplementary step_number)
  | RectPgramAng i j =>
      first_issue
        (dependency_type_issue facts "rect_pgram_ang" 0 i ExpectedRight
           step_number)
        (dependency_type_issue facts "rect_pgram_ang" 1 j ExpectedParallelogram
           step_number)
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

(** * Advisory report content

    Nothing below is trusted.  [accepted] reads the verdict alone, so these
    fields cannot make a rejected proof look accepted; they exist so the
    interface can say which step failed, what fed it, and what was never
    used.  They are written to be honest about their own limits: a step after
    the first failure is reported [StepBlocked] rather than judged, because
    its dependency was never established. *)


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
  | PgramOppSidesConv _ _ => "pgram_opp_sides_conv"
  | PgramConsecAngsConv _ _ => "pgram_consec_angs_conv"
  | KiteOppConAng _ => "kite_opp_con_ang"
  | RectPgramAng _ _ => "rect_pgram_ang"
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
  | TangentPerpConv _ _ => "tangent_perp_conv"
  | ConTangentsExt _ _ => "con_tangents_ext"
  | RadiusChordBisect _ _ _ => "radius_chord_bisect"
  | PerpBisect _ _ => "perp_bisector"
  | IsosTrapConDiags _ _ => "isos_trap_con_diags"
  | IsosTrapBaseAngs _ _ => "isos_trap_base_angs"
  | IsosTrapBaseAngsConv _ => "isos_trap_base_angs_conv"
  | PgramDiagBisectConv _ _ => "pgram_diag_bisect_conv"
  | PgramOppAngsConv _ _ => "pgram_opp_angs_conv"
  | RectDiagConConv _ _ => "rect_diag_con_conv"
  | RhombusDiagPerpConv _ _ => "rhombus_diag_perp_conv"
  | RhombusOppBisectConv _ _ _ => "rhombus_opp_bisect_conv"
  | AASim _ _ => "aa_sim"
  | LinearPairConv _ => "linear_pair_conv"
  | PgramDiagBisect _ => "pgram_diag_bisect"
  | RhombusDiagPerp _ => "rhombus_diag_perp"
  | KiteDiagPerp _ => "kite_diag_perp"
  | ChordBisectConv _ _ => "chord_bisect_conv"
  | DefRadiusConv _ => "def_radius_conv"
  | ConInscribedAngs _ _ => "con_inscribed_angs"
  | SupplementaryInscribedAngs _ _ => "supplementary_inscribed_angs"
  end.

(** The step numbers a reason cites.  [given] and [vert_ang] cite a premise
    label rather than a step, and [reflex] cites nothing. *)
Definition reason_dependencies (r : Reason) : list nat :=
  match r with
  | Given _ | Reflex | VertAng _ => []
  | CPCTC i | PerpConAng i | DefMidpt i | DefAngBisect i | AngBisectConv i
  | MidptConv i | DefIsosceles i | BaseAngle i | BaseAngleConv i
  | EquilatEquiang i | EquiangEquilat i | DefLinearPair i | DefPerp i
  | PgramOppSides i | PgramOppAngles i | PgramConsecAngs i | KiteOppConAng i
  | RectanglePgram i
  | RhombusPgram i | RhombusDef i | RhombusOppBisect i | RectDiagCon i
  | RectangleDef i | AltInt i | AltExt i | CorrespAng i | SamesideAng i
  | AltIntConv i | AltExtConv i | CorrespAngConv i | SamesideAngConv i
  | DefRadius i | InscribedSemi i | ConChordsArcs i
  | IsosTrapBaseAngsConv i | LinearPairConv i
  | PgramDiagBisect i | RhombusDiagPerp i | KiteDiagPerp i
  | DefRadiusConv i => [i]
  | PgramOppSidesConv i j | PgramConsecAngsConv i j | RectPgramAng i j
  | ConSegTrans i j | ConAngTrans i j | ConTriTrans i j | DefConRight i j
  | ThirdAngle i j | ConSupplementsSame i j | ConComplementsSame i j
  | DefParallelogram i j | PgramOppSidePara i j | RhombusConsecSides i j
  | ParaTrans i j | TangentPerp i j | TangentPerpConv i j
  | ConTangentsExt i j | PerpBisect i j | IsosTrapConDiags i j
  | PgramDiagBisectConv i j | PgramOppAngsConv i j | IsosTrapBaseAngs i j
  | RectDiagConConv i j | RhombusDiagPerpConv i j
  | AASim i j | ChordBisectConv i j | ConInscribedAngs i j
  | SupplementaryInscribedAngs i j => [i; j]
  | SAS i j k | SSS i j k | ASA i j k | AAS i j k | RHL i j k
  | DefEquilateral i j k | DefEquiangular i j k | ConSupplements i j k
  | RadiusChordBisect i j k | RhombusOppBisectConv i j k
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

(** A step line, kept whether or not it parses: the verdict needs every step
    to parse, but a report should still say which line failed and judge the
    rest. *)
Record ReportStep := report_step {
  rs_source : string;
  rs_label : option nat;
  rs_step : option Step;
  rs_line : list ascii
}.

Definition step_label (compact : list ascii) : option nat :=
  match compact with
  | "["%char :: rest =>
      match Parser.take_before ["]"%char] rest with
      | Some label => Parser.parse_nat label
      | None => None
      end
  | _ => None
  end.

Fixpoint report_step_lines (lines : list (list ascii)) : list ReportStep :=
  match lines with
  | [] => []
  | line :: rest =>
      let compact := Parser.remove_space (Parser.take_until "/"%char line) in
      if Parser.starts_with ["["%char] compact then
        report_step (string_of_list_ascii line) (step_label compact)
          (Parser.parse_step line) line :: report_step_lines rest
      else report_step_lines rest
  end.

(** A line that does not parse states nothing.  It still occupies its place,
    so later citations keep pointing where the writer meant; the placeholder
    names no real point, so no rule can use it. *)
Definition placeholder_fact : Statement :=
  ConSeg (segment_name "?"%char "?"%char) (segment_name "?"%char "?"%char).

Definition fact_of (s : option Step) : Statement :=
  match s with Some st => st.(step_conclusion) | None => placeholder_fact end.

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
    (facts : list Statement) (steps : list (option Step)) (number : nat)
    (statuses : list (nat * Audit.StepStatus))
    : list (nat * Audit.StepStatus) :=
  match steps with
  | [] => statuses
  | None :: rest =>
      step_statuses decls premises (List.app facts [placeholder_fact])
        rest (S number) (List.app statuses [(number, Audit.StepRejected)])
  | Some current :: rest =>
      (* Blocking comes first: a rule may need its cited step's facts to
         judge the step at all, as [cpctc] does for an unordered [con_tri]. *)
      let status :=
        if dependency_blocked statuses
             (reason_dependencies current.(step_reason))
        then Audit.StepBlocked
        else if negb (rule_valid decls premises facts current.(step_reason)
                        current.(step_conclusion))
        then Audit.StepRejected
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

Definition step_unparsed_diagnostic : Audit.Diagnostic :=
  Audit.diagnostic Audit.ProofParsing Audit.DiagnosticError Audit.MalformedProof
    "this step could not be read".

Fixpoint step_reports (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (statuses : list (nat * Audit.StepStatus))
    (steps : list ReportStep) (number : nat) : list Audit.StepReport :=
  match steps with
  | [] => []
  | rs :: rest =>
      let status := status_of statuses number in
      match rs.(rs_step) with
      | Some current =>
          Audit.step_report number rs.(rs_source)
            (Some (reason_name current.(step_reason)))
            (Some current.(step_conclusion)) status
            (reason_dependencies current.(step_reason))
            (rule_diagram_premises decls premises facts
               current.(step_reason) current.(step_conclusion))
            (match status with
             | Audit.StepRejected => [step_failure_diagnostic]
             | Audit.StepBlocked => [step_blocked_diagnostic]
             | Audit.StepAccepted => []
             end)
      | None =>
          Audit.step_report number rs.(rs_source) None None status [] []
            [step_unparsed_diagnostic]
      end
      :: step_reports decls premises
           (List.app facts [fact_of rs.(rs_step)]) statuses rest (S number)
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
           [Audit.duplicate_derivation s first origin]
       end) ++ duplicate_scan (seen ++ [(origin, s)]) rest
  end.

Fixpoint numbered_step_facts (steps : list (option Step)) (number : nat)
    : list (Audit.FactOrigin * Reason * Statement) :=
  match steps with
  | [] => []
  | Some current :: rest =>
      (Audit.StepOrigin number, current.(step_reason), current.(step_conclusion))
      :: numbered_step_facts rest (S number)
  | None :: rest => numbered_step_facts rest (S number)
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
Fixpoint goal_stated_by (goal : Statement) (steps : list (option Step))
    (number : nat) (statuses : list (nat * Audit.StepStatus))
    (require_accepted : bool) : option nat :=
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
      match current with
      | Some st =>
          if usable && fact_eqb goal st.(step_conclusion) then Some number
          else goal_stated_by goal rest (S number) statuses require_accepted
      | None => goal_stated_by goal rest (S number) statuses require_accepted
      end
  end.

Definition goal_missing_diagnostic : Audit.Diagnostic :=
  Audit.diagnostic Audit.ProofChecking Audit.DiagnosticError Audit.GoalNotProved
    "no step states the goal".

(** Naming the step keeps which step states the goal, whether or not it holds,
    recoverable from a report whose [goal_proved_by] deliberately omits it. *)
Definition goal_unproved_diagnostic (number : nat) : Audit.Diagnostic :=
  Audit.diagnostic Audit.ProofChecking Audit.DiagnosticError Audit.GoalNotProved
    ("step " ++ nat_text number ++ " states the goal but was not accepted").

Definition goal_report_for (goal : Statement) (steps : list (option Step))
    (statuses : list (nat * Audit.StepStatus)) : Audit.GoalReport :=
  match goal_stated_by goal steps 1 statuses true with
  | Some n => Audit.goal_report (Some n) []
  | None =>
      match goal_stated_by goal steps 1 statuses false with
      | Some n => Audit.goal_report None [goal_unproved_diagnostic n]
      | None => Audit.goal_report None [goal_missing_diagnostic]
      end
  end.

(** Everything a report is computed from, once the header has been read. *)
Record ReportData := report_data {
  rd_declarations : Declarations;
  rd_premises : list Premise;
  rd_goal : Statement;
  rd_steps : list ReportStep;
  rd_statuses : list (nat * Audit.StepStatus)
}.

Definition report_data_of (source : string) : option ReportData :=
  let text := list_ascii_of_string source in
  match problemPart source with
  | Some part =>
      match parsePublicProblem part,
            Parser.find_after (list_ascii_of_string "steps:") text,
            parseProblemPart part with
      | Some public, Some stepText, Some header =>
          match build_kernel_problem public header [] with
          | Some p =>
              let steps := report_step_lines (Parser.split_lines stepText []) in
              (* the declarations [check_problem] reads, so the report judges
                 each step as the verdict does *)
              let decls := kernel_declarations p.(problem_declarations)
                             p.(problem_premises) in
              Some (report_data decls p.(problem_premises)
                      p.(problem_goal) steps
                      (step_statuses decls
                         p.(problem_premises) [] (map rs_step steps) 1 []))
          | None => None
          end
      | _, _, _ => None
      end
  | None => None
  end.

Definition report_content (source : string)
    : list Audit.StepReport * Audit.DependencyGraph *
      list Audit.DuplicateDerivation * Audit.GoalReport :=
  match report_data_of source with
  | Some d =>
      let steps := map rs_step d.(rd_steps) in
      let reports :=
        step_reports d.(rd_declarations) d.(rd_premises) [] d.(rd_statuses)
          d.(rd_steps) 1 in
      let stated := goal_stated_by d.(rd_goal) steps 1 d.(rd_statuses) false in
      (reports, step_graph reports stated,
       duplicate_scan (premise_facts d.(rd_premises)) (numbered_step_facts steps 1),
       goal_report_for d.(rd_goal) steps d.(rd_statuses))
  | None => ([], empty_graph, [], Audit.goal_report None [])
  end.

(** * Issues

    What the interface and the feedback prompts read: one issue per step that
    did not hold, saying why as specifically as the checker can, in the codes
    of [src/checker/ERROR_CODES.md].  Advisory, like the rest of the report:
    the verdict never reads them. *)
Definition step_field (number : nat) : string * Audit.JsonValue :=
  ("steps", Audit.JsonArray [Audit.JsonString (nat_text number)]).
Definition string_field (key value : string) : string * Audit.JsonValue :=
  (key, Audit.JsonString value).
Definition quoted (text : string) : string := "`" ++ text ++ "`".

(** The arguments each statement takes, for a statement written wrongly. *)
Definition statement_signatures : list (string * list string) :=
  let seg := "segment" in let pt := "point" in let ang := "angle" in
  let tri := "triangle" in let quad := "quadrilateral" in let circ := "circle" in
  [("on_line", [seg; pt]);
   ("transversal", [pt; pt; pt; pt; pt; pt; pt; pt]);
   ("intersect_seg", [seg; seg; pt]);
   ("trapezoid_premise", [quad; seg; seg]);
   ("kite_premise", [quad; ang; ang]);
   ("isos_trapezoid_premise", [quad; seg; seg]);
   ("right", [ang]);
   ("con_seg", [seg; seg]);
   ("con_ang", [ang; ang]);
   ("con_tri", [tri; tri]);
   ("con_tri_ordered", [tri; tri]);
   ("con_right", [ang; ang]);
   ("para", [seg; seg]);
   ("isosceles", [tri]);
   ("perp", [seg; seg; pt]);
   ("midpt", [seg; pt]);
   ("ang_bisect", [ang; seg]);
   ("rectangle", [quad]);
   ("parallelogram", [quad]);
   ("proportion", [seg; seg; seg; seg]);
   ("sim_tri", [tri; tri]);
   ("equilateral", [tri]);
   ("supplementary", [ang; ang]);
   ("complementary", [ang; ang]);
   ("linear_pair", [ang; ang]);
   ("equiangular", [tri]);
   ("circumcenter", [pt; tri]);
   ("incenter", [pt; tri]);
   ("perp_bisector", [seg; seg; pt]);
   ("seg_bisect", [seg; seg; pt]);
   ("isos_trapezoid", [quad]);
   ("rhombus", [quad]);
   ("tangent", [circ; seg; pt]);
   ("chord", [circ; seg]);
   ("minor_arc", [circ; pt; pt]);
   ("major_arc", [circ; pt; pt]);
   ("radius", [circ; pt]);
   ("diameter", [circ; seg]);
   ("inscribed_angle", [circ; ang]);
   ("minor_inscribed_ang", [circ; ang]);
   ("major_inscribed_ang", [circ; ang]);
   ("on_circle", [circ; pt]);
   ("center_on_line", [circ; seg]);
   ("ref_seg", [seg; seg]);
   ("ref_ang", [ang; ang]);
   ("con_arc", ["arc"; "arc"])].

Definition lookup_text {A : Type} (key : string) (table : list (string * A))
    : option A :=
  match find (fun entry => String.eqb (fst entry) key) table with
  | Some (_, value) => Some value
  | None => None
  end.

(** Split [text], which follows an opening parenthesis, at the parenthesis
    that closes it. *)
Fixpoint split_close (depth : nat) (inside text : list ascii) : option (list ascii * list ascii) :=
  match text with
  | [] => None
  | c :: rest =>
      if Ascii.eqb c "("%char then split_close (S depth) (inside ++ [c]) rest
      else if Ascii.eqb c ")"%char then
        match depth with
        | O => Some (inside, rest)
        | S d => split_close d (inside ++ [c]) rest
        end
      else split_close depth (inside ++ [c]) rest
  end.

(** Why a statement's text did not read as a statement. *)
Definition statement_issue (context : list (string * Audit.JsonValue))
    (raw : string) : Audit.Issue :=
  let text := Audit.normalized raw in
  let t := list_ascii_of_string text in
  let name := string_of_list_ascii (Parser.take_until "("%char t) in
  let unreadable code extra :=
    Audit.issue 3 code
      (Audit.JsonObject (List.app context (string_field "text" text :: extra))) in
  match t with
  | [] => Audit.issue 3 "empty_statement" (Audit.JsonObject context)
  | _ =>
  match Parser.find_after ["("%char] t with
  | None => unreadable "malformed_statement" []
  | Some after =>
      match split_close 0 [] after with
      | None => unreadable "unclosed_parenthesis" []
      | Some (args, trailing) =>
          match trailing with
          | _ :: _ =>
              unreadable "trailing_text"
                [string_field "trailing" (string_of_list_ascii trailing)]
          | [] =>
              match lookup_text name statement_signatures with
              | None =>
                  Audit.issue 3 "unknown_function" (Audit.JsonObject (context ++
                    [string_field "token" name]))
              | Some parameters =>
                  Audit.issue 11 "stmt_arg_type_invalid" (Audit.JsonObject (context ++
                    [string_field "statement" name;
                     ("parameters", Audit.JsonArray (json_strings parameters));
                     string_field "text" text]))
              end
          end
      end
  end
  end.

(** How many dependencies each reason cites. *)
Definition reason_arities : list (string * (nat * nat)) :=
  [("given", (1, 1)); ("reflex", (0, 0));
   ("sas", (3, 3)); ("sss", (3, 3)); ("asa", (3, 3)); ("aas", (3, 3));
   ("rhl", (3, 3)); ("cpctc", (1, 1));
   ("con_seg_transitive", (2, 2)); ("con_ang_transitive", (2, 2));
   ("con_tri_transitive", (2, 2)); ("def_con_right", (2, 2));
   ("perp_con_ang", (1, 1)); ("def_midpt", (1, 1)); ("vert_ang", (0, 1));
   ("def_ang_bisect", (1, 1)); ("ang_bisect_conv", (1, 1));
   ("midpt_conv", (1, 1)); ("third_angle", (2, 2)); ("def_con_tri", (6, 6));
   ("def_isosceles", (1, 1)); ("base_angle", (1, 1)); ("base_angle_conv", (1, 1));
   ("def_equilateral", (3, 3)); ("def_equiangular", (3, 3));
   ("equilat_equiang", (1, 1)); ("equiang_equilat", (1, 1)); ("def_perp", (1, 1));
   ("con_supplements_same", (2, 2)); ("con_supplements", (3, 3));
   ("con_complements_same", (2, 2)); ("con_complements", (3, 3));
   ("def_linear_pair", (1, 1)); ("def_parallelogram", (2, 2));
   ("pgram_opp_sides", (1, 1)); ("pgram_opp_angs", (1, 1));
   ("kite_opp_con_ang", (1, 1)); ("pgram_consec_angs_conv", (2, 2));
   ("pgram_consec_angs", (1, 1)); ("pgram_opp_sides_conv", (2, 2));
   ("rect_pgram_ang", (2, 2)); ("pgram_opp_side_para", (2, 2));
   ("rectangle_pgram", (1, 1)); ("rhombus_pgram", (1, 1));
   ("rhombus_consec_sides", (2, 2)); ("rhombus_opp_bisect", (1, 1));
   ("rect_diag_con", (1, 1)); ("rhombus", (1, 1)); ("rectangle", (1, 1));
   ("altint_conv", (1, 2)); ("altint", (1, 2)); ("altext_conv", (1, 2));
   ("altext", (1, 2)); ("corresp_ang_conv", (1, 2)); ("corresp_ang", (1, 2));
   ("sameside_ang_conv", (1, 2)); ("sameside_ang", (1, 2));
   ("para_transitive", (2, 2)); ("def_radius", (1, 1));
   ("inscribed_semi", (1, 1)); ("con_chords_intersect_arcs", (1, 1));
   ("tangent_perp_conv", (2, 2)); ("tangent_perp", (2, 2));
   ("con_tangents_ext", (2, 2)); ("radius_chord_bisect", (3, 3));
   ("perp_bisector", (2, 2)); ("isos_trap_con_diags", (2, 2));
   ("isos_trap_base_angs_conv", (1, 1)); ("isos_trap_base_angs", (2, 2));
   ("pgram_diag_bisect_conv", (2, 2)); ("pgram_opp_angs_conv", (2, 2));
   ("rect_diag_con_conv", (2, 2)); ("rhombus_diag_perp_conv", (2, 2));
   ("rhombus_opp_bisect_conv", (3, 3)); ("aa_sim", (2, 2));
   ("linear_pair_conv", (1, 2)); ("pgram_diag_bisect", (1, 2));
   ("rhombus_diag_perp", (1, 2)); ("kite_diag_perp", (1, 2));
   ("chord_bisect_conv", (2, 2)); ("def_radius_conv", (1, 2));
   ("con_inscribed_angs", (2, 2)); ("supplementary_inscribed_angs", (2, 2))].

Definition premise_label_text (arg : list ascii) : bool :=
  match arg with
  | "g"%char :: "_"%char :: _ => true
  | _ => false
  end.

(** Why a reason's text did not read as one of the reasons the kernel has. *)
Definition reason_issue (number : nat) (raw : list ascii) : Audit.Issue :=
  let t := Parser.remove_space (Parser.take_until "/"%char raw) in
  let name := string_of_list_ascii (Parser.take_until "("%char t) in
  let body :=
    match Parser.find_after ["("%char] t with
    | Some after =>
        match split_close 0 [] after with
        | Some (inside, _) => inside
        | None => after
        end
    | None => []
    end in
  let args := match body with [] => [] | _ => Parser.split_on ","%char body [] end in
  let count := List.length args in
  let base := [step_field number; string_field "reason" name] in
  match lookup_text name reason_arities with
  | None =>
      Audit.issue 3 "unknown_function" (Audit.JsonObject (base ++
        [string_field "token" name]))
  | Some (low, high) =>
      match find premise_label_text args with
      | Some label =>
          if String.eqb name "given" then
            Audit.issue 3 "unreadable_given_citation" (Audit.JsonObject (base ++
              [string_field "text" (string_of_list_ascii t)]))
          else
            Audit.issue 13 "invalid_given_dep" (Audit.JsonObject (base ++
              [string_field "ref" (string_of_list_ascii label)]))
      | None =>
          if negb (Nat.leb low count && Nat.leb count high) then
            Audit.issue 9 "reason_dep_missing" (Audit.JsonObject (base ++
              [("expectedLength", Audit.JsonNumber low);
               ("receivedLength", Audit.JsonNumber count)]))
          else
            Audit.issue 3 "unreadable_dependencies" (Audit.JsonObject (base ++
              [string_field "text" (string_of_list_ascii t)]))
      end
  end.

(** Why a step line did not parse.  Spaces and a trailing [//] comment do not
    count, so [[01]  // todo] is an empty step. *)
Definition step_parse_issue (number : nat) (line : list ascii) : Audit.Issue :=
  let compact := Parser.remove_space (Parser.take_until "/"%char line) in
  let issue code := Audit.issue 3 code (Audit.JsonObject [step_field number]) in
  match compact with
  | "["%char :: rest =>
      match Parser.find_after ["]"%char] rest with
      | None => issue "unclosed_step_number"
      | Some [] => issue "empty_step"
      | Some after =>
          match Parser.split_arrow after with
          | None => issue "missing_arrow"
          | Some ([], []) => issue "empty_step"
          | Some ([], _) => issue "empty_reason"
          | Some (reason_text, statement_text) =>
              match Parser.parse_reason_chars reason_text with
              | None => reason_issue number reason_text
              | Some _ =>
                  statement_issue [step_field number]
                    (string_of_list_ascii statement_text)
              end
          end
      end
  | _ => issue "missing_step_number"
  end.

(** The statements each reason can conclude. *)
Definition reason_conclusions (r : Reason) : option (list string) :=
  match r with
  | Given _ => None
  | Reflex => Some ["ref_seg"; "ref_ang"]
  | SAS _ _ _ | SSS _ _ _ | ASA _ _ _ | AAS _ _ _ | RHL _ _ _
  | DefConTri _ _ _ _ _ _ | ConTriTrans _ _ => Some ["con_tri"; "con_tri_ordered"]
  | CPCTC _ => Some ["con_seg"; "con_ang"]
  | ConSegTrans _ _ | DefMidpt _ | BaseAngleConv _ | PgramOppSides _
  | RectDiagCon _ | RhombusDef _ | PerpBisect _ _ | ConTangentsExt _ _
  | ConChordsArcs _ | DefRadius _ => Some ["con_seg"]
  | ConAngTrans _ _ | VertAng _ | AltInt _ | AltExt _ | CorrespAng _
  | DefAngBisect _ | ConSupplements _ _ _ | ConSupplementsSame _ _
  | ConComplements _ _ _ | ConComplementsSame _ _ | ThirdAngle _ _
  | BaseAngle _ | PgramOppAngles _ | KiteOppConAng _
  | IsosTrapBaseAngsConv _ => Some ["con_ang"]
  | DefConRight _ _ | PerpConAng _ => Some ["con_ang"; "con_right"]
  | RectangleDef _ => Some ["con_right"; "con_ang"; "con_seg"]
  | DefPerp _ | TangentPerp _ _ => Some ["perp"]
  | MidptConv _ => Some ["midpt"]
  | AngBisectConv _ | RhombusOppBisect _ => Some ["ang_bisect"]
  | AltIntConv _ | AltExtConv _ | CorrespAngConv _ | SamesideAngConv _
  | ParaTrans _ _ => Some ["para"]
  | SamesideAng _ | DefLinearPair _ | PgramConsecAngs _ => Some ["supplementary"]
  | DefIsosceles _ => Some ["isosceles"]
  | DefEquilateral _ _ _ | EquiangEquilat _ => Some ["equilateral"]
  | DefEquiangular _ _ _ | EquilatEquiang _ => Some ["equiangular"]
  | DefParallelogram _ _ | PgramOppSidesConv _ _ | PgramOppAngsConv _ _
  | PgramOppSidePara _ _ | PgramConsecAngsConv _ _ | PgramDiagBisectConv _ _
  | RectanglePgram _ | RhombusPgram _ => Some ["parallelogram"]
  | RectDiagConConv _ _ | RectPgramAng _ _ => Some ["rectangle"]
  | RhombusDiagPerpConv _ _ | RhombusOppBisectConv _ _ _
  | RhombusConsecSides _ _ => Some ["rhombus"]
  | IsosTrapBaseAngs _ _ | IsosTrapConDiags _ _ => Some ["isos_trapezoid"]
  | TangentPerpConv _ _ => Some ["tangent"]
  | RadiusChordBisect _ _ _ => Some ["seg_bisect"]
  | InscribedSemi _ => Some ["right"]
  | AASim _ _ => Some ["sim_tri"]
  | LinearPairConv _ => Some ["linear_pair"]
  | PgramDiagBisect _ => Some ["seg_bisect"]
  | RhombusDiagPerp _ | KiteDiagPerp _ => Some ["perp"]
  | ChordBisectConv _ _ => Some ["center_on_line"]
  | DefRadiusConv _ => Some ["radius"]
  | ConInscribedAngs _ _ => Some ["con_ang"]
  | SupplementaryInscribedAngs _ _ => Some ["supplementary"]
  end.

(** A statement naming one object twice where it means two. *)
Definition duplicate_argument (s : Statement) : option string :=
  match s with
  | ConSeg a b | Para a b | Perp a b _ =>
      if segment_u_eqb a b then Some (Audit.segmentText a) else None
  | ConAng a b | ConRight a b | Supplementary a b | Complementary a b
  | LinearPair a b =>
      if angle_u_eqb a b then Some (Audit.angleText a) else None
  | ConTri a b | ConTriOrdered a b | SimTri a b =>
      if triangle_eqb a b then Some (Audit.triangleText a) else None
  | _ => None
  end.

Definition json_numbers (xs : list nat) : Audit.JsonValue :=
  Audit.JsonArray (map (fun n => Audit.JsonString (nat_text n)) xs).

(** The statement each remaining rule reads from each dependency, for the
    rules whose dependency types [reason_dependency_issue] does not cover. *)
Definition dependency_kinds (r : Reason) : list (nat * string) :=
  match r with
  | PgramOppSides i | PgramOppAngles i | PgramDiagBisect i =>
      [(i, "parallelogram")]
  | KiteOppConAng i | KiteDiagPerp i => [(i, "kite_premise")]
  | RhombusDiagPerp i => [(i, "rhombus")]
  | RectanglePgram i => [(i, "rectangle")]
  | RhombusPgram i => [(i, "rhombus")]
  | AltInt i | AltExt i | CorrespAng i | SamesideAng i => [(i, "para")]
  | AltIntConv i | AltExtConv i | CorrespAngConv i => [(i, "con_ang")]
  | SamesideAngConv i => [(i, "supplementary")]
  | DefRadius i => [(i, "radius")]
  | InscribedSemi i => [(i, "diameter")]
  | ConChordsArcs i => [(i, "con_arc")]
  | IsosTrapBaseAngsConv i => [(i, "isos_trapezoid_premise")]
  | DefParallelogram i j | ParaTrans i j => [(i, "para"); (j, "para")]
  | PgramOppSidePara i j => [(i, "con_seg"); (j, "para")]
  | RhombusConsecSides i j => [(i, "parallelogram"); (j, "con_seg")]
  | TangentPerp i j => [(i, "tangent"); (j, "radius")]
  | TangentPerpConv i j => [(i, "perp"); (j, "radius")]
  | ConTangentsExt i j => [(i, "tangent"); (j, "tangent")]
  | PerpBisect i j => [(i, "perp"); (j, "midpt")]
  | IsosTrapConDiags i j => [(i, "con_seg"); (j, "trapezoid_premise")]
  | PgramDiagBisectConv i j => [(i, "seg_bisect"); (j, "seg_bisect")]
  | PgramOppAngsConv i j => [(i, "con_ang"); (j, "con_ang")]
  | IsosTrapBaseAngs i j => [(i, "con_ang"); (j, "trapezoid_premise")]
  | RectDiagConConv i j => [(i, "con_seg"); (j, "parallelogram")]
  | RhombusDiagPerpConv i j => [(i, "perp"); (j, "parallelogram")]
  | RadiusChordBisect i j k => [(i, "perp"); (j, "radius"); (k, "chord")]
  | ChordBisectConv i j => [(i, "perp_bisector"); (j, "chord")]
  | DefRadiusConv i => [(i, "center_on_line")]
  | RhombusOppBisectConv i j k =>
      [(i, "ang_bisect"); (j, "ang_bisect"); (k, "parallelogram")]
  | ConComplementsSame i j | ConComplements i j _ =>
      [(i, "complementary"); (j, "complementary")]
  | _ => []
  end.

Fixpoint kinds_issue (facts : list Statement) (reason : string)
    (kinds : list (nat * string)) (index step_number : nat)
    : option Audit.Issue :=
  match kinds with
  | [] => None
  | (reference, expected) :: rest =>
      match lookup_step facts reference with
      | Some received =>
          if String.eqb (statement_function received) expected
          then kinds_issue facts reason rest (S index) step_number
          else Some (Audit.issue 12 "reason_dep_type_mismatch" (Audit.JsonObject
            [("reason", Audit.JsonString reason);
             ("index", Audit.JsonNumber index);
             ("ref", Audit.JsonString (nat_text reference));
             ("expectedType", Audit.JsonString expected);
             ("allowedTypes", Audit.JsonArray []);
             ("receivedType", Audit.JsonString (statement_function received));
             ("steps", Audit.JsonArray [Audit.JsonString (nat_text step_number)])]))
      | None => kinds_issue facts reason rest (S index) step_number
      end
  end.

(** Why a rule did not apply, for the rules whose failures are common enough
    in the corpora to be worth explaining in their own terms.  These read the
    same figures the rules read, but nothing depends on them being complete:
    a rule they do not cover still gets a generic issue naming it. *)
Definition seg_text (s : SegmentName) : Audit.JsonValue :=
  Audit.JsonString (Audit.segmentText s).
Definition ang_text (a : AngleName) : Audit.JsonValue :=
  Audit.JsonString (Audit.angleText a).

Definition segments_share (a b c d : SegmentName) : bool :=
  segment_u_eqb a c || segment_u_eqb a d || segment_u_eqb b c || segment_u_eqb b d.
Definition angles_share (a b c d : AngleName) : bool :=
  angle_u_eqb a c || angle_u_eqb a d || angle_u_eqb b c || angle_u_eqb b d.

Definition has_transversal (premises : list Premise) : bool :=
  existsb (fun pr => match pr.(premise_statement) with
                     | Transversal _ _ _ _ _ _ _ _ => true
                     | _ => false
                     end) premises.

Definition quad_text (q : QuadrilateralName) : Audit.JsonValue :=
  Audit.JsonString (Audit.quadrilateralText q).
Definition tri_text (t : TriangleName) : Audit.JsonValue :=
  Audit.JsonString (Audit.triangleText t).

(** Two quadrilateral statements a rule relates must name one figure, in any
    of its eight spellings. *)
Definition different_quads (r q : QuadrilateralName) : list (string * Audit.JsonValue) :=
  [("pair", Audit.JsonArray [quad_text r; quad_text q])].

(** Under the correspondence [t] to [u], the part a congruence's first
    object corresponds to. *)
Definition corresponding_part (t u : TriangleName) (conclusion : Statement)
    : option string :=
  let parts := cpctc_facts t u in
  match conclusion with
  | ConSeg x _ =>
      match find (fun f => match f with
                           | ConSeg p q => segment_u_eqb p x || segment_u_eqb q x
                           | _ => false end) parts with
      | Some (ConSeg p q) =>
          Some (Audit.segmentText (if segment_u_eqb p x then q else p))
      | _ => None
      end
  | ConAng x _ =>
      match find (fun f => match f with
                           | ConAng p q => angle_u_eqb p x || angle_u_eqb q x
                           | _ => false end) parts with
      | Some (ConAng p q) =>
          Some (Audit.angleText (if angle_u_eqb p x then q else p))
      | _ => None
      end
  | _ => None
  end.

(** The part a cpctc conclusion should have paired its first object with. *)
Definition corresponding_field (t u : TriangleName) (conclusion : Statement)
    : list (string * Audit.JsonValue) :=
  match corresponding_part t u conclusion with
  | Some partner => [string_field "expected" partner]
  | None => []
  end.

Definition opposite_sides (q : QuadrilateralName) : Audit.JsonValue :=
  Audit.JsonArray
    [Audit.JsonArray [seg_text (quad_side_ab q); seg_text (quad_side_cd q)];
     Audit.JsonArray [seg_text (quad_side_bc q); seg_text (quad_side_da q)]].
Definition opposite_angles (q : QuadrilateralName) : Audit.JsonValue :=
  Audit.JsonArray
    [Audit.JsonArray [ang_text (quad_corner_a q); ang_text (quad_corner_c q)];
     Audit.JsonArray [ang_text (quad_corner_b q); ang_text (quad_corner_d q)]].
Definition diagonals (q : QuadrilateralName) : Audit.JsonValue :=
  Audit.JsonArray [seg_text (quad_diagonal_ac q); seg_text (quad_diagonal_bd q)].

Definition rule_specific_issue (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (number : nat) (current : Step)
    : option Audit.Issue :=
  let r := current.(step_reason) in
  let conclusion := current.(step_conclusion) in
  let base := [string_field "reason" (reason_name r); step_field number] in
  let issue code extra :=
    Some (Audit.issue 1 code (Audit.JsonObject (base ++ extra))) in
  match r with
  | Reflex =>
      match conclusion with
      | RefSeg a b =>
          if segment_u_eqb a b then None
          else issue "objs_not_equal"
            [("pair", Audit.JsonArray [seg_text a; seg_text b])]
      | RefAng a b =>
          if angle_u_eqb a b then
            if declared_angle decls a then None
            else issue "angle_not_declared"
              [("angle", ang_text a)]
          else issue "objs_not_equal"
            [("pair", Audit.JsonArray [ang_text a; ang_text b])]
      | _ => None
      end
  | DefMidpt i =>
      match lookup_step facts i with
      | Some (Midpt s p) =>
          let halves := ConSeg (segment_name s.(segment_first) p)
                               (segment_name p s.(segment_second)) in
          issue "segs_not_subsegments_meeting_at_midpt"
            [string_field "expected" (Audit.statementText halves)]
      | _ => None
      end
  | DefAngBisect i =>
      match lookup_step facts i, conclusion with
      | Some (AngBisect a s), ConAng x y =>
          let v := a.(angle_vertex) in
          if ascii_eqb x.(angle_vertex) v && ascii_eqb y.(angle_vertex) v then
            issue "bisector_not_in_both_half_angles"
              [("angle", ang_text a); ("bisector", seg_text s)]
          else
            issue "angle_centers_dont_match"
              [string_field "vertex" (string_of_list_ascii [v])]
      | _, _ => None
      end
  | DefConRight i j =>
      match lookup_step facts i, lookup_step facts j with
      | Some (Right a), Some (Right b) =>
          issue "right_angles_dont_match_conclusion"
            [("expected", Audit.JsonArray [ang_text a; ang_text b])]
      | _, _ => None
      end
  | PgramOppSides i =>
      match lookup_step facts i, conclusion with
      | Some (Parallelogram q), ConSeg a b =>
          issue "segs_not_opp_sides_of_quad"
            [("pair", Audit.JsonArray [seg_text a; seg_text b]);
             ("quad", quad_text q); ("oppositeSides", opposite_sides q)]
      | _, _ => None
      end
  | PgramOppAngles i =>
      match lookup_step facts i, conclusion with
      | Some (Parallelogram q), ConAng a b =>
          issue "angles_not_opp_angles_of_quad"
            [("pair", Audit.JsonArray [ang_text a; ang_text b]);
             ("quad", quad_text q); ("oppositeAngles", opposite_angles q)]
      | _, _ => None
      end
  | PgramConsecAngs i =>
      match lookup_step facts i, conclusion with
      | Some (Parallelogram q), Supplementary a b =>
          issue "angles_not_consecutive_in_quad"
            [("a1", ang_text a); ("a2", ang_text b); ("quad", quad_text q)]
      | _, _ => None
      end
  | RhombusOppBisect i =>
      match lookup_step facts i, conclusion with
      | Some (Rhombus q), AngBisect a s =>
          issue "angle_or_seg_not_within_quad"
            [("angle", ang_text a); ("segment", seg_text s); ("quad", quad_text q)]
      | _, _ => None
      end
  | VertAng label =>
      let parts := Parser.split_on ","%char (list_ascii_of_string label) [] in
      let cited := [string_field "label" label] in
      if Nat.ltb 1 (List.length parts) then
        issue "no_intersecting_seg_produces_vert_angles" cited
      else
      match find_premise label premises with
      | Some found =>
          issue "no_intersecting_seg_produces_vert_angles"
            (List.app cited [string_field "premise" (Audit.statementText found)])
      | None => issue "no_intersecting_seg_produces_vert_angles" cited
      end
  | AltInt _ | AltExt _ | CorrespAng _ | SamesideAng _
  | AltIntConv _ | AltExtConv _ | CorrespAngConv _ | SamesideAngConv _ =>
      issue "transversal_angles_or_parallel_segs_dont_form_valid_config"
        [("hasTransversal", Audit.JsonBool (has_transversal premises))]
  | SAS _ _ _ | SSS _ _ _ | ASA _ _ _ | AAS _ _ _ | RHL _ _ _ =>
      match conclusion with
      | ConTri t u | ConTriOrdered t u =>
          if declared_pair decls t u then
            issue "criterion_parts_dont_match_triangles"
              [("tri1", tri_text t); ("tri2", tri_text u)]
          else
            issue "triangle_not_declared"
              [("tri1", tri_text t); ("tri2", tri_text u)]
      | _ => None
      end
  | CPCTC i =>
      match lookup_step facts i with
      | Some (ConTriOrdered t u) =>
          issue "parts_not_corresponding_in_triangles"
            (List.app [("tri1", tri_text t); ("tri2", tri_text u)]
               (corresponding_field t u conclusion))
      | Some (ConTri t u) =>
          match find (fun u' => chain_witnessed decls premises facts t u')
                     (triangle_orderings u) with
          | Some u' =>
            issue "parts_not_corresponding_in_triangles"
              (List.app [("tri1", tri_text t); ("tri2", tri_text u)]
                 (corresponding_field t u' conclusion))
          | None =>
            issue "no_correspondence_established"
              [("tri1", tri_text t); ("tri2", tri_text u)]
          end
      | _ => None
      end
  | KiteOppConAng i =>
      match lookup_step facts i with
      | Some (KitePremise q a b) =>
          issue "angles_not_opp_angles_of_quad"
            [("expected", Audit.JsonArray [ang_text a; ang_text b]);
             ("quad", quad_text q)]
      | _ => None
      end
  | EquilatEquiang i | EquiangEquilat i =>
      match lookup_step facts i, conclusion with
      | Some (Equilateral u), Equiangular t | Some (Equiangular u), Equilateral t =>
          issue "equilateral_and_equiangular_not_the_same_triangle"
            [("tri1", tri_text u); ("tri2", tri_text t)]
      | _, _ => None
      end
  | ConSupplementsSame i j | ConComplementsSame i j =>
      let shared a b c d :=
        if angles_share a b c d then
          issue "non_shared_angles_dont_match_con_ang_conclusion"
            []
        else
          issue "no_shared_angle_bw_supp_pairs"
            [] in
      match lookup_step facts i, lookup_step facts j with
      | Some (Supplementary a b), Some (Supplementary c d)
      | Some (Complementary a b), Some (Complementary c d) => shared a b c d
      | _, _ => None
      end
  | DefRadius i =>
      match lookup_step facts i with
      | Some (Radius c p) =>
          let expected := ConSeg (segment_name c.(circle_center) p)
                            (segment_name c.(circle_center) c.(circle_radius_point)) in
          issue "segs_not_radii_of_circle"
            [string_field "expected" (Audit.statementText expected)]
      | _ => None
      end
  | ConTangentsExt _ _ =>
      issue "tangent_segs_have_no_common_ext_pt"
        []
  | TangentPerp _ _ | TangentPerpConv _ _ =>
      issue "tangent_and_radius_have_diff_tangency_pts"
        []
  | PerpConAng i =>
      match lookup_step facts i, conclusion with
      | Some (Perp _ _ p), ConAng a b =>
          if declared_angle decls a && declared_angle decls b then
            issue "angles_dont_share_centerpt"
              [string_field "point" (string_of_list_ascii [p])]
          else
            issue "angle_not_declared"
              [("angles", Audit.JsonArray [ang_text a; ang_text b])]
      | Some (Perp _ _ p), ConRight _ _ =>
          issue "angles_dont_share_centerpt"
            [string_field "point" (string_of_list_ascii [p])]
      | _, _ => None
      end
  | IsosTrapBaseAngsConv i =>
      match lookup_step facts i with
      | Some (IsosTrapezoidPremise q _ _) =>
          issue "angles_not_base_angle_pair_of_trap" [("quad", quad_text q)]
      | _ => None
      end
  | RectangleDef i =>
      match lookup_step facts i with
      | Some (Rectangle q) =>
          issue "conclusion_elements_not_in_quad" [("quad", quad_text q)]
      | _ => None
      end
  | RectanglePgram i | RhombusPgram i =>
      match conclusion, lookup_step facts i with
      | Parallelogram q, Some (Rectangle r) | Parallelogram q, Some (Rhombus r) =>
          if same_quadrilateral q r then None
          else issue "quad_stmts_refer_to_diff_quads" (different_quads r q)
      | _, _ => None
      end
  | RhombusConsecSides _ _ | RectPgramAng _ _ | RectDiagConConv _ _
  | RhombusDiagPerpConv _ _ | IsosTrapConDiags _ _ | IsosTrapBaseAngs _ _
  | RhombusOppBisectConv _ _ _ =>
      let quads :=
        flat_map (fun d => match lookup_step facts d with
                           | Some (Parallelogram q) | Some (TrapezoidPremise q _ _) => [q]
                           | _ => []
                           end) (reason_dependencies r) in
      let concluded :=
        match conclusion with
        | Rhombus q | Rectangle q | IsosTrapezoid q => Some q
        | _ => None
        end in
      match concluded, quads with
      | Some q, r0 :: _ =>
          if same_quadrilateral q r0 then
            match r with
            | IsosTrapConDiags i _ =>
                match lookup_step facts i with
                | Some (ConSeg a b) =>
                    issue "segs_not_both_diagonals_of_quad"
                      [("s1", seg_text a); ("s2", seg_text b);
                       ("quad", quad_text q); ("diagonals", diagonals q)]
                | _ => None
                end
            | _ => None
            end
          else issue "quad_stmts_refer_to_diff_quads" (different_quads r0 q)
      | _, _ => None
      end
  | DefParallelogram _ _ =>
      match conclusion with
      | Parallelogram q =>
          issue "segs_not_opp_sides_of_quad"
            [("quad", quad_text q); ("oppositeSides", opposite_sides q)]
      | _ => None
      end
  | ConSegTrans i j =>
      match lookup_step facts i, lookup_step facts j with
      | Some (ConSeg a b), Some (ConSeg c d) =>
          if segments_share a b c d then None
          else issue "no_shared_congruent_element"
            []
      | _, _ => None
      end
  | ConAngTrans i j =>
      match lookup_step facts i, lookup_step facts j with
      | Some (ConAng a b), Some (ConAng c d) =>
          if angles_share a b c d then None
          else issue "no_shared_congruent_element"
            []
      | _, _ => None
      end
  | ConTriTrans i j =>
      match lookup_step facts i, lookup_step facts j with
      | Some (ConTri a b), Some (ConTri c d)
      | Some (ConTriOrdered a b), Some (ConTriOrdered c d)
      | Some (ConTri a b), Some (ConTriOrdered c d)
      | Some (ConTriOrdered a b), Some (ConTri c d) =>
          if same_vertices a c || same_vertices a d || same_vertices b c
             || same_vertices b d then None
          else issue "no_shared_congruent_element"
            []
      | _, _ => None
      end
  | PgramDiagBisect _ | RhombusDiagPerp _ | KiteDiagPerp _ =>
      match diagonal_rule_parts r facts conclusion with
      | Some (q, s, t, p) =>
          if names_diagonals q s t then
            issue "no_intersect_seg_premise_for_diagonals_at_this_point"
              [string_field "expected" (Audit.statementText
                 (IntersectSeg (quad_diagonal_ac q) (quad_diagonal_bd q) p))]
          else
            issue "segs_not_both_diagonals_of_quad"
              [("s1", seg_text s); ("s2", seg_text t);
               ("quad", quad_text q); ("diagonals", diagonals q)]
      | None => None
      end
  | _ => None
  end.

(** Two dependency slots citing the same fact, by position in the citation. *)
Definition duplicate_dependency (facts : list Statement) (deps : list nat)
    : option (nat * nat) :=
  let indexed := combine (seq 0 (List.length deps)) deps in
  let same d e :=
    Nat.eqb d e ||
    match lookup_step facts d, lookup_step facts e with
    | Some x, Some y => fact_eqb x y
    | _, _ => false
    end in
  let fix scan (rest : list (nat * nat)) : option (nat * nat) :=
    match rest with
    | [] => None
    | (i, d) :: more =>
        match find (fun p => same d (snd p)) more with
        | Some (j, _) => Some (i, j)
        | None => scan more
        end
    end in
  scan indexed.

(** Why a step that parsed was not accepted, as specifically as the checker
    can say without explaining the geometry of each rule. *)
Definition rejected_step_issue (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (number : nat) (current : Step) : Audit.Issue :=
  let r := current.(step_reason) in
  let name := reason_name r in
  let conclusion := current.(step_conclusion) in
  let base := [string_field "reason" name; step_field number] in
  let given_issue :=
    match r with
    | Given label =>
        match find_premise label premises with
        | None =>
            Some (Audit.issue 13 "invalid_given_dep" (Audit.JsonObject (base ++
              [string_field "ref" label])))
        | Some stated =>
            if String.eqb (statement_function stated) (statement_function conclusion)
            then Some (Audit.issue 11 "stmt_arg_type_invalid" (Audit.JsonObject (base ++
              [string_field "ref" label;
               string_field "expected" (Audit.statementText stated);
               string_field "actual" (Audit.statementText conclusion)])))
            else Some (Audit.issue 10 "reason_stmt_mismatch" (Audit.JsonObject (base ++
              [("legalStatements",
                Audit.JsonArray [Audit.JsonString (statement_function stated)]);
               string_field "actualStatement" (statement_function conclusion);
               string_field "ref" label])))
        end
    | _ => None
    end in
  let forward :=
    find (fun d => Nat.eqb d 0 || Nat.leb number d) (reason_dependencies r) in
  match forward with
  | Some d =>
      Audit.issue 7 "forward_reference" (Audit.JsonObject (base ++
        [string_field "ref" (nat_text d)]))
  | None =>
  match given_issue with
  | Some found => found
  | None =>
  match first_issue (reason_dependency_issue facts r number)
          (kinds_issue facts name (dependency_kinds r) 0 number) with
  | Some found => found
  | None =>
  match duplicate_dependency facts (reason_dependencies r) with
  | Some (first, second) =>
      Audit.issue 14 "invalid_duplicate_stmt" (Audit.JsonObject (base ++
        [("firstIndex", Audit.JsonNumber first);
         ("secondIndex", Audit.JsonNumber second)]))
  | None =>
  match reason_conclusions r with
  | Some legal =>
      if existsb (String.eqb (statement_function conclusion)) legal then
        match duplicate_argument conclusion with
        | Some argument =>
            Audit.issue 14 "invalid_duplicate_stmt" (Audit.JsonObject (base ++
              [string_field "statement" (statement_function conclusion);
               string_field "argument" argument]))
        | None =>
            match rule_specific_issue decls premises facts number current with
            | Some found => found
            | None => Audit.issue 1 "reason_application_error" (Audit.JsonObject base)
            end
        end
      else
        Audit.issue 10 "reason_stmt_mismatch" (Audit.JsonObject (base ++
          [("legalStatements", Audit.JsonArray (json_strings legal));
           string_field "actualStatement" (statement_function conclusion)]))
  | None => Audit.issue 1 "reason_application_error" (Audit.JsonObject base)
  end
  end
  end
  end
  end.

Fixpoint step_issues (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (statuses : list (nat * Audit.StepStatus)) (steps : list ReportStep)
    (number : nat) : list Audit.Issue :=
  match steps with
  | [] => []
  | rs :: rest =>
      let here :=
        match status_of statuses number, rs.(rs_step) with
        | Audit.StepAccepted, _ => []
        | _, None => [step_parse_issue number rs.(rs_line)]
        | Audit.StepBlocked, Some current =>
            let failed :=
              filter (fun d =>
                match status_of statuses d with
                | Audit.StepAccepted => false
                | _ => true
                end) (reason_dependencies current.(step_reason)) in
            [Audit.issue 6 "upstream_dep_error" (Audit.JsonObject
              [string_field "reason" (reason_name current.(step_reason));
               ("dependsOn", json_numbers failed);
               step_field number])]
        | Audit.StepRejected, Some current =>
            [rejected_step_issue decls premises facts number current]
        end in
      here ++ step_issues decls premises (List.app facts [fact_of rs.(rs_step)])
                statuses rest (S number)
  end.

(** Step numbers run 1, 2, 3, ...: dependencies are positions, so a skipped
    or repeated number makes every citation after it point somewhere else. *)
Fixpoint numbering_issues (labels : list (option nat)) (expected : nat)
    : list Audit.Issue :=
  match labels with
  | [] => []
  | Some found :: rest =>
      if Nat.eqb found expected then numbering_issues rest (S expected)
      else [Audit.issue 3 "non_consecutive_step_numbers" (Audit.JsonObject
              [("expected", Audit.JsonNumber expected);
               string_field "found" (nat_text found);
               string_field "step" (nat_text found)])]
  | None :: rest => numbering_issues rest (S expected)
  end.

Definition origin_text (origin : Audit.FactOrigin) : string :=
  match origin with
  | Audit.PremiseOrigin label => label
  | Audit.StepOrigin n => nat_text n
  end.

(** Steps are cited by position, and that is what the issues above count in;
    a reader looks for the number written in brackets, which is the same
    unless the numbering skips. *)
Definition written_number (labels : list (option nat)) (text : string) : string :=
  let fix go (rest : list (option nat)) (position : nat) : string :=
    match rest with
    | [] => text
    | label :: more =>
        if String.eqb (nat_text position) text then
          match label with Some n => nat_text n | None => text end
        else go more (S position)
    end in
  go labels 1.

Definition relabel_value (labels : list (option nat)) (v : Audit.JsonValue)
    : Audit.JsonValue :=
  match v with
  | Audit.JsonString t => Audit.JsonString (written_number labels t)
  | Audit.JsonArray items =>
      Audit.JsonArray (map (fun item =>
        match item with
        | Audit.JsonString t => Audit.JsonString (written_number labels t)
        | other => other
        end) items)
  | other => other
  end.

Definition relabel_issue (labels : list (option nat)) (i : Audit.Issue)
    : Audit.Issue :=
  match i.(Audit.issue_details) with
  | Audit.JsonObject fields =>
      Audit.issue i.(Audit.issue_type) i.(Audit.issue_code)
        (Audit.JsonObject (map (fun field =>
           if String.eqb (fst field) "steps" || String.eqb (fst field) "dependsOn"
              || String.eqb (fst field) "ref" || String.eqb (fst field) "duplicateOf"
              || String.eqb (fst field) "statedBy"
           then (fst field, relabel_value labels (snd field))
           else field) fields))
  | _ => i
  end.

Definition proof_issues (source : string) (accepted : bool) : list Audit.Issue :=
  match report_data_of source with
  | Some d =>
      let content := report_content source in
      let graph := snd (fst (fst content)) in
      let duplicates := snd (fst content) in
      let goal := snd content in
      let steps := step_issues d.(rd_declarations) d.(rd_premises) []
                     d.(rd_statuses) d.(rd_steps) 1 in
      let numbering := numbering_issues (map rs_label d.(rd_steps)) 1 in
      let cycles :=
        map (fun c => Audit.issue 8 "cycle"
               (Audit.JsonObject [("steps", json_numbers c)]))
            graph.(Audit.graph_cycles) in
      let goal_issue :=
        if accepted then []
        else match goal.(Audit.goal_proved_by) with
             | Some _ => []
             | None =>
                 [Audit.issue 4 "goal_not_reached" (Audit.JsonObject
                   (string_field "goal" (Audit.statementText d.(rd_goal)) ::
                    match goal_stated_by d.(rd_goal) (map rs_step d.(rd_steps)) 1
                            d.(rd_statuses) false with
                    | Some n => [string_field "statedBy" (nat_text n)]
                    | None => []
                    end))]
             end in
      let unused :=
        match graph.(Audit.graph_unused_steps) with
        | [] => []
        | unused => [Audit.issue 5 "unused_step"
                       (Audit.JsonObject [("steps", json_numbers unused)])]
        end in
      let repeated :=
        map (fun dup => Audit.issue 14 "duplicate_conclusion" (Audit.JsonObject
               [string_field "duplicateOf"
                  (origin_text dup.(Audit.duplicate_first));
                ("steps", Audit.JsonArray
                   [Audit.JsonString (origin_text dup.(Audit.duplicate_again))])]))
            duplicates in
      numbering ++ map (relabel_issue (map rs_label d.(rd_steps)))
                     (steps ++ cycles ++ goal_issue ++ unused ++ repeated)
  | None =>
      if accepted then []
      else [Audit.issue 1 "reason_application_error" (Audit.JsonObject
              [])]
  end.

(** Why the problem part did not parse: the first line the audited grammar
    does not accept, or what the problem is missing as a whole. *)
Fixpoint header_line_issue (lines : list string) (number : nat)
    : option Audit.Issue :=
  match lines with
  | [] => None
  | line :: rest =>
      match PublicParser.parse_public_line line with
      | Some _ => header_line_issue rest (S number)
      | None =>
          let context := [string_field "line" line] in
          Some
            match Audit.premiseBody line with
            | Some body => statement_issue context body
            | None =>
                match Audit.goalBody line with
                | Some body => statement_issue context body
                | None =>
                    Audit.issue 3 "unrecognized_line" (Audit.JsonObject context)
                end
            end
      end
  end.

Definition goal_line_count (lines : list string) : nat :=
  List.length (filter (fun line => match Audit.goalBody line with
                                   | Some _ => true
                                   | None => false
                                   end) lines).

Definition problem_issue (source : string) : Audit.Issue :=
  let issue code := Audit.issue 3 code (Audit.JsonObject []) in
  match problemPart source with
  | None =>
      match Audit.after "pt:" source with
      | None => issue "missing_points_line"
      | Some _ => issue "missing_steps_line"
      end
  | Some part =>
      let lines := PublicParser.splitLines part in
      match header_line_issue lines 1 with
      | Some found => found
      | None =>
          match goal_line_count lines with
          | O => issue "missing_goal"
          | S O => issue "parser_error"
          | _ => issue "multiple_goals"
          end
      end
  end.

Definition report_issues_for (source : string) (result : CheckResult)
    : list Audit.Issue :=
  match result with
  | ParseFailure => []
  | ProofRejected => proof_issues source false
  | ProofAccepted => proof_issues source true
  end.

Definition report_errors_for (source : string) (result : CheckResult)
    : list Audit.Issue :=
  match result with
  | ParseFailure => [problem_issue source]
  | _ => []
  end.

Definition check_report (source : string) : Audit.CheckReport :=
  let result := classify_source source in
  let content := report_content source in
  Audit.check_report (public_verdict result) (public_problem_of_source source)
    (PresentationParser.parsePresentation source)
    (fst (fst (fst content))) (snd (fst (fst content))) (snd (fst content))
    (snd content)
    (report_issues_for source result) (report_errors_for source result)
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

Lemma segment_list_eqb_eq : forall a b, segment_list_eqb a b = true <-> a = b.
Proof.
  induction a as [|x xs IH]; destruct b as [|y ys]; cbn; try easy.
  rewrite andb_true_iff, segment_eqb_eq, IH. split.
  - intros [-> ->]. reflexivity.
  - intros H. inversion H. auto.
Qed.

Lemma declarations_eqb_eq : forall a b, declarations_eqb a b = true <-> a = b.
Proof.
  intros [t1 a1 q1 c1 s1] [t2 a2 q2 c2 s2]. unfold declarations_eqb. cbn.
  rewrite !andb_true_iff, triangle_list_eqb_eq, angle_list_eqb_eq,
    quadrilateral_list_eqb_eq, circle_list_eqb_eq, segment_list_eqb_eq. split.
  - intros [[[[-> ->] ->] ->] ->]. reflexivity.
  - intros H. inversion H. auto.
Qed.

Section Bridge.
Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : Audit.PointName -> Tpoint.

Lemma projected_triangle_meaning : forall ds,
  Forall (Audit.declarationMeaning point) ds ->
  declarations_well_formed point (projected_declarations ds).
Proof.
  intros ds Hall. split; [|split; [|split; [|split]]].
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
  - intros sd Hin. induction Hall as [|d rest Hd Hrest IH]; cbn in Hin.
    + contradiction.
    + destruct d; cbn in *; try now apply IH.
      destruct Hin as [<-|Hin]; [exact Hd|now apply IH].
Qed.

(** The kernel reads premises with their audited meanings, so a premise it
    was given holds whenever the audited premise does. *)
Lemma premises_meaning : forall publics premises,
  statement_list_eqb publics (premise_statements premises) = true ->
  Forall (Audit.statementMeaning point) publics ->
  Forall (interp_premise point) premises.
Proof.
  intros publics premises Heq Hall.
  apply statement_list_eqb_eq in Heq. subst publics.
  apply Forall_forall. intros pr Hin.
  rewrite Forall_forall in Hall. apply Hall.
  unfold premise_statements. try rewrite map_map.
  apply in_map_iff. exists pr. split; [reflexivity|exact Hin].
Qed.

End Bridge.

Theorem complete_checker_problem_sound : forall source part public,
  problemPart source = Some part ->
  parsePublicProblem part = Some public ->
  complete_checker source = true ->
  forall `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality},
  forall (T2D : @Tarski_2D Tn TnEQD),
  forall (TE : @Tarski_euclidean Tn TnEQD),
  forall point : Audit.PointName -> Tpoint,
    Audit.problemClaim point public.
Proof.
  intros source part public Hpart Hpublic Hcheck Tn TnEQD T2D TE point.
  unfold complete_checker, classify_source in Hcheck. rewrite Hpart, Hpublic in Hcheck.
  destruct (Parser.find_after (list_ascii_of_string "steps:")
              (list_ascii_of_string source)) as [stepText|] eqn:HstepText;
    try discriminate.
  destruct (parseProblemPart part) as [header|] eqn:Hheader; try discriminate.
  destruct (parse_step_lines (Parser.split_lines stepText []) []) as [steps|]
    eqn:Hsteps; try discriminate.
  unfold build_kernel_problem in Hcheck.
  destruct (declarations_eqb (projected_declarations (Audit.public_declarations public))
              (header_declarations header) &&
            statement_list_eqb (Audit.public_premises public)
              (premise_statements (header_premises header)) &&
            statement_eqb (Audit.public_conclusion public) (header_goal header))
    eqn:Hmatches; try discriminate.
  apply andb_true_iff in Hmatches. destruct Hmatches as [Hrest _].
  apply andb_true_iff in Hrest. destruct Hrest as [Htriangles Hpremises].
  apply declarations_eqb_eq in Htriangles.
  unfold Audit.problemClaim. intros Hdeclarations HpublicPremises.
  pose proof (projected_triangle_meaning point _ Hdeclarations) as Hwf.
  rewrite Htriangles in Hwf.
  pose proof (premises_meaning point _ _ Hpremises HpublicPremises)
    as HkernelPremises.
  destruct (check_problem
    (problem (header_declarations header) (header_premises header)
       (Audit.public_conclusion public) steps)) eqn:HkernelCheck; try discriminate.
  exact (check_problem_sound point _ HkernelCheck Hwf HkernelPremises).
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
        Hpart Hpublic Hcheck Tn TnEQD T2D TE point).
    - exfalso. unfold checker, complete_checker, classify_source in Hcheck.
      rewrite Hpart, Hpublic in Hcheck. discriminate.
  Qed.

  (** The plane [Model.v] builds over the real algebraic numbers.  Its three
      [lower_dim] points are the non-collinear triple, since [Col] is exactly
      the disjunction that field negates. *)
  Lemma euclidean_plane_exists :
    exists (Tn : Tarski_neutral_dimensionless)
           (TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality Tn)
           (T2D : @Tarski_2D Tn TnEQD)
           (TE : @Tarski_euclidean Tn TnEQD)
           (A B C : @Tpoint Tn),
      ~ @Col Tn A B C.
  Proof.
    exists Ender.Model.PlaneTn, Ender.Model.PlanePED,
      Ender.Model.Plane2D, Ender.Model.PlaneEuclid.
    exists (@PA Ender.Model.PlaneTn), (@PB Ender.Model.PlaneTn),
      (@PC Ender.Model.PlaneTn).
    exact (@lower_dim Ender.Model.PlaneTn).
  Qed.
End CompleteVerifiedChecker.
