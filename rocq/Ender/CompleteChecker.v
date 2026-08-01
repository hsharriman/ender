From Coq Require Import List String Bool.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Audit Ender.PublicParser Ender.Syntax Ender.Semantics
  Ender.Checker Ender.Parser.
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

(** Statements usable as premises by the currently implemented kernel. *)
Definition project_premise_statement (s : FA.PublicStatement) : option Statement :=
  match s with
  | FA.ConSeg a b => Some (ConSeg (project_segment a) (project_segment b))
  | FA.ConAng a b => Some (ConAng (project_angle a) (project_angle b))
  | FA.RefSeg a b => Some (RefSeg (project_segment a) (project_segment b))
  | FA.RefAng a b => Some (RefAng (project_angle a) (project_angle b))
  | _ => None
  end.

(** Reflexive goals carry extra public same-object meaning not supplied merely
    by internal congruence, so this adapter conservatively rejects them. *)
Definition project_goal_statement (s : FA.PublicStatement) : option Statement :=
  match s with
  | FA.ConSeg a b => Some (ConSeg (project_segment a) (project_segment b))
  | FA.ConAng a b => Some (ConAng (project_angle a) (project_angle b))
  | FA.ConTri a b => Some (ConTri (project_triangle a) (project_triangle b))
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
  | FA.ConTri a b => triangle_mem (project_triangle a) triangles &&
                     triangle_mem (project_triangle b) triangles
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
  match problemPart source,
        Parser.find_after (list_ascii_of_string "steps:") text with
  | Some part, Some stepText =>
      match parsePublicProblem part, parseProblemPart part,
            parse_step_lines (Parser.split_lines stepText []) [] with
      | Some public, Some header, Some steps =>
          match build_kernel_problem public header steps with
          | Some p => if check_problem p then ProofAccepted else ProofRejected
          | None => ProofRejected
          end
      | _, _, _ => ParseFailure
      end
  | _, _ => ParseFailure
  end.

Definition complete_checker (source : string) : bool :=
  match classify_source source with ProofAccepted => true | _ => false end.

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
    injection Hproject as <-; cbn in *; try exact Hmeaning; tauto.
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
  apply triangle_mem_spec in Ha. apply triangle_mem_spec in Hb.
  pose proof (Hwf _ Ha) as Hwa. pose proof (Hwf _ Hb) as Hwb.
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
  Definition checker := complete_checker.
  Definition parser_sound := parsePublicProblem_sound.

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
    unfold meaning, parseProblem.
    destruct (parsePublicProblem part) as [public|] eqn:Hpublic.
    - eexists. split; [reflexivity|].
      intros point. exact (@complete_checker_problem_sound source part public
        Hpart Hpublic Hcheck Tn TnEQD point).
    - exfalso. unfold checker, complete_checker, classify_source in Hcheck.
      rewrite Hpart in Hcheck.
      destruct (Parser.find_after (list_ascii_of_string "steps:")
        (list_ascii_of_string source)); [rewrite Hpublic in Hcheck|]; discriminate.
  Qed.
End CompleteVerifiedChecker.
