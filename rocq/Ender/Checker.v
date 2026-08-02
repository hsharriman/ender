From Coq Require Import List String Bool Lia.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import Ender.Syntax Ender.Geometry Ender.Semantics.
Import ListNotations.
Import EnderSyntax.

Definition rotate_triangle (t : Triangle) : Triangle :=
  triangle t.(tri_b) t.(tri_c) t.(tri_a).

Definition side_ab (t : Triangle) := segment t.(tri_a) t.(tri_b).
Definition side_bc (t : Triangle) := segment t.(tri_b) t.(tri_c).
Definition side_ca (t : Triangle) := segment t.(tri_c) t.(tri_a).
Definition angle_a (t : Triangle) := angle t.(tri_b) t.(tri_a) t.(tri_c).
Definition angle_b (t : Triangle) := angle t.(tri_a) t.(tri_b) t.(tri_c).
Definition angle_c (t : Triangle) := angle t.(tri_a) t.(tri_c) t.(tri_b).

Definition reverse_segment (s : Segment) := segment s.(seg_end) s.(seg_start).
Definition segment_u_eqb (a b : Segment) : bool :=
  segment_eqb a b || segment_eqb a (reverse_segment b).
Definition segment_pair_eqb (a b c d : Segment) : bool :=
  (segment_u_eqb a c && segment_u_eqb b d) ||
  (segment_u_eqb a d && segment_u_eqb b c).

Lemma segment_u_eqb_cases : forall a b, segment_u_eqb a b = true ->
  a = b \/ a = reverse_segment b.
Proof.
  intros a b H. unfold segment_u_eqb in H. apply orb_true_iff in H.
  destruct H as [H|H]; apply segment_eqb_eq in H; auto.
Qed.

(** [a_XYZ] and [a_ZYX] name the same angle, and angle congruence is symmetric,
    so an angle-congruence fact is matched the same way a segment-congruence
    fact is. *)
Definition reverse_angle (a : Angle) :=
  angle a.(ang_right) a.(ang_vertex) a.(ang_left).
Definition angle_u_eqb (a b : Angle) : bool :=
  angle_eqb a b || angle_eqb a (reverse_angle b).
Definition angle_pair_eqb (a b c d : Angle) : bool :=
  (angle_u_eqb a c && angle_u_eqb b d) || (angle_u_eqb a d && angle_u_eqb b c).

Lemma angle_u_eqb_cases : forall a b, angle_u_eqb a b = true ->
  a = b \/ a = reverse_angle b.
Proof.
  intros a b H. unfold angle_u_eqb in H. apply orb_true_iff in H.
  destruct H as [H|H]; apply angle_eqb_eq in H; auto.
Qed.

(** `RefSeg` and `RefAng` carry the same geometry as their `Con*` forms. *)
Definition fact_eqb (expected actual : Statement) : bool :=
  match expected, actual with
  | ConSeg a b, ConSeg c d | ConSeg a b, RefSeg c d
  | RefSeg a b, ConSeg c d | RefSeg a b, RefSeg c d =>
      segment_pair_eqb a b c d
  | ConAng a b, ConAng c d | ConAng a b, RefAng c d
  | RefAng a b, ConAng c d | RefAng a b, RefAng c d =>
      angle_pair_eqb a b c d
  | ConTri a b, ConTri c d => triangle_eqb a c && triangle_eqb b d
  | RightAng a, RightAng b => angle_eqb a b
  | ConRight a b, ConRight c d => angle_pair_eqb a b c d
  | PerpAt a b p, PerpAt c d q =>
      segment_eqb a c && segment_eqb b d && ascii_eqb p q
  | MidptOf a p, MidptOf b q => segment_u_eqb a b && ascii_eqb p q
  | IntersectSeg a b p, IntersectSeg c d q =>
      segment_eqb a c && segment_eqb b d && ascii_eqb p q
  (* Reversing the ray commutes the two disjuncts of the bisector meaning. *)
  | AngBisectOf a b, AngBisectOf c d => angle_eqb a c && segment_u_eqb b d
  | _, _ => false
  end.

Definition lookup_step (facts : list Statement) (index : nat) : option Statement :=
  match index with O => None | S n => nth_error facts n end.

(** An angle spanning the three vertices of a declared triangle has
    nondegenerate rays, because declaring a triangle asserts that its vertices
    are noncollinear. *)
Definition angle_of_triangle (t : Triangle) (a : Angle) : bool :=
  angle_eqb a (angle t.(tri_b) t.(tri_a) t.(tri_c)) ||
  angle_eqb a (angle t.(tri_c) t.(tri_a) t.(tri_b)) ||
  angle_eqb a (angle t.(tri_a) t.(tri_b) t.(tri_c)) ||
  angle_eqb a (angle t.(tri_c) t.(tri_b) t.(tri_a)) ||
  angle_eqb a (angle t.(tri_a) t.(tri_c) t.(tri_b)) ||
  angle_eqb a (angle t.(tri_b) t.(tri_c) t.(tri_a)).

Definition declared_angle (triangles : list Triangle) (a : Angle) : bool :=
  existsb (fun t => angle_of_triangle t a) triangles.

(** A triangle criterion may consume a [con_right] fact where it expects a
    [con_ang] one: two right angles are congruent as soon as both have
    nondegenerate rays, which declared triangles supply. *)
Definition dependency_matches (triangles : list Triangle)
    (expected actual : Statement) : bool :=
  fact_eqb expected actual ||
  match expected, actual with
  | ConAng a b, ConRight c d =>
      angle_u_eqb a c && angle_u_eqb b d &&
      declared_angle triangles a && declared_angle triangles b
  | _, _ => false
  end.

Definition schema3 (triangles : list Triangle) (facts : list Statement)
    (i j k : nat) (a b c : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j, lookup_step facts k with
  | Some x, Some y, Some z =>
      dependency_matches triangles a x && dependency_matches triangles b y &&
      dependency_matches triangles c z
  | _, _, _ => false
  end.

Definition sas_schema triangles facts i j k (t u : Triangle) : bool :=
  schema3 triangles facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ca t) (side_ca u)).

Definition sss_schema triangles facts i j k (t u : Triangle) : bool :=
  schema3 triangles facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u)).

Definition asa_schema triangles facts i j k (t u : Triangle) : bool :=
  schema3 triangles facts i j k
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_b t) (angle_b u)).

Definition aas_schema triangles facts i j k (t u : Triangle) : bool :=
  schema3 triangles facts i j k
    (ConAng (angle_c t) (angle_c u))
    (ConAng (angle_b t) (angle_b u))
    (ConSeg (side_ab t) (side_ab u)).

(** Right-hypotenuse-leg.  The bundled fixtures disagree about whether the
    hypotenuse or the leg is cited second, and the catalog only says both are
    segment congruences, so both readings are accepted; each is separately
    sound.  Two legs are still refused, and the correspondence search already
    covers which leg is cited. *)
Definition rhl_schema triangles facts i j k (t u : Triangle) : bool :=
  schema3 triangles facts i j k
    (ConRight (angle_b t) (angle_b u))
    (ConSeg (side_ca t) (side_ca u))
    (ConSeg (side_bc t) (side_bc u)) ||
  schema3 triangles facts i j k
    (ConRight (angle_b t) (angle_b u))
    (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u)).

Definition three_rotations
    (schema : list Triangle -> list Statement -> nat -> nat -> nat ->
              Triangle -> Triangle -> bool)
    triangles facts i j k t u : bool :=
  schema triangles facts i j k t u ||
  schema triangles facts i j k (rotate_triangle t) (rotate_triangle u) ||
  schema triangles facts i j k (rotate_triangle (rotate_triangle t))
                               (rotate_triangle (rotate_triangle u)).

(** A criterion's dependency order fixes which vertex plays which role, so the
    correspondence must be searched in both orientations, not only in its three
    rotations. *)
Definition reverse_triangle (t : Triangle) : Triangle :=
  triangle t.(tri_c) t.(tri_b) t.(tri_a).

Definition six_correspondences
    (schema : list Triangle -> list Statement -> nat -> nat -> nat ->
              Triangle -> Triangle -> bool)
    triangles facts i j k t u : bool :=
  three_rotations schema triangles facts i j k t u ||
  three_rotations schema triangles facts i j k
    (reverse_triangle t) (reverse_triangle u).

(** Declaring [t_ABC] asserts that its vertices are noncollinear, and that is
    invariant under renaming the triangle's vertices. *)
Definition triangle_permutations (t : Triangle) : list Triangle :=
  [ triangle t.(tri_a) t.(tri_b) t.(tri_c); triangle t.(tri_a) t.(tri_c) t.(tri_b)
  ; triangle t.(tri_b) t.(tri_a) t.(tri_c); triangle t.(tri_b) t.(tri_c) t.(tri_a)
  ; triangle t.(tri_c) t.(tri_a) t.(tri_b); triangle t.(tri_c) t.(tri_b) t.(tri_a) ].

Definition triangle_declared (triangles : list Triangle) (t : Triangle) : bool :=
  existsb (fun d => triangle_mem t (triangle_permutations d)) triangles.

Definition declared_pair (triangles : list Triangle) (t u : Triangle) : bool :=
  triangle_declared triangles t && triangle_declared triangles u.

Definition cpctc_facts (t u : Triangle) : list Statement :=
  [ ConSeg (side_ab t) (side_ab u)
  ; ConSeg (side_bc t) (side_bc u)
  ; ConSeg (side_ca t) (side_ca u)
  ; ConAng (angle_a t) (angle_a u)
  ; ConAng (angle_b t) (angle_b u)
  ; ConAng (angle_c t) (angle_c u)
  ].

Definition is_cpctc_fact (t u : Triangle) (conclusion : Statement) : bool :=
  existsb (fun expected => fact_eqb expected conclusion) (cpctc_facts t u).

(** Transitivity of congruence.  A dependency states a congruence between two
    like objects; the two dependencies must share one object, and the
    conclusion must congruate the remaining two.  Sharing is decided by the
    same object identity the corresponding [fact_eqb] case uses, so segments
    may be shared with either endpoint order while angles and triangles must
    be shared exactly. *)
Definition segment_congruence_pair (s : Statement) : option (Segment * Segment) :=
  match s with ConSeg a b | RefSeg a b => Some (a, b) | _ => None end.
Definition angle_congruence_pair (s : Statement) : option (Angle * Angle) :=
  match s with ConAng a b | RefAng a b => Some (a, b) | _ => None end.
Definition triangle_congruence_pair (s : Statement) : option (Triangle * Triangle) :=
  match s with ConTri a b => Some (a, b) | _ => None end.

Section Transitivity.
Context {A : Type} (same : A -> A -> bool) (congruence : A -> A -> Statement).

Definition transitive_link (x1 x2 y1 y2 : A) (conclusion : Statement) : bool :=
  (same x2 y1 && fact_eqb (congruence x1 y2) conclusion) ||
  (same x2 y2 && fact_eqb (congruence x1 y1) conclusion) ||
  (same x1 y1 && fact_eqb (congruence x2 y2) conclusion) ||
  (same x1 y2 && fact_eqb (congruence x2 y1) conclusion).

Definition transitive_rule (pair_of : Statement -> option (A * A))
    (facts : list Statement) (i j : nat) (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some first, Some second =>
      match pair_of first, pair_of second with
      | Some (x1, x2), Some (y1, y2) => transitive_link x1 x2 y1 y2 conclusion
      | _, _ => false
      end
  | _, _ => false
  end.
End Transitivity.

Definition con_seg_transitive facts i j conclusion : bool :=
  transitive_rule segment_u_eqb ConSeg segment_congruence_pair facts i j conclusion.
Definition con_ang_transitive facts i j conclusion : bool :=
  transitive_rule angle_u_eqb ConAng angle_congruence_pair facts i j conclusion.
Definition con_tri_transitive facts i j conclusion : bool :=
  transitive_rule triangle_eqb ConTri triangle_congruence_pair facts i j conclusion.

(** Two right angles are congruent.  The audited [right] meaning supplies the
    nondegenerate rays that GeoCoq's [l11_16] needs, so this rule may conclude
    either [con_right] or [con_ang]. *)
Definition def_con_right_conclusion (a b : Angle) (conclusion : Statement) : bool :=
  match conclusion with
  | ConRight c d | ConAng c d =>
      (angle_u_eqb a c && angle_u_eqb b d) || (angle_u_eqb a d && angle_u_eqb b c)
  | _ => false
  end.

Definition def_con_right (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some (RightAng a), Some (RightAng b) => def_con_right_conclusion a b conclusion
  | _, _ => false
  end.

(** Every angle whose vertex is the foot of a perpendicular and whose rays end
    on the two perpendicular segments is right.  [Perp_at] states exactly this
    for all points collinear with either segment, and segment endpoints are
    trivially collinear with their own segment. *)
Definition endpoint_of (c : PointId) (s : Segment) : bool :=
  ascii_eqb c s.(seg_start) || ascii_eqb c s.(seg_end).

Definition perp_right_angle (s t : Segment) (p : PointId) (a : Angle) : bool :=
  ascii_eqb a.(ang_vertex) p &&
  ((endpoint_of a.(ang_left) s && endpoint_of a.(ang_right) t) ||
   (endpoint_of a.(ang_left) t && endpoint_of a.(ang_right) s)).

Definition perp_con_ang (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (PerpAt s t p) =>
      match conclusion with
      | ConRight a b => perp_right_angle s t p a && perp_right_angle s t p b
      | _ => false
      end
  | _ => false
  end.

(** A midpoint halves its segment. *)
Definition def_midpt (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (MidptOf s p) =>
      fact_eqb (ConSeg (segment s.(seg_start) p) (segment p s.(seg_end))) conclusion
  | _ => false
  end.

(** Vertical angles.  Two segments crossing at [p] give two pairs of opposite
    angles at [p]; both members of the concluded pair must span the vertices of
    a declared triangle, which is what supplies the nondegenerate rays.  This
    reason takes no step dependency, so the crossing is looked up among the
    diagram premises. *)
Definition vertical_angle_pair (triangles : list Triangle) (s t : Segment)
    (p : PointId) (conclusion : Statement) : bool :=
  let opposite first second :=
    declared_angle triangles first && declared_angle triangles second &&
    fact_eqb (ConAng first second) conclusion in
  opposite (angle s.(seg_start) p t.(seg_start))
           (angle s.(seg_end) p t.(seg_end)) ||
  opposite (angle s.(seg_start) p t.(seg_end))
           (angle s.(seg_end) p t.(seg_start)).

Definition vert_ang (triangles : list Triangle) (premises : list Premise)
    (conclusion : Statement) : bool :=
  existsb (fun pr => match pr.(premise_statement) with
                     | IntersectSeg s t p =>
                         vertical_angle_pair triangles s t p conclusion
                     | _ => false
                     end) premises.

(** An angle bisector halves its angle.  The audited meaning is a disjunction
    over which endpoint of the ray names the vertex, and that is a condition on
    names, so the checker can decide which disjunct is available. *)
Definition def_ang_bisect (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (AngBisectOf a s) =>
      let halves far :=
        ConAng (angle a.(ang_left) a.(ang_vertex) far)
               (angle far a.(ang_vertex) a.(ang_right)) in
      (ascii_eqb s.(seg_start) a.(ang_vertex) &&
        fact_eqb (halves s.(seg_end)) conclusion) ||
      (ascii_eqb s.(seg_end) a.(ang_vertex) &&
        fact_eqb (halves s.(seg_start)) conclusion)
  | _ => false
  end.

Fixpoint find_premise (label : string) (premises : list Premise) : option Statement :=
  match premises with
  | [] => None
  | p :: rest =>
      if String.eqb label p.(premise_label) then Some p.(premise_statement)
      else find_premise label rest
  end.

Definition rule_valid (triangles : list Triangle) (premises : list Premise)
    (facts : list Statement) (r : Reason) (conclusion : Statement) : bool :=
  match r with
  | Given label =>
      match find_premise label premises with
      | Some prem => statement_eqb prem conclusion
      | None => false
      end
  | Reflex =>
      match conclusion with
      | RefSeg a b => segment_u_eqb a b
      | _ => false
      end
  | SAS i j k =>
      match conclusion with
      | ConTri t u => declared_pair triangles t u &&
          six_correspondences sas_schema triangles facts i j k t u
      | _ => false
      end
  | SSS i j k =>
      match conclusion with
      | ConTri t u => declared_pair triangles t u &&
          six_correspondences sss_schema triangles facts i j k t u
      | _ => false
      end
  | ASA i j k =>
      match conclusion with
      | ConTri t u => declared_pair triangles t u &&
          six_correspondences asa_schema triangles facts i j k t u
      | _ => false
      end
  | AAS i j k =>
      match conclusion with
      | ConTri t u => declared_pair triangles t u &&
          six_correspondences aas_schema triangles facts i j k t u
      | _ => false
      end
  | CPCTC i =>
      match lookup_step facts i with
      | Some (ConTri t u) => is_cpctc_fact t u conclusion
      | _ => false
      end
  | ConSegTrans i j => con_seg_transitive facts i j conclusion
  | ConAngTrans i j => con_ang_transitive facts i j conclusion
  | ConTriTrans i j => con_tri_transitive facts i j conclusion
  | DefConRight i j => def_con_right facts i j conclusion
  | PerpConAng i => perp_con_ang facts i conclusion
  | DefMidpt i => def_midpt facts i conclusion
  | VertAng => vert_ang triangles premises conclusion
  | DefAngBisect i => def_ang_bisect facts i conclusion
  | RHL i j k =>
      match conclusion with
      | ConTri t u => declared_pair triangles t u &&
          six_correspondences rhl_schema triangles facts i j k t u
      | _ => false
      end
  end.

Fixpoint check_steps triangles premises facts steps : option (list Statement) :=
  match steps with
  | [] => Some facts
  | s :: rest =>
      if rule_valid triangles premises facts s.(step_reason) s.(step_conclusion)
      then check_steps triangles premises (facts ++ [s.(step_conclusion)]) rest
      else None
  end.

Definition check_problem (p : Problem) : bool :=
  match check_steps p.(problem_triangles) p.(problem_premises) [] p.(problem_steps) with
  | Some facts => existsb (statement_eqb p.(problem_goal)) facts
  | None => false
  end.

Section Soundness.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : PointId -> Tpoint.

Notation Interp := (interp_statement point).

Lemma fact_eqb_sound : forall expected actual,
  fact_eqb expected actual = true -> (Interp expected <-> Interp actual).
Proof.
  assert (Hpair : forall a b c d,
      segment_pair_eqb a b c d = true ->
      (interp_segment_congruence point a b <->
       interp_segment_congruence point c d)).
  { intros a b c d H. unfold segment_pair_eqb in H. apply orb_true_iff in H.
    destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
      apply segment_u_eqb_cases in H1; apply segment_u_eqb_cases in H2;
      destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
      unfold reverse_segment, interp_segment_congruence; cbn; split; intro; Cong. }
  assert (Hangles : forall a b c d,
      angle_pair_eqb a b c d = true ->
      (interp_angle_congruence point a b <->
       interp_angle_congruence point c d)).
  { intros a b c d H. unfold angle_pair_eqb in H. apply orb_true_iff in H.
    destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
      apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
      destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
      unfold reverse_angle, interp_angle_congruence; cbn; split; intro; CongA. }
  assert (Hrights : forall a b c d, angle_pair_eqb a b c d = true ->
      ((right_angle point a /\ right_angle point b) <->
       (right_angle point c /\ right_angle point d))).
  { intros a b c d H. unfold angle_pair_eqb in H. apply orb_true_iff in H.
    destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
      apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
      destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
      unfold reverse_angle, right_angle; cbn;
      split; intros [Hx Hy]; split;
      solve [assumption | now apply l8_2]. }
  destruct expected, actual; cbn; try discriminate; intros H;
    try (now apply Hpair); try (now apply Hangles); try (now apply Hrights);
    (* Split only syntactic conjunctions: the object comparisons are
       themselves conjunctions of character tests, and decomposing those
       would lose the record-level equalities this proof needs. *)
    repeat match goal with
    | Heq : _ && _ = true |- _ => apply andb_true_iff in Heq; destruct Heq as [? ?]
    end;
    repeat match goal with
    | Heq : segment_eqb _ _ = true |- _ => apply segment_eqb_eq in Heq
    | Heq : segment_u_eqb _ _ = true |- _ =>
        apply segment_u_eqb_cases in Heq; destruct Heq as [Heq|Heq]
    | Heq : angle_eqb _ _ = true |- _ => apply angle_eqb_eq in Heq
    | Heq : triangle_eqb _ _ = true |- _ => apply triangle_eqb_eq in Heq
    | Heq : ascii_eqb _ _ = true |- _ => apply Ascii.eqb_eq in Heq
    end; subst;
    (* residual cases: a midpoint or an angle bisector on a reversed segment *)
    solve [ tauto
          | unfold reverse_segment; cbn; split; apply l7_2
          | unfold reverse_segment; cbn; tauto ].
Qed.

Lemma find_premise_sound : forall label premises statement,
  find_premise label premises = Some statement ->
  exists p, In p premises /\ p.(premise_statement) = statement.
Proof.
  intros label premises. induction premises as [|p rest IH]; cbn; intros statement H.
  - discriminate.
  - destruct (String.eqb label (premise_label p)) eqn:Heq.
    + inversion H. exists p. auto.
    + apply IH in H. destruct H as [q [Hin Hq]]. exists q. auto.
Qed.

Lemma lookup_step_sound : forall facts i statement,
  Forall Interp facts -> lookup_step facts i = Some statement -> Interp statement.
Proof.
  intros facts [|i] statement Hall Hlookup; cbn in Hlookup; try discriminate.
  eapply Forall_forall; [exact Hall|]. eapply nth_error_In; eauto.
Qed.

Lemma angle_u_eqb_right : forall a b, angle_u_eqb a b = true ->
  (right_angle point a <-> right_angle point b).
Proof.
  intros a b H. apply angle_u_eqb_cases in H.
  destruct H as [Heq|Heq]; subst a; [tauto|].
  unfold reverse_angle, right_angle; cbn. split; apply l8_2.
Qed.

Lemma angle_u_eqb_well_formed : forall a b, angle_u_eqb a b = true ->
  (angle_well_formed point a <-> angle_well_formed point b).
Proof.
  intros a b H. apply angle_u_eqb_cases in H.
  destruct H as [Heq|Heq]; subst a; [tauto|].
  unfold reverse_angle, angle_well_formed; cbn. tauto.
Qed.

Lemma declared_angle_sound : forall triangles a,
  declarations_well_formed point triangles ->
  declared_angle triangles a = true -> angle_well_formed point a.
Proof.
  intros triangles a Hwf H. unfold declared_angle in H.
  apply existsb_exists in H. destruct H as [t [Hin Hangle]].
  pose proof (Hwf t Hin) as Hncol.
  destruct t as [A B C]. unfold triangle_well_formed in Hncol. cbn in Hncol.
  apply not_col_distincts in Hncol.
  destruct Hncol as [_ [Hab [Hbc Hac]]].
  unfold angle_of_triangle in Hangle. cbn in Hangle.
  repeat rewrite orb_true_iff in Hangle.
  unfold angle_well_formed.
  repeat match goal with H : _ \/ _ |- _ => destruct H as [H|H] end;
    apply angle_eqb_eq in Hangle; subst; cbn; split; auto.
Qed.

Lemma dependency_matches_sound : forall triangles expected actual,
  declarations_well_formed point triangles ->
  dependency_matches triangles expected actual = true ->
  Interp actual -> Interp expected.
Proof.
  intros triangles expected actual Hwf H Hactual.
  unfold dependency_matches in H. apply orb_true_iff in H.
  destruct H as [H|H]; [now apply (fact_eqb_sound _ _ H)|].
  destruct expected; try discriminate. destruct actual; try discriminate.
  apply andb_true_iff in H. destruct H as [H Hb].
  apply andb_true_iff in H. destruct H as [H Ha].
  apply andb_true_iff in H. destruct H as [H1 H2].
  apply (declared_angle_sound triangles _ Hwf) in Ha.
  apply (declared_angle_sound triangles _ Hwf) in Hb.
  destruct Ha as [Hal Har]. destruct Hb as [Hbl Hbr].
  destruct Hactual as [Hpa Hpb].
  apply (proj2 (angle_u_eqb_right _ _ H1)) in Hpa.
  apply (proj2 (angle_u_eqb_right _ _ H2)) in Hpb.
  unfold right_angle in Hpa, Hpb.
  cbn. now apply l11_16.
Qed.

Lemma schema3_sound : forall triangles facts i j k a b c,
  declarations_well_formed point triangles ->
  Forall Interp facts -> schema3 triangles facts i j k a b c = true ->
  Interp a /\ Interp b /\ Interp c.
Proof.
  intros triangles facts i j k a b c Hwf Hall H.
  unfold schema3 in H.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate.
  destruct (lookup_step facts k) as [z|] eqn:Hz; try discriminate.
  apply andb_true_iff in H. destruct H as [Hab Hc].
  apply andb_true_iff in Hab. destruct Hab as [Ha Hb].
  pose proof (lookup_step_sound facts i x Hall Hx) as HIx.
  pose proof (lookup_step_sound facts j y Hall Hy) as HIy.
  pose proof (lookup_step_sound facts k z Hall Hz) as HIz.
  repeat split; eapply dependency_matches_sound; eauto.
Qed.

Lemma triangle_declared_sound : forall triangles t,
  declarations_well_formed point triangles ->
  triangle_declared triangles t = true -> triangle_well_formed point t.
Proof.
  intros triangles t Hwf H. unfold triangle_declared in H.
  apply existsb_exists in H. destruct H as [d [Hin Hperm]].
  pose proof (Hwf d Hin) as Hd.
  apply triangle_mem_spec in Hperm. destruct d as [A B C].
  unfold triangle_well_formed in Hd |- *. cbn in Hd, Hperm.
  destruct Hperm as [<-|[<-|[<-|[<-|[<-|[<-|[]]]]]]]; cbn;
    intro Hcol; apply Hd; Col.
Qed.

Lemma declared_pair_sound : forall triangles t u,
  declarations_well_formed point triangles ->
  declared_pair triangles t u = true ->
  triangle_well_formed point t /\ triangle_well_formed point u.
Proof.
  intros triangles t u Hwf H. apply andb_true_iff in H. destruct H as [Ht Hu].
  split; eapply triangle_declared_sound; eauto.
Qed.

Lemma rotated_well_formed : forall t,
  triangle_well_formed point t -> triangle_well_formed point (rotate_triangle t).
Proof.
  intros [A B C]. unfold triangle_well_formed, rotate_triangle; cbn.
  intros Hncol Hcol. apply Hncol. Col.
Qed.

Lemma sas_schema_sound : forall triangles facts i j k t u,
  declarations_well_formed point triangles ->
  Forall Interp facts -> triangle_well_formed point t ->
  sas_schema triangles facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros triangles facts i j k [A B C] [D E F] Hdecl Hall Hwf Hschema.
  apply schema3_sound in Hschema; [|exact Hdecl|exact Hall]. cbn in Hschema |- *.
  destruct Hschema as [Hs1 [Ha Hs2]]. eapply ender_sas; eauto; Cong.
Qed.

Lemma sss_schema_sound : forall triangles facts i j k t u,
  declarations_well_formed point triangles ->
  Forall Interp facts -> triangle_well_formed point t ->
  sss_schema triangles facts i j k t u = true -> interp_triangle_congruence point t u.
Proof.
  intros triangles facts i j k [A B C] [D E F] Hdecl Hall Hwf Hschema.
  apply schema3_sound in Hschema; [|exact Hdecl|exact Hall]. cbn in Hschema |- *.
  destruct Hschema as [Hs1 [Hs2 Hs3]]. now apply ender_sss.
Qed.

Lemma asa_schema_sound : forall triangles facts i j k t u,
  declarations_well_formed point triangles ->
  Forall Interp facts -> triangle_well_formed point t ->
  asa_schema triangles facts i j k t u = true -> interp_triangle_congruence point t u.
Proof.
  intros triangles facts i j k [A B C] [D E F] Hdecl Hall Hwf Hschema.
  apply schema3_sound in Hschema; [|exact Hdecl|exact Hall]. cbn in Hschema |- *.
  destruct Hschema as [Ha [Hs Hb]]. now apply ender_asa.
Qed.

Lemma aas_schema_sound : forall triangles facts i j k t u,
  declarations_well_formed point triangles ->
  Forall Interp facts -> triangle_well_formed point t ->
  aas_schema triangles facts i j k t u = true -> interp_triangle_congruence point t u.
Proof.
  intros triangles facts i j k [A B C] [D E F] Hdecl Hall Hwf Hschema.
  apply schema3_sound in Hschema; [|exact Hdecl|exact Hall]. cbn in Hschema |- *.
  destruct Hschema as [Hc [Hb Hs]]. apply ender_aas; auto.
  now apply conga_comm.
Qed.

Lemma rhl_schema_sound : forall triangles facts i j k t u,
  declarations_well_formed point triangles ->
  Forall Interp facts -> triangle_well_formed point t ->
  rhl_schema triangles facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros triangles facts i j k [A B C] [D E F] Hdecl Hall Hwf Hschema.
  unfold rhl_schema in Hschema. apply orb_true_iff in Hschema.
  assert (Hsides : forall x y z : Statement,
      schema3 triangles facts i j k x y z = true -> Interp x /\ Interp y /\ Interp z)
    by (intros; eapply schema3_sound; eauto).
  assert (Hbuild : Per (point A) (point B) (point C) ->
                   Per (point D) (point E) (point F) ->
                   Cong (point C) (point A) (point F) (point D) ->
                   Cong (point B) (point C) (point E) (point F) ->
                   interp_triangle_congruence point (triangle A B C) (triangle D E F)).
  { intros Hper Hper' Hca Hbc.
    assert (Hcong3 : Cong_3 (point A) (point B) (point C)
                            (point D) (point E) (point F))
      by (apply cong2_per2__cong_3; auto; Cong).
    destruct Hcong3 as [Hab [Hac Hbc']]. cbn.
    apply ender_sss; auto; Cong. }
  destruct Hschema as [H|H]; apply Hsides in H; cbn in H;
    destruct H as [[Hper Hper'] [H1 H2]]; now apply Hbuild.
Qed.

Lemma three_rotations_sound : forall schema triangles facts i j k t u,
  declarations_well_formed point triangles ->
  Forall Interp facts -> triangle_well_formed point t ->
  (forall triangles facts i j k t u,
    declarations_well_formed point triangles ->
    Forall Interp facts -> triangle_well_formed point t ->
    schema triangles facts i j k t u = true ->
    interp_triangle_congruence point t u) ->
  three_rotations schema triangles facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros schema triangles facts i j k t u Hdecl Hall Hwf Hsound H.
  unfold three_rotations in H. apply orb_true_iff in H. destruct H as [H|H].
  - apply orb_true_iff in H. destruct H as [H|H].
    + exact (Hsound triangles facts i j k t u Hdecl Hall Hwf H).
    + apply triangle_congruent_rotate_back.
      exact (Hsound triangles facts i j k (rotate_triangle t) (rotate_triangle u)
               Hdecl Hall (rotated_well_formed t Hwf) H).
  - apply triangle_congruent_rotate_back. apply triangle_congruent_rotate_back.
    exact (Hsound triangles facts i j k (rotate_triangle (rotate_triangle t))
             (rotate_triangle (rotate_triangle u)) Hdecl Hall
             (rotated_well_formed _ (rotated_well_formed t Hwf)) H).
Qed.

Lemma reversed_well_formed : forall t,
  triangle_well_formed point t -> triangle_well_formed point (reverse_triangle t).
Proof.
  intros [A B C]. unfold triangle_well_formed, reverse_triangle; cbn.
  intros Hncol Hcol. apply Hncol. Col.
Qed.

Lemma six_correspondences_sound : forall schema triangles facts i j k t u,
  declarations_well_formed point triangles ->
  Forall Interp facts -> triangle_well_formed point t ->
  (forall triangles facts i j k t u,
    declarations_well_formed point triangles ->
    Forall Interp facts -> triangle_well_formed point t ->
    schema triangles facts i j k t u = true ->
    interp_triangle_congruence point t u) ->
  six_correspondences schema triangles facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros schema triangles facts i j k [A B C] [D E F] Hdecl Hall Hwf Hsound H.
  unfold six_correspondences in H. apply orb_true_iff in H. destruct H as [H|H].
  - eapply three_rotations_sound; eauto.
  - apply triangle_congruent_reverse.
    change (interp_triangle_congruence point
              (reverse_triangle (triangle A B C)) (reverse_triangle (triangle D E F))).
    eapply three_rotations_sound;
      [exact Hdecl|exact Hall|now apply reversed_well_formed|exact Hsound|exact H].
Qed.

Lemma cpctc_sound : forall t u conclusion,
  interp_triangle_congruence point t u ->
  is_cpctc_fact t u conclusion = true -> Interp conclusion.
Proof.
  intros [A B C] [D E F] conclusion Htri H.
  unfold is_cpctc_fact, cpctc_facts in H. cbn [existsb] in H.
  repeat rewrite orb_true_iff in H.
  unfold interp_triangle_congruence in Htri. cbn in Htri.
  destruct Htri as [Hs1 [Hs2 [Hs3 [Ha [Hb Hc]]]]].
  repeat match goal with
  | H : _ \/ _ |- _ => destruct H as [H|H]
  end;
  try discriminate;
  apply fact_eqb_sound in H; tauto.
Qed.

(** One transitivity argument covers segments, angles, and triangles.  The
    shared-object test is only ever used to move an already established
    congruence onto an equal object, so no reflexivity — and in particular no
    nondegenerate-ray hypothesis for angles — is required. *)
Lemma transitive_rule_sound :
  forall (A : Type) (same : A -> A -> bool) (congruence : A -> A -> Statement)
         (pair_of : Statement -> option (A * A)),
  (forall w x y, same x y = true ->
     Interp (congruence w x) -> Interp (congruence w y)) ->
  (forall x y, Interp (congruence x y) -> Interp (congruence y x)) ->
  (forall x y z, Interp (congruence x y) -> Interp (congruence y z) ->
     Interp (congruence x z)) ->
  (forall s x y, pair_of s = Some (x, y) -> Interp s -> Interp (congruence x y)) ->
  forall facts i j conclusion,
  Forall Interp facts ->
  transitive_rule same congruence pair_of facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros A same congruence pair_of Hsame Hsym Htrans Hpair facts i j conclusion
    Hfacts Hrule.
  unfold transitive_rule in Hrule.
  destruct (lookup_step facts i) as [first|] eqn:Hfirst; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct (pair_of first) as [[x1 x2]|] eqn:Hx; try discriminate.
  destruct (pair_of second) as [[y1 y2]|] eqn:Hy; try discriminate.
  assert (Hxx : Interp (congruence x1 x2))
    by (eapply Hpair; [exact Hx|eapply lookup_step_sound; eauto]).
  assert (Hyy : Interp (congruence y1 y2))
    by (eapply Hpair; [exact Hy|eapply lookup_step_sound; eauto]).
  unfold transitive_link in Hrule.
  repeat rewrite orb_true_iff in Hrule.
  assert (Hconclude : forall x y, Interp (congruence x y) ->
            fact_eqb (congruence x y) conclusion = true -> Interp conclusion).
  { intros x y Hxy Heq. now apply (fact_eqb_sound _ _ Heq). }
  destruct Hrule as [[[Hcase|Hcase]|Hcase]|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hlink Heq];
    eapply Hconclude; [|exact Heq| |exact Heq| |exact Heq| |exact Heq].
  - eapply Htrans; [eapply Hsame; [exact Hlink|exact Hxx]|exact Hyy].
  - eapply Htrans; [eapply Hsame; [exact Hlink|exact Hxx]|now apply Hsym].
  - eapply Htrans; [eapply Hsame; [exact Hlink|now apply Hsym]|exact Hyy].
  - eapply Htrans; [eapply Hsame; [exact Hlink|now apply Hsym]|now apply Hsym].
Qed.

Lemma con_seg_transitive_sound : forall facts i j conclusion,
  Forall Interp facts -> con_seg_transitive facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  eapply transitive_rule_sound; [| | | |exact Hfacts|exact Hrule].
  - intros w x y Hsame Hcong. apply segment_u_eqb_cases in Hsame.
    destruct Hsame as [Heq|Heq]; subst x; [exact Hcong|].
    unfold reverse_segment in Hcong. cbn in Hcong |- *. Cong.
  - intros x y Hcong. cbn in Hcong |- *. Cong.
  - intros x y z Hxy Hyz. cbn in Hxy, Hyz |- *. eapply cong_transitivity; eauto.
  - intros s x y Hpair Hs. destruct s; cbn in Hpair; try discriminate;
      injection Hpair as <- <-; exact Hs.
Qed.

Lemma con_ang_transitive_sound : forall facts i j conclusion,
  Forall Interp facts -> con_ang_transitive facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  eapply transitive_rule_sound; [| | | |exact Hfacts|exact Hrule].
  - intros w x y Hsame Hcong. apply angle_u_eqb_cases in Hsame.
    destruct Hsame as [Heq|Heq]; subst x; [exact Hcong|].
    unfold reverse_angle in Hcong. cbn in Hcong |- *. CongA.
  - intros x y Hcong. cbn in Hcong |- *. now apply conga_sym.
  - intros x y z Hxy Hyz. cbn in Hxy, Hyz |- *. eapply conga_trans; eauto.
  - intros s x y Hpair Hs. destruct s; cbn in Hpair; try discriminate;
      injection Hpair as <- <-; exact Hs.
Qed.

Lemma con_tri_transitive_sound : forall facts i j conclusion,
  Forall Interp facts -> con_tri_transitive facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  eapply transitive_rule_sound; [| | | |exact Hfacts|exact Hrule].
  - intros w x y Hsame Hcong. apply triangle_eqb_eq in Hsame. now subst.
  - intros x y Hcong. cbn in Hcong |- *. now apply triangle_congruent_sym.
  - intros x y z Hxy Hyz. cbn in Hxy, Hyz |- *.
    eapply triangle_congruent_trans; eauto.
  - intros s x y Hpair Hs. destruct s; cbn in Hpair; try discriminate;
      injection Hpair as <- <-; exact Hs.
Qed.

Lemma def_con_right_sound : forall facts i j conclusion,
  Forall Interp facts -> def_con_right facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule. unfold def_con_right in Hrule.
  destruct (lookup_step facts i) as [first|] eqn:Hfirst; try discriminate.
  destruct first; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  assert (Ha : Interp (RightAng a)) by (eapply lookup_step_sound; eauto).
  assert (Hb : Interp (RightAng a0)) by (eapply lookup_step_sound; eauto).
  cbn in Ha, Hb.
  assert (Hmove : forall x y, angle_u_eqb x y = true -> Interp (RightAng x) ->
            angle_well_formed point y /\ right_angle point y).
  { intros x y Hxy [Hwf Hper]. split.
    - now apply (angle_u_eqb_well_formed _ _ Hxy).
    - now apply (angle_u_eqb_right _ _ Hxy). }
  unfold def_con_right_conclusion in Hrule.
  destruct conclusion; try discriminate;
    apply orb_true_iff in Hrule;
    destruct Hrule as [Hmatch|Hmatch]; apply andb_true_iff in Hmatch;
    destruct Hmatch as [H1 H2];
    [ pose proof (Hmove _ _ H1 Ha) as Hc; pose proof (Hmove _ _ H2 Hb) as Hd
    | pose proof (Hmove _ _ H2 Hb) as Hc; pose proof (Hmove _ _ H1 Ha) as Hd
    | pose proof (Hmove _ _ H1 Ha) as Hc; pose proof (Hmove _ _ H2 Hb) as Hd
    | pose proof (Hmove _ _ H2 Hb) as Hc; pose proof (Hmove _ _ H1 Ha) as Hd ];
    destruct Hc as [[Hcl Hcr] Hcp], Hd as [[Hdl Hdr] Hdp];
    unfold right_angle in Hcp, Hdp; cbn;
    solve [ tauto | now apply l11_16 ].
Qed.

Lemma endpoint_of_col : forall c s,
  endpoint_of c s = true ->
  Col (point c) (point s.(seg_start)) (point s.(seg_end)).
Proof.
  intros c s H. unfold endpoint_of, ascii_eqb in H.
  apply orb_true_iff in H. destruct H as [H|H]; apply Ascii.eqb_eq in H; subst;
    [apply col_trivial_1|apply col_trivial_3].
Qed.

Lemma perp_right_angle_sound : forall s t p a,
  Interp (PerpAt s t p) -> perp_right_angle s t p a = true ->
  right_angle point a.
Proof.
  intros s t p a Hperp H. cbn in Hperp.
  unfold perp_right_angle, ascii_eqb in H.
  apply andb_true_iff in H. destruct H as [Hvertex H].
  apply Ascii.eqb_eq in Hvertex.
  destruct Hperp as [_ [_ [_ [_ Hall]]]].
  unfold right_angle. rewrite Hvertex.
  apply orb_true_iff in H. destruct H as [H|H];
    apply andb_true_iff in H; destruct H as [Hleft Hright];
    apply endpoint_of_col in Hleft; apply endpoint_of_col in Hright.
  - now apply Hall.
  - apply l8_2. now apply Hall.
Qed.

Lemma perp_con_ang_sound : forall facts i conclusion,
  Forall Interp facts -> perp_con_ang facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule. unfold perp_con_ang in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hperp : Interp (PerpAt s s0 p)) by (eapply lookup_step_sound; eauto).
  destruct conclusion; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hleft Hright].
  split; eapply perp_right_angle_sound; eauto.
Qed.

Lemma def_midpt_sound : forall facts i conclusion,
  Forall Interp facts -> def_midpt facts i conclusion = true -> Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule. unfold def_midpt in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hmid : Interp (MidptOf s p)) by (eapply lookup_step_sound; eauto).
  apply (fact_eqb_sound _ _ Hrule). cbn in Hmid |- *. apply Hmid.
Qed.

Lemma vertical_angle_pair_sound : forall triangles s t p conclusion,
  declarations_well_formed point triangles ->
  Interp (IntersectSeg s t p) ->
  vertical_angle_pair triangles s t p conclusion = true -> Interp conclusion.
Proof.
  intros triangles s t p conclusion Hwf Hcross Hpair.
  cbn in Hcross. destruct Hcross as [Hs Ht].
  unfold vertical_angle_pair in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [Hdeclared Heq]; apply andb_true_iff in Hdeclared;
    destruct Hdeclared as [Hfirst Hsecond];
    apply (declared_angle_sound triangles _ Hwf) in Hfirst;
    apply (declared_angle_sound triangles _ Hwf) in Hsecond;
    destruct Hfirst as [Hf1 Hf2]; destruct Hsecond as [Hs1 Hs2];
    cbn in Hf1, Hf2, Hs1, Hs2;
    apply (fact_eqb_sound _ _ Heq); cbn.
  - now apply l11_14.
  - apply l11_14; auto. now apply between_symmetry.
Qed.

Lemma vert_ang_sound : forall triangles premises conclusion,
  declarations_well_formed point triangles ->
  Forall (interp_premise point) premises ->
  vert_ang triangles premises conclusion = true -> Interp conclusion.
Proof.
  intros triangles premises conclusion Hwf Hprem Hrule.
  unfold vert_ang in Hrule. apply existsb_exists in Hrule.
  destruct Hrule as [pr [Hin Hmatch]].
  pose proof ((proj1 (@Forall_forall Premise (interp_premise point) premises))
                Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr.
  destruct (premise_statement pr); try discriminate.
  eapply vertical_angle_pair_sound; eauto.
Qed.

Lemma def_ang_bisect_sound : forall facts i conclusion,
  Forall Interp facts -> def_ang_bisect facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule. unfold def_ang_bisect in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hbisect : Interp (AngBisectOf a s)) by (eapply lookup_step_sound; eauto).
  cbn in Hbisect.
  apply orb_true_iff in Hrule; destruct Hrule as [Hcase|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hvertex Heq];
    unfold ascii_eqb in Hvertex; apply Ascii.eqb_eq in Hvertex;
    apply (fact_eqb_sound _ _ Heq); cbn;
    destruct Hbisect as [[Hstart Hc]|[Hend Hc]].
  (* the named endpoint is the vertex, so the other disjunct can only hold when
     both endpoints name it and the two halves therefore coincide *)
  - exact Hc.
  - assert (Hsame : s.(seg_end) = s.(seg_start)) by congruence.
    rewrite Hsame. exact Hc.
  - assert (Hsame : s.(seg_start) = s.(seg_end)) by congruence.
    rewrite Hsame. exact Hc.
  - exact Hc.
Qed.

Lemma rule_valid_sound : forall triangles premises facts reason conclusion,
  declarations_well_formed point triangles ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  rule_valid triangles premises facts reason conclusion = true ->
  Interp conclusion.
Proof.
  intros triangles premises facts reason conclusion Hwf Hprem Hfacts Hvalid.
  destruct reason; cbn in Hvalid.
  - destruct (find_premise s premises) eqn:Hfind; try discriminate.
    apply statement_eqb_eq in Hvalid. subst conclusion.
    apply find_premise_sound in Hfind. destruct Hfind as [p [Hin Hp]].
    pose proof ((proj1 (@Forall_forall Premise (interp_premise point) premises))
                  Hprem p Hin) as Hip.
    unfold interp_premise in Hip. now rewrite Hp in Hip.
  - destruct conclusion; try discriminate.
    + apply segment_u_eqb_cases in Hvalid. destruct Hvalid as [Hvalid|Hvalid].
      * subst. cbn. apply cong_reflexivity.
      * subst. unfold reverse_segment. cbn. apply cong_pseudo_reflexivity.
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hfacts|exact Ht|exact sas_schema_sound|exact Hschema].
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hfacts|exact Ht|exact sss_schema_sound|exact Hschema].
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hfacts|exact Ht|exact asa_schema_sound|exact Hschema].
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hfacts|exact Ht|exact aas_schema_sound|exact Hschema].
  - destruct (lookup_step facts n) as [dependency|] eqn:Hlookup; try discriminate.
    destruct dependency; try discriminate.
    change (is_cpctc_fact t t0 conclusion = true) in Hvalid.
    apply (cpctc_sound t t0 conclusion); [|exact Hvalid].
    change (Interp (ConTri t t0)). eapply lookup_step_sound; eauto.
  - eapply con_seg_transitive_sound; eauto.
  - eapply con_ang_transitive_sound; eauto.
  - eapply con_tri_transitive_sound; eauto.
  - eapply def_con_right_sound; eauto.
  - eapply perp_con_ang_sound; eauto.
  - eapply def_midpt_sound; eauto.
  - eapply vert_ang_sound; eauto.
  - eapply def_ang_bisect_sound; eauto.
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hfacts|exact Ht|exact rhl_schema_sound|exact Hschema].
Qed.

Lemma check_steps_sound : forall triangles premises steps facts output,
  declarations_well_formed point triangles ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  check_steps triangles premises facts steps = Some output ->
  Forall Interp output.
Proof.
  intros triangles premises steps. induction steps as [|s rest IH];
    intros facts output Hwf Hprem Hfacts Hcheck; cbn in Hcheck.
  - injection Hcheck as <-. exact Hfacts.
  - destruct (rule_valid triangles premises facts (step_reason s)
              (step_conclusion s)) eqn:Hvalid; try discriminate.
    apply (IH (facts ++ [step_conclusion s]) output); auto.
    apply Forall_app. split; auto. constructor; auto.
    eapply rule_valid_sound; eauto.
Qed.

Theorem check_problem_sound : forall p,
  check_problem p = true ->
  declarations_well_formed point p.(problem_triangles) ->
  Forall (interp_premise point) p.(problem_premises) ->
  Interp p.(problem_goal).
Proof.
  intros p Hcheck Hwf Hprem. unfold check_problem in Hcheck.
  destruct (check_steps (problem_triangles p) (problem_premises p) []
            (problem_steps p)) as [facts|] eqn:Hsteps; try discriminate.
  apply existsb_exists in Hcheck. destruct Hcheck as [goal [Hin Heq]].
  apply statement_eqb_eq in Heq. subst goal.
  pose proof (check_steps_sound _ _ _ _ _ Hwf Hprem (Forall_nil _) Hsteps) as Hall.
  eapply Forall_forall; eauto.
Qed.

End Soundness.
