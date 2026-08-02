From Coq Require Import List String Bool Numbers.DecimalString.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Audit Ender.PublicParser Ender.Syntax Ender.Geometry
  Ender.Semantics Ender.Checker Ender.Parser Ender.PresentationParser.
Import ListNotations.
Import EnderSyntax.
Module FA := Audit.FinalAudit.
Open Scope string_scope.

Definition project_segment (s : FA.SegmentName) : Segment :=
  segment s.(FA.segment_first) s.(FA.segment_second).
Definition project_angle (a : FA.AngleName) : Angle :=
  angle a.(FA.angle_first) a.(FA.angle_vertex) a.(FA.angle_last).
Definition project_triangle (t : FA.TriangleName) : Triangle :=
  triangle t.(FA.triangle_first) t.(FA.triangle_second) t.(FA.triangle_third).

(** Statements usable as premises by the currently implemented kernel.  A
    public [con_tri] premise carries both triangles' noncollinearity together
    with the three side congruences, which is exactly the SSS hypothesis, so
    the kernel's stronger side-and-angle reading of [ConTri] is justified. *)
Definition project_premise_statement (s : FA.PublicStatement) : option Statement :=
  match s with
  | FA.ConSeg a b => Some (ConSeg (project_segment a) (project_segment b))
  | FA.ConAng a b => Some (ConAng (project_angle a) (project_angle b))
  | FA.ConTri a b => Some (ConTri (project_triangle a) (project_triangle b))
  | FA.RefSeg a b => Some (RefSeg (project_segment a) (project_segment b))
  | FA.RefAng a b => Some (RefAng (project_angle a) (project_angle b))
  | FA.Right a => Some (RightAng (project_angle a))
  | FA.ConRight a b => Some (ConRight (project_angle a) (project_angle b))
  | FA.Perp a b p => Some (PerpAt (project_segment a) (project_segment b) p)
  | _ => None
  end.

(** Reflexive goals carry extra public same-object meaning not supplied merely
    by internal congruence, so this adapter conservatively rejects them.  The
    right-angle and perpendicularity statements below are defined to have
    exactly their audited meanings, so they project in both directions. *)
Definition project_goal_statement (s : FA.PublicStatement) : option Statement :=
  match s with
  | FA.ConSeg a b => Some (ConSeg (project_segment a) (project_segment b))
  | FA.ConAng a b => Some (ConAng (project_angle a) (project_angle b))
  | FA.ConTri a b => Some (ConTri (project_triangle a) (project_triangle b))
  | FA.Right a => Some (RightAng (project_angle a))
  | FA.ConRight a b => Some (ConRight (project_angle a) (project_angle b))
  | FA.Perp a b p => Some (PerpAt (project_segment a) (project_segment b) p)
  | _ => None
  end.

Fixpoint project_premise_statements (ss : list FA.PublicStatement)
    : option (list Statement) :=
  match ss with
  | [] => Some []
  | s :: rest =>
      match project_premise_statement s, project_premise_statements rest with
      | Some x, Some xs => Some (x :: xs)
      | _, _ => None
      end
  end.

Definition projected_triangles (ds : list FA.PublicDeclaration) : list Triangle :=
  fold_right (fun d rest => match d with
    | FA.TriangleDeclaration t => project_triangle t :: rest
    | _ => rest
    end) [] ds.

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

Definition premise_statements (ps : list Premise) : list Statement :=
  map premise_statement ps.

Definition goal_declarations_valid (goal : FA.PublicStatement)
    (triangles : list Triangle) : bool :=
  match goal with
  | FA.ConTri a b => triangle_declared triangles (project_triangle a) &&
                     triangle_declared triangles (project_triangle b)
  | _ => true
  end.

Definition build_kernel_problem (public : FA.PublicProblem)
    (header : ProblemHeader) (steps : list Step) : option Problem :=
  match project_premise_statements public.(FA.public_premises),
        project_goal_statement public.(FA.public_conclusion) with
  | Some premises, Some goal =>
      if triangle_list_eqb (projected_triangles public.(FA.public_declarations))
                           header.(header_triangles) &&
         statement_list_eqb premises (premise_statements header.(header_premises)) &&
         statement_eqb goal header.(header_goal) &&
         goal_declarations_valid public.(FA.public_conclusion)
           header.(header_triangles)
      then Some (problem header.(header_triangles) header.(header_premises) goal steps)
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
Definition empty_graph : FA.DependencyGraph :=
  FA.dependency_graph [] [] [] [].

Definition public_problem_of_source (source : string) : option FA.PublicProblem :=
  match problemPart source with
  | Some part => parsePublicProblem part
  | None => None
  end.

Definition public_verdict (result : CheckResult) : FA.Verdict :=
  match result with
  | ParseFailure => FA.FailedToParseProblem
  | ProofRejected => FA.RejectedProof
  | ProofAccepted => FA.Accepted
  end.

Definition verdict_diagnostics (result : CheckResult) : list FA.Diagnostic :=
  match result with
  | ParseFailure =>
      [FA.diagnostic FA.ProblemParsing FA.DiagnosticError FA.MalformedProblem
        "the theorem-bearing problem header could not be parsed"]
  | ProofRejected =>
      [FA.diagnostic FA.ProofChecking FA.DiagnosticError FA.ProofNotAccepted
        "the proof was not accepted by the verified reason kernel"]
  | ProofAccepted => []
  end.

Inductive ExpectedFact :=
| ExpectedSegment | ExpectedAngle | ExpectedTriangle
| ExpectedRight | ExpectedPerpendicular.

Definition statement_function (s : Statement) : string :=
  match s with
  | ConSeg _ _ => "con_seg" | ConAng _ _ => "con_ang"
  | ConTri _ _ => "con_tri" | RefSeg _ _ => "ref_seg"
  | RefAng _ _ => "ref_ang" | RightAng _ => "right"
  | ConRight _ _ => "con_right" | PerpAt _ _ _ => "perp"
  end.

Definition expected_function (expected : ExpectedFact) : string :=
  match expected with
  | ExpectedSegment => "con_seg" | ExpectedAngle => "con_ang"
  | ExpectedTriangle => "con_tri" | ExpectedRight => "right"
  | ExpectedPerpendicular => "perp"
  end.

Definition allowed_functions (expected : ExpectedFact) : list string :=
  match expected with
  | ExpectedSegment => ["ref_seg"]
  | ExpectedAngle => ["ref_ang"; "con_right"]
  | ExpectedTriangle | ExpectedRight | ExpectedPerpendicular => []
  end.

Definition fact_has_expected_type (expected : ExpectedFact) (s : Statement) : bool :=
  match expected, s with
  | ExpectedSegment, ConSeg _ _ | ExpectedSegment, RefSeg _ _
  | ExpectedAngle, ConAng _ _ | ExpectedAngle, RefAng _ _
  | ExpectedAngle, ConRight _ _
  | ExpectedTriangle, ConTri _ _ | ExpectedRight, RightAng _
  | ExpectedPerpendicular, PerpAt _ _ _ => true
  | _, _ => false
  end.

Definition nat_text (n : nat) : string := NilZero.string_of_uint (Nat.to_uint n).
Definition json_strings (xs : list string) : list FA.JsonValue :=
  map FA.JsonString xs.

Definition dependency_type_issue (facts : list Statement) (reason : string)
    (index reference : nat) (expected : ExpectedFact) (step_number : nat)
    : option FA.Issue :=
  match lookup_step facts reference with
  | Some received =>
      if fact_has_expected_type expected received then None else
      Some (FA.issue 12 "reason_dep_type_mismatch" (FA.JsonObject
        [("reason", FA.JsonString reason);
         ("index", FA.JsonNumber index);
         ("ref", FA.JsonString (nat_text reference));
         ("expectedType", FA.JsonString (expected_function expected));
         ("allowedTypes", FA.JsonArray (json_strings (allowed_functions expected)));
         ("receivedType", FA.JsonString (statement_function received));
         ("steps", FA.JsonArray [FA.JsonString (nat_text step_number)])]))
  | None => None
  end.

Definition first_issue (a b : option FA.Issue) : option FA.Issue :=
  match a with Some issue => Some issue | None => b end.

Definition reason_dependency_issue (facts : list Statement) (reason : Reason)
    (step_number : nat) : option FA.Issue :=
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
  | _ => None
  end.

Definition generic_rejection_issue (step_number : nat) : FA.Issue :=
  FA.issue 1 "reason_application_error"
    (FA.JsonObject [("steps", FA.JsonArray [FA.JsonString (nat_text step_number)])]).

Fixpoint diagnose_steps (triangles : list Triangle) (premises : list Premise)
    (facts : list Statement) (steps : list Step) (step_number : nat)
    : list FA.Issue :=
  match steps with
  | [] =>
      [FA.issue 4 "goal_not_reached" (FA.JsonObject [])]
  | current :: rest =>
      if rule_valid triangles premises facts current.(step_reason) current.(step_conclusion)
      then diagnose_steps triangles premises (facts ++ [current.(step_conclusion)])
             rest (S step_number)
      else match reason_dependency_issue facts current.(step_reason) step_number with
           | Some issue => [issue]
           | None => [generic_rejection_issue step_number]
           end
  end.

Definition rejected_proof_issues (source : string) : list FA.Issue :=
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
              | Some p => diagnose_steps p.(problem_triangles) p.(problem_premises)
                            [] p.(problem_steps) 1
              | None => [generic_rejection_issue 0]
              end
          | None => [FA.issue 3 "parser_error" (FA.JsonObject [])]
          end
      | _, _, _ => [FA.issue 3 "parser_error" (FA.JsonObject [])]
      end
  | None => [FA.issue 3 "parser_error" (FA.JsonObject [])]
  end.

Definition report_issues_for (source : string) (result : CheckResult) : list FA.Issue :=
  match result with ProofRejected => rejected_proof_issues source | _ => [] end.
Definition report_errors_for (result : CheckResult) : list FA.Issue :=
  match result with
  | ParseFailure => [FA.issue 3 "parser_error" (FA.JsonObject [])]
  | _ => []
  end.

Definition check_report (source : string) : FA.CheckReport :=
  let result := classify_source source in
  FA.check_report (public_verdict result) (public_problem_of_source source)
    (PresentationParser.parsePresentation source)
    [] empty_graph [] (FA.goal_report None [] [])
    (report_issues_for source result) (report_errors_for result)
    (verdict_diagnostics result).

Lemma check_report_accepted : forall source,
  FA.accepted (check_report source) = complete_checker source.
Proof.
  intro source. unfold check_report, FA.accepted, complete_checker.
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

Section Bridge.
Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : FA.PointName -> Tpoint.

Lemma projected_triangle_meaning : forall declarations,
  Forall (FA.declarationMeaning point) declarations ->
  declarations_well_formed point (projected_triangles declarations).
Proof.
  intros declarations Hall t Hin. induction Hall as [|d ds Hd Hds IH]; cbn in Hin.
  - contradiction.
  - destruct d; cbn in *; try now apply IH.
    destruct Hin as [<-|Hin]; [exact (proj2 (proj2 (proj2 Hd)))|now apply IH].
Qed.

Lemma projected_premise_meaning : forall public internal,
  project_premise_statement public = Some internal ->
  FA.statementMeaning point public -> interp_statement point internal.
Proof.
  destruct public; cbn; intros internal Hproject Hmeaning; try discriminate;
    injection Hproject as <-; cbn in *; try exact Hmeaning; try tauto.
  (* [con_tri]: the audited meaning supplies noncollinearity and the three
     corresponding sides, so SSS recovers the kernel's angle components. *)
  unfold FA.TriangleCongruent, FA.TriangleWellFormed, FA.SegmentCongruent,
    FA.side_ab, FA.side_bc, FA.side_ca, FA.seg_start, FA.seg_end in Hmeaning.
  cbn in Hmeaning.
  destruct Hmeaning as [[_ [_ [_ Hncol]]] [_ [Hab [Hbc Hca]]]].
  now apply ender_sss.
Qed.

Lemma projected_premises_meaning : forall publics internals premises,
  project_premise_statements publics = Some internals ->
  premise_statements premises = internals ->
  Forall (FA.statementMeaning point) publics ->
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

Lemma projected_goal_meaning : forall public internal declarations,
  project_goal_statement public = Some internal ->
  interp_statement point internal ->
  declarations_well_formed point declarations ->
  goal_declarations_valid public declarations = true ->
  FA.statementMeaning point public.
Proof.
  destruct public; cbn; intros internal declarations Hproject Hmeaning Hwf Hdecl;
    try discriminate;
    injection Hproject as <-; cbn in *; try exact Hmeaning.
  apply andb_true_iff in Hdecl. destruct Hdecl as [Ha Hb].
  pose proof (triangle_declared_sound point _ _ Hwf Ha) as Hwa.
  pose proof (triangle_declared_sound point _ _ Hwf Hb) as Hwb.
  apply noncol_well_formed in Hwa. apply noncol_well_formed in Hwb.
  unfold triangle_congruence in Hmeaning. cbn in Hmeaning.
  destruct Hmeaning as [Hab [Hbc [Hca Hangles]]].
  unfold FA.TriangleCongruent. cbn.
  exact (conj Hwa (conj Hwb (conj Hab (conj Hbc Hca)))).
Qed.

End Bridge.

Theorem complete_checker_problem_sound : forall source part public,
  problemPart source = Some part ->
  parsePublicProblem part = Some public ->
  complete_checker source = true ->
  forall `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality},
  forall point : FA.PointName -> Tpoint,
    FA.problemClaim point public.
Proof.
  intros source part public Hpart Hpublic Hcheck Tn TnEQD point.
  unfold complete_checker, classify_source in Hcheck. rewrite Hpart, Hpublic in Hcheck.
  destruct (Parser.find_after (list_ascii_of_string "steps:")
              (list_ascii_of_string source)) as [stepText|] eqn:HstepText;
    try discriminate.
  destruct (parseProblemPart part) as [header|] eqn:Hheader; try discriminate.
  destruct (parse_step_lines (Parser.split_lines stepText []) []) as [steps|]
    eqn:Hsteps; try discriminate.
  unfold build_kernel_problem in Hcheck.
  destruct (project_premise_statements (FA.public_premises public)) as [premises|]
    eqn:HprojectPremises; try discriminate.
  destruct (project_goal_statement (FA.public_conclusion public)) as [goal|]
    eqn:HprojectGoal; try discriminate.
  destruct (triangle_list_eqb (projected_triangles (FA.public_declarations public))
              (header_triangles header) &&
            statement_list_eqb premises (premise_statements (header_premises header)) &&
            statement_eqb goal (header_goal header) &&
            goal_declarations_valid (FA.public_conclusion public)
              (header_triangles header)) eqn:Hmatches; try discriminate.
  apply andb_true_iff in Hmatches. destruct Hmatches as [Hrest HgoalDeclared].
  apply andb_true_iff in Hrest. destruct Hrest as [Hrest Hgoal].
  apply andb_true_iff in Hrest. destruct Hrest as [Htriangles Hpremises].
  apply triangle_list_eqb_eq in Htriangles.
  apply statement_list_eqb_eq in Hpremises.
  apply statement_eqb_eq in Hgoal.
  unfold FA.problemClaim. intros Hdeclarations HpublicPremises.
  pose proof (projected_triangle_meaning point _ Hdeclarations) as Hwf.
  rewrite Htriangles in Hwf.
  assert (HkernelPremises :
      Forall (interp_premise point) (header_premises header)).
  { eapply projected_premises_meaning.
    - exact HprojectPremises.
    - symmetry. exact Hpremises.
    - exact HpublicPremises. }
  destruct (check_problem
    (problem (header_triangles header) (header_premises header) goal steps))
    eqn:HkernelCheck; try discriminate.
  pose proof (check_problem_sound point
    (problem (header_triangles header) (header_premises header) goal steps)
    HkernelCheck Hwf HkernelPremises) as HkernelGoal.
  eapply projected_goal_meaning; eauto.
Qed.

Module CompleteVerifiedChecker <: FA.COMPLETE_VERIFIED_CHECKER.
  Definition parseProblem := parsePublicProblem.
  Definition parsePresentation := PresentationParser.parsePresentation.
  Definition check := check_report.
  Definition checker (source : string) : bool := FA.accepted (check source).
  Definition parser_sound := parsePublicProblem_sound.
  Definition parser_complete := parsePublicProblem_complete.

  Definition meaning
      `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}
      (source : string) : option Prop :=
    match parseProblem source with
    | Some p =>
        Some (forall point : FA.PointName -> Tpoint, FA.problemClaim point p)
    | None => None
    end.

  Theorem checker_sound : forall source,
    checker source = true ->
      forall part, problemPart source = Some part ->
      forall `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality},
      forall (T2D : @Tarski_2D Tn TnEQD),
      forall (TE : @Tarski_euclidean Tn TnEQD),
        exists claim : Prop, meaning part = Some claim /\ claim.
  Proof.
    intros source Hcheck part Hpart Tn TnEQD T2D TE.
    change (FA.accepted (check_report source) = true) in Hcheck.
    rewrite check_report_accepted in Hcheck.
    unfold meaning, parseProblem.
    destruct (parsePublicProblem part) as [public|] eqn:Hpublic.
    - eexists. split; [reflexivity|].
      intros point. exact (@complete_checker_problem_sound source part public
        Hpart Hpublic Hcheck Tn TnEQD point).
    - exfalso. unfold checker, complete_checker, classify_source in Hcheck.
      rewrite Hpart, Hpublic in Hcheck. discriminate.
  Qed.
End CompleteVerifiedChecker.
