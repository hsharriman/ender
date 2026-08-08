From Stdlib Require Import List String Bool Lia.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import GeoCoq.Main.Tarski_dev.Ch12_parallel.
Require Import GeoCoq.Main.Annexes.suma.
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

Lemma segment_u_eqb_refl : forall s, segment_u_eqb s s = true.
Proof.
  intros [a b]. unfold segment_u_eqb, segment_eqb, ascii_eqb. cbn.
  apply orb_true_iff. left. apply andb_true_iff. split; apply Ascii.eqb_refl.
Qed.

Lemma segment_u_eqb_reverse : forall a b,
  segment_u_eqb (segment a b) (segment b a) = true.
Proof.
  intros a b. unfold segment_u_eqb, segment_eqb, reverse_segment, ascii_eqb.
  cbn. apply orb_true_iff. right.
  apply andb_true_iff. split; apply Ascii.eqb_refl.
Qed.

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

Lemma angle_u_eqb_intro : forall a b,
  a = b \/ a = reverse_angle b -> angle_u_eqb a b = true.
Proof.
  intros a b [Heq|Heq]; subst a; unfold angle_u_eqb, angle_eqb, reverse_angle,
    ascii_eqb; cbn; apply orb_true_iff; [left|right];
    repeat (apply andb_true_iff; split); apply Ascii.eqb_refl.
Qed.

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
  | ConTri a b, ConTri c d | SimTri a b, SimTri c d =>
      triangle_eqb a c && triangle_eqb b d
  | RightAng a, RightAng b => angle_eqb a b
  | ConRight a b, ConRight c d => angle_pair_eqb a b c d
  | PerpAt a b p, PerpAt c d q =>
      segment_u_eqb a c && segment_u_eqb b d && ascii_eqb p q
  | MidptOf a p, MidptOf b q => segment_u_eqb a b && ascii_eqb p q
  | IntersectSeg a b p, IntersectSeg c d q =>
      segment_eqb a c && segment_eqb b d && ascii_eqb p q
  (* Reversing the ray commutes the two disjuncts of the bisector meaning. *)
  | AngBisectOf a b, AngBisectOf c d => angle_eqb a c && segment_u_eqb b d
  (* The bisector's line and the halved segment are both unoriented: [Col] is
     permutation-invariant, and [Midpoint] survives swapping the endpoints. *)
  | SegBisectOf a b p, SegBisectOf c d q =>
      segment_u_eqb a c && segment_u_eqb b d && ascii_eqb p q
  | OnLine a p, OnLine b q => segment_u_eqb a b && ascii_eqb p q
  | IsoscelesTri a, IsoscelesTri b | EquilateralTri a, EquilateralTri b
  | EquiangularTri a, EquiangularTri b => triangle_eqb a b
  (* [SuppA] is symmetric and unaffected by reversing either angle. *)
  | Supplementary a b, Supplementary c d
  | Complementary a b, Complementary c d => angle_pair_eqb a b c d
  (* [Par] is symmetric and unaffected by reversing either segment. *)
  | Para a b, Para c d => segment_pair_eqb a b c d
  (* Quadrilateral names fix the cyclic order their meanings read sides from,
     so they match exactly; the same for the transversal's labeled figure. *)
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
  | RadiusOf c p, RadiusOf c' p' => circle_eqb c c' && ascii_eqb p p'
  | ChordOf c s, ChordOf c' s' | DiameterOf c s, DiameterOf c' s' =>
      circle_eqb c c' && segment_eqb s s'
  | TangentAt c s p, TangentAt c' s' p' =>
      circle_eqb c c' && segment_eqb s s' && ascii_eqb p p'
  | InscribedAngleOf c a, InscribedAngleOf c' a' =>
      circle_eqb c c' && angle_eqb a a'
  | ArcOf a, ArcOf a' => arc_eqb a a'
  | ConArc a b, ConArc a' b' => arc_eqb a a' && arc_eqb b b'
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

(** A declared quadrilateral asserts that its four vertices are pairwise
    distinct, so any three of them, named apart, are an angle with
    nondegenerate rays.  Unlike a triangle, the three need not be consecutive:
    distinctness is all a well-formed angle wants, and every pair of vertices
    has it. *)
Definition quad_vertices (q : Quadrilateral) : list PointId :=
  [q.(quad_a); q.(quad_b); q.(quad_c); q.(quad_d)].

Definition angle_of_quadrilateral (q : Quadrilateral) (a : Angle) : bool :=
  let vertex p := existsb (ascii_eqb p) (quad_vertices q) in
  vertex a.(ang_left) && vertex a.(ang_vertex) && vertex a.(ang_right) &&
  negb (ascii_eqb a.(ang_left) a.(ang_vertex)) &&
  negb (ascii_eqb a.(ang_right) a.(ang_vertex)).

(** A [seg:] line is audited as [SegmentWellFormed], so a declared segment is
    a source of the one fact a ray needs: that its two ends are different
    points. *)
Definition declared_segment (decls : Declarations) (s : Segment) : bool :=
  existsb (segment_u_eqb s) decls.(decl_segments).

(** An angle is nondegenerate if it spans a declared triangle's vertices, if it
    names three vertices of a declared quadrilateral, if both of its rays are
    declared segments -- which is the same two distinctness facts, written the
    way a figure with no triangle in it usually declares them -- or if it is
    itself declared on an [ang:] line, whose audited meaning is exactly
    [AngleWellFormed]. *)
Definition declared_angle (decls : Declarations) (a : Angle) : bool :=
  existsb (fun t => angle_of_triangle t a) decls.(decl_triangles) ||
  existsb (fun q => angle_of_quadrilateral q a) decls.(decl_quadrilaterals) ||
  (declared_segment decls (segment a.(ang_left) a.(ang_vertex)) &&
   declared_segment decls (segment a.(ang_right) a.(ang_vertex))) ||
  existsb (angle_u_eqb a) decls.(decl_angles).

(** [q] names the same ray from [v] as [p]: the names are equal, or an
    [on_line] diagram premise places one of the two on the segment from [v]
    through the other.  [on_line] is audited as segment membership, so the
    premise supplies the betweenness an [Out] fact needs. *)
Definition on_segment_match (v p q : PointId) (s : Segment) (r : PointId) : bool :=
  ((segment_u_eqb s (segment v q) && ascii_eqb r p) ||
   (segment_u_eqb s (segment v p) && ascii_eqb r q)).

(** Diagram statements and midpoint givens all carry endpoint-inclusive
    segment membership.  Treat their named interior point uniformly when
    deciding whether two spellings name the same ray. *)
Definition statement_ray_linked (v p q : PointId) (s : Statement) : bool :=
  match s with
  | OnLine t r | MidptOf t r => on_segment_match v p q t r
  | IntersectSeg t u r =>
      on_segment_match v p q t r || on_segment_match v p q u r
  | _ => false
  end.

Definition on_line_witness (s : Statement) : option (Segment * PointId) :=
  match s with OnLine t q => Some (t, q) | _ => None end.

(** Searching the diagram premises yields the premise that was found, not
    merely the fact that one exists.  A rule needs only the bit, and takes it
    as [premise_found]; a report that says which premise a step consulted needs
    the premise itself.  Both come from the same search, so the two cannot
    disagree about what a rule used. *)
Definition premise_witness (p : Premise -> bool) (premises : list Premise)
    : option Statement :=
  match find p premises with
  | Some pr => Some pr.(premise_statement)
  | None => None
  end.

Definition premise_found (p : Premise -> bool) (premises : list Premise) : bool :=
  match premise_witness p premises with Some _ => true | None => false end.

Lemma premise_found_existsb : forall p premises,
  premise_found p premises = existsb p premises.
Proof.
  intros p premises. unfold premise_found, premise_witness.
  induction premises as [|pr rest IH]; [reflexivity|].
  cbn. destruct (p pr); [reflexivity|exact IH].
Qed.

Definition ray_link_premise (v p q : PointId) (pr : Premise) : bool :=
  statement_ray_linked v p q pr.(premise_statement).

Definition ray_linked (premises : list Premise) (v p q : PointId) : bool :=
  ascii_eqb p q || premise_found (ray_link_premise v p q) premises.

Definition ray_link_witness (premises : list Premise) (v p q : PointId)
    : option Statement :=
  if ascii_eqb p q then None
  else premise_witness (ray_link_premise v p q) premises.

(** An expected angle may be spelled through any labeled points on its own
    rays, provided each substitution is justified by an [on_line] diagram
    premise and the expected angle is declared nondegenerate: [out2__conga]
    then carries the congruence across the renaming.  The vertex must match
    exactly, and either ray order is accepted, as everywhere else. *)
(** Matching an angle through renamed rays consults the diagram, so the match
    yields the premises it leaned on: none when the two spellings agree
    outright, and otherwise the [on_line]-family premises that linked each ray.
    [angle_ray_matches] is this having succeeded, so the bit and the premises
    can never come apart. *)
Definition ray_pair_used (premises : list Premise) (v p q p' q' : PointId)
    : option (list Statement) :=
  if ray_linked premises v p p' && ray_linked premises v q q'
  then Some (match ray_link_witness premises v p p' with
             | Some w => [w] | None => [] end ++
             match ray_link_witness premises v q q' with
             | Some w => [w] | None => [] end)
  else None.

Definition angle_ray_used (decls : Declarations) (premises : list Premise)
    (expected actual : Angle) : option (list Statement) :=
  if angle_u_eqb expected actual then Some []
  else if negb (declared_angle decls expected &&
                ascii_eqb expected.(ang_vertex) actual.(ang_vertex))
  then None
  else match ray_pair_used premises expected.(ang_vertex)
               expected.(ang_left) expected.(ang_right)
               actual.(ang_left) actual.(ang_right) with
       | Some used => Some used
       | None =>
           ray_pair_used premises expected.(ang_vertex)
             expected.(ang_left) expected.(ang_right)
             actual.(ang_right) actual.(ang_left)
       end.

Definition angle_ray_matches (decls : Declarations) (premises : list Premise)
    (expected actual : Angle) : bool :=
  match angle_ray_used decls premises expected actual with
  | Some _ => true
  | None => false
  end.

(** A triangle criterion may consume a [con_right] fact where it expects a
    [con_ang] one: two right angles are congruent as soon as both have
    nondegenerate rays, which declared triangles supply.  An expected
    [con_ang] may also be met by a congruence over ray-renamed spellings of
    its angles, which is what lets overlapping triangles share an angle
    named through either triangle's own vertices. *)
Definition angle_pair_used (decls : Declarations) (premises : list Premise)
    (a b c d : Angle) : option (list Statement) :=
  match angle_ray_used decls premises a c, angle_ray_used decls premises b d with
  | Some x, Some y => Some (x ++ y)
  | _, _ =>
      match angle_ray_used decls premises a d, angle_ray_used decls premises b c with
      | Some x, Some y => Some (x ++ y)
      | _, _ => None
      end
  end.

Definition dependency_used (decls : Declarations) (premises : list Premise)
    (expected actual : Statement) : option (list Statement) :=
  if fact_eqb expected actual then Some []
  else
    match expected, actual with
    | ConAng a b, ConRight c d =>
        if angle_u_eqb a c && angle_u_eqb b d &&
           declared_angle decls a && declared_angle decls b
        then Some [] else None
    | ConAng a b, ConAng c d | ConAng a b, RefAng c d =>
        angle_pair_used decls premises a b c d
    | _, _ => None
    end.

Definition dependency_matches (decls : Declarations) (premises : list Premise)
    (expected actual : Statement) : bool :=
  match dependency_used decls premises expected actual with
  | Some _ => true
  | None => false
  end.

Lemma dependency_matches_unfold : forall decls premises expected actual,
  dependency_matches decls premises expected actual =
  (fact_eqb expected actual ||
   match expected, actual with
   | ConAng a b, ConRight c d =>
       angle_u_eqb a c && angle_u_eqb b d &&
       declared_angle decls a && declared_angle decls b
   | ConAng a b, ConAng c d | ConAng a b, RefAng c d =>
       (angle_ray_matches decls premises a c &&
        angle_ray_matches decls premises b d) ||
       (angle_ray_matches decls premises a d &&
        angle_ray_matches decls premises b c)
   | _, _ => false
   end).
Proof.
  intros decls premises expected actual.
  unfold dependency_matches, dependency_used, angle_pair_used,
    angle_ray_matches.
  destruct (fact_eqb expected actual); [reflexivity|].
  destruct expected; destruct actual; try reflexivity;
    try (destruct (angle_u_eqb _ _); cbn; try reflexivity);
    repeat (match goal with
            | |- context [angle_ray_used ?d ?p ?x ?y] =>
                destruct (angle_ray_used d p x y)
            | |- context [angle_u_eqb ?x ?y] => destruct (angle_u_eqb x y)
            | |- context [declared_angle ?d ?x] => destruct (declared_angle d x)
            end; cbn); reflexivity.
Qed.

Definition schema3_used (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i j k : nat) (a b c : Statement) : option (list Statement) :=
  match lookup_step facts i, lookup_step facts j, lookup_step facts k with
  | Some x, Some y, Some z =>
      match dependency_used decls premises a x,
            dependency_used decls premises b y,
            dependency_used decls premises c z with
      | Some p, Some q, Some r => Some (p ++ q ++ r)
      | _, _, _ => None
      end
  | _, _, _ => None
  end.

Definition schema3 (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i j k : nat) (a b c : Statement) : bool :=
  match schema3_used decls premises facts i j k a b c with
  | Some _ => true
  | None => false
  end.

Lemma schema3_unfold : forall decls premises facts i j k a b c,
  schema3 decls premises facts i j k a b c =
  match lookup_step facts i, lookup_step facts j, lookup_step facts k with
  | Some x, Some y, Some z =>
      dependency_matches decls premises a x &&
      dependency_matches decls premises b y &&
      dependency_matches decls premises c z
  | _, _, _ => false
  end.
Proof.
  intros decls premises facts i j k a b c.
  unfold schema3, schema3_used, dependency_matches.
  destruct (lookup_step facts i); [|reflexivity].
  destruct (lookup_step facts j); [|reflexivity].
  destruct (lookup_step facts k); [|reflexivity].
  destruct (dependency_used decls premises a s);
    destruct (dependency_used decls premises b s0);
    destruct (dependency_used decls premises c s1); reflexivity.
Qed.

Definition sas_schema decls premises facts i j k (t u : Triangle) : bool :=
  schema3 decls premises facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ca t) (side_ca u)).

Definition sss_schema decls premises facts i j k (t u : Triangle) : bool :=
  schema3 decls premises facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u)).

Definition asa_schema decls premises facts i j k (t u : Triangle) : bool :=
  schema3 decls premises facts i j k
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_b t) (angle_b u)).

(** The two angles are interchangeable in the citation: swapping them names
    the same three facts, so both orders are accepted. *)
Definition aas_schema decls premises facts i j k (t u : Triangle) : bool :=
  schema3 decls premises facts i j k
    (ConAng (angle_c t) (angle_c u))
    (ConAng (angle_b t) (angle_b u))
    (ConSeg (side_ab t) (side_ab u)) ||
  schema3 decls premises facts i j k
    (ConAng (angle_b t) (angle_b u))
    (ConAng (angle_c t) (angle_c u))
    (ConSeg (side_ab t) (side_ab u)).

(** Right-hypotenuse-leg.  The bundled fixtures disagree about whether the
    hypotenuse or the leg is cited second, and the catalog only says both are
    segment congruences, so both readings are accepted; each is separately
    sound.  Two legs are still refused, and the correspondence search already
    covers which leg is cited. *)
Definition rhl_schema decls premises facts i j k (t u : Triangle) : bool :=
  schema3 decls premises facts i j k
    (ConRight (angle_b t) (angle_b u))
    (ConSeg (side_ca t) (side_ca u))
    (ConSeg (side_bc t) (side_bc u)) ||
  schema3 decls premises facts i j k
    (ConRight (angle_b t) (angle_b u))
    (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u)).

Definition three_rotations
    (schema : Declarations -> list Premise -> list Statement -> nat -> nat -> nat ->
              Triangle -> Triangle -> bool)
    decls premises facts i j k t u : bool :=
  schema decls premises facts i j k t u ||
  schema decls premises facts i j k (rotate_triangle t) (rotate_triangle u) ||
  schema decls premises facts i j k (rotate_triangle (rotate_triangle t))
                               (rotate_triangle (rotate_triangle u)).

(** A criterion's dependency order fixes which vertex plays which role, so the
    correspondence must be searched in both orientations, not only in its three
    rotations. *)
Definition reverse_triangle (t : Triangle) : Triangle :=
  triangle t.(tri_c) t.(tri_b) t.(tri_a).

Definition six_correspondences
    (schema : Declarations -> list Premise -> list Statement -> nat -> nat -> nat ->
              Triangle -> Triangle -> bool)
    decls premises facts i j k t u : bool :=
  three_rotations schema decls premises facts i j k t u ||
  three_rotations schema decls premises facts i j k
    (reverse_triangle t) (reverse_triangle u).

(** The same search, keeping the premises the winning correspondence used.  It
    tries the readings in the order the rule tries them, so it finds the same
    one. *)
Definition first_used {A : Type} (f : A -> option (list Statement)) (xs : list A)
    : option (list Statement) :=
  fold_right (fun x rest => match f x with Some p => Some p | None => rest end)
    None xs.

Definition six_correspondences_used
    (schema : Declarations -> list Premise -> list Statement -> nat -> nat -> nat ->
              Triangle -> Triangle -> option (list Statement))
    decls premises facts i j k t u : option (list Statement) :=
  first_used (fun c => schema decls premises facts i j k (fst c) (snd c))
    [(t, u);
     (rotate_triangle t, rotate_triangle u);
     (rotate_triangle (rotate_triangle t), rotate_triangle (rotate_triangle u));
     (reverse_triangle t, reverse_triangle u);
     (rotate_triangle (reverse_triangle t), rotate_triangle (reverse_triangle u));
     (rotate_triangle (rotate_triangle (reverse_triangle t)),
      rotate_triangle (rotate_triangle (reverse_triangle u)))].

Definition either_used (a b : option (list Statement)) : option (list Statement) :=
  match a with Some p => Some p | None => b end.

Definition asa_schema_used decls premises facts i j k (t u : Triangle) :=
  schema3_used decls premises facts i j k
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_b t) (angle_b u)).

Definition aas_schema_used decls premises facts i j k (t u : Triangle) :=
  either_used
    (schema3_used decls premises facts i j k
      (ConAng (angle_c t) (angle_c u))
      (ConAng (angle_b t) (angle_b u))
      (ConSeg (side_ab t) (side_ab u)))
    (schema3_used decls premises facts i j k
      (ConAng (angle_b t) (angle_b u))
      (ConAng (angle_c t) (angle_c u))
      (ConSeg (side_ab t) (side_ab u))).

Definition rhl_schema_used decls premises facts i j k (t u : Triangle) :=
  either_used
    (schema3_used decls premises facts i j k
      (ConRight (angle_b t) (angle_b u))
      (ConSeg (side_ca t) (side_ca u))
      (ConSeg (side_bc t) (side_bc u)))
    (schema3_used decls premises facts i j k
      (ConRight (angle_b t) (angle_b u))
      (ConSeg (side_bc t) (side_bc u))
      (ConSeg (side_ca t) (side_ca u))).

Definition sas_schema_used decls premises facts i j k (t u : Triangle) :=
  schema3_used decls premises facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ca t) (side_ca u)).

Definition sss_schema_used decls premises facts i j k (t u : Triangle) :=
  schema3_used decls premises facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u)).

(** Declaring [t_ABC] asserts that its vertices are noncollinear, and that is
    invariant under renaming the triangle's vertices. *)
Definition triangle_permutations (t : Triangle) : list Triangle :=
  [ triangle t.(tri_a) t.(tri_b) t.(tri_c); triangle t.(tri_a) t.(tri_c) t.(tri_b)
  ; triangle t.(tri_b) t.(tri_a) t.(tri_c); triangle t.(tri_b) t.(tri_c) t.(tri_a)
  ; triangle t.(tri_c) t.(tri_a) t.(tri_b); triangle t.(tri_c) t.(tri_b) t.(tri_a) ].

Definition triangle_declared (decls : Declarations) (t : Triangle) : bool :=
  existsb (fun d => triangle_mem t (triangle_permutations d))
          decls.(decl_triangles).

(** The same six readings [six_correspondences] searches, as data, for rules
    whose shape does not fit the three-dependency schema. *)
Definition correspondences (t u : Triangle) : list (Triangle * Triangle) :=
  let r := rotate_triangle in
  let t' := reverse_triangle t in
  let u' := reverse_triangle u in
  [ (t, u); (r t, r u); (r (r t), r (r u))
  ; (t', u'); (r t', r u'); (r (r t'), r (r u')) ].

Definition declared_pair (decls : Declarations) (t u : Triangle) : bool :=
  triangle_declared decls t && triangle_declared decls u.

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

Definition perp_con_ang (decls : Declarations) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (PerpAt s t p) =>
      match conclusion with
      | ConRight a b => perp_right_angle s t p a && perp_right_angle s t p b
      (* [Perp_at] alone forces neither ray to be nondegenerate, but a declared
         triangle spanning the angle does, and that is all [l11_16] needs. *)
      | ConAng a b =>
          perp_right_angle s t p a && perp_right_angle s t p b &&
          declared_angle decls a && declared_angle decls b
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
Definition vertical_angle_pair (decls : Declarations) (s t : Segment)
    (p : PointId) (conclusion : Statement) : bool :=
  let opposite first second :=
    declared_angle decls first && declared_angle decls second &&
    fact_eqb (ConAng first second) conclusion in
  opposite (angle s.(seg_start) p t.(seg_start))
           (angle s.(seg_end) p t.(seg_end)) ||
  opposite (angle s.(seg_start) p t.(seg_end))
           (angle s.(seg_end) p t.(seg_start)).

Definition vert_ang_premise (decls : Declarations) (label : string)
    (conclusion : Statement) (pr : Premise) : bool :=
  (String.eqb label EmptyString || String.eqb label pr.(premise_label)) &&
  match pr.(premise_statement) with
  | IntersectSeg s t p => vertical_angle_pair decls s t p conclusion
  | _ => false
  end.

Definition vert_ang (decls : Declarations) (premises : list Premise)
    (label : string) (conclusion : Statement) : bool :=
  premise_found (vert_ang_premise decls label conclusion) premises.

Definition vert_ang_witness (decls : Declarations) (premises : list Premise)
    (label : string) (conclusion : Statement) : option Statement :=
  premise_witness (vert_ang_premise decls label conclusion) premises.

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

(** Conservative converse of the angle-bisector definition.  The conclusion
    fixes both the outer angle and the named ray; the dependency must be
    exactly the two halves induced by that ray, modulo the unoriented angle
    symmetries accepted by [fact_eqb]. *)
Definition ang_bisect_conv (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | AngBisectOf a s, Some dependency =>
      let halves far :=
        ConAng (angle a.(ang_left) a.(ang_vertex) far)
               (angle far a.(ang_vertex) a.(ang_right)) in
      (ascii_eqb s.(seg_start) a.(ang_vertex) &&
        fact_eqb (halves s.(seg_end)) dependency) ||
      (ascii_eqb s.(seg_end) a.(ang_vertex) &&
        fact_eqb (halves s.(seg_start)) dependency)
  | _, _ => false
  end.

(** [def_perp] wants an [on_line] premise placing this point on this segment,
    and wants all of what [on_line] says: [perp_core_col] needs the segment
    nondegenerate as well as the point on it. *)
Definition on_line_premise (s : Segment) (p : PointId) (pr : Premise) : bool :=
  match on_line_witness pr.(premise_statement) with
  | Some (t, q) => segment_u_eqb s t && ascii_eqb p q
  | None => false
  end.

Definition on_line_premise_used (premises : list Premise) (s : Segment)
    (p : PointId) : option Statement :=
  premise_witness (on_line_premise s p) premises.

(** [midpt_conv] wants strictly less: only that the diagram puts [p] between
    the endpoints of [s].  [on_line] says that and more, but [intersect_seg]
    says it too, of each of the two segments it crosses — a crossing point lies
    between the endpoints of both.  Reading the crossing here is what lets a
    figure declared by its intersection serve a midpoint converse without also
    having to spell out an [on_line] for the same pair.

    This is deliberately not shared with [def_perp].  [intersect_seg] carries no
    nondegeneracy, so it cannot discharge [perp_core_col]'s [seg_start <>
    seg_end]; [midpt_conv] never needs that, because [Midpoint] is by definition
    the betweenness together with the congruence its dependency supplies. *)
Definition on_segment_statement (s : Segment) (p : PointId) (st : Statement)
    : bool :=
  match st with
  | OnLine t q => segment_u_eqb s t && ascii_eqb p q
  | IntersectSeg t u q =>
      (segment_u_eqb s t || segment_u_eqb s u) && ascii_eqb p q
  | _ => false
  end.

Definition on_segment_premise (s : Segment) (p : PointId) (pr : Premise) : bool :=
  on_segment_statement s p pr.(premise_statement).

Definition on_segment_premise_used (premises : list Premise) (s : Segment)
    (p : PointId) : option Statement :=
  premise_witness (on_segment_premise s p) premises.

(** Converse of the midpoint definition.  Congruent halves alone do not place
    the point between the endpoints, so this rule additionally requires a
    diagram premise that does. *)
Definition midpt_conv (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | MidptOf s p =>
      match lookup_step facts i with
      | Some dependency =>
          fact_eqb (ConSeg (segment s.(seg_start) p) (segment p s.(seg_end)))
                   dependency &&
          premise_found (on_segment_premise s p) premises
      | None => false
      end
  | _ => false
  end.

(** Two angles of a triangle determine the third.  The rule needs both
    triangles, and they are not named by the conclusion, so it searches the
    declared pairs; declaring them is also what rules out degenerate ones. *)
Definition schema2 (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i j : nat) (a b : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some x, Some y =>
      dependency_matches decls premises a x && dependency_matches decls premises b y
  | _, _ => false
  end.

Definition third_angle_at (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i j : nat) (t u : Triangle) (conclusion : Statement) : bool :=
  schema2 decls premises facts i j
    (ConAng (angle_a t) (angle_a u))
    (ConAng (angle_b t) (angle_b u)) &&
  fact_eqb (ConAng (angle_c t) (angle_c u)) conclusion.

Definition third_angle (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i j : nat) (conclusion : Statement) : bool :=
  existsb (fun t => existsb (fun u =>
      existsb (fun c => third_angle_at decls premises facts i j (fst c) (snd c) conclusion)
              (correspondences t u))
    decls.(decl_triangles)) decls.(decl_triangles).

(** Two congruent angle pairs make the triangles similar.  The audited
    similarity is the three angle congruences, so this is [third_angle] with
    the pair of triangles read off the conclusion instead of searched for, and
    all three congruences reported rather than only the new one. *)
Definition aa_sim_at (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i j : nat) (t u : Triangle) : bool :=
  schema2 decls premises facts i j
    (ConAng (angle_a t) (angle_a u))
    (ConAng (angle_b t) (angle_b u)).

Definition aa_sim (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i j : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | SimTri t u =>
      declared_pair decls t u &&
      existsb (fun c => aa_sim_at decls premises facts i j (fst c) (snd c))
              (correspondences t u)
  | _ => false
  end.

(** The two halves a midpoint cuts its segment into are congruent.  The
    perpendicularity is cited because the catalog's reason is the definition
    of a perpendicular bisector, but the halves follow from the midpoint
    alone, so nothing here rests on it. *)
Definition perp_bisector_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | ConSeg x y, Some (PerpAt _ s2 p), Some (MidptOf s q) =>
      ascii_eqb p q && segment_u_eqb s2 s &&
      segment_pair_eqb x y (segment s.(seg_start) q) (segment q s.(seg_end))
  | _, _, _ => false
  end.

Definition schema6 (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i1 i2 i3 i4 i5 i6 : nat) (a b c d e f : Statement) : bool :=
  schema3 decls premises facts i1 i2 i3 a b c &&
  schema3 decls premises facts i4 i5 i6 d e f.

(** All six corresponding parts, cited explicitly.  The dependency order fixes
    the correspondence, so the six readings of the conclusion are searched as
    they are for the other criteria. *)
Definition def_con_tri_at (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i1 i2 i3 i4 i5 i6 : nat) (t u : Triangle) : bool :=
  schema6 decls premises facts i1 i2 i3 i4 i5 i6
    (ConSeg (side_ab t) (side_ab u))
    (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u))
    (ConAng (angle_a t) (angle_a u))
    (ConAng (angle_b t) (angle_b u))
    (ConAng (angle_c t) (angle_c u)).

Definition def_con_tri (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i1 i2 i3 i4 i5 i6 : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | ConTri t u =>
      declared_pair decls t u &&
      existsb (fun c => def_con_tri_at decls premises facts i1 i2 i3 i4 i5 i6
                          (fst c) (snd c))
              (correspondences t u)
  | _ => false
  end.

(** Triangle shape statements.  Each names one declared triangle, which is
    where its nondegeneracy comes from. *)
Definition isosceles_pairs (t : Triangle) : list Statement :=
  [ ConSeg (side_ab t) (side_bc t)
  ; ConSeg (side_bc t) (side_ca t)
  ; ConSeg (side_ca t) (side_ab t) ].

Definition def_isosceles (decls : Declarations) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | IsoscelesTri t =>
      triangle_declared decls t &&
      match lookup_step facts i with
      | Some dependency =>
          existsb (fun expected => fact_eqb expected dependency)
                  (isosceles_pairs t)
      | None => false
      end
  | _ => false
  end.

(** Pons asinorum, with the apex at the first vertex of some reading of a
    declared triangle. *)
Definition base_angle_sides (t : Triangle) : Statement :=
  ConSeg (segment t.(tri_a) t.(tri_b)) (segment t.(tri_a) t.(tri_c)).
Definition base_angle_angles (t : Triangle) : Statement :=
  ConAng (angle t.(tri_a) t.(tri_b) t.(tri_c))
         (angle t.(tri_a) t.(tri_c) t.(tri_b)).

Definition apex_readings (t : Triangle) : list Triangle :=
  [t; rotate_triangle t; rotate_triangle (rotate_triangle t)].

Definition base_angle (decls : Declarations) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some dependency =>
      existsb (fun t => triangle_declared decls t &&
                        fact_eqb (base_angle_sides t) dependency &&
                        fact_eqb (base_angle_angles t) conclusion)
              (flat_map apex_readings decls.(decl_triangles))
  | None => false
  end.

Definition base_angle_conv (decls : Declarations) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some dependency =>
      existsb (fun t => triangle_declared decls t &&
                        fact_eqb (base_angle_angles t) dependency &&
                        fact_eqb (base_angle_sides t) conclusion)
              (flat_map apex_readings decls.(decl_triangles))
  | None => false
  end.

Definition def_equilateral (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i j k : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | EquilateralTri t =>
      triangle_declared decls t &&
      schema3 decls premises facts i j k
        (ConSeg (side_ab t) (side_bc t))
        (ConSeg (side_bc t) (side_ca t))
        (ConSeg (side_ca t) (side_ab t))
  | _ => false
  end.

Definition def_equiangular (decls : Declarations) (premises : list Premise)
    (facts : list Statement)
    (i j k : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | EquiangularTri t =>
      triangle_declared decls t &&
      schema3 decls premises facts i j k
        (ConAng (angle_a t) (angle_b t))
        (ConAng (angle_b t) (angle_c t))
        (ConAng (angle_c t) (angle_a t))
  | _ => false
  end.

Definition equilat_equiang (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | EquiangularTri t, Some (EquilateralTri u) => triangle_eqb t u
  | _, _ => false
  end.

Definition equiang_equilat (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | EquilateralTri t, Some (EquiangularTri u) => triangle_eqb t u
  | _, _ => false
  end.

(** Angles supplementary to congruent angles are congruent, and so are two
    supplements of the same angle. *)
Definition con_supplements (facts : list Statement) (i j k : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j, lookup_step facts k with
  | Some (Supplementary a b), Some (Supplementary c d), Some witness =>
      (fact_eqb (ConAng b d) witness && fact_eqb (ConAng a c) conclusion) ||
      (fact_eqb (ConAng b c) witness && fact_eqb (ConAng a d) conclusion) ||
      (fact_eqb (ConAng a d) witness && fact_eqb (ConAng b c) conclusion) ||
      (fact_eqb (ConAng a c) witness && fact_eqb (ConAng b d) conclusion)
  | _, _, _ => false
  end.

Definition con_supplements_same (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some (Supplementary a b), Some (Supplementary c d) =>
      (angle_u_eqb d b && fact_eqb (ConAng a c) conclusion) ||
      (angle_u_eqb c b && fact_eqb (ConAng a d) conclusion) ||
      (angle_u_eqb d a && fact_eqb (ConAng b c) conclusion) ||
      (angle_u_eqb c a && fact_eqb (ConAng b d) conclusion)
  | _, _ => false
  end.

(** The same two rules for complements.  [SAMS] in the audited meaning is
    what makes them hold: without it the shared right angle could be reached
    from either side, and a null angle would be a complement of the same
    angle a straight one is. *)
Definition con_complements (facts : list Statement) (i j k : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j, lookup_step facts k with
  | Some (Complementary a b), Some (Complementary c d), Some witness =>
      (fact_eqb (ConAng b d) witness && fact_eqb (ConAng a c) conclusion) ||
      (fact_eqb (ConAng b c) witness && fact_eqb (ConAng a d) conclusion) ||
      (fact_eqb (ConAng a d) witness && fact_eqb (ConAng b c) conclusion) ||
      (fact_eqb (ConAng a c) witness && fact_eqb (ConAng b d) conclusion)
  | _, _, _ => false
  end.

Definition con_complements_same (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some (Complementary a b), Some (Complementary c d) =>
      (angle_u_eqb d b && fact_eqb (ConAng a c) conclusion) ||
      (angle_u_eqb c b && fact_eqb (ConAng a d) conclusion) ||
      (angle_u_eqb d a && fact_eqb (ConAng b c) conclusion) ||
      (angle_u_eqb c a && fact_eqb (ConAng b d) conclusion)
  | _, _ => false
  end.

Definition def_linear_pair (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (LinearPair a b) => fact_eqb (Supplementary a b) conclusion
  | _ => false
  end.

(** A right angle at [p] whose rays reach the two lines makes them
    perpendicular at [p].  [Perp_at] additionally demands that the whole of
    each line meet at right angles, so the [on_line] premise is what lets the
    right angle be transported from the ray to the line that contains it. *)
Definition other_endpoint (c : PointId) (s : Segment) : PointId :=
  if ascii_eqb c s.(seg_start) then s.(seg_end) else s.(seg_start).

Definition def_perp_shape (u s : Segment) (p x y : PointId) : bool :=
  endpoint_of p u && endpoint_of x s && endpoint_of y u.

Definition def_perp (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | PerpAt u s p =>
      match lookup_step facts i with
      | Some (RightAng a) =>
          ascii_eqb a.(ang_vertex) p &&
          (def_perp_shape u s p a.(ang_left) a.(ang_right) ||
           def_perp_shape u s p a.(ang_right) a.(ang_left)) &&
          premise_found (on_line_premise s p) premises
      | _ => false
      end
  | _ => false
  end.

Fixpoint find_premise (label : string) (premises : list Premise) : option Statement :=
  match premises with
  | [] => None
  | p :: rest =>
      if String.eqb label p.(premise_label) then Some p.(premise_statement)
      else find_premise label rest
  end.

(** * The parallelogram family

    Well-formedness comes from a declared quadrilateral where no dependency
    supplies it; every side comparison is up to reversal and pair order,
    which the meaning-level [Par] and [Cong] permutation lemmas justify. *)
Definition declared_quadrilateral (decls : Declarations)
    (q : Quadrilateral) : bool :=
  existsb (quadrilateral_eqb q) decls.(decl_quadrilaterals).

Definition quad_side_ab (q : Quadrilateral) : Segment :=
  segment q.(quad_a) q.(quad_b).
Definition quad_side_bc (q : Quadrilateral) : Segment :=
  segment q.(quad_b) q.(quad_c).
Definition quad_side_cd (q : Quadrilateral) : Segment :=
  segment q.(quad_c) q.(quad_d).
Definition quad_side_da (q : Quadrilateral) : Segment :=
  segment q.(quad_d) q.(quad_a).
Definition quad_corner_a (q : Quadrilateral) : Angle :=
  angle q.(quad_d) q.(quad_a) q.(quad_b).
Definition quad_corner_b (q : Quadrilateral) : Angle :=
  angle q.(quad_a) q.(quad_b) q.(quad_c).
Definition quad_corner_c (q : Quadrilateral) : Angle :=
  angle q.(quad_b) q.(quad_c) q.(quad_d).
Definition quad_corner_d (q : Quadrilateral) : Angle :=
  angle q.(quad_c) q.(quad_d) q.(quad_a).

Definition quad_diagonal_ac (q : Quadrilateral) : Segment :=
  segment q.(quad_a) q.(quad_c).
Definition quad_diagonal_bd (q : Quadrilateral) : Segment :=
  segment q.(quad_b) q.(quad_d).

Definition def_parallelogram_rule (decls : Declarations)
    (facts : list Statement) (i j : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Pgram q, Some (Para s1 s2), Some (Para s3 s4) =>
      declared_quadrilateral decls q &&
      ((segment_pair_eqb s1 s2 (quad_side_ab q) (quad_side_cd q) &&
        segment_pair_eqb s3 s4 (quad_side_bc q) (quad_side_da q)) ||
       (segment_pair_eqb s1 s2 (quad_side_bc q) (quad_side_da q) &&
        segment_pair_eqb s3 s4 (quad_side_ab q) (quad_side_cd q)))
  | _, _, _ => false
  end.

Definition rectangle_pgram_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Pgram q, Some (Rect r) => quadrilateral_eqb q r
  | _, _ => false
  end.

Definition rhombus_pgram_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Pgram q, Some (Rhomb r) => quadrilateral_eqb q r
  | _, _ => false
  end.

Definition pgram_opp_sides_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConSeg s1 s2, Some (Pgram q) =>
      segment_pair_eqb s1 s2 (quad_side_ab q) (quad_side_cd q) ||
      segment_pair_eqb s1 s2 (quad_side_bc q) (quad_side_da q)
  | _, _ => false
  end.

Definition pgram_opp_angles_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConAng a b, Some (Pgram q) =>
      angle_pair_eqb a b (quad_corner_a q) (quad_corner_c q) ||
      angle_pair_eqb a b (quad_corner_b q) (quad_corner_d q)
  | _, _ => false
  end.

Definition rhombus_consec_sides_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Rhomb q, Some (Pgram r), Some (ConSeg s1 s2) =>
      quadrilateral_eqb q r &&
      (segment_pair_eqb s1 s2 (quad_side_ab q) (quad_side_bc q) ||
       segment_pair_eqb s1 s2 (quad_side_bc q) (quad_side_cd q) ||
       segment_pair_eqb s1 s2 (quad_side_cd q) (quad_side_da q) ||
       segment_pair_eqb s1 s2 (quad_side_da q) (quad_side_ab q))
  | _, _, _ => false
  end.

(** Two corners of a parallelogram that share a side are supplementary.  Only
    consecutive pairs: opposite corners are congruent instead, which is
    [pgram_opp_angs]. *)
Definition pgram_consec_angs_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (Pgram q) =>
      fact_eqb (Supplementary (quad_corner_a q) (quad_corner_b q)) conclusion ||
      fact_eqb (Supplementary (quad_corner_b q) (quad_corner_c q)) conclusion ||
      fact_eqb (Supplementary (quad_corner_c q) (quad_corner_d q)) conclusion ||
      fact_eqb (Supplementary (quad_corner_d q) (quad_corner_a q)) conclusion
  | _ => false
  end.

(** Both pairs of opposite sides congruent make a parallelogram.  The
    conclusion is a quadrilateral statement, so unlike a rule that reads one
    off a dependency this one must supply the well-formedness itself, and the
    declaration is where that comes from. *)
Definition pgram_opp_sides_conv_rule (decls : Declarations)
    (facts : list Statement) (i j : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Pgram q, Some (ConSeg a b), Some (ConSeg c d) =>
      declared_quadrilateral decls q &&
      ((segment_pair_eqb a b (quad_side_ab q) (quad_side_cd q) &&
        segment_pair_eqb c d (quad_side_bc q) (quad_side_da q)) ||
       (segment_pair_eqb a b (quad_side_bc q) (quad_side_da q) &&
        segment_pair_eqb c d (quad_side_ab q) (quad_side_cd q)))
  | _, _, _ => false
  end.

(** A kite's premise already names which pair of opposite angles it makes
    congruent -- the pair between the two pairs of congruent sides -- so the
    rule reads the conclusion straight off it. *)
Definition kite_opp_con_ang_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (KiteP _ a b) => fact_eqb (ConAng a b) conclusion
  | _ => false
  end.

(** Two corners supplementary to a third make a parallelogram: each
    supplementary pair shares a side, and that side is the transversal of the
    two the pair forces parallel.  The shared corner may sit on either side of
    either dependency, as [SuppA] is symmetric. *)
Definition consec_pair_eqb (a b : Angle) (first second : Angle) : bool :=
  fact_eqb (Supplementary first second) (Supplementary a b).

Definition pgram_consec_angs_conv_rule (decls : Declarations)
    (facts : list Statement) (i j : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Pgram q, Some (Supplementary a b), Some (Supplementary c d) =>
      let along_ab := consec_pair_eqb a b (quad_corner_a q) (quad_corner_b q) in
      let along_bc := consec_pair_eqb a b (quad_corner_b q) (quad_corner_c q) in
      let along_cd := consec_pair_eqb a b (quad_corner_c q) (quad_corner_d q) in
      let along_da := consec_pair_eqb a b (quad_corner_d q) (quad_corner_a q) in
      let along_ab' := consec_pair_eqb c d (quad_corner_a q) (quad_corner_b q) in
      let along_bc' := consec_pair_eqb c d (quad_corner_b q) (quad_corner_c q) in
      let along_cd' := consec_pair_eqb c d (quad_corner_c q) (quad_corner_d q) in
      let along_da' := consec_pair_eqb c d (quad_corner_d q) (quad_corner_a q) in
      declared_quadrilateral decls q &&
      (* one pair from each of the two side directions *)
      (((along_bc || along_da) && (along_ab' || along_cd')) ||
       ((along_ab || along_cd) && (along_bc' || along_da')))
  | _, _, _ => false
  end.

(** One right corner of a parallelogram makes it a rectangle. *)
Definition rect_pgram_ang_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Rect q, Some (RightAng a), Some (Pgram r) =>
      quadrilateral_eqb q r &&
      (angle_u_eqb a (quad_corner_a q) || angle_u_eqb a (quad_corner_b q) ||
       angle_u_eqb a (quad_corner_c q) || angle_u_eqb a (quad_corner_d q))
  | _, _, _ => false
  end.

(** The audited rhombus meaning carries a congruence chain around all four
    sides.  Expose every unordered pair, not merely adjacent pairs. *)
Definition rhombus_def_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (Rhomb q) =>
      fact_eqb (ConSeg (quad_side_ab q) (quad_side_bc q)) conclusion ||
      fact_eqb (ConSeg (quad_side_bc q) (quad_side_cd q)) conclusion ||
      fact_eqb (ConSeg (quad_side_cd q) (quad_side_da q)) conclusion ||
      fact_eqb (ConSeg (quad_side_ab q) (quad_side_cd q)) conclusion ||
      fact_eqb (ConSeg (quad_side_ab q) (quad_side_da q)) conclusion ||
      fact_eqb (ConSeg (quad_side_bc q) (quad_side_da q)) conclusion
  | _ => false
  end.

(** Each diagonal of a rhombus bisects the two corners it runs between: the
    two triangles it cuts the rhombus into have three pairs of congruent
    sides, so the halves at either end are congruent.  The conclusion names
    one corner and one diagonal, and the rule pairs them: only a corner at an
    end of the named diagonal is bisected by it.  The audited
    [AngleBisector] already reads the far endpoint of the segment as the ray
    the halves are measured to, and that endpoint is the opposite corner. *)
(** The ray may also be spelled by a point along the diagonal rather than by
    the opposite corner -- the crossing point, or a point beyond it -- which
    is how the corpus writes it when the figure labels that point.  Such a
    segment must run from the corner, its far end must name the same ray as
    the diagonal does, and it must be declared, since [out2__conga] carries
    the halves across the renaming only if that end is not the corner
    itself. *)
Definition bisector_ray (decls : Declarations) (premises : list Premise)
    (s : Segment) (vertex opposite : PointId) : bool :=
  segment_u_eqb s (segment vertex opposite) ||
  (declared_segment decls s &&
   ((ascii_eqb s.(seg_start) vertex &&
       ray_linked premises vertex opposite s.(seg_end)) ||
    (ascii_eqb s.(seg_end) vertex &&
       ray_linked premises vertex opposite s.(seg_start)))).

(** The premise that placed the far end of the ray on the diagonal, when the
    ray was not spelled as the diagonal itself. *)
Definition bisector_ray_used (decls : Declarations) (premises : list Premise)
    (s : Segment) (vertex opposite : PointId) : option Statement :=
  if segment_u_eqb s (segment vertex opposite) then None
  else if negb (declared_segment decls s) then None
  else if ascii_eqb s.(seg_start) vertex then
    ray_link_witness premises vertex opposite s.(seg_end)
  else if ascii_eqb s.(seg_end) vertex then
    ray_link_witness premises vertex opposite s.(seg_start)
  else None.

Definition rhombus_opp_bisect_rule (decls : Declarations)
    (premises : list Premise) (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | AngBisectOf a s, Some (Rhomb q) =>
      (angle_u_eqb a (quad_corner_a q) &&
         bisector_ray decls premises s q.(quad_a) q.(quad_c)) ||
      (angle_u_eqb a (quad_corner_c q) &&
         bisector_ray decls premises s q.(quad_c) q.(quad_a)) ||
      (angle_u_eqb a (quad_corner_b q) &&
         bisector_ray decls premises s q.(quad_b) q.(quad_d)) ||
      (angle_u_eqb a (quad_corner_d q) &&
         bisector_ray decls premises s q.(quad_d) q.(quad_b))
  | _, _ => false
  end.

(** The two diagonals of a rectangle are congruent -- the diagonals, and
    nothing else: a pair of opposite sides is congruent too, but that is
    [pgram_opp_sides]. *)
Definition rect_diag_con_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (Rect q) =>
      fact_eqb (ConSeg (quad_diagonal_ac q) (quad_diagonal_bd q)) conclusion
  | _ => false
  end.

(** A midpoint named on a rectangle side names the same ray from either
    endpoint as the opposite endpoint.  Unlike general ray matching this
    witness is a proved fact, rather than an unaudited diagram premise. *)
Definition midpoint_ray_linked (facts : list Statement)
    (v p q : PointId) : bool :=
  ascii_eqb p q ||
  existsb (fun st =>
    match st with
    | MidptOf s m => ascii_eqb q m && segment_u_eqb s (segment v p)
    | _ => false
    end) facts.

Definition rectangle_angle_matches (facts : list Statement)
    (expected actual : Angle) : bool :=
  ascii_eqb expected.(ang_vertex) actual.(ang_vertex) &&
  ((midpoint_ray_linked facts expected.(ang_vertex)
      expected.(ang_left) actual.(ang_left) &&
    midpoint_ray_linked facts expected.(ang_vertex)
      expected.(ang_right) actual.(ang_right)) ||
   (midpoint_ray_linked facts expected.(ang_vertex)
      expected.(ang_left) actual.(ang_right) &&
    midpoint_ray_linked facts expected.(ang_vertex)
      expected.(ang_right) actual.(ang_left))).

Definition rectangle_corner_matches (facts : list Statement)
    (q : Quadrilateral) (a : Angle) : bool :=
  rectangle_angle_matches facts (quad_corner_a q) a ||
  rectangle_angle_matches facts (quad_corner_b q) a ||
  rectangle_angle_matches facts (quad_corner_c q) a ||
  rectangle_angle_matches facts (quad_corner_d q) a.

(** A rectangle has four right, mutually congruent corners and congruent
    opposite sides.  Corner rays may be named by proved midpoints on a side. *)
Definition rectangle_def_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, conclusion with
  | Some (Rect q), ConRight a b | Some (Rect q), ConAng a b =>
      rectangle_corner_matches facts q a && rectangle_corner_matches facts q b
  | Some (Rect q), ConSeg a b =>
      segment_pair_eqb a b (quad_side_ab q) (quad_side_cd q) ||
      segment_pair_eqb a b (quad_side_bc q) (quad_side_da q)
  | _, _ => false
  end.

(** One pair of opposite sides both parallel and congruent.  The conclusion's
    declared quadrilateral supplies the crossing diagonals that separate a
    parallelogram from the crossed quadrilateral with the same side facts. *)
Definition pgram_opp_side_para_rule (decls : Declarations)
    (facts : list Statement) (i j : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Pgram q, Some (ConSeg c1 c2), Some (Para p1 p2) =>
      declared_quadrilateral decls q &&
      ((segment_pair_eqb c1 c2 (quad_side_ab q) (quad_side_cd q) &&
        segment_pair_eqb p1 p2 (quad_side_ab q) (quad_side_cd q)) ||
       (segment_pair_eqb c1 c2 (quad_side_bc q) (quad_side_da q) &&
        segment_pair_eqb p1 p2 (quad_side_bc q) (quad_side_da q)))
  | _, _, _ => false
  end.

(** Both pairs of opposite corners congruent make a quadrilateral a
    parallelogram.  As with the other converses the conclusion is a
    quadrilateral statement, so the declaration is what supplies its
    well-formedness. *)
Definition pgram_opp_angs_conv_rule (decls : Declarations)
    (facts : list Statement) (i j : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Pgram q, Some (ConAng a1 b1), Some (ConAng a2 b2) =>
      declared_quadrilateral decls q &&
      ((angle_pair_eqb a1 b1 (quad_corner_a q) (quad_corner_c q) &&
        angle_pair_eqb a2 b2 (quad_corner_b q) (quad_corner_d q)) ||
       (angle_pair_eqb a1 b1 (quad_corner_b q) (quad_corner_d q) &&
        angle_pair_eqb a2 b2 (quad_corner_a q) (quad_corner_c q)))
  | _, _, _ => false
  end.

(** Congruent diagonals in a parallelogram make it a rectangle. *)
Definition rect_diag_con_conv_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Rect q, Some (ConSeg s1 s2), Some (Pgram r) =>
      quadrilateral_eqb q r &&
      segment_pair_eqb s1 s2 (quad_diagonal_ac q) (quad_diagonal_bd q)
  | _, _, _ => false
  end.

(** Perpendicular diagonals in a parallelogram make it a rhombus.  Only the
    two lines matter, so where the perpendicularity premise puts their meeting
    point is left alone: [Perp_at] already places it on both. *)
Definition rhombus_diag_perp_conv_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Rhomb q, Some (PerpAt s1 s2 _), Some (Pgram r) =>
      quadrilateral_eqb q r &&
      ((segment_u_eqb s1 (quad_diagonal_ac q) &&
        segment_u_eqb s2 (quad_diagonal_bd q)) ||
       (segment_u_eqb s1 (quad_diagonal_bd q) &&
        segment_u_eqb s2 (quad_diagonal_ac q)))
  | _, _, _ => false
  end.

(** Diagonals that bisect each other make a parallelogram.  As with the other
    converses the conclusion is a quadrilateral statement, so the declaration
    supplies the well-formedness the dependencies cannot. *)
Definition pgram_diag_bisect_conv_rule (decls : Declarations)
    (facts : list Statement) (i j : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Pgram q, Some (SegBisectOf b1 t1 p), Some (SegBisectOf b2 t2 p') =>
      declared_quadrilateral decls q && ascii_eqb p p' &&
      ((segment_u_eqb b1 (quad_diagonal_ac q) &&
        segment_u_eqb t1 (quad_diagonal_bd q) &&
        segment_u_eqb b2 (quad_diagonal_bd q) &&
        segment_u_eqb t2 (quad_diagonal_ac q)) ||
       (segment_u_eqb b1 (quad_diagonal_bd q) &&
        segment_u_eqb t1 (quad_diagonal_ac q) &&
        segment_u_eqb b2 (quad_diagonal_ac q) &&
        segment_u_eqb t2 (quad_diagonal_bd q)))
  | _, _, _ => false
  end.

(** A diagonal bisecting the corners it runs between makes a parallelogram a
    rhombus.  Reading the figure from each corner in turn is what
    [quad_rotations] is for: the audited parallelogram says the same thing
    about every rotation of its name.  One bisected corner is already enough
    for the geometry, but the reason is stated of a *pair* of opposite
    corners, so the rule asks for both rather than letting one premise be
    cited twice. *)
Definition rotate_quad (q : Quadrilateral) : Quadrilateral :=
  quadrilateral q.(quad_b) q.(quad_c) q.(quad_d) q.(quad_a).

Definition quad_rotations (q : Quadrilateral) : list Quadrilateral :=
  [q; rotate_quad q; rotate_quad (rotate_quad q);
   rotate_quad (rotate_quad (rotate_quad q))].

Definition bisector_at_corner (a : Angle) (s : Segment)
    (r : Quadrilateral) : bool :=
  angle_u_eqb a (quad_corner_a r) && segment_u_eqb s (quad_diagonal_ac r).

Definition rhombus_opp_bisect_conv_rule (facts : list Statement) (i j k : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j,
        lookup_step facts k with
  | Rhomb q, Some (AngBisectOf a1 s1), Some (AngBisectOf a2 s2), Some (Pgram r) =>
      quadrilateral_eqb q r &&
      existsb (fun rot =>
                 bisector_at_corner a1 s1 rot &&
                 bisector_at_corner a2 s2 (rotate_quad (rotate_quad rot)))
              (quad_rotations q)
  | _, _, _, _ => false
  end.

(** A trapezoid with congruent diagonals is isosceles.  That is the audited
    meaning of [isos_trapezoid] itself, so the rule is the two dependencies
    put side by side. *)
Definition isos_trap_con_diags_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | IsosTrap q, Some (ConSeg s1 s2), Some (TrapPremise r _ _) =>
      quadrilateral_eqb q r &&
      segment_pair_eqb s1 s2 (quad_diagonal_ac q) (quad_diagonal_bd q)
  | _, _, _ => false
  end.

(** Congruent base angles make a trapezoid isosceles -- congruent diagonals
    being what the audited [isos_trapezoid] means. *)
Definition isos_trap_base_angs_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | IsosTrap q, Some (ConAng a b), Some (TrapPremise r s1 s2) =>
      quadrilateral_eqb q r &&
      ((segment_pair_eqb s1 s2 (quad_side_ab q) (quad_side_cd q) &&
        (angle_pair_eqb a b (quad_corner_a q) (quad_corner_b q) ||
         angle_pair_eqb a b (quad_corner_c q) (quad_corner_d q))) ||
       (segment_pair_eqb s1 s2 (quad_side_bc q) (quad_side_da q) &&
        (angle_pair_eqb a b (quad_corner_b q) (quad_corner_c q) ||
         angle_pair_eqb a b (quad_corner_d q) (quad_corner_a q))))
  | _, _, _ => false
  end.

(** An isosceles trapezoid's base angles are congruent -- at either end of
    whichever pair of sides the premise names parallel. *)
Definition isos_trap_base_angs_conv_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConAng a b, Some (IsosTrapPremise q s1 s2) =>
      (segment_pair_eqb s1 s2 (quad_side_ab q) (quad_side_cd q) &&
       (angle_pair_eqb a b (quad_corner_a q) (quad_corner_b q) ||
        angle_pair_eqb a b (quad_corner_c q) (quad_corner_d q))) ||
      (segment_pair_eqb s1 s2 (quad_side_bc q) (quad_side_da q) &&
       (angle_pair_eqb a b (quad_corner_b q) (quad_corner_c q) ||
        angle_pair_eqb a b (quad_corner_d q) (quad_corner_a q)))
  | _, _ => false
  end.

(** * The parallel-line family

    Every rule reads the drawn configuration from the transversal diagram
    premise, the way [vert_ang] reads the crossing, and matches its named
    angles against the figure's labeled points up to reversal and pair
    order. *)
Definition transversal_witness (s : Statement)
  : option (PointId * PointId * PointId * PointId *
            PointId * PointId * PointId * PointId) :=
  match s with
  | Transv a b t1 i1 c d t2 i2 => Some (a, b, t1, i1, c, d, t2, i2)
  | _ => None
  end.

Definition transversal_premise
    (check : PointId -> PointId -> PointId -> PointId ->
             PointId -> PointId -> PointId -> PointId -> bool)
    (pr : Premise) : bool :=
  match transversal_witness pr.(premise_statement) with
  | Some (a, b, t1, i1, c, d, t2, i2) => check a b t1 i1 c d t2 i2
  | None => false
  end.

Definition transversal_premise_check
    (check : PointId -> PointId -> PointId -> PointId ->
             PointId -> PointId -> PointId -> PointId -> bool)
    (premises : list Premise) : bool :=
  premise_found (transversal_premise check) premises.

Definition transversal_premise_used
    (check : PointId -> PointId -> PointId -> PointId ->
             PointId -> PointId -> PointId -> PointId -> bool)
    (premises : list Premise) : option Statement :=
  premise_witness (transversal_premise check) premises.

(** A segment names a transversal's line when it matches, up to reversal,
    the flanking pair or either flank joined to the crossing point, which the
    audited configuration places on the same line.  The crossing-point
    spellings are what let a corner figure — a line whose natural segment
    name *ends* at its crossing — cite that line. *)
Definition line_name_matches (s : Segment) (a b i1 : PointId) : bool :=
  segment_u_eqb s (segment a b) ||
  segment_u_eqb s (segment a i1) ||
  segment_u_eqb s (segment i1 b).

Definition transversal_lines_match (s1 s2 : Segment)
    (a b i1 c d i2 : PointId) : bool :=
  (line_name_matches s1 a b i1 && line_name_matches s2 c d i2) ||
  (line_name_matches s2 a b i1 && line_name_matches s1 c d i2).

(** A historical proof may name a transversal ray by an interior point
    supplied by [on_line], [midpt], or [intersect_seg].  This matcher is used
    when the transversal configuration itself supplies nondegeneracy. *)
Definition angle_ray_spelling (premises : list Premise)
    (expected actual : Angle) : bool :=
  ascii_eqb expected.(ang_vertex) actual.(ang_vertex) &&
  ((ray_linked premises expected.(ang_vertex)
      expected.(ang_left) actual.(ang_left) &&
    ray_linked premises expected.(ang_vertex)
      expected.(ang_right) actual.(ang_right)) ||
   (ray_linked premises expected.(ang_vertex)
      expected.(ang_left) actual.(ang_right) &&
    ray_linked premises expected.(ang_vertex)
      expected.(ang_right) actual.(ang_left))).

Definition conga_ray_pair (premises : list Premise)
    (expected1 expected2 actual1 actual2 : Angle) : bool :=
  (angle_ray_spelling premises expected1 actual1 &&
   angle_ray_spelling premises expected2 actual2) ||
  (angle_ray_spelling premises expected1 actual2 &&
   angle_ray_spelling premises expected2 actual1).

Definition altint_pair (a b i1 c d i2 : PointId) (x y : Angle) : bool :=
  angle_pair_eqb x y (angle a i1 i2) (angle d i2 i1) ||
  angle_pair_eqb x y (angle b i1 i2) (angle c i2 i1).
Definition altext_pair (a b t1 i1 c d t2 i2 : PointId) (x y : Angle) : bool :=
  angle_pair_eqb x y (angle t1 i1 a) (angle t2 i2 d) ||
  angle_pair_eqb x y (angle t1 i1 b) (angle t2 i2 c).
Definition corresp_pair (a b t1 i1 c d t2 i2 : PointId) (x y : Angle) : bool :=
  angle_pair_eqb x y (angle i2 i1 b) (angle t2 i2 d) ||
  angle_pair_eqb x y (angle i2 i1 a) (angle t2 i2 c) ||
  angle_pair_eqb x y (angle t1 i1 a) (angle i1 i2 c) ||
  angle_pair_eqb x y (angle t1 i1 b) (angle i1 i2 d).
Definition sameside_pair (a b i1 c d i2 : PointId) (x y : Angle) : bool :=
  angle_pair_eqb x y (angle b i1 i2) (angle i1 i2 d) ||
  angle_pair_eqb x y (angle a i1 i2) (angle i1 i2 c).

Definition altint_check (s1 s2 : Segment) (x y : Angle)
    (a b t1 i1 c d t2 i2 : PointId) : bool :=
  transversal_lines_match s1 s2 a b i1 c d i2 && altint_pair a b i1 c d i2 x y.

Definition altint_rule (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConAng x y, Some (Para s1 s2) =>
      transversal_premise_check (altint_check s1 s2 x y) premises
  | _, _ => false
  end.

Definition altext_check (s1 s2 : Segment) (x y : Angle)
    (a b t1 i1 c d t2 i2 : PointId) : bool :=
  transversal_lines_match s1 s2 a b i1 c d i2 && altext_pair a b t1 i1 c d t2 i2 x y.

Definition altext_rule (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConAng x y, Some (Para s1 s2) =>
      transversal_premise_check (altext_check s1 s2 x y) premises
  | _, _ => false
  end.

Definition corresp_ang_check (s1 s2 : Segment) (x y : Angle)
    (a b t1 i1 c d t2 i2 : PointId) : bool :=
  transversal_lines_match s1 s2 a b i1 c d i2 && corresp_pair a b t1 i1 c d t2 i2 x y.

Definition corresp_ang_rule (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConAng x y, Some (Para s1 s2) =>
      transversal_premise_check (corresp_ang_check s1 s2 x y) premises
  | _, _ => false
  end.

Definition sameside_ang_check (s1 s2 : Segment) (x y : Angle)
    (a b t1 i1 c d t2 i2 : PointId) : bool :=
  transversal_lines_match s1 s2 a b i1 c d i2 && sameside_pair a b i1 c d i2 x y.

Definition sameside_ang_rule (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Supplementary x y, Some (Para s1 s2) =>
      transversal_premise_check (sameside_ang_check s1 s2 x y) premises
  | _, _ => false
  end.

Definition altint_conv_check (premises : list Premise) (s1 s2 : Segment)
    (x y : Angle) (a b t1 i1 c d t2 i2 : PointId) : bool :=
  transversal_lines_match s1 s2 a b i1 c d i2 &&
  (altint_pair a b i1 c d i2 x y ||
   conga_ray_pair premises (angle a i1 i2) (angle d i2 i1) x y ||
   conga_ray_pair premises (angle b i1 i2) (angle c i2 i1) x y).

Definition altint_conv_rule (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Para s1 s2, Some (ConAng x y) =>
      transversal_premise_check (altint_conv_check premises s1 s2 x y) premises
  | _, _ => false
  end.

Definition altext_conv_rule (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Para s1 s2, Some (ConAng x y) =>
      transversal_premise_check (altext_check s1 s2 x y) premises
  | _, _ => false
  end.

Definition corresp_ang_conv_rule (premises : list Premise)
    (facts : list Statement) (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Para s1 s2, Some (ConAng x y) =>
      transversal_premise_check (corresp_ang_check s1 s2 x y) premises
  | _, _ => false
  end.

Definition sameside_ang_conv_rule (premises : list Premise)
    (facts : list Statement) (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Para s1 s2, Some (Supplementary x y) =>
      transversal_premise_check (sameside_ang_check s1 s2 x y) premises
  | _, _ => false
  end.

Definition para_transitive_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Para s1 s2, Some (Para u1 u2), Some (Para v1 v2) =>
      (segment_u_eqb u2 v1 && segment_pair_eqb s1 s2 u1 v2) ||
      (segment_u_eqb u2 v2 && segment_pair_eqb s1 s2 u1 v1) ||
      (segment_u_eqb u1 v1 && segment_pair_eqb s1 s2 u2 v2) ||
      (segment_u_eqb u1 v2 && segment_pair_eqb s1 s2 u2 v1)
  | _, _, _ => false
  end.

(** * The sphere-safe circle family

    These rules are sound for the audited meanings in Euclidean models of
    every dimension: none of them compares angles at distinct circle points,
    which is the operation that fails on a sphere and stays deferred. *)
Definition inscribed_witness (s : Statement) : option (Circle * Angle) :=
  match s with InscribedAngleOf c a => Some (c, a) | _ => None end.

Definition def_radius_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConSeg s1 s2, Some (RadiusOf c p) =>
      segment_pair_eqb s1 s2 (segment c.(circle_c) p)
                             (segment c.(circle_c) c.(circle_r))
  | _, _ => false
  end.

(** The angle sits in a semicircle: its two ray points name the diameter's
    endpoints, and an [inscribed_angle] diagram premise places its vertex on
    the circle. *)
Definition inscribed_angle_premise (c : Circle) (a : Angle) (pr : Premise) : bool :=
  match inscribed_witness pr.(premise_statement) with
  | Some (c', a') => circle_eqb c c' && angle_u_eqb a a'
  | None => false
  end.

Definition inscribed_angle_premise_used (premises : list Premise) (c : Circle)
    (a : Angle) : option Statement :=
  premise_witness (inscribed_angle_premise c a) premises.

Definition inscribed_semi_rule (premises : list Premise)
    (facts : list Statement) (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | RightAng a, Some (DiameterOf c s) =>
      segment_u_eqb (segment a.(ang_left) a.(ang_right)) s &&
      premise_found (inscribed_angle_premise c a) premises
  | _, _ => false
  end.

Definition con_chords_arcs_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConSeg s1 s2, Some (ConArc x y) =>
      segment_pair_eqb s1 s2 (segment x.(arc_p1) x.(arc_p2))
                             (segment y.(arc_p1) y.(arc_p2))
  | _, _ => false
  end.

(** The radius dependency names the point of tangency, anchoring the radius
    segment's spelling; the tangent fact itself carries the geometry. *)
Definition tangent_perp_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | PerpAt s1 s2 q, Some (TangentAt c s p), Some (RadiusOf c' p') =>
      circle_eqb c c' && ascii_eqb p' p && ascii_eqb q p &&
      ((segment_u_eqb s1 s && segment_u_eqb s2 (segment c.(circle_c) p)) ||
       (segment_u_eqb s2 s && segment_u_eqb s1 (segment c.(circle_c) p)))
  | _, _, _ => false
  end.

(** The converse.  The audited tangent meaning is exactly this figure -- the
    point of tangency on the circle, the segment through it, and the right
    angle to the radius -- so the rule assembles it from the perpendicularity
    and the radius rather than deriving anything.  The point of tangency has
    to be an endpoint of the tangent segment, which is where the segment's own
    nondegeneracy comes back as the [Q <> p] the meaning asks for. *)
Definition tangent_perp_conv_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | TangentAt c s p, Some (PerpAt s1 s2 q), Some (RadiusOf c' p') =>
      circle_eqb c c' && ascii_eqb p' p && ascii_eqb q p && endpoint_of p s &&
      ((segment_u_eqb s1 s && segment_u_eqb s2 (segment c.(circle_c) p)) ||
       (segment_u_eqb s2 s && segment_u_eqb s1 (segment c.(circle_c) p)))
  | _, _, _ => false
  end.

(** Two tangents drawn to one circle from one outside point are congruent.
    Each dependency carries its own right angle to a radius; the shared far
    endpoint is what makes the two right triangles comparable. *)
Definition con_tangents_ext_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | ConSeg x y, Some (TangentAt c s p), Some (TangentAt c' s' p') =>
      let e := other_endpoint p s in
      circle_eqb c c' &&
      segment_u_eqb s (segment p e) && segment_u_eqb s' (segment p' e) &&
      segment_pair_eqb x y (segment p e) (segment p' e)
  | _, _, _ => false
  end.

(** A radius perpendicular to a chord bisects it.  The perpendicularity names
    the foot, and both the concluded bisector and the perpendicular's own
    first segment have to run from the centre to it; the chord dependency is
    what puts the chord's two endpoints the same distance away.  The radius
    dependency names the circle and nothing else -- the point it carries is
    free, as the corpus writes it (`radius(c_OR, R)` for a chord of `c_OR`
    met at `M`). *)
Definition radius_chord_bisect_rule (facts : list Statement) (i j k : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j,
        lookup_step facts k with
  | SegBisectOf b t p, Some (PerpAt s1 s2 q), Some (RadiusOf c _),
    Some (ChordOf c' ch) =>
      circle_eqb c c' && ascii_eqb q p &&
      segment_u_eqb b (segment c.(circle_c) p) &&
      segment_u_eqb s1 (segment c.(circle_c) p) &&
      segment_u_eqb t ch && segment_u_eqb s2 ch
  | _, _, _, _ => false
  end.

(** Which diagram premises a step actually consulted.  Each entry comes from
    the same search the rule itself runs -- the rule is [premise_found] of it
    and this is [premise_witness] of it -- so the report cannot claim a premise
    the rule did not use, nor miss one it did.

    Rules that reach the diagram only through dependency matching, where a
    triangle criterion transports an angle along an [on_line] premise, are not
    covered: the premise is consumed several layers down inside a search over
    correspondences, and no witness comes back out.  Those steps report no
    diagram premises rather than a guess. *)
(** Two dependencies of one step may lean on the same premise; the step used
    it once. *)
Fixpoint dedup_statements (seen : list Statement) (rest : list Statement)
    : list Statement :=
  match rest with
  | [] => []
  | s :: tail =>
      if existsb (statement_eqb s) seen
      then dedup_statements seen tail
      else s :: dedup_statements (s :: seen) tail
  end.

Definition rule_diagram_premises_raw (decls : Declarations)
    (premises : list Premise) (facts : list Statement) (reason : Reason)
    (conclusion : Statement) : list Statement :=
  let one := fun (w : option Statement) =>
    match w with Some s => [s] | None => [] end in
  let all := fun (w : option (list Statement)) =>
    match w with Some ss => ss | None => [] end in
  let transversal := fun (check : PointId -> PointId -> PointId -> PointId ->
                                  PointId -> PointId -> PointId -> PointId -> bool) =>
    one (transversal_premise_used check premises) in
  let dependency := fun (i : nat) => lookup_step facts i in
  match reason with
  | VertAng label => one (vert_ang_witness decls premises label conclusion)
  (* A triangle criterion reaches the diagram when it transports an angle
     along an [on_line] premise to match a dependency; the correspondence
     search returns the premises whichever reading won. *)
  | SAS i j k =>
      match conclusion with
      | ConTri t u =>
          all (six_correspondences_used sas_schema_used decls premises facts
                 i j k t u)
      | _ => []
      end
  | SSS i j k =>
      match conclusion with
      | ConTri t u =>
          all (six_correspondences_used sss_schema_used decls premises facts
                 i j k t u)
      | _ => []
      end
  | ASA i j k =>
      match conclusion with
      | ConTri t u =>
          all (six_correspondences_used asa_schema_used decls premises facts
                 i j k t u)
      | _ => []
      end
  | AAS i j k =>
      match conclusion with
      | ConTri t u =>
          all (six_correspondences_used aas_schema_used decls premises facts
                 i j k t u)
      | _ => []
      end
  | RHL i j k =>
      match conclusion with
      | ConTri t u =>
          all (six_correspondences_used rhl_schema_used decls premises facts
                 i j k t u)
      | _ => []
      end
  | InscribedSemi i =>
      match conclusion, dependency i with
      | RightAng a, Some (DiameterOf c _) =>
          one (inscribed_angle_premise_used premises c a)
      | _, _ => []
      end
  | RhombusOppBisect i =>
      match conclusion, dependency i with
      | AngBisectOf a s, Some (Rhomb q) =>
          (* the same four corner readings the rule tries, in the same order *)
          if angle_u_eqb a (quad_corner_a q) then
            one (bisector_ray_used decls premises s q.(quad_a) q.(quad_c))
          else if angle_u_eqb a (quad_corner_c q) then
            one (bisector_ray_used decls premises s q.(quad_c) q.(quad_a))
          else if angle_u_eqb a (quad_corner_b q) then
            one (bisector_ray_used decls premises s q.(quad_b) q.(quad_d))
          else if angle_u_eqb a (quad_corner_d q) then
            one (bisector_ray_used decls premises s q.(quad_d) q.(quad_b))
          else []
      | _, _ => []
      end
  | MidptConv _ =>
      match conclusion with
      | MidptOf s p => one (on_segment_premise_used premises s p)
      | _ => []
      end
  | DefPerp _ =>
      match conclusion with
      | PerpAt _ s p => one (on_line_premise_used premises s p)
      | _ => []
      end
  | AltInt i =>
      match conclusion, dependency i with
      | ConAng x y, Some (Para s1 s2) => transversal (altint_check s1 s2 x y)
      | _, _ => []
      end
  | AltExt i =>
      match conclusion, dependency i with
      | ConAng x y, Some (Para s1 s2) => transversal (altext_check s1 s2 x y)
      | _, _ => []
      end
  | CorrespAng i =>
      match conclusion, dependency i with
      | ConAng x y, Some (Para s1 s2) => transversal (corresp_ang_check s1 s2 x y)
      | _, _ => []
      end
  | SamesideAng i =>
      match conclusion, dependency i with
      | Supplementary x y, Some (Para s1 s2) =>
          transversal (sameside_ang_check s1 s2 x y)
      | _, _ => []
      end
  | AltIntConv i =>
      match conclusion, dependency i with
      | Para s1 s2, Some (ConAng x y) =>
          transversal (altint_conv_check premises s1 s2 x y)
      | _, _ => []
      end
  | AltExtConv i =>
      match conclusion, dependency i with
      | Para s1 s2, Some (ConAng x y) => transversal (altext_check s1 s2 x y)
      | _, _ => []
      end
  | CorrespAngConv i =>
      match conclusion, dependency i with
      | Para s1 s2, Some (ConAng x y) => transversal (corresp_ang_check s1 s2 x y)
      | _, _ => []
      end
  | SamesideAngConv i =>
      match conclusion, dependency i with
      | Para s1 s2, Some (Supplementary x y) =>
          transversal (sameside_ang_check s1 s2 x y)
      | _, _ => []
      end
  | _ => []
  end.

Definition rule_diagram_premises (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (reason : Reason) (conclusion : Statement)
    : list Statement :=
  dedup_statements []
    (rule_diagram_premises_raw decls premises facts reason conclusion).

Definition rule_valid (decls : Declarations) (premises : list Premise)
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
      (* An angle is congruent to itself once its rays are known to be
         nondegenerate, which a declaration supplies. *)
      | RefAng a b => angle_u_eqb a b && declared_angle decls a
      | _ => false
      end
  | SAS i j k =>
      match conclusion with
      | ConTri t u => declared_pair decls t u &&
          six_correspondences sas_schema decls premises facts i j k t u
      | _ => false
      end
  | SSS i j k =>
      match conclusion with
      | ConTri t u => declared_pair decls t u &&
          six_correspondences sss_schema decls premises facts i j k t u
      | _ => false
      end
  | ASA i j k =>
      match conclusion with
      | ConTri t u => declared_pair decls t u &&
          six_correspondences asa_schema decls premises facts i j k t u
      | _ => false
      end
  | AAS i j k =>
      match conclusion with
      | ConTri t u => declared_pair decls t u &&
          six_correspondences aas_schema decls premises facts i j k t u
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
  | PerpConAng i => perp_con_ang decls facts i conclusion
  | DefMidpt i => def_midpt facts i conclusion
  | VertAng label => vert_ang decls premises label conclusion
  | DefAngBisect i => def_ang_bisect facts i conclusion
  | AngBisectConv i => ang_bisect_conv facts i conclusion
  | MidptConv i => midpt_conv premises facts i conclusion
  | ThirdAngle i j => third_angle decls premises facts i j conclusion
  | DefConTri i1 i2 i3 i4 i5 i6 =>
      def_con_tri decls premises facts i1 i2 i3 i4 i5 i6 conclusion
  | DefIsosceles i => def_isosceles decls facts i conclusion
  | BaseAngle i => base_angle decls facts i conclusion
  | BaseAngleConv i => base_angle_conv decls facts i conclusion
  | DefEquilateral i j k => def_equilateral decls premises facts i j k conclusion
  | DefEquiangular i j k => def_equiangular decls premises facts i j k conclusion
  | EquilatEquiang i => equilat_equiang facts i conclusion
  | EquiangEquilat i => equiang_equilat facts i conclusion
  | ConSupplements i j k => con_supplements facts i j k conclusion
  | ConSupplementsSame i j => con_supplements_same facts i j conclusion
  | ConComplements i j k => con_complements facts i j k conclusion
  | ConComplementsSame i j => con_complements_same facts i j conclusion
  | DefLinearPair i => def_linear_pair facts i conclusion
  | DefPerp i => def_perp premises facts i conclusion
  | DefParallelogram i j => def_parallelogram_rule decls facts i j conclusion
  | PgramOppSides i => pgram_opp_sides_rule facts i conclusion
  | PgramOppAngles i => pgram_opp_angles_rule facts i conclusion
  | PgramConsecAngs i => pgram_consec_angs_rule facts i conclusion
  | KiteOppConAng i => kite_opp_con_ang_rule facts i conclusion
  | PgramOppSidesConv i j => pgram_opp_sides_conv_rule decls facts i j conclusion
  | PgramConsecAngsConv i j =>
      pgram_consec_angs_conv_rule decls facts i j conclusion
  | RectPgramAng i j => rect_pgram_ang_rule facts i j conclusion
  | PgramOppSidePara i j => pgram_opp_side_para_rule decls facts i j conclusion
  | RectanglePgram i => rectangle_pgram_rule facts i conclusion
  | RhombusPgram i => rhombus_pgram_rule facts i conclusion
  | RhombusConsecSides i j => rhombus_consec_sides_rule facts i j conclusion
  | RhombusDef i => rhombus_def_rule facts i conclusion
  | RhombusOppBisect i =>
      rhombus_opp_bisect_rule decls premises facts i conclusion
  | RectDiagCon i => rect_diag_con_rule facts i conclusion
  | RectangleDef i => rectangle_def_rule facts i conclusion
  | AltInt i => altint_rule premises facts i conclusion
  | AltExt i => altext_rule premises facts i conclusion
  | CorrespAng i => corresp_ang_rule premises facts i conclusion
  | SamesideAng i => sameside_ang_rule premises facts i conclusion
  | AltIntConv i => altint_conv_rule premises facts i conclusion
  | AltExtConv i => altext_conv_rule premises facts i conclusion
  | CorrespAngConv i => corresp_ang_conv_rule premises facts i conclusion
  | SamesideAngConv i => sameside_ang_conv_rule premises facts i conclusion
  | ParaTrans i j => para_transitive_rule facts i j conclusion
  | DefRadius i => def_radius_rule facts i conclusion
  | InscribedSemi i => inscribed_semi_rule premises facts i conclusion
  | ConChordsArcs i => con_chords_arcs_rule facts i conclusion
  | TangentPerp i j => tangent_perp_rule facts i j conclusion
  | TangentPerpConv i j => tangent_perp_conv_rule facts i j conclusion
  | ConTangentsExt i j => con_tangents_ext_rule facts i j conclusion
  | RadiusChordBisect i j k => radius_chord_bisect_rule facts i j k conclusion
  | PerpBisect i j => perp_bisector_rule facts i j conclusion
  | IsosTrapConDiags i j => isos_trap_con_diags_rule facts i j conclusion
  | IsosTrapBaseAngs i j => isos_trap_base_angs_rule facts i j conclusion
  | IsosTrapBaseAngsConv i =>
      isos_trap_base_angs_conv_rule facts i conclusion
  | PgramDiagBisectConv i j =>
      pgram_diag_bisect_conv_rule decls facts i j conclusion
  | PgramOppAngsConv i j => pgram_opp_angs_conv_rule decls facts i j conclusion
  | RectDiagConConv i j => rect_diag_con_conv_rule facts i j conclusion
  | RhombusDiagPerpConv i j =>
      rhombus_diag_perp_conv_rule facts i j conclusion
  | RhombusOppBisectConv i j k =>
      rhombus_opp_bisect_conv_rule facts i j k conclusion
  | AASim i j => aa_sim decls premises facts i j conclusion
  | RHL i j k =>
      match conclusion with
      | ConTri t u => declared_pair decls t u &&
          six_correspondences rhl_schema decls premises facts i j k t u
      | _ => false
      end
  end.

Fixpoint check_steps decls premises facts steps : option (list Statement) :=
  match steps with
  | [] => Some facts
  | s :: rest =>
      if rule_valid decls premises facts s.(step_reason) s.(step_conclusion)
      then check_steps decls premises (facts ++ [s.(step_conclusion)]) rest
      else None
  end.

(** The goal is closed by any derived fact carrying the same geometry, under
    exactly the spellings step-to-step matching accepts: segments and angles
    up to reversal, symmetric pairs up to swap, and [ref_*] facts standing in
    for their [con_*] forms.  [fact_eqb_sound] is the justification, and it
    keeps [con_tri] ordered-exact, as the correspondence semantics demand. *)
Definition check_problem (p : Problem) : bool :=
  match check_steps p.(problem_declarations) p.(problem_premises) [] p.(problem_steps) with
  | Some facts => existsb (fact_eqb p.(problem_goal)) facts
  | None => false
  end.

Section Soundness.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : PointId -> Tpoint.

Notation Interp := (interp_statement point).

Lemma perp_at_realign : forall a b c d p q,
  segment_u_eqb a c = true -> segment_u_eqb b d = true ->
  ascii_eqb p q = true ->
  (Interp (PerpAt a b p) <-> Interp (PerpAt c d q)).
Proof.
  intros a b c d p q Ha Hb Hp. unfold ascii_eqb in Hp.
  apply Ascii.eqb_eq in Hp. subst q.
  apply segment_u_eqb_cases in Ha. apply segment_u_eqb_cases in Hb.
  destruct Ha as [Ha|Ha]; destruct Hb as [Hb|Hb]; subst;
    unfold reverse_segment; cbn; split; intro H;
    solve [ assumption
          | now apply perp_in_left_comm | now apply perp_in_right_comm
          | now apply perp_in_comm ].
Qed.

(** The bisector's own line and the segment it halves are both unoriented:
    [Col] does not care about the order of the first two points, and
    [Midpoint] survives swapping the two endpoints. *)
Lemma seg_bisect_realign : forall a b c d p q,
  segment_u_eqb a c = true -> segment_u_eqb b d = true ->
  ascii_eqb p q = true ->
  (Interp (SegBisectOf a b p) <-> Interp (SegBisectOf c d q)).
Proof.
  intros a b c d p q Ha Hb Hp. unfold ascii_eqb in Hp.
  apply Ascii.eqb_eq in Hp. subst q.
  apply segment_u_eqb_cases in Ha. apply segment_u_eqb_cases in Hb.
  destruct Ha as [Ha|Ha]; destruct Hb as [Hb|Hb]; subst;
    unfold reverse_segment; cbn;
    split; intros [Hne [Hcol Hmid]];
    (split; [solve [exact Hne | now apply not_eq_sym]|]);
    (split; [solve [Col]|solve [exact Hmid | now apply l7_2]]).
Qed.

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
  assert (Hsupp : forall a b c d, angle_pair_eqb a b c d = true ->
      (Interp (Supplementary a b) <-> Interp (Supplementary c d))).
  { intros a b c d H. unfold angle_pair_eqb in H. apply orb_true_iff in H.
    destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
      apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
      destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
      unfold reverse_angle; cbn; split; intro Hs;
      solve [ assumption
            | now apply suppa_sym
            | now apply suppa_left_comm | now apply suppa_right_comm
            | now apply suppa_comm
            | now apply suppa_left_comm, suppa_sym
            | now apply suppa_right_comm, suppa_sym
            | now apply suppa_comm, suppa_sym
            | now apply suppa_sym, suppa_left_comm
            | now apply suppa_sym, suppa_right_comm
            | now apply suppa_sym, suppa_comm ]. }
  assert (Hcomp : forall a b c d, angle_pair_eqb a b c d = true ->
      (Interp (Complementary a b) <-> Interp (Complementary c d))).
  { assert (Hsym : forall x y : Angle, x = y \/ x = reverse_angle y ->
        y = x \/ y = reverse_angle x).
    { intros x y [Heq|Heq]; subst; [now left|right; destruct y; reflexivity]. }
    assert (Hswap : forall a b,
        Interp (Complementary a b) -> Interp (Complementary b a)).
    { intros a b [X [Y [Z [Hper [Hsams Hsuma]]]]]. exists X, Y, Z.
      split; [exact Hper|split; [now apply sams_sym|now apply suma_sym]]. }
    assert (Hone : forall a b c d,
        (a = c \/ a = reverse_angle c) -> (b = d \/ b = reverse_angle d) ->
        Interp (Complementary a b) -> Interp (Complementary c d)).
    { intros a b c d Ha Hb [X [Y [Z [Hper [Hsams Hsuma]]]]].
      exists X, Y, Z. split; [exact Hper|].
      destruct Ha as [Ha|Ha]; destruct Hb as [Hb|Hb]; subst;
        unfold reverse_angle in Hsams, Hsuma; cbn in Hsams, Hsuma |- *;
        split;
        solve [ exact Hsams | exact Hsuma
              | now apply sams_left_comm | now apply suma_left_comm
              | now apply sams_right_comm | now apply suma_middle_comm
              | now apply sams_comm
              | now apply suma_left_comm, suma_middle_comm ]. }
    intros a b c d H. unfold angle_pair_eqb in H. apply orb_true_iff in H.
    destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
      apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
      split; intro Hs.
    - now apply (Hone a b).
    - apply (Hone c d); [now apply Hsym|now apply Hsym|exact Hs].
    - apply Hswap in Hs. now apply (Hone b a).
    - apply Hswap. apply (Hone c d); [now apply Hsym|now apply Hsym|exact Hs]. }
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
  assert (Hparf : forall a b c d, segment_pair_eqb a b c d = true ->
      (Interp (Para a b) <-> Interp (Para c d))).
  { intros a b c d H. unfold segment_pair_eqb in H. apply orb_true_iff in H.
    destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
      apply segment_u_eqb_cases in H1; apply segment_u_eqb_cases in H2;
      destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
      cbn; unfold Audit.Parallel, seg_name, Audit.seg_start, Audit.seg_end,
        reverse_segment; cbn; split; intro;
      eauto 6 using par_symmetry, par_left_comm, par_right_comm, par_comm. }
  destruct expected, actual; cbn; try discriminate; intros H;
    try (now apply Hpair); try (now apply Hangles); try (now apply Hrights);
    try (now apply Hsupp); try (now apply Hcomp); try (now apply Hparf);
    try (apply andb_true_iff in H; destruct H as [H ?];
         apply andb_true_iff in H; destruct H as [H ?];
         solve [now apply perp_at_realign | now apply seg_bisect_realign]);
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
    | Heq : quadrilateral_eqb _ _ = true |- _ =>
        apply quadrilateral_eqb_eq in Heq
    | Heq : circle_eqb _ _ = true |- _ => apply circle_eqb_eq in Heq
    | Heq : arc_eqb _ _ = true |- _ => apply arc_eqb_eq in Heq
    | Heq : ascii_eqb _ _ = true |- _ => apply Ascii.eqb_eq in Heq
    end; subst;
    (* residual cases: a midpoint, an angle bisector, or an on-line witness
       stated on a reversed segment *)
    solve [ tauto
          | unfold reverse_segment; cbn; split; apply l7_2
          | unfold reverse_segment; cbn; tauto
          | unfold reverse_segment; cbn;
            split; intros [Hne Hbet];
            (split; [congruence|now apply between_symmetry]) ].
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

(** Two vertices of a well-formed quadrilateral named apart are apart: the
    audited meaning states all six distinctnesses. *)
Lemma quad_vertex_distinct : forall q x y,
  Audit.QuadrilateralWellFormed point (quad_name q) ->
  In x (quad_vertices q) -> In y (quad_vertices q) -> x <> y ->
  point x <> point y.
Proof.
  intros q x y Hwf Hx Hy Hne.
  destruct Hwf as [HAB [HAC [HAD [HBC [HBD [HCD _]]]]]].
  cbn in HAB, HAC, HAD, HBC, HBD, HCD.
  unfold quad_vertices in Hx, Hy; cbn in Hx, Hy.
  destruct Hx as [<-|[<-|[<-|[<-|[]]]]];
    destruct Hy as [<-|[<-|[<-|[<-|[]]]]];
    solve [now contradiction Hne | assumption | now apply not_eq_sym].
Qed.

Lemma declared_segment_sound : forall decls s,
  declarations_well_formed point decls ->
  declared_segment decls s = true ->
  point s.(seg_start) <> point s.(seg_end).
Proof.
  intros decls s Hwf H. destruct Hwf as [_ [_ [_ [_ Hwfs]]]].
  unfold declared_segment in H. apply existsb_exists in H.
  destruct H as [d [Hin Heq]]. pose proof (Hwfs d Hin) as Hd.
  apply segment_u_eqb_cases in Heq.
  destruct Heq as [Heq|Heq]; subst s; [exact Hd|].
  unfold reverse_segment. cbn. now apply not_eq_sym.
Qed.

Lemma declared_angle_sound : forall decls a,
  declarations_well_formed point decls ->
  declared_angle decls a = true -> angle_well_formed point a.
Proof.
  intros decls a Hwf H. pose proof Hwf as [Hwft [Hwfa [Hwfq _]]].
  unfold declared_angle in H. apply orb_true_iff in H.
  destruct H as [H|H]; [apply orb_true_iff in H; destruct H as [H|H];
    [apply orb_true_iff in H; destruct H as [H|H]|]|].
  - (* spans the vertices of a declared triangle *)
    apply existsb_exists in H. destruct H as [t [Hin Hangle]].
    pose proof (Hwft t Hin) as Hncol.
    destruct t as [A B C]. unfold triangle_well_formed in Hncol. cbn in Hncol.
    apply not_col_distincts in Hncol.
    destruct Hncol as [_ [Hab [Hbc Hac]]].
    unfold angle_of_triangle in Hangle. cbn in Hangle.
    repeat rewrite orb_true_iff in Hangle.
    unfold angle_well_formed.
    repeat match goal with H : _ \/ _ |- _ => destruct H as [H|H] end;
      apply angle_eqb_eq in Hangle; subst; cbn; split; auto.
  - (* names three vertices of a declared quadrilateral, apart from each other *)
    apply existsb_exists in H. destruct H as [q [Hin Hnames]].
    pose proof (Hwfq q Hin) as Hq.
    unfold angle_of_quadrilateral in Hnames.
    apply andb_true_iff in Hnames; destruct Hnames as [Hnames Hright].
    apply andb_true_iff in Hnames; destruct Hnames as [Hnames Hleft].
    apply andb_true_iff in Hnames; destruct Hnames as [Hnames Hin3].
    apply andb_true_iff in Hnames; destruct Hnames as [Hin1 Hin2].
    assert (Hmember : forall p, existsb (ascii_eqb p) (quad_vertices q) = true ->
        In p (quad_vertices q)).
    { intros p Hp. apply existsb_exists in Hp. destruct Hp as [v [Hv Heq]].
      unfold ascii_eqb in Heq. apply Ascii.eqb_eq in Heq. now subst v. }
    assert (Hapart : forall x y, negb (ascii_eqb x y) = true -> x <> y).
    { intros x y Hxy Heq. unfold ascii_eqb in Hxy.
      rewrite Heq, Ascii.eqb_refl in Hxy. discriminate. }
    split; apply (quad_vertex_distinct q); auto using Hmember, Hapart.
  - (* both rays are declared segments *)
    apply andb_true_iff in H. destruct H as [Hleft Hright].
    split; [exact (declared_segment_sound _ _ Hwf Hleft)
           |exact (declared_segment_sound _ _ Hwf Hright)].
  - (* declared directly on an [ang:] line *)
    apply existsb_exists in H. destruct H as [b [Hin Heq]].
    apply (proj2 (angle_u_eqb_well_formed _ _ Heq)). now apply Hwfa.
Qed.

Lemma on_segment_match_out : forall v p q s r,
  Bet (point s.(seg_start)) (point r) (point s.(seg_end)) ->
  on_segment_match v p q s r = true ->
  point p <> point v -> point q <> point v ->
  Out (point v) (point q) (point p).
Proof.
  intros v p q s r Hbet Hc Hp Hq.
  unfold on_segment_match in Hc.
  apply orb_true_iff in Hc. destruct Hc as [Hc|Hc];
    apply andb_true_iff in Hc; destruct Hc as [Hs Hr];
    apply Ascii.eqb_eq in Hr; subst r;
    apply segment_u_eqb_cases in Hs;
    destruct Hs as [-> | ->]; unfold reverse_segment in Hbet; cbn in Hbet.
  - apply l6_6, bet_out; assumption.
  - apply l6_6, bet_out; [assumption|].
    apply between_symmetry. exact Hbet.
  - apply bet_out; assumption.
  - apply bet_out; [assumption|].
    apply between_symmetry. exact Hbet.
Qed.

Lemma ray_linked_out : forall premises v p q,
  Forall (interp_premise point) premises ->
  ray_linked premises v p q = true ->
  point p <> point v -> point q <> point v ->
  Out (point v) (point q) (point p).
Proof.
  intros premises v p q Hprem Hlink Hp Hq.
  unfold ray_linked in Hlink. apply orb_true_iff in Hlink.
  destruct Hlink as [Heq|Hlink].
  { apply Ascii.eqb_eq in Heq. subst q. apply out_trivial. exact Hp. }
  rewrite premise_found_existsb in Hlink. apply existsb_exists in Hlink. destruct Hlink as [pr [Hin Hc]].
  pose proof ((proj1 (Forall_forall _ _)) Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr. unfold ray_link_premise in Hc.
  destruct pr.(premise_statement); try discriminate;
    cbn in Hpr, Hc.
  - destruct Hpr as [Hbet _].
    eapply on_segment_match_out; [exact Hbet|exact Hc|exact Hp|exact Hq].
  - destruct Hpr as [Hbet1 Hbet2]. apply orb_true_iff in Hc.
    destruct Hc as [Hc|Hc].
    + eapply on_segment_match_out; [exact Hbet1|exact Hc|exact Hp|exact Hq].
    + eapply on_segment_match_out; [exact Hbet2|exact Hc|exact Hp|exact Hq].
  - destruct Hpr as [_ Hbet].
    eapply on_segment_match_out; [exact Hbet|exact Hc|exact Hp|exact Hq].
Qed.

(** The premises-yielding definition decides exactly what the plain reading of
    the rule says it does. *)
Lemma angle_ray_matches_unfold : forall decls premises e a,
  angle_ray_matches decls premises e a =
  (angle_u_eqb e a ||
   (declared_angle decls e &&
    ascii_eqb e.(ang_vertex) a.(ang_vertex) &&
    ((ray_linked premises e.(ang_vertex) e.(ang_left) a.(ang_left) &&
      ray_linked premises e.(ang_vertex) e.(ang_right) a.(ang_right)) ||
     (ray_linked premises e.(ang_vertex) e.(ang_left) a.(ang_right) &&
      ray_linked premises e.(ang_vertex) e.(ang_right) a.(ang_left))))).
Proof.
  intros decls premises e a.
  unfold angle_ray_matches, angle_ray_used, ray_pair_used.
  destruct (angle_u_eqb e a); [reflexivity|cbn].
  destruct (declared_angle decls e); [|reflexivity].
  destruct (ascii_eqb e.(ang_vertex) a.(ang_vertex)); [cbn|reflexivity].
  destruct (ray_linked premises e.(ang_vertex) e.(ang_left) a.(ang_left));
    destruct (ray_linked premises e.(ang_vertex) e.(ang_right) a.(ang_right));
    destruct (ray_linked premises e.(ang_vertex) e.(ang_left) a.(ang_right));
    destruct (ray_linked premises e.(ang_vertex) e.(ang_right) a.(ang_left));
    reflexivity.
Qed.

Lemma angle_ray_matches_sound : forall decls premises e a A B C,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  angle_ray_matches decls premises e a = true ->
  CongA (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right)) A B C ->
  CongA (point e.(ang_left)) (point e.(ang_vertex)) (point e.(ang_right)) A B C.
Proof.
  intros decls premises e a A B C Hwf Hprem Hm Hconga.
  rewrite angle_ray_matches_unfold in Hm. apply orb_true_iff in Hm.
  destruct Hm as [Hu|Hm].
  { apply angle_u_eqb_cases in Hu. destruct Hu as [->| ->]; [exact Hconga|].
    unfold reverse_angle. cbn. CongA. }
  apply andb_true_iff in Hm. destruct Hm as [Hm Hrays].
  apply andb_true_iff in Hm. destruct Hm as [Hdecl Hvert].
  apply Ascii.eqb_eq in Hvert.
  pose proof (declared_angle_sound _ _ Hwf Hdecl) as Hwfe.
  destruct Hwfe as [Hel Her]. rewrite Hvert in Hel, Her |- *.
  pose proof Hconga as Hd. destruct Hd as [Hd1 [Hd2 _]].
  apply orb_true_iff in Hrays; destruct Hrays as [Hr|Hr];
    apply andb_true_iff in Hr; destruct Hr as [Hr1 Hr2];
    rewrite Hvert in Hr1, Hr2.
  - pose proof (ray_linked_out _ _ _ _ Hprem Hr1 Hel Hd1) as Ho1.
    pose proof (ray_linked_out _ _ _ _ Hprem Hr2 Her Hd2) as Ho2.
    apply conga_trans with (point a.(ang_left)) (point a.(ang_vertex))
                           (point a.(ang_right)); [|exact Hconga].
    apply out2__conga; assumption.
  - pose proof (ray_linked_out _ _ _ _ Hprem Hr1 Hel Hd2) as Ho1.
    pose proof (ray_linked_out _ _ _ _ Hprem Hr2 Her Hd1) as Ho2.
    apply conga_trans with (point a.(ang_right)) (point a.(ang_vertex))
                           (point a.(ang_left)); [|CongA].
    apply out2__conga; assumption.
Qed.

Lemma angle_ray_spelling_bridge : forall premises e a,
  Forall (interp_premise point) premises ->
  angle_well_formed point e -> angle_well_formed point a ->
  angle_ray_spelling premises e a = true ->
  CongA (point e.(ang_left)) (point e.(ang_vertex)) (point e.(ang_right))
        (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right)).
Proof.
  intros premises [el ev er] [al av ar] Hprem [Hel Her] [Hal Har] Hm.
  cbn in Hel, Her, Hal, Har, Hm |- *.
  unfold angle_ray_spelling in Hm. cbn in Hm.
  apply andb_true_iff in Hm. destruct Hm as [Hv Hrays].
  apply Ascii.eqb_eq in Hv. subst av.
  apply orb_true_iff in Hrays; destruct Hrays as [Hr|Hr];
    apply andb_true_iff in Hr; destruct Hr as [Hr1 Hr2].
  - pose proof (ray_linked_out premises _ _ _ Hprem Hr1 Hel Hal) as Ho1.
    pose proof (ray_linked_out premises _ _ _ Hprem Hr2 Her Har) as Ho2.
    apply out2__conga; assumption.
  - pose proof (ray_linked_out premises _ _ _ Hprem Hr1 Hel Har) as Ho1.
    pose proof (ray_linked_out premises _ _ _ Hprem Hr2 Her Hal) as Ho2.
    apply conga_trans with (point ar) (point ev) (point al).
    + apply out2__conga; assumption.
    + CongA.
Qed.

Lemma conga_ray_pair_sound : forall premises e1 e2 a1 a2,
  Forall (interp_premise point) premises ->
  angle_well_formed point e1 -> angle_well_formed point e2 ->
  conga_ray_pair premises e1 e2 a1 a2 = true ->
  CongA (point a1.(ang_left)) (point a1.(ang_vertex)) (point a1.(ang_right))
        (point a2.(ang_left)) (point a2.(ang_vertex)) (point a2.(ang_right)) ->
  CongA (point e1.(ang_left)) (point e1.(ang_vertex)) (point e1.(ang_right))
        (point e2.(ang_left)) (point e2.(ang_vertex)) (point e2.(ang_right)).
Proof.
  intros premises e1 e2 a1 a2 Hprem He1 He2 Hmatch Hconga.
  pose proof Hconga as Hwf1. destruct Hwf1 as [Ha1l [Ha1r _]].
  pose proof (conga_sym _ _ _ _ _ _ Hconga) as Hwf2.
  destruct Hwf2 as [Ha2l [Ha2r _]].
  assert (Ha1 : angle_well_formed point a1) by exact (conj Ha1l Ha1r).
  assert (Ha2 : angle_well_formed point a2) by exact (conj Ha2l Ha2r).
  unfold conga_ray_pair in Hmatch. apply orb_true_iff in Hmatch.
  destruct Hmatch as [Hmatch|Hmatch];
    apply andb_true_iff in Hmatch; destruct Hmatch as [Hm1 Hm2].
  - pose proof (angle_ray_spelling_bridge _ _ _ Hprem He1 Ha1 Hm1) as H1.
    pose proof (angle_ray_spelling_bridge _ _ _ Hprem He2 Ha2 Hm2) as H2.
    eapply conga_trans; [exact H1|]. eapply conga_trans; [exact Hconga|].
    now apply conga_sym.
  - pose proof (angle_ray_spelling_bridge _ _ _ Hprem He1 Ha2 Hm1) as H1.
    pose proof (angle_ray_spelling_bridge _ _ _ Hprem He2 Ha1 Hm2) as H2.
    eapply conga_trans; [exact H1|].
    eapply conga_trans; [exact (conga_sym _ _ _ _ _ _ Hconga)|].
    exact (conga_sym _ _ _ _ _ _ H2).
Qed.

Lemma dependency_matches_sound : forall decls premises expected actual,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  dependency_matches decls premises expected actual = true ->
  Interp actual -> Interp expected.
Proof.
  intros decls premises expected actual Hwf Hprem H Hactual.
  rewrite dependency_matches_unfold in H. apply orb_true_iff in H.
  destruct H as [H|H]; [now apply (fact_eqb_sound _ _ H)|].
  destruct expected; try discriminate; destruct actual; try discriminate.
  - (* con_ang matched by a ray-renamed con_ang *)
    cbn in Hactual |- *.
    apply orb_true_iff in H; destruct H as [H|H];
      apply andb_true_iff in H; destruct H as [H1 H2].
    + apply conga_sym.
      apply (angle_ray_matches_sound _ _ _ _ _ _ _ Hwf Hprem H2).
      apply conga_sym.
      apply (angle_ray_matches_sound _ _ _ _ _ _ _ Hwf Hprem H1).
      exact Hactual.
    + apply conga_sym.
      apply (angle_ray_matches_sound _ _ _ _ _ _ _ Hwf Hprem H2).
      apply conga_sym.
      apply (angle_ray_matches_sound _ _ _ _ _ _ _ Hwf Hprem H1).
      apply conga_sym. exact Hactual.
  - (* con_ang matched by a ray-renamed ref_ang *)
    cbn in Hactual |- *.
    apply orb_true_iff in H; destruct H as [H|H];
      apply andb_true_iff in H; destruct H as [H1 H2].
    + apply conga_sym.
      apply (angle_ray_matches_sound _ _ _ _ _ _ _ Hwf Hprem H2).
      apply conga_sym.
      apply (angle_ray_matches_sound _ _ _ _ _ _ _ Hwf Hprem H1).
      exact Hactual.
    + apply conga_sym.
      apply (angle_ray_matches_sound _ _ _ _ _ _ _ Hwf Hprem H2).
      apply conga_sym.
      apply (angle_ray_matches_sound _ _ _ _ _ _ _ Hwf Hprem H1).
      apply conga_sym. exact Hactual.
  - (* con_ang matched by con_right *)
    apply andb_true_iff in H. destruct H as [H Hb].
    apply andb_true_iff in H. destruct H as [H Ha].
    apply andb_true_iff in H. destruct H as [H1 H2].
    apply (declared_angle_sound decls _ Hwf) in Ha.
    apply (declared_angle_sound decls _ Hwf) in Hb.
    destruct Ha as [Hal Har]. destruct Hb as [Hbl Hbr].
    destruct Hactual as [Hpa Hpb].
    apply (proj2 (angle_u_eqb_right _ _ H1)) in Hpa.
    apply (proj2 (angle_u_eqb_right _ _ H2)) in Hpb.
    unfold right_angle in Hpa, Hpb.
    cbn. now apply l11_16.
Qed.

Lemma schema3_sound : forall decls premises facts i j k a b c,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts -> schema3 decls premises facts i j k a b c = true ->
  Interp a /\ Interp b /\ Interp c.
Proof.
  intros decls premises facts i j k a b c Hwf Hprem Hall H.
  rewrite schema3_unfold in H.
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

Lemma triangle_declared_sound : forall decls t,
  declarations_well_formed point decls ->
  triangle_declared decls t = true -> triangle_well_formed point t.
Proof.
  intros decls t [Hwft _] H. unfold triangle_declared in H.
  apply existsb_exists in H. destruct H as [d [Hin Hperm]].
  pose proof (Hwft d Hin) as Hd.
  apply triangle_mem_spec in Hperm. destruct d as [A B C].
  unfold triangle_well_formed in Hd |- *. cbn in Hd, Hperm.
  destruct Hperm as [<-|[<-|[<-|[<-|[<-|[<-|[]]]]]]]; cbn;
    intro Hcol; apply Hd; Col.
Qed.

Lemma declared_pair_sound : forall decls t u,
  declarations_well_formed point decls ->
  declared_pair decls t u = true ->
  triangle_well_formed point t /\ triangle_well_formed point u.
Proof.
  intros decls t u Hwf H. apply andb_true_iff in H. destruct H as [Ht Hu].
  split; eapply triangle_declared_sound; eauto.
Qed.

Lemma rotated_well_formed : forall t,
  triangle_well_formed point t -> triangle_well_formed point (rotate_triangle t).
Proof.
  intros [A B C]. unfold triangle_well_formed, rotate_triangle; cbn.
  intros Hncol Hcol. apply Hncol. Col.
Qed.

Lemma sas_schema_sound : forall decls premises facts i j k t u,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts -> triangle_well_formed point t ->
  sas_schema decls premises facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros decls premises facts i j k [A B C] [D E F] Hdecl Hprem Hall Hwf Hschema.
  apply schema3_sound in Hschema; [|exact Hdecl|exact Hprem|exact Hall]. cbn in Hschema |- *.
  destruct Hschema as [Hs1 [Ha Hs2]]. eapply ender_sas; eauto; Cong.
Qed.

Lemma sss_schema_sound : forall decls premises facts i j k t u,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts -> triangle_well_formed point t ->
  sss_schema decls premises facts i j k t u = true -> interp_triangle_congruence point t u.
Proof.
  intros decls premises facts i j k [A B C] [D E F] Hdecl Hprem Hall Hwf Hschema.
  apply schema3_sound in Hschema; [|exact Hdecl|exact Hprem|exact Hall]. cbn in Hschema |- *.
  destruct Hschema as [Hs1 [Hs2 Hs3]]. now apply ender_sss.
Qed.

Lemma asa_schema_sound : forall decls premises facts i j k t u,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts -> triangle_well_formed point t ->
  asa_schema decls premises facts i j k t u = true -> interp_triangle_congruence point t u.
Proof.
  intros decls premises facts i j k [A B C] [D E F] Hdecl Hprem Hall Hwf Hschema.
  apply schema3_sound in Hschema; [|exact Hdecl|exact Hprem|exact Hall]. cbn in Hschema |- *.
  destruct Hschema as [Ha [Hs Hb]]. now apply ender_asa.
Qed.

Lemma aas_schema_sound : forall decls premises facts i j k t u,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts -> triangle_well_formed point t ->
  aas_schema decls premises facts i j k t u = true -> interp_triangle_congruence point t u.
Proof.
  intros decls premises facts i j k [A B C] [D E F] Hdecl Hprem Hall Hwf Hschema.
  unfold aas_schema in Hschema. apply orb_true_iff in Hschema.
  assert (Hparts : forall x y z : Statement,
      schema3 decls premises facts i j k x y z = true ->
      Interp x /\ Interp y /\ Interp z)
    by (intros; eapply schema3_sound; eauto).
  destruct Hschema as [H|H]; apply Hparts in H; cbn in H |- *.
  - destruct H as [Hc [Hb Hs]]. apply ender_aas; auto. now apply conga_comm.
  - destruct H as [Hb [Hc Hs]]. apply ender_aas; auto. now apply conga_comm.
Qed.

Lemma rhl_schema_sound : forall decls premises facts i j k t u,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts -> triangle_well_formed point t ->
  rhl_schema decls premises facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros decls premises facts i j k [A B C] [D E F] Hdecl Hprem Hall Hwf Hschema.
  unfold rhl_schema in Hschema. apply orb_true_iff in Hschema.
  assert (Hsides : forall x y z : Statement,
      schema3 decls premises facts i j k x y z = true -> Interp x /\ Interp y /\ Interp z)
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

Lemma three_rotations_sound : forall schema decls premises facts i j k t u,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts -> triangle_well_formed point t ->
  (forall decls premises facts i j k t u,
    declarations_well_formed point decls ->
    Forall (interp_premise point) premises ->
    Forall Interp facts -> triangle_well_formed point t ->
    schema decls premises facts i j k t u = true ->
    interp_triangle_congruence point t u) ->
  three_rotations schema decls premises facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros schema decls premises facts i j k t u Hdecl Hprem Hall Hwf Hsound H.
  unfold three_rotations in H. apply orb_true_iff in H. destruct H as [H|H].
  - apply orb_true_iff in H. destruct H as [H|H].
    + exact (Hsound decls premises facts i j k t u Hdecl Hprem Hall Hwf H).
    + apply triangle_congruent_rotate_back.
      exact (Hsound decls premises facts i j k (rotate_triangle t)
               (rotate_triangle u) Hdecl Hprem Hall
               (rotated_well_formed t Hwf) H).
  - apply triangle_congruent_rotate_back. apply triangle_congruent_rotate_back.
    exact (Hsound decls premises facts i j k
             (rotate_triangle (rotate_triangle t))
             (rotate_triangle (rotate_triangle u)) Hdecl Hprem Hall
             (rotated_well_formed _ (rotated_well_formed t Hwf)) H).
Qed.

Lemma reversed_well_formed : forall t,
  triangle_well_formed point t -> triangle_well_formed point (reverse_triangle t).
Proof.
  intros [A B C]. unfold triangle_well_formed, reverse_triangle; cbn.
  intros Hncol Hcol. apply Hncol. Col.
Qed.

Lemma six_correspondences_sound : forall schema decls premises facts i j k t u,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts -> triangle_well_formed point t ->
  (forall decls premises facts i j k t u,
    declarations_well_formed point decls ->
    Forall (interp_premise point) premises ->
    Forall Interp facts -> triangle_well_formed point t ->
    schema decls premises facts i j k t u = true ->
    interp_triangle_congruence point t u) ->
  six_correspondences schema decls premises facts i j k t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros schema decls premises facts i j k [A B C] [D E F] Hdecl Hprem Hall Hwf Hsound H.
  unfold six_correspondences in H. apply orb_true_iff in H. destruct H as [H|H].
  - eapply three_rotations_sound; eauto.
  - apply triangle_congruent_reverse.
    change (interp_triangle_congruence point
              (reverse_triangle (triangle A B C)) (reverse_triangle (triangle D E F))).
    eapply three_rotations_sound;
      [exact Hdecl|exact Hprem|exact Hall|now apply reversed_well_formed
      |exact Hsound|exact H].
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

Lemma perp_con_ang_sound : forall decls facts i conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  perp_con_ang decls facts i conclusion = true -> Interp conclusion.
Proof.
  intros decls facts i conclusion Hwf Hfacts Hrule.
  unfold perp_con_ang in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hperp : Interp (PerpAt s s0 p)) by (eapply lookup_step_sound; eauto).
  destruct conclusion; try discriminate.
  - (* con_ang: the declared triangles supply the nondegenerate rays *)
    apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hdb].
    apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hda].
    apply andb_true_iff in Hrule. destruct Hrule as [Hpa Hpb].
    apply (declared_angle_sound decls _ Hwf) in Hda.
    apply (declared_angle_sound decls _ Hwf) in Hdb.
    destruct Hda as [Hal Har]. destruct Hdb as [Hbl Hbr].
    assert (Hra : right_angle point a) by (eapply perp_right_angle_sound; eauto).
    assert (Hrb : right_angle point a0) by (eapply perp_right_angle_sound; eauto).
    unfold right_angle in Hra, Hrb. cbn. now apply l11_16.
  - apply andb_true_iff in Hrule. destruct Hrule as [Hleft Hright].
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

Lemma vertical_angle_pair_sound : forall decls s t p conclusion,
  declarations_well_formed point decls ->
  Interp (IntersectSeg s t p) ->
  vertical_angle_pair decls s t p conclusion = true -> Interp conclusion.
Proof.
  intros decls s t p conclusion Hwf Hcross Hpair.
  cbn in Hcross. destruct Hcross as [Hs Ht].
  unfold vertical_angle_pair in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [Hdeclared Heq]; apply andb_true_iff in Hdeclared;
    destruct Hdeclared as [Hfirst Hsecond];
    apply (declared_angle_sound decls _ Hwf) in Hfirst;
    apply (declared_angle_sound decls _ Hwf) in Hsecond;
    destruct Hfirst as [Hf1 Hf2]; destruct Hsecond as [Hs1 Hs2];
    cbn in Hf1, Hf2, Hs1, Hs2;
    apply (fact_eqb_sound _ _ Heq); cbn.
  - now apply l11_14.
  - apply l11_14; auto. now apply between_symmetry.
Qed.

Lemma vert_ang_sound : forall decls premises label conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  vert_ang decls premises label conclusion = true -> Interp conclusion.
Proof.
  intros decls premises label conclusion Hwf Hprem Hrule.
  unfold vert_ang in Hrule. rewrite premise_found_existsb in Hrule.
  apply existsb_exists in Hrule.
  destruct Hrule as [pr [Hin Hmatch]]. unfold vert_ang_premise in Hmatch.
  apply andb_true_iff in Hmatch. destruct Hmatch as [_ Hmatch].
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

Lemma ang_bisect_conv_sound : forall facts i conclusion,
  Forall Interp facts -> ang_bisect_conv facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule. unfold ang_bisect_conv in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  assert (Hdependency : Interp dependency) by (eapply lookup_step_sound; eauto).
  apply orb_true_iff in Hrule; destruct Hrule as [Hcase|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hvertex Heq];
    unfold ascii_eqb in Hvertex; apply Ascii.eqb_eq in Hvertex;
    apply (fact_eqb_sound _ _ Heq) in Hdependency; cbn in Hdependency |- *.
  - left. split; [exact Hvertex|exact Hdependency].
  - right. split; [exact Hvertex|exact Hdependency].
Qed.

Lemma on_line_u_sound : forall s t p q,
  segment_u_eqb s t = true -> ascii_eqb p q = true ->
  Interp (OnLine t q) -> Interp (OnLine s p).
Proof.
  intros s t p q Hs Hp Hon. unfold ascii_eqb in Hp. apply Ascii.eqb_eq in Hp.
  subst q. apply segment_u_eqb_cases in Hs.
  destruct Hs as [Heq|Heq]; subst s; [exact Hon|].
  unfold reverse_segment in *. cbn in Hon |- *.
  destruct Hon as [Hne Hbet]. split; [congruence|now apply between_symmetry].
Qed.

(** Betweenness transfers across the reversal [segment_u_eqb] allows. *)
Lemma segment_u_bet : forall s t r,
  segment_u_eqb s t = true ->
  Bet (point t.(seg_start)) (point r) (point t.(seg_end)) ->
  Bet (point s.(seg_start)) (point r) (point s.(seg_end)).
Proof.
  intros s t r Hs Hbet. apply segment_u_eqb_cases in Hs.
  destruct Hs as [Heq|Heq]; subst s; [exact Hbet|].
  unfold reverse_segment. cbn. now apply between_symmetry.
Qed.

(** The only thing [midpt_conv] reads out of the diagram premise it found.
    [on_line] gives it directly; [intersect_seg] gives it of whichever of its
    two segments matched.  Nondegeneracy is deliberately not claimed, because
    [intersect_seg] does not carry it and the midpoint converse does not use
    it. *)
Lemma on_segment_statement_sound : forall s p st,
  on_segment_statement s p st = true -> Interp st ->
  Bet (point s.(seg_start)) (point p) (point s.(seg_end)).
Proof.
  intros s p st Hmatch Hst. destruct st; try discriminate;
    cbn in Hmatch; apply andb_true_iff in Hmatch;
    destruct Hmatch as [Hseg Hpoint];
    unfold ascii_eqb in Hpoint; apply Ascii.eqb_eq in Hpoint; subst.
  - (* IntersectSeg: either crossed segment may be the one named *)
    cbn in Hst. destruct Hst as [Hbet1 Hbet2].
    apply orb_true_iff in Hseg. destruct Hseg as [Hseg|Hseg];
      eapply segment_u_bet; eassumption.
  - (* OnLine: the betweenness half of what it says *)
    cbn in Hst. destruct Hst as [_ Hbet].
    eapply segment_u_bet; eassumption.
Qed.

(** [Midpoint] is by definition the betweenness together with the congruence of
    the two halves, so the premise and the dependency give the conclusion with
    nothing left over — in particular with no appeal to the endpoints being
    distinct. *)
Lemma midpt_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  midpt_conv premises facts i conclusion = true -> Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold midpt_conv in Hrule. destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hhalves Hon].
  assert (Hdep : Interp dependency) by (eapply lookup_step_sound; eauto).
  apply (fact_eqb_sound _ _ Hhalves) in Hdep. cbn in Hdep.
  rewrite premise_found_existsb in Hon.
  apply existsb_exists in Hon. destruct Hon as [pr [Hin Hmatch]].
  unfold on_segment_premise in Hmatch.
  pose proof ((proj1 (@Forall_forall Premise (interp_premise point) premises))
                Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr.
  pose proof (on_segment_statement_sound _ _ _ Hmatch Hpr) as Hbet.
  cbn. split; [exact Hbet|exact Hdep].
Qed.

Lemma correspondences_congruent : forall t u c,
  In c (correspondences t u) ->
  interp_triangle_congruence point (fst c) (snd c) ->
  interp_triangle_congruence point t u.
Proof.
  intros [A B C] [D E F] c Hin Hcong. unfold correspondences in Hin. cbn in Hin.
  repeat (destruct Hin as [<-|Hin];
    [cbn in Hcong |- *;
     solve [ exact Hcong
           | now apply triangle_congruent_rotate_back
           | now apply triangle_congruent_rotate_back,
                       triangle_congruent_rotate_back
           | now apply triangle_congruent_reverse
           | apply triangle_congruent_reverse;
             now apply triangle_congruent_rotate_back
           | apply triangle_congruent_reverse;
             now apply triangle_congruent_rotate_back,
                       triangle_congruent_rotate_back ]|]).
  contradiction.
Qed.

Lemma schema6_sound : forall decls premises facts i1 i2 i3 i4 i5 i6 a b c d e f,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  schema6 decls premises facts i1 i2 i3 i4 i5 i6 a b c d e f = true ->
  Interp a /\ Interp b /\ Interp c /\ Interp d /\ Interp e /\ Interp f.
Proof.
  intros decls premises facts i1 i2 i3 i4 i5 i6 a b c d e f Hwf Hprem Hall H.
  unfold schema6 in H. apply andb_true_iff in H. destruct H as [H1 H2].
  apply (schema3_sound _ _ _ _ _ _ _ _ _ Hwf Hprem Hall) in H1.
  apply (schema3_sound _ _ _ _ _ _ _ _ _ Hwf Hprem Hall) in H2. tauto.
Qed.

Lemma def_con_tri_sound : forall decls premises facts i1 i2 i3 i4 i5 i6
    conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  def_con_tri decls premises facts i1 i2 i3 i4 i5 i6 conclusion = true ->
  Interp conclusion.
Proof.
  intros decls premises facts i1 i2 i3 i4 i5 i6 conclusion Hwf Hprem Hall Hrule.
  unfold def_con_tri in Hrule. destruct conclusion; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [_ Hrule].
  apply existsb_exists in Hrule. destruct Hrule as [c [Hin Hmatch]].
  change (Interp (ConTri t t0)). apply (correspondences_congruent t t0 c Hin).
  unfold def_con_tri_at in Hmatch.
  apply (schema6_sound _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ Hwf Hprem Hall) in Hmatch.
  destruct (fst c) as [A B C]; destruct (snd c) as [D E F].
  cbn in Hmatch |- *. unfold interp_triangle_congruence, triangle_congruence.
  cbn. tauto.
Qed.

Lemma def_isosceles_sound : forall decls facts i conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  def_isosceles decls facts i conclusion = true -> Interp conclusion.
Proof.
  intros decls facts i conclusion Hwf Hall Hrule.
  unfold def_isosceles in Hrule. destruct conclusion; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hrule].
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  assert (Hdep : Interp dependency) by (eapply lookup_step_sound; eauto).
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply triangle_well_formed_nondegenerate in Hdeclared.
  apply existsb_exists in Hrule. destruct Hrule as [expected [Hin Heq]].
  apply (fact_eqb_sound _ _ Heq) in Hdep.
  unfold isosceles_pairs in Hin. cbn in Hin. cbn.
  split; [exact Hdeclared|].
  destruct Hin as [<-|[<-|[<-|[]]]]; cbn in Hdep; tauto.
Qed.

Lemma apex_readings_well_formed : forall decls t r,
  declarations_well_formed point decls ->
  triangle_declared decls t = true -> In r (apex_readings t) ->
  triangle_well_formed point t.
Proof. intros decls t r Hwf Hd _. eapply triangle_declared_sound; eauto. Qed.

Lemma base_angle_sound : forall decls facts i conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  base_angle decls facts i conclusion = true -> Interp conclusion.
Proof.
  intros decls facts i conclusion Hwf Hall Hrule.
  unfold base_angle in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  assert (Hdep : Interp dependency) by (eapply lookup_step_sound; eauto).
  apply existsb_exists in Hrule. destruct Hrule as [t [_ Hmatch]].
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hmatch Hconclusion].
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hdeclared Hsides].
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply (fact_eqb_sound _ _ Hsides) in Hdep.
  apply (fact_eqb_sound _ _ Hconclusion).
  destruct t as [A B C]. cbn in Hdep, Hdeclared |- *.
  now apply ender_base_angle.
Qed.

Lemma base_angle_conv_sound : forall decls facts i conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  base_angle_conv decls facts i conclusion = true -> Interp conclusion.
Proof.
  intros decls facts i conclusion Hwf Hall Hrule.
  unfold base_angle_conv in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  assert (Hdep : Interp dependency) by (eapply lookup_step_sound; eauto).
  apply existsb_exists in Hrule. destruct Hrule as [t [_ Hmatch]].
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hmatch Hconclusion].
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hdeclared Hangles].
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply (fact_eqb_sound _ _ Hangles) in Hdep.
  apply (fact_eqb_sound _ _ Hconclusion).
  destruct t as [A B C]. cbn in Hdep, Hdeclared |- *.
  now apply ender_base_angle_conv.
Qed.

Lemma def_equilateral_sound : forall decls premises facts i j k conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  def_equilateral decls premises facts i j k conclusion = true -> Interp conclusion.
Proof.
  intros decls premises facts i j k conclusion Hwf Hprem Hall Hrule.
  unfold def_equilateral in Hrule. destruct conclusion; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hschema].
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply triangle_well_formed_nondegenerate in Hdeclared.
  apply (schema3_sound _ _ _ _ _ _ _ _ _ Hwf Hprem Hall) in Hschema.
  destruct t as [A B C]. cbn in Hschema, Hdeclared |- *. tauto.
Qed.

Lemma def_equiangular_sound : forall decls premises facts i j k conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  def_equiangular decls premises facts i j k conclusion = true -> Interp conclusion.
Proof.
  intros decls premises facts i j k conclusion Hwf Hprem Hall Hrule.
  unfold def_equiangular in Hrule. destruct conclusion; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hschema].
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply triangle_well_formed_nondegenerate in Hdeclared.
  apply (schema3_sound _ _ _ _ _ _ _ _ _ Hwf Hprem Hall) in Hschema.
  destruct t as [A B C]. cbn in Hschema, Hdeclared |- *.
  destruct Hschema as [Hab [Hbc _]]. split; [exact Hdeclared|].
  split; CongA.
Qed.

Lemma equilat_equiang_sound : forall facts i conclusion,
  Forall Interp facts -> equilat_equiang facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hall Hrule. unfold equilat_equiang in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  apply triangle_eqb_eq in Hrule. subst t.
  assert (Hdep : Interp (EquilateralTri t0)) by (eapply lookup_step_sound; eauto).
  destruct t0 as [A B C]. cbn in Hdep |- *.
  destruct Hdep as [Hnd [Hab Hbc]]. split; [exact Hnd|].
  apply ender_equilateral_equiangular; [apply Hnd|exact Hab|exact Hbc].
Qed.

Lemma equiang_equilat_sound : forall facts i conclusion,
  Forall Interp facts -> equiang_equilat facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hall Hrule. unfold equiang_equilat in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  apply triangle_eqb_eq in Hrule. subst t.
  assert (Hdep : Interp (EquiangularTri t0)) by (eapply lookup_step_sound; eauto).
  destruct t0 as [A B C]. cbn in Hdep |- *.
  destruct Hdep as [Hnd [HangA HangB]]. split; [exact Hnd|].
  apply ender_equiangular_equilateral; [apply Hnd|exact HangA|exact HangB].
Qed.

Lemma supplement_realign : forall c b d,
  angle_u_eqb d b = true ->
  Interp (Supplementary c d) -> Interp (Supplementary c b).
Proof.
  intros c b d H Hs. apply angle_u_eqb_cases in H.
  destruct H as [Heq|Heq]; subst d; [exact Hs|].
  unfold reverse_angle in Hs. cbn in Hs |- *. now apply suppa_right_comm.
Qed.

Lemma con_supplements_same_sound : forall facts i j conclusion,
  Forall Interp facts -> con_supplements_same facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hall Hrule. unfold con_supplements_same in Hrule.
  destruct (lookup_step facts i) as [first|] eqn:Hfirst; try discriminate.
  destruct first; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  assert (Hs1 : Interp (Supplementary a a0)) by (eapply lookup_step_sound; eauto).
  assert (Hs2 : Interp (Supplementary a1 a2)) by (eapply lookup_step_sound; eauto).
  (* [SuppA] is symmetric, so the shared angle may occupy either slot of
     either dependency; realign it into the second slot of both. *)
  assert (Hcancel : forall x y z : Angle,
      Interp (Supplementary x y) -> Interp (Supplementary z y) ->
      Interp (ConAng x z)).
  { intros x y z Hx Hz. cbn in Hx, Hz |- *.
    now apply (suppa2__conga123 _ _ _ (point (ang_left y)) (point (ang_vertex y))
                                (point (ang_right y))). }
  repeat rewrite orb_true_iff in Hrule.
  destruct Hrule as [[[Hcase|Hcase]|Hcase]|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hshared Hconclusion];
    apply (fact_eqb_sound _ _ Hconclusion).
  (* the shared angle is the second of the first dependency ... *)
  - apply Hcancel with (y := a0);
      [exact Hs1|now apply (supplement_realign a1 a0 a2)].
  - apply Hcancel with (y := a0); [exact Hs1|].
    apply (supplement_realign a2 a0 a1); [exact Hshared|now apply suppa_sym].
  (* ... or its first *)
  - apply Hcancel with (y := a);
      [now apply suppa_sym|now apply (supplement_realign a1 a a2)].
  - apply Hcancel with (y := a); [now apply suppa_sym|].
    apply (supplement_realign a2 a a1); [exact Hshared|now apply suppa_sym].
Qed.

Lemma supplements_transfer : forall x y z w,
  Interp (Supplementary x y) -> Interp (Supplementary z w) ->
  Interp (ConAng y w) -> Interp (ConAng x z).
Proof.
  intros x y z w Hx Hz Hyw. cbn in Hx, Hz, Hyw |- *.
  pose proof (suppa_distincts _ _ _ _ _ _ Hz) as Hd. spliter.
  assert (Hzy : SuppA (point (ang_left z)) (point (ang_vertex z))
                      (point (ang_right z))
                      (point (ang_left y)) (point (ang_vertex y))
                      (point (ang_right y))).
  { apply (conga2_suppa__suppa (point (ang_left z)) (point (ang_vertex z))
             (point (ang_right z)) (point (ang_left w)) (point (ang_vertex w))
             (point (ang_right w)));
      [apply conga_refl; auto|now apply conga_sym|exact Hz]. }
  now apply (suppa2__conga123 _ _ _ (point (ang_left y)) (point (ang_vertex y))
                              (point (ang_right y))).
Qed.

Lemma con_supplements_sound : forall facts i j k conclusion,
  Forall Interp facts -> con_supplements facts i j k conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j k conclusion Hall Hrule. unfold con_supplements in Hrule.
  destruct (lookup_step facts i) as [first|] eqn:Hfirst; try discriminate.
  destruct first; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  destruct (lookup_step facts k) as [witness|] eqn:Hwitness; try discriminate.
  assert (Hs1 : Interp (Supplementary a a0)) by (eapply lookup_step_sound; eauto).
  assert (Hs2 : Interp (Supplementary a1 a2)) by (eapply lookup_step_sound; eauto).
  assert (Hw : Interp witness) by (eapply lookup_step_sound; eauto).
  (* the witness may relate either angle of one dependency to either of the
     other; the conclusion is then the remaining pair *)
  repeat rewrite orb_true_iff in Hrule.
  destruct Hrule as [[[Hcase|Hcase]|Hcase]|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hcongruent Hconclusion];
    apply (fact_eqb_sound _ _ Hcongruent) in Hw;
    apply (fact_eqb_sound _ _ Hconclusion).
  - now apply (supplements_transfer a a0 a1 a2).
  - apply (supplements_transfer a a0 a2 a1); [exact Hs1|now apply suppa_sym|exact Hw].
  - apply (supplements_transfer a0 a a1 a2); [now apply suppa_sym|exact Hs2|exact Hw].
  - apply (supplements_transfer a0 a a2 a1);
      [now apply suppa_sym|now apply suppa_sym|exact Hw].
Qed.

Lemma complement_sym : forall a b,
  Interp (Complementary a b) -> Interp (Complementary b a).
Proof.
  intros a b [X [Y [Z [Hper [Hsams Hsuma]]]]]. cbn in Hsams, Hsuma |- *.
  exists X, Y, Z.
  split; [exact Hper|split; [now apply sams_sym|now apply suma_sym]].
Qed.

Lemma complement_realign : forall c b d,
  angle_u_eqb d b = true ->
  Interp (Complementary c d) -> Interp (Complementary c b).
Proof.
  intros c b d H [X [Y [Z [Hper [Hsams Hsuma]]]]].
  apply angle_u_eqb_cases in H. destruct H as [Heq|Heq]; subst d.
  { exists X, Y, Z. auto. }
  unfold reverse_angle in Hsams, Hsuma. cbn in Hsams, Hsuma |- *.
  exists X, Y, Z.
  split; [exact Hper
         |split; [now apply sams_right_comm|now apply suma_middle_comm]].
Qed.

(** Both complement rules cancel the shared angle out of two sums that reach
    a right angle.  All right angles are congruent, so the two sums can be
    made to reach the *same* one, and [SAMS] is exactly the hypothesis
    GeoCoq's cancellation law wants. *)
Lemma complements_transfer : forall x y z w,
  Interp (Complementary x y) -> Interp (Complementary z w) ->
  Interp (ConAng y w) -> Interp (ConAng x z).
Proof.
  intros x y z w [X1 [Y1 [Z1 [Hper1 [Hsams1 Hsuma1]]]]]
                 [X2 [Y2 [Z2 [Hper2 [Hsams2 Hsuma2]]]]] Hyw.
  cbn in Hsams1, Hsuma1, Hsams2, Hsuma2, Hyw |- *.
  pose proof (suma_distincts _ _ _ _ _ _ _ _ _ Hsuma1) as Hd1.
  pose proof (suma_distincts _ _ _ _ _ _ _ _ _ Hsuma2) as Hd2.
  spliter.
  assert (Hright : CongA X2 Y2 Z2 X1 Y1 Z1)
    by (apply l11_16; auto; now apply not_eq_sym).
  assert (Hwy : CongA (point (ang_left w)) (point (ang_vertex w))
                      (point (ang_right w))
                      (point (ang_left y)) (point (ang_vertex y))
                      (point (ang_right y))) by (now apply conga_sym).
  assert (Hzz : CongA (point (ang_left z)) (point (ang_vertex z))
                      (point (ang_right z))
                      (point (ang_left z)) (point (ang_vertex z))
                      (point (ang_right z)))
    by (apply conga_refl; auto using not_eq_sym).
  assert (Hsuma2' : SumA (point (ang_left z)) (point (ang_vertex z))
                         (point (ang_right z))
                         (point (ang_left y)) (point (ang_vertex y))
                         (point (ang_right y)) X1 Y1 Z1)
    by (eapply conga3_suma__suma;
          [exact Hsuma2|exact Hzz|exact Hwy|exact Hright]).
  assert (Hsams2' : SAMS (point (ang_left z)) (point (ang_vertex z))
                         (point (ang_right z))
                         (point (ang_left y)) (point (ang_vertex y))
                         (point (ang_right y)))
    by (eapply conga2_sams__sams; [exact Hzz|exact Hwy|exact Hsams2]).
  now apply (sams2_suma2__conga123 _ _ _ _ _ _ (point (ang_left y))
               (point (ang_vertex y)) (point (ang_right y)) X1 Y1 Z1).
Qed.

Lemma complementary_second_refl : forall x y,
  Interp (Complementary x y) -> Interp (ConAng y y).
Proof.
  intros x y [X [Y [Z [_ [_ Hsuma]]]]]. cbn in Hsuma |- *.
  pose proof (suma_distincts _ _ _ _ _ _ _ _ _ Hsuma) as Hd. spliter.
  apply conga_refl; auto using not_eq_sym.
Qed.

Lemma con_complements_sound : forall facts i j k conclusion,
  Forall Interp facts -> con_complements facts i j k conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j k conclusion Hall Hrule. unfold con_complements in Hrule.
  destruct (lookup_step facts i) as [first|] eqn:Hfirst; try discriminate.
  destruct first; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  destruct (lookup_step facts k) as [witness|] eqn:Hwitness; try discriminate.
  assert (Hc1 : Interp (Complementary a a0)) by (eapply lookup_step_sound; eauto).
  assert (Hc2 : Interp (Complementary a1 a2)) by (eapply lookup_step_sound; eauto).
  assert (Hw : Interp witness) by (eapply lookup_step_sound; eauto).
  repeat rewrite orb_true_iff in Hrule.
  destruct Hrule as [[[Hcase|Hcase]|Hcase]|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hcongruent Hconclusion];
    apply (fact_eqb_sound _ _ Hcongruent) in Hw;
    apply (fact_eqb_sound _ _ Hconclusion).
  - now apply (complements_transfer a a0 a1 a2).
  - apply (complements_transfer a a0 a2 a1);
      [exact Hc1|now apply complement_sym|exact Hw].
  - apply (complements_transfer a0 a a1 a2);
      [now apply complement_sym|exact Hc2|exact Hw].
  - apply (complements_transfer a0 a a2 a1);
      [now apply complement_sym|now apply complement_sym|exact Hw].
Qed.

Lemma con_complements_same_sound : forall facts i j conclusion,
  Forall Interp facts -> con_complements_same facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hall Hrule. unfold con_complements_same in Hrule.
  destruct (lookup_step facts i) as [first|] eqn:Hfirst; try discriminate.
  destruct first; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  assert (Hc1 : Interp (Complementary a a0)) by (eapply lookup_step_sound; eauto).
  assert (Hc2 : Interp (Complementary a1 a2)) by (eapply lookup_step_sound; eauto).
  (* the shared angle may sit in either slot of either dependency; realign it
     into the second slot of both, then cancel it *)
  assert (Hcancel : forall x y z : Angle,
      Interp (Complementary x y) -> Interp (Complementary z y) ->
      Interp (ConAng x z)).
  { intros x y z Hx Hz. apply (complements_transfer x y z y);
      [exact Hx|exact Hz|now apply (complementary_second_refl z)]. }
  repeat rewrite orb_true_iff in Hrule.
  destruct Hrule as [[[Hcase|Hcase]|Hcase]|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hshared Hconclusion];
    apply (fact_eqb_sound _ _ Hconclusion).
  - apply Hcancel with (y := a0);
      [exact Hc1|now apply (complement_realign a1 a0 a2)].
  - apply Hcancel with (y := a0); [exact Hc1|].
    apply (complement_realign a2 a0 a1); [exact Hshared|now apply complement_sym].
  - apply Hcancel with (y := a);
      [now apply complement_sym|now apply (complement_realign a1 a a2)].
  - apply Hcancel with (y := a); [now apply complement_sym|].
    apply (complement_realign a2 a a1); [exact Hshared|now apply complement_sym].
Qed.

Lemma linear_pair_is_supplementary : forall a b,
  Interp (LinearPair a b) -> Interp (Supplementary a b).
Proof.
  intros [AL AV AR] [BL BV BR] H. cbn in H |- *.
  unfold Audit.LinearPairMeaning, Audit.AngleWellFormed, ang_name, Audit.ang_start,
    Audit.ang_vertex, Audit.ang_end in H. cbn in H.
  destruct H as [[HAL HAV] [[HBL HBV] [Hvertex Hcases]]].
  rewrite <- Hvertex in *. destruct Hcases as [Hcase|[Hcase|[Hcase|Hcase]]];
    destruct Hcase as [Hout Hbet]; destruct Hbet as [Hbet [Hbet1 Hbet2]].
  - eapply conga2_suppa__suppa.
    + apply conga_refl; auto.
    + apply out2__conga; [exact (l6_6 _ _ _ Hout)|apply out_trivial; exact HBV].
    + apply suppa_left_comm.
      now apply (bet__suppa (point AR) (point AV) (point AL) (point BR)).
  - eapply conga2_suppa__suppa.
    + apply conga_refl; auto.
    + apply conga_right_comm, out2__conga;
        [exact (l6_6 _ _ _ Hout)|apply out_trivial; exact HBL].
    + apply suppa_left_comm.
      now apply (bet__suppa (point AR) (point AV) (point AL) (point BL)).
  - eapply conga2_suppa__suppa.
    + apply conga_refl; auto.
    + apply out2__conga; [exact (l6_6 _ _ _ Hout)|apply out_trivial; exact HBV].
    + now apply (bet__suppa (point AL) (point AV) (point AR) (point BR)).
  - eapply conga2_suppa__suppa.
    + apply conga_refl; auto.
    + apply conga_right_comm, out2__conga;
        [exact (l6_6 _ _ _ Hout)|apply out_trivial; exact HBL].
    + now apply (bet__suppa (point AL) (point AV) (point AR) (point BL)).
Qed.

Lemma def_linear_pair_sound : forall facts i conclusion,
  Forall Interp facts -> def_linear_pair facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hall Hrule. unfold def_linear_pair in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  apply (fact_eqb_sound _ _ Hrule).
  apply linear_pair_is_supplementary.
  eapply lookup_step_sound; eauto.
Qed.

Lemma endpoints_determine : forall u p y, p <> y ->
  endpoint_of p u = true -> endpoint_of y u = true ->
  segment_u_eqb (segment p y) u = true.
Proof.
  intros [c1 c2] p y Hne Hp Hy.
  unfold endpoint_of, segment_u_eqb, segment_eqb, reverse_segment,
         ascii_eqb in *. cbn in *.
  destruct (Ascii.eqb p c1) eqn:Hp1, (Ascii.eqb p c2) eqn:Hp2,
           (Ascii.eqb y c1) eqn:Hy1, (Ascii.eqb y c2) eqn:Hy2;
    cbn in *; try discriminate; try reflexivity;
    exfalso; apply Hne;
    repeat match goal with
    | H : Ascii.eqb _ _ = true |- _ => apply Ascii.eqb_eq in H
    end; congruence.
Qed.

Lemma other_endpoint_spec : forall x s, endpoint_of x s = true ->
  segment_u_eqb (segment x (other_endpoint x s)) s = true.
Proof.
  intros x [c1 c2] Hx.
  unfold endpoint_of, other_endpoint, segment_u_eqb, segment_eqb,
         reverse_segment, ascii_eqb in *. cbn in *.
  destruct (Ascii.eqb x c1) eqn:H1; cbn in *.
  - now rewrite Ascii.eqb_refl.
  - rewrite Hx. cbn. now rewrite Ascii.eqb_refl.
Qed.

(** The core of [def_perp], stated over bare collinearity so that rules whose
    premises place the foot on the line without betweenness — tangency, for
    one — can reuse it. *)
Lemma perp_core_col : forall u s p x y,
  point x <> point p -> point y <> point p ->
  Per (point x) (point p) (point y) ->
  endpoint_of p u = true -> endpoint_of y u = true ->
  endpoint_of x s = true ->
  point s.(seg_start) <> point s.(seg_end) ->
  Col (point s.(seg_start)) (point s.(seg_end)) (point p) ->
  Interp (PerpAt u s p).
Proof.
  intros u s p x y Hx Hy Hper Hpu Hyu Hxs Hne Hcol.
  assert (Hbase : Perp_at (point p) (point p) (point y) (point x) (point p))
    by (apply perp_in_sym, per_perp_in; auto).
  assert (Hspec : point x <> point (other_endpoint x s) /\
                  Col (point x) (point p) (point (other_endpoint x s))).
  { unfold other_endpoint, endpoint_of, ascii_eqb in *.
    destruct (Ascii.eqb x (seg_start s)) eqn:Hstart.
    - apply Ascii.eqb_eq in Hstart. rewrite Hstart. split; [exact Hne|Col].
    - apply orb_true_iff in Hxs. destruct Hxs as [Hbad|Hend]; [congruence|].
      apply Ascii.eqb_eq in Hend. rewrite Hend. split; [congruence|Col]. }
  destruct Hspec as [Hdistinct Hcollinear].
  assert (Hext : Interp (PerpAt (segment p y) (segment x (other_endpoint x s)) p)).
  { cbn. eapply perp_in_col_perp_in; [exact Hdistinct|exact Hcollinear|exact Hbase]. }
  apply (perp_at_realign (segment p y) (segment x (other_endpoint x s)) u s p p);
    [ apply endpoints_determine; [intro Heq; apply Hy; now rewrite Heq| |]; auto
    | now apply other_endpoint_spec
    | unfold ascii_eqb; apply Ascii.eqb_refl
    | exact Hext ].
Qed.

Lemma def_perp_core : forall u s p x y,
  point x <> point p -> point y <> point p ->
  Per (point x) (point p) (point y) ->
  endpoint_of p u = true -> endpoint_of y u = true ->
  endpoint_of x s = true -> Interp (OnLine s p) -> Interp (PerpAt u s p).
Proof.
  intros u s p x y Hx Hy Hper Hpu Hyu Hxs Hline.
  cbn in Hline. destruct Hline as [Hne Hbet].
  pose proof (bet_col _ _ _ Hbet) as Hcol.
  apply (perp_core_col u s p x y); try assumption. Col.
Qed.

Lemma def_perp_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  def_perp premises facts i conclusion = true -> Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold def_perp in Hrule. destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hshape Hon].
  assert (Hright : Interp (RightAng a)) by (eapply lookup_step_sound; eauto).
  cbn in Hright. destruct Hright as [[Hleft Hright] Hper].
  unfold right_angle in Hper.
  (* the [on_line] premise, realigned onto the conclusion's own segment *)
  rewrite premise_found_existsb in Hon.
  apply existsb_exists in Hon. destruct Hon as [pr [Hin Hmatch]].
  unfold on_line_premise in Hmatch.
  pose proof ((proj1 (@Forall_forall Premise (interp_premise point) premises))
                Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr.
  destruct (on_line_witness (premise_statement pr)) as [[t q]|] eqn:Hwitness;
    try discriminate.
  assert (Hpremise : premise_statement pr = OnLine t q).
  { unfold on_line_witness in Hwitness.
    destruct (premise_statement pr); try discriminate.
    now injection Hwitness as <- <-. }
  rewrite Hpremise in Hpr.
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hseg Hpoint].
  pose proof (on_line_u_sound s0 t p q Hseg Hpoint Hpr) as Hline.
  (* either ray may be the one lying along the perpendicular *)
  apply andb_true_iff in Hshape. destruct Hshape as [Hvertex Hshape].
  unfold ascii_eqb in Hvertex. apply Ascii.eqb_eq in Hvertex. subst p.
  apply orb_true_iff in Hshape. unfold def_perp_shape in Hshape.
  destruct Hshape as [Hcase|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hcase Hyu];
    apply andb_true_iff in Hcase; destruct Hcase as [Hpu Hxs].
  - eapply (def_perp_core _ _ _ (ang_left a) (ang_right a)); eassumption.
  - eapply (def_perp_core _ _ _ (ang_right a) (ang_left a)); try eassumption.
    now apply l8_2.
Qed.

(** Meaning-level transfer for quadrilateral side matching: a side named up
    to reversal and pair order carries its [Par] or [Cong] fact onto the
    canonical side segments. *)
Lemma para_pair_sound : forall s1 s2 a b,
  segment_pair_eqb s1 s2 a b = true ->
  Interp (Para s1 s2) ->
  Par (point a.(seg_start)) (point a.(seg_end))
      (point b.(seg_start)) (point b.(seg_end)).
Proof.
  intros s1 s2 a b Hpair Hpar.
  cbn in Hpar. unfold Audit.Parallel, seg_name, Audit.seg_start,
    Audit.seg_end in Hpar. cbn in Hpar.
  unfold segment_pair_eqb in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [H1 H2];
    apply segment_u_eqb_cases in H1; apply segment_u_eqb_cases in H2;
    destruct H1 as [->| ->]; destruct H2 as [->| ->];
    unfold reverse_segment in Hpar; cbn in Hpar;
    eauto 6 using par_symmetry, par_left_comm, par_right_comm, par_comm.
Qed.

Lemma cong_pair_sound : forall s1 s2 a b,
  segment_pair_eqb s1 s2 a b = true ->
  Interp (ConSeg s1 s2) ->
  Cong (point a.(seg_start)) (point a.(seg_end))
       (point b.(seg_start)) (point b.(seg_end)).
Proof.
  intros s1 s2 a b Hpair Hcong. cbn in Hcong.
  unfold segment_pair_eqb in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [H1 H2];
    apply segment_u_eqb_cases in H1; apply segment_u_eqb_cases in H2;
    destruct H1 as [->| ->]; destruct H2 as [->| ->];
    unfold reverse_segment in Hcong; cbn in Hcong; Cong.
Qed.

Lemma cong_pair_conclude : forall s1 s2 a b,
  segment_pair_eqb s1 s2 a b = true ->
  Cong (point a.(seg_start)) (point a.(seg_end))
       (point b.(seg_start)) (point b.(seg_end)) ->
  Interp (ConSeg s1 s2).
Proof.
  intros s1 s2 a b Hpair Hcong.
  cbn. unfold segment_pair_eqb in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [H1 H2];
    apply segment_u_eqb_cases in H1; apply segment_u_eqb_cases in H2;
    destruct H1 as [->| ->]; destruct H2 as [->| ->];
    unfold reverse_segment; cbn; Cong.
Qed.

Lemma declared_quadrilateral_sound : forall decls q,
  declarations_well_formed point decls ->
  declared_quadrilateral decls q = true ->
  Audit.QuadrilateralWellFormed point (quad_name q).
Proof.
  intros decls q Hwf H. destruct Hwf as [_ [_ Hq]].
  unfold declared_quadrilateral in H. apply existsb_exists in H.
  destruct H as [r [Hin Heq]]. apply quadrilateral_eqb_eq in Heq.
  subst r. now apply Hq.
Qed.

Lemma def_parallelogram_sound : forall decls facts i j conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  def_parallelogram_rule decls facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros decls facts i j conclusion Hwf Hfacts Hrule.
  unfold def_parallelogram_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdecl Hmatch].
  assert (Hp1 : Interp (Para s s0)) by (eapply lookup_step_sound; eauto).
  assert (Hp2 : Interp (Para s1 s2)) by (eapply lookup_step_sound; eauto).
  cbn. unfold Audit.IsParallelogram.
  apply orb_true_iff in Hmatch;
    destruct Hmatch as [Hm|Hm]; apply andb_true_iff in Hm;
    destruct Hm as [HmA HmB];
    [pose proof (para_pair_sound _ _ _ _ HmA Hp1) as HP1;
     pose proof (para_pair_sound _ _ _ _ HmB Hp2) as HP2
    |pose proof (para_pair_sound _ _ _ _ HmB Hp2) as HP1;
     pose proof (para_pair_sound _ _ _ _ HmA Hp1) as HP2];
    cbn in HP1, HP2;
    (split; [eapply declared_quadrilateral_sound; eauto|]);
    unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn;
    (split; [exact HP1|exact HP2]).
Qed.

Lemma rectangle_pgram_sound : forall facts i conclusion,
  Forall Interp facts -> rectangle_pgram_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold rectangle_pgram_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  apply quadrilateral_eqb_eq in Hrule. subst.
  assert (Hr : Interp (Rect q0)) by (eapply lookup_step_sound; eauto).
  cbn in Hr |- *. exact (proj1 Hr).
Qed.

Lemma rhombus_pgram_sound : forall facts i conclusion,
  Forall Interp facts -> rhombus_pgram_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold rhombus_pgram_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  apply quadrilateral_eqb_eq in Hrule. subst.
  assert (Hr : Interp (Rhomb q0)) by (eapply lookup_step_sound; eauto).
  cbn in Hr |- *. exact (proj1 Hr).
Qed.

Lemma para_pair_conclude : forall s1 s2 a b,
  segment_pair_eqb s1 s2 a b = true ->
  Par (point a.(seg_start)) (point a.(seg_end))
      (point b.(seg_start)) (point b.(seg_end)) ->
  Interp (Para s1 s2).
Proof.
  intros s1 s2 a b Hpair Hpar.
  cbn. unfold Audit.Parallel, seg_name, Audit.seg_start, Audit.seg_end. cbn.
  unfold segment_pair_eqb in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [H1 H2];
    apply segment_u_eqb_cases in H1; apply segment_u_eqb_cases in H2;
    destruct H1 as [->| ->]; destruct H2 as [->| ->];
    unfold reverse_segment; cbn;
    eauto 6 using par_symmetry, par_left_comm, par_right_comm, par_comm.
Qed.

(** Transfer a [Par] fact between the spellings that name a transversal's
    line: all three candidate name pairs lie on that line by the audited
    betweenness, so [par_col2_par] carries parallelism across the renaming
    in both directions. *)
Lemma line_name_par_out : forall s a b i1 X Y,
  line_name_matches s a b i1 = true ->
  BetS (point a) (point i1) (point b) ->
  Par X Y (point s.(seg_start)) (point s.(seg_end)) ->
  Par X Y (point a) (point b).
Proof.
  intros s a b i1 X Y Hm [Hbet [HneA HneI]] Hpar.
  assert (HneAB : point a <> point b).
  { intro Heq. rewrite <- Heq in Hbet.
    apply HneA, between_identity. assumption. }
  assert (HcolI : Col (point a) (point i1) (point b))
    by (apply bet_col; assumption).
  unfold line_name_matches in Hm.
  apply orb_true_iff in Hm. destruct Hm as [Hm|Hm].
  - apply orb_true_iff in Hm. destruct Hm as [Hm|Hm];
      apply segment_u_eqb_cases in Hm; destruct Hm as [->| ->];
      unfold reverse_segment in Hpar; cbn in Hpar.
    + assumption.
    + now apply par_right_comm.
    + apply (par_col2_par X Y (point a) (point i1) (point a) (point b)
               HneAB Hpar); Col.
    + apply (par_col2_par X Y (point i1) (point a) (point a) (point b)
               HneAB Hpar); Col.
  - apply segment_u_eqb_cases in Hm; destruct Hm as [->| ->];
      unfold reverse_segment in Hpar; cbn in Hpar.
    + apply (par_col2_par X Y (point i1) (point b) (point a) (point b)
               HneAB Hpar); Col.
    + apply (par_col2_par X Y (point b) (point i1) (point a) (point b)
               HneAB Hpar); Col.
Qed.

Lemma line_name_par_in : forall s a b i1 X Y,
  line_name_matches s a b i1 = true ->
  BetS (point a) (point i1) (point b) ->
  Par X Y (point a) (point b) ->
  Par X Y (point s.(seg_start)) (point s.(seg_end)).
Proof.
  intros s a b i1 X Y Hm [Hbet [HneA HneI]] Hpar.
  assert (HcolI : Col (point a) (point i1) (point b))
    by (apply bet_col; assumption).
  assert (HneIB : point i1 <> point b) by exact HneI.
  unfold line_name_matches in Hm.
  apply orb_true_iff in Hm. destruct Hm as [Hm|Hm].
  - apply orb_true_iff in Hm. destruct Hm as [Hm|Hm];
      apply segment_u_eqb_cases in Hm; destruct Hm as [->| ->];
      unfold reverse_segment; cbn.
    + assumption.
    + now apply par_right_comm.
    + apply (par_col2_par X Y (point a) (point b) (point a) (point i1)
               HneA Hpar); Col.
    + apply par_right_comm.
      apply (par_col2_par X Y (point a) (point b) (point a) (point i1)
               HneA Hpar); Col.
  - apply segment_u_eqb_cases in Hm; destruct Hm as [->| ->];
      unfold reverse_segment; cbn.
    + apply (par_col2_par X Y (point a) (point b) (point i1) (point b)
               HneIB Hpar); Col.
    + apply par_right_comm.
      apply (par_col2_par X Y (point a) (point b) (point i1) (point b)
               HneIB Hpar); Col.
Qed.

Lemma transversal_para_sound : forall s1 s2 pa pb pi1 pc pd pi2,
  transversal_lines_match s1 s2 pa pb pi1 pc pd pi2 = true ->
  BetS (point pa) (point pi1) (point pb) ->
  BetS (point pc) (point pi2) (point pd) ->
  Interp (Para s1 s2) ->
  Par (point pa) (point pb) (point pc) (point pd).
Proof.
  intros s1 s2 pa pb pi1 pc pd pi2 Hm Hab Hcd Hpara.
  cbn in Hpara. unfold Audit.Parallel, seg_name, Audit.seg_start,
    Audit.seg_end in Hpara. cbn in Hpara.
  unfold transversal_lines_match in Hm.
  apply orb_true_iff in Hm; destruct Hm as [Hm|Hm];
    apply andb_true_iff in Hm; destruct Hm as [H1 H2].
  - apply par_symmetry.
    apply (line_name_par_out s1 pa pb pi1 _ _ H1 Hab).
    apply par_symmetry.
    apply (line_name_par_out s2 pc pd pi2 _ _ H2 Hcd).
    exact Hpara.
  - apply par_symmetry.
    apply (line_name_par_out s2 pa pb pi1 _ _ H1 Hab).
    apply par_symmetry.
    apply (line_name_par_out s1 pc pd pi2 _ _ H2 Hcd).
    apply par_symmetry. exact Hpara.
Qed.

Lemma transversal_para_conclude : forall s1 s2 pa pb pi1 pc pd pi2,
  transversal_lines_match s1 s2 pa pb pi1 pc pd pi2 = true ->
  BetS (point pa) (point pi1) (point pb) ->
  BetS (point pc) (point pi2) (point pd) ->
  Par (point pa) (point pb) (point pc) (point pd) ->
  Interp (Para s1 s2).
Proof.
  intros s1 s2 pa pb pi1 pc pd pi2 Hm Hab Hcd Hpar.
  cbn. unfold Audit.Parallel, seg_name, Audit.seg_start, Audit.seg_end. cbn.
  unfold transversal_lines_match in Hm.
  apply orb_true_iff in Hm; destruct Hm as [Hm|Hm];
    apply andb_true_iff in Hm; destruct Hm as [H1 H2].
  - apply (line_name_par_in s2 pc pd pi2 _ _ H2 Hcd).
    apply par_symmetry.
    apply (line_name_par_in s1 pa pb pi1 _ _ H1 Hab).
    apply par_symmetry. exact Hpar.
  - apply (line_name_par_in s2 pa pb pi1 _ _ H1 Hab).
    apply par_symmetry.
    apply (line_name_par_in s1 pc pd pi2 _ _ H2 Hcd).
    exact Hpar.
Qed.

Lemma conga_pair_sound : forall x y a b,
  angle_pair_eqb x y a b = true ->
  Interp (ConAng x y) ->
  CongA (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right))
        (point b.(ang_left)) (point b.(ang_vertex)) (point b.(ang_right)).
Proof.
  intros x y a b Hpair Hconga. cbn in Hconga.
  unfold angle_pair_eqb in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [H1 H2];
    apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
    destruct H1 as [->| ->]; destruct H2 as [->| ->];
    unfold reverse_angle in Hconga; cbn in Hconga; CongA.
Qed.

Lemma conga_pair_conclude : forall x y a b,
  angle_pair_eqb x y a b = true ->
  CongA (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right))
        (point b.(ang_left)) (point b.(ang_vertex)) (point b.(ang_right)) ->
  Interp (ConAng x y).
Proof.
  intros x y a b Hpair Hconga.
  cbn. unfold angle_pair_eqb in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [H1 H2];
    apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
    destruct H1 as [->| ->]; destruct H2 as [->| ->];
    unfold reverse_angle; cbn; CongA.
Qed.

Lemma suppa_pair_sound : forall x y a b,
  angle_pair_eqb x y a b = true ->
  Interp (Supplementary x y) ->
  SuppA (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right))
        (point b.(ang_left)) (point b.(ang_vertex)) (point b.(ang_right)).
Proof.
  intros x y a b Hpair Hsupp. cbn in Hsupp.
  unfold angle_pair_eqb in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [H1 H2];
    apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
    destruct H1 as [->| ->]; destruct H2 as [->| ->];
    unfold reverse_angle in Hsupp; cbn in Hsupp;
    solve [ assumption
          | now apply suppa_sym
          | now apply suppa_left_comm | now apply suppa_right_comm
          | now apply suppa_comm
          | now apply suppa_left_comm, suppa_sym
          | now apply suppa_right_comm, suppa_sym
          | now apply suppa_comm, suppa_sym
          | now apply suppa_sym, suppa_left_comm
          | now apply suppa_sym, suppa_right_comm
          | now apply suppa_sym, suppa_comm ].
Qed.

Lemma suppa_pair_conclude : forall x y a b,
  angle_pair_eqb x y a b = true ->
  SuppA (point a.(ang_left)) (point a.(ang_vertex)) (point a.(ang_right))
        (point b.(ang_left)) (point b.(ang_vertex)) (point b.(ang_right)) ->
  Interp (Supplementary x y).
Proof.
  intros x y a b Hpair Hsupp.
  cbn. unfold angle_pair_eqb in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [H1 H2];
    apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
    destruct H1 as [->| ->]; destruct H2 as [->| ->];
    unfold reverse_angle; cbn;
    solve [ assumption
          | now apply suppa_sym
          | now apply suppa_left_comm | now apply suppa_right_comm
          | now apply suppa_comm
          | now apply suppa_left_comm, suppa_sym
          | now apply suppa_right_comm, suppa_sym
          | now apply suppa_comm, suppa_sym
          | now apply suppa_sym, suppa_left_comm
          | now apply suppa_sym, suppa_right_comm
          | now apply suppa_sym, suppa_comm ].
Qed.

(** Extract the transversal configuration named by a diagram premise. *)
Lemma transversal_premise_sound : forall premises check,
  Forall (interp_premise point) premises ->
  transversal_premise_check check premises = true ->
  exists pa pb pt1 pi1 pc pd pt2 pi2,
    check pa pb pt1 pi1 pc pd pt2 pi2 = true /\
    BetS (point pt1) (point pi1) (point pi2) /\
    BetS (point pi1) (point pi2) (point pt2) /\
    BetS (point pa) (point pi1) (point pb) /\
    BetS (point pc) (point pi2) (point pd) /\
    OS (point pi1) (point pi2) (point pa) (point pc).
Proof.
  intros premises check Hprem Hcheck.
  unfold transversal_premise_check in Hcheck.
  rewrite premise_found_existsb in Hcheck.
  apply existsb_exists in Hcheck. destruct Hcheck as [pr [Hin Hc]].
  unfold transversal_premise in Hc.
  pose proof ((proj1 (Forall_forall _ _)) Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr.
  destruct (transversal_witness pr.(premise_statement))
    as [[[[[[[[pa pb] pt1] pi1] pc] pd] pt2] pi2]|] eqn:Hwit; try discriminate.
  assert (Hpremise : pr.(premise_statement) = Transv pa pb pt1 pi1 pc pd pt2 pi2).
  { unfold transversal_witness in Hwit.
    destruct pr.(premise_statement); try discriminate.
    now injection Hwit as <- <- <- <- <- <- <- <-. }
  rewrite Hpremise in Hpr. cbn in Hpr.
  unfold Audit.TransversalConfiguration in Hpr. cbn in Hpr.
  destruct Hpr as [H1 [H2 [H3 [H4 H5]]]].
  exists pa, pb, pt1, pi1, pc, pd, pt2, pi2.
  split; [exact Hc|]. split; [exact H1|]. split; [exact H2|].
  split; [exact H3|]. split; [exact H4|exact H5].
Qed.

Lemma altint_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  altint_conv_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold altint_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hconga : Interp (ConAng a a0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc [Hbt1 [Hbt2 [Hbab [Hbcd Hos]]]]]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ Hlines Hbab Hbcd).
  apply (ender_transversal_master_conv (point pi1) (point pi2)); try assumption.
  pose proof Hbt1 as [_ [_ Hi12]].
  pose proof Hbab as [_ [Hai1 _]].
  pose proof Hbcd as [_ [_ Hi2d]].
  assert (Hwf1a : angle_well_formed point (angle pa pi1 pi2))
    by (cbn; split; [exact Hai1|exact (swap_diff _ _ Hi12)]).
  assert (Hwf1b : angle_well_formed point (angle pd pi2 pi1))
    by (cbn; split; [exact (swap_diff _ _ Hi2d)|exact Hi12]).
  assert (Hwf2a : angle_well_formed point (angle pb pi1 pi2)).
  { pose proof Hbab as [_ [_ Hi1b]]. cbn; split; [exact (swap_diff _ _ Hi1b)|exact (swap_diff _ _ Hi12)]. }
  assert (Hwf2b : angle_well_formed point (angle pc pi2 pi1)).
  { pose proof Hbcd as [_ [Hci2 _]]. cbn; split; [exact Hci2|exact Hi12]. }
  unfold altint_pair in Hpairs. repeat rewrite orb_true_iff in Hpairs.
  destruct Hpairs as [[[Hm|Hm]|Hm]|Hm].
  - left. pose proof (conga_pair_sound _ _ _ _ Hm Hconga) as HC.
    cbn in HC. exact HC.
  - right. pose proof (conga_pair_sound _ _ _ _ Hm Hconga) as HC.
    cbn in HC. exact HC.
  - left. exact (conga_ray_pair_sound _ _ _ _ _ Hprem Hwf1a Hwf1b Hm Hconga).
  - right. exact (conga_ray_pair_sound _ _ _ _ _ Hprem Hwf2a Hwf2b Hm Hconga).
Qed.

Lemma altext_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  altext_conv_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold altext_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hconga : Interp (ConAng a a0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc [Hbt1 [Hbt2 [Hbab [Hbcd Hos]]]]]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ Hlines Hbab Hbcd).
  apply (ender_transversal_altext_conv (point pt1) (point pi1) (point pi2)
           (point pt2)); try assumption.
  unfold altext_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm].
  - left. pose proof (conga_pair_sound _ _ _ _ Hm Hconga) as HC.
    cbn in HC. exact HC.
  - right. pose proof (conga_pair_sound _ _ _ _ Hm Hconga) as HC.
    cbn in HC. exact HC.
Qed.

Lemma corresp_ang_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  corresp_ang_conv_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold corresp_ang_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hconga : Interp (ConAng a a0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc [Hbt1 [Hbt2 [Hbab [Hbcd Hos]]]]]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ Hlines Hbab Hbcd).
  apply (ender_transversal_corresp_conv (point pt1) (point pi1) (point pi2)
           (point pt2)); try assumption.
  unfold corresp_pair in Hpairs.
  apply orb_true_iff in Hpairs. destruct Hpairs as [Hpairs|Hm4].
  2:{ do 3 right. pose proof (conga_pair_sound _ _ _ _ Hm4 Hconga) as HC.
      cbn in HC. exact HC. }
  apply orb_true_iff in Hpairs. destruct Hpairs as [Hpairs|Hm3].
  2:{ do 2 right; left.
      pose proof (conga_pair_sound _ _ _ _ Hm3 Hconga) as HC.
      cbn in HC. exact HC. }
  apply orb_true_iff in Hpairs. destruct Hpairs as [Hm1|Hm2].
  - left. pose proof (conga_pair_sound _ _ _ _ Hm1 Hconga) as HC.
    cbn in HC. exact HC.
  - right; left. pose proof (conga_pair_sound _ _ _ _ Hm2 Hconga) as HC.
    cbn in HC. exact HC.
Qed.

Lemma sameside_ang_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  sameside_ang_conv_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold sameside_ang_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hsupp : Interp (Supplementary a a0))
    by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc [Hbt1 [Hbt2 [Hbab [Hbcd Hos]]]]]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ Hlines Hbab Hbcd).
  apply (ender_transversal_sameside_conv (point pt1) (point pi1) (point pi2)
           (point pt2)); try assumption.
  unfold sameside_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm].
  - left. pose proof (suppa_pair_sound _ _ _ _ Hm Hsupp) as HC.
    cbn in HC. exact HC.
  - right. pose proof (suppa_pair_sound _ _ _ _ Hm Hsupp) as HC.
    cbn in HC. exact HC.
Qed.

Lemma def_radius_sound : forall facts i conclusion,
  Forall Interp facts -> def_radius_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold def_radius_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hr : Interp (RadiusOf c p)) by (eapply lookup_step_sound; eauto).
  cbn in Hr. destruct Hr as [Hwf Hcong]. cbn in Hcong.
  eapply cong_pair_conclude; [exact Hrule|]. cbn. exact Hcong.
Qed.

Lemma con_chords_arcs_sound : forall facts i conclusion,
  Forall Interp facts -> con_chords_arcs_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold con_chords_arcs_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hc : Interp (ConArc a a0)) by (eapply lookup_step_sound; eauto).
  cbn in Hc.
  destruct Hc as [Hwf1 [Hwf2 [Hkind [Hrad Hconga]]]].
  destruct Hwf1 as [Hne1 [Hon11 Hon12]].
  destruct Hwf2 as [Hne2 [Hon21 Hon22]].
  destruct Hon11 as [_ HcX1]. destruct Hon12 as [_ HcY1].
  destruct Hon21 as [_ HcX2]. destruct Hon22 as [_ HcY2].
  cbn in HcX1, HcY1, HcX2, HcY2, Hrad, Hconga.
  assert (HOX : Cong (point (a.(arc_circ)).(circle_c)) (point a.(arc_p1))
                     (point (a0.(arc_circ)).(circle_c)) (point a0.(arc_p1))).
  { apply cong_transitivity with (point (a.(arc_circ)).(circle_c))
        (point (a.(arc_circ)).(circle_r)); [exact HcX1|].
    apply cong_transitivity with (point (a0.(arc_circ)).(circle_c))
        (point (a0.(arc_circ)).(circle_r)); [exact Hrad|Cong]. }
  assert (HOY : Cong (point (a.(arc_circ)).(circle_c)) (point a.(arc_p2))
                     (point (a0.(arc_circ)).(circle_c)) (point a0.(arc_p2))).
  { apply cong_transitivity with (point (a.(arc_circ)).(circle_c))
        (point (a.(arc_circ)).(circle_r)); [exact HcY1|].
    apply cong_transitivity with (point (a0.(arc_circ)).(circle_c))
        (point (a0.(arc_circ)).(circle_r)); [exact Hrad|Cong]. }
  destruct (l11_49 (point a.(arc_p1)) (point (a.(arc_circ)).(circle_c))
              (point a.(arc_p2)) (point a0.(arc_p1))
              (point (a0.(arc_circ)).(circle_c)) (point a0.(arc_p2))
              Hconga HOX HOY) as [Hchord _].
  eapply cong_pair_conclude; [exact Hrule|]. cbn. exact Hchord.
Qed.

Lemma tangent_perp_sound : forall facts i j conclusion,
  Forall Interp facts -> tangent_perp_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold tangent_perp_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hor].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hqp].
  apply andb_true_iff in Hrule. destruct Hrule as [Hcirc Hpp].
  unfold ascii_eqb in Hqp. apply Ascii.eqb_eq in Hqp. subst p.
  assert (Ht : Interp (TangentAt c s1 p0)) by (eapply lookup_step_sound; eauto).
  cbn in Ht. destruct Ht as [Hsegwf [Honp [Hcol HQ]]].
  destruct Honp as [Hcwf Hcongp]. cbn in Hcwf, Hcongp, Hsegwf, Hcol.
  assert (Hpp1 : ascii_eqb p0 p0 = true)
    by (unfold ascii_eqb; apply Ascii.eqb_refl).
  assert (HOp : point (c.(circle_c)) <> point p0).
  { intro Heq. apply Hcwf.
    rewrite <- Heq in Hcongp.
    apply (cong_identity _ _ (point c.(circle_c))). Cong. }
  destruct HQ as [Q [Hdisj [HQne HPer]]].
  assert (Hcore : Interp (PerpAt (segment c.(circle_c) p0) s1 p0)).
  { destruct Hdisj as [HQ1|HQ2].
    - apply (perp_core_col _ _ _ s1.(seg_start) c.(circle_c)).
      + rewrite HQ1 in HQne. exact HQne.
      + exact HOp.
      + apply l8_2. rewrite HQ1 in HPer. exact HPer.
      + unfold endpoint_of, ascii_eqb. cbn. rewrite Ascii.eqb_refl.
        now rewrite orb_true_r.
      + unfold endpoint_of, ascii_eqb. cbn. now rewrite Ascii.eqb_refl.
      + unfold endpoint_of, ascii_eqb. now rewrite Ascii.eqb_refl.
      + exact Hsegwf.
      + exact Hcol.
    - apply (perp_core_col _ _ _ s1.(seg_end) c.(circle_c)).
      + rewrite HQ2 in HQne. exact HQne.
      + exact HOp.
      + apply l8_2. rewrite HQ2 in HPer. exact HPer.
      + unfold endpoint_of, ascii_eqb. cbn. rewrite Ascii.eqb_refl.
        now rewrite orb_true_r.
      + unfold endpoint_of, ascii_eqb. cbn. now rewrite Ascii.eqb_refl.
      + unfold endpoint_of, ascii_eqb. cbn. rewrite Ascii.eqb_refl.
        now rewrite orb_true_r.
      + exact Hsegwf.
      + exact Hcol. }
  apply orb_true_iff in Hor. destruct Hor as [Hcase|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [H1 H2].
  - assert (Hsw : Interp (PerpAt s1 (segment c.(circle_c) p0) p0)).
    { cbn in Hcore |- *. apply perp_in_sym. exact Hcore. }
    exact (proj2 (perp_at_realign s s0 s1 (segment c.(circle_c) p0) p0 p0
                    H1 H2 Hpp1) Hsw).
  - exact (proj2 (perp_at_realign s s0 (segment c.(circle_c) p0) s1 p0 p0
                    H2 H1 Hpp1) Hcore).
Qed.

(** Everything above holds in neutral geometry.  [third_angle] is the first
    rule that genuinely needs the parallel postulate, so the assumption enters
    here rather than at the top of the section; every lemma stated before this
    point is free of it. *)
Context {TE : @Tarski_euclidean Tn TnEQD}.

Lemma schema2_sound : forall decls premises facts i j a b,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts -> schema2 decls premises facts i j a b = true ->
  Interp a /\ Interp b.
Proof.
  intros decls premises facts i j a b Hwf Hprem Hall H. unfold schema2 in H.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate.
  apply andb_true_iff in H. destruct H as [Ha Hb].
  pose proof (lookup_step_sound facts i x Hall Hx) as HIx.
  pose proof (lookup_step_sound facts j y Hall Hy) as HIy.
  split; eapply dependency_matches_sound; eauto.
Qed.

Lemma correspondences_well_formed : forall t u c,
  In c (correspondences t u) ->
  triangle_well_formed point t -> triangle_well_formed point u ->
  triangle_well_formed point (fst c) /\ triangle_well_formed point (snd c).
Proof.
  intros t u c Hin Ht Hu. unfold correspondences in Hin. cbn in Hin.
  repeat (destruct Hin as [<-|Hin]; [cbn; split;
    solve [ assumption
          | now apply rotated_well_formed
          | now apply reversed_well_formed
          | now apply rotated_well_formed, reversed_well_formed
          | now apply rotated_well_formed, rotated_well_formed
          | now apply rotated_well_formed, rotated_well_formed,
                      reversed_well_formed ]|]).
  contradiction.
Qed.

Lemma third_angle_sound : forall decls premises facts i j conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts ->
  third_angle decls premises facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros decls premises facts i j conclusion Hwf Hprem Hall Hrule.
  unfold third_angle in Hrule.
  apply existsb_exists in Hrule. destruct Hrule as [t [Hint Hrule]].
  apply existsb_exists in Hrule. destruct Hrule as [u [Hinu Hrule]].
  apply existsb_exists in Hrule. destruct Hrule as [c [Hinc Hmatch]].
  assert (Hwft : forall x, In x decls.(decl_triangles) ->
                 triangle_well_formed point x) by apply Hwf.
  pose proof (correspondences_well_formed t u c Hinc (Hwft t Hint) (Hwft u Hinu))
    as [Hwt Hwu].
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hdeps Hconclusion].
  apply (schema2_sound _ _ _ _ _ _ _ Hwf Hprem Hall) in Hdeps.
  destruct Hdeps as [HatA HatB].
  apply (fact_eqb_sound _ _ Hconclusion).
  destruct c as [[A B C] [D E F]]. cbn in HatA, HatB, Hwt, Hwu |- *.
  now apply ender_third_angle.
Qed.

Lemma pgram_opp_sides_sound : forall facts i conclusion,
  Forall Interp facts -> pgram_opp_sides_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold pgram_opp_sides_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hp : Interp (Pgram q)) by (eapply lookup_step_sound; eauto).
  cbn in Hp. destruct Hp as [Hwfq [Hpar1 Hpar2]].
  destruct Hwfq as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol, HXac, HXbd.
  pose proof (ender_pgram_opp_sides _ _ _ _ _ Hncol HXac HXbd Hpar1 Hpar2)
    as [Hc1 Hc2].
  apply orb_true_iff in Hrule. destruct Hrule as [Hm|Hm].
  - eapply cong_pair_conclude; [exact Hm|]. cbn. exact Hc1.
  - eapply cong_pair_conclude; [exact Hm|]. cbn. exact Hc2.
Qed.

Lemma pgram_opp_angles_sound : forall facts i conclusion,
  Forall Interp facts -> pgram_opp_angles_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule. unfold pgram_opp_angles_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hp : Interp (Pgram q)) by (eapply lookup_step_sound; eauto).
  cbn in Hp. destruct Hp as [Hwf [Hpar1 Hpar2]].
  destruct Hwf as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol Hex]]]]]]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol.
  pose proof (ender_pgram_opp_angles
    (point q.(quad_a)) (point q.(quad_b))
    (point q.(quad_c)) (point q.(quad_d))
    (conj HAB (conj HAC HBC)) Hncol Hpar1 Hpar2) as [Hang1 Hang2].
  apply orb_true_iff in Hrule. destruct Hrule as [Hm|Hm].
  - eapply conga_pair_conclude; [exact Hm|]. cbn. now apply conga_sym.
  - eapply conga_pair_conclude; [exact Hm|]. cbn. exact Hang1.
Qed.

Lemma rhombus_consec_sides_sound : forall facts i j conclusion,
  Forall Interp facts ->
  rhombus_consec_sides_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold rhombus_consec_sides_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Heq Hmatch].
  apply quadrilateral_eqb_eq in Heq. subst.
  assert (Hp : Interp (Pgram q0)) by (eapply lookup_step_sound; eauto).
  assert (Hcseg : Interp (ConSeg s s0)) by (eapply lookup_step_sound; eauto).
  cbn in Hp. destruct Hp as [Hwfq [Hpar1 Hpar2]].
  pose proof Hwfq as Hwfcopy.
  destruct Hwfcopy as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol, HXac, HXbd.
  assert (Hadj :
    Cong (point q0.(quad_a)) (point q0.(quad_b))
         (point q0.(quad_b)) (point q0.(quad_c)) \/
    Cong (point q0.(quad_b)) (point q0.(quad_c))
         (point q0.(quad_c)) (point q0.(quad_d)) \/
    Cong (point q0.(quad_c)) (point q0.(quad_d))
         (point q0.(quad_d)) (point q0.(quad_a)) \/
    Cong (point q0.(quad_d)) (point q0.(quad_a))
         (point q0.(quad_a)) (point q0.(quad_b))).
  { apply orb_true_iff in Hmatch. destruct Hmatch as [Hmatch|Hm].
    2:{ do 3 right.
        pose proof (cong_pair_sound _ _ _ _ Hm Hcseg) as HC.
        cbn in HC. exact HC. }
    apply orb_true_iff in Hmatch. destruct Hmatch as [Hmatch|Hm].
    2:{ do 2 right; left.
        pose proof (cong_pair_sound _ _ _ _ Hm Hcseg) as HC.
        cbn in HC. exact HC. }
    apply orb_true_iff in Hmatch. destruct Hmatch as [Hm|Hm].
    - left. pose proof (cong_pair_sound _ _ _ _ Hm Hcseg) as HC.
      cbn in HC. exact HC.
    - right; left. pose proof (cong_pair_sound _ _ _ _ Hm Hcseg) as HC.
      cbn in HC. exact HC. }
  pose proof (ender_rhombus_sides _ _ _ _ _ Hncol HXac HXbd Hpar1 Hpar2 Hadj)
    as [H1 [H2 H3]].
  cbn. split; [|split; [|split]].
  - split; [exact Hwfq|split; [exact Hpar1|exact Hpar2]].
  - exact H1.
  - exact H2.
  - exact H3.
Qed.

Lemma rhombus_def_sound : forall facts i conclusion,
  Forall Interp facts -> rhombus_def_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule. unfold rhombus_def_rule in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hr : Interp (Rhomb q)) by (eapply lookup_step_sound; eauto).
  cbn in Hr. destruct Hr as [_ [Hab [Hbc Hcd]]].
  assert (Hab' : Interp (ConSeg (quad_side_ab q) (quad_side_bc q))) by exact Hab.
  assert (Hbc' : Interp (ConSeg (quad_side_bc q) (quad_side_cd q))) by exact Hbc.
  assert (Hcd' : Interp (ConSeg (quad_side_cd q) (quad_side_da q))) by exact Hcd.
  assert (Hac : Interp (ConSeg (quad_side_ab q) (quad_side_cd q))).
  { cbn in Hab', Hbc' |- *. eapply cong_transitivity; eauto. }
  assert (Had : Interp (ConSeg (quad_side_ab q) (quad_side_da q))).
  { cbn in Hac, Hcd' |- *. eapply cong_transitivity; eauto. }
  assert (Hbd : Interp (ConSeg (quad_side_bc q) (quad_side_da q))).
  { cbn in Hbc', Hcd' |- *. eapply cong_transitivity; eauto. }
  repeat rewrite orb_true_iff in Hrule.
  destruct Hrule as [[[[[Heq|Heq]|Heq]|Heq]|Heq]|Heq];
    apply (fact_eqb_sound _ _ Heq); assumption.
Qed.

Lemma segment_u_eqb_flip : forall s v w,
  segment_u_eqb s (segment v w) = true ->
  segment_u_eqb s (segment w v) = true.
Proof.
  intros s v w H. apply segment_u_eqb_cases in H.
  unfold segment_u_eqb, segment_eqb, ascii_eqb, reverse_segment.
  destruct H as [H|H]; subst s; cbn; apply orb_true_iff;
    [right|left]; apply andb_true_iff; split; apply Ascii.eqb_refl.
Qed.

(** [W] sees the two rays of the corner at [V] as the equal sides of an
    isosceles pair, so the two triangles the segment [V W] cuts share three
    pairs of congruent sides and its corner halves are congruent. *)
Lemma ender_two_pairs_bisect : forall V P Q W,
  V <> P -> V <> W -> P <> W ->
  Cong V P V Q -> Cong W P W Q -> CongA P V W W V Q.
Proof.
  intros V P Q W HVP HVW HPW HV HW.
  destruct (l11_51 V P W V Q W HVP HVW HPW HV (cong_reflexivity V W)
              (cong_commutativity _ _ _ _ HW)) as [Hangle _].
  now apply conga_right_comm.
Qed.

(** Both spellings of the corner and both spellings of the ray name the same
    bisection; the audited meaning is a disjunction over exactly which
    endpoint of the ray is the vertex. *)
Lemma bisect_conclude : forall a s v p q w,
  angle_u_eqb a (angle p v q) = true ->
  segment_u_eqb s (segment v w) = true ->
  CongA (point p) (point v) (point w) (point w) (point v) (point q) ->
  Interp (AngBisectOf a s).
Proof.
  intros a s v p q w Hangle Hsegment Hcong.
  apply angle_u_eqb_cases in Hangle. apply segment_u_eqb_cases in Hsegment.
  unfold reverse_angle, reverse_segment in Hangle, Hsegment; cbn in *.
  destruct Hangle as [Hangle|Hangle]; subst a;
    destruct Hsegment as [Hsegment|Hsegment]; subst s; cbn;
    [left|right|left|right]; (split; [reflexivity|]);
    solve [exact Hcong | now apply conga_comm, conga_sym].
Qed.


(** The halves measured to the opposite corner are the halves measured to any
    point on the same ray from this one. *)
Lemma bisect_transport : forall p v q c w,
  point p <> point v -> point q <> point v ->
  Out (point v) (point w) (point c) ->
  CongA (point p) (point v) (point c) (point c) (point v) (point q) ->
  CongA (point p) (point v) (point w) (point w) (point v) (point q).
Proof.
  intros p v q c w Hp Hq Hout Hhalves.
  apply conga_trans with (point c) (point v) (point q).
  - apply conga_trans with (point p) (point v) (point c); [|exact Hhalves].
    apply conga_sym, out2__conga; [now apply out_trivial|exact Hout].
  - apply out2__conga; [exact Hout|now apply out_trivial].
Qed.

Lemma bisect_ray_conclude : forall decls premises a s v p q c,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  angle_u_eqb a (angle p v q) = true ->
  bisector_ray decls premises s v c = true ->
  point p <> point v -> point q <> point v -> point c <> point v ->
  CongA (point p) (point v) (point c) (point c) (point v) (point q) ->
  Interp (AngBisectOf a s).
Proof.
  intros decls premises a s v p q c Hwf Hprem Hangle Hray Hp Hq Hc Hhalves.
  unfold bisector_ray in Hray. apply orb_true_iff in Hray.
  destruct Hray as [Hdiagonal|Hlinked].
  { exact (bisect_conclude a s v p q c Hangle Hdiagonal Hhalves). }
  apply andb_true_iff in Hlinked. destruct Hlinked as [Hdeclared Hends].
  pose proof (declared_segment_sound _ _ Hwf Hdeclared) as Hdistinct.
  destruct s as [start finish]; cbn in Hdistinct.
  apply orb_true_iff in Hends.
  destruct Hends as [Hend|Hend]; apply andb_true_iff in Hend;
    destruct Hend as [Hvertex Hlink]; cbn in Hvertex, Hlink;
    unfold ascii_eqb in Hvertex; apply Ascii.eqb_eq in Hvertex; subst.
  - assert (Hout : Out (point v) (point finish) (point c))
      by (apply (ray_linked_out premises v c finish Hprem Hlink Hc);
          now apply not_eq_sym).
    exact (bisect_conclude a (segment v finish) v p q finish Hangle
             (segment_u_eqb_refl _) (bisect_transport p v q c finish Hp Hq Hout Hhalves)).
  - assert (Hout : Out (point v) (point start) (point c))
      by (apply (ray_linked_out premises v c start Hprem Hlink Hc); exact Hdistinct).
    exact (bisect_conclude a (segment start v) v p q start Hangle
             (segment_u_eqb_reverse _ _)
             (bisect_transport p v q c start Hp Hq Hout Hhalves)).
Qed.

Lemma rhombus_opp_bisect_sound : forall decls premises facts i conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts ->
  rhombus_opp_bisect_rule decls premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros decls premises facts i conclusion Hdecls Hprem Hfacts Hrule.
  unfold rhombus_opp_bisect_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hr : Interp (Rhomb q)) by (eapply lookup_step_sound; eauto).
  cbn in Hr. destruct Hr as [[Hwf _] [Hab [Hbc Hcd]]].
  destruct Hwf as [HAB [HAC [HAD [HBC [HBD [HCD _]]]]]].
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end, quad_name
    in Hab, Hbc, Hcd, HAB, HAC, HAD, HBC, HBD, HCD.
  cbn in Hab, Hbc, Hcd, HAB, HAC, HAD, HBC, HBD, HCD.
  (* the four sides are mutually congruent, so both triangles a diagonal cuts
     have congruent legs at either end *)
  assert (Hda : Cong (point q.(quad_a)) (point q.(quad_b))
                     (point q.(quad_d)) (point q.(quad_a))).
  { apply (cong_transitivity _ _ (point q.(quad_c)) (point q.(quad_d)));
      [now apply (cong_transitivity _ _ (point q.(quad_b)) (point q.(quad_c)))
      |exact Hcd]. }
  repeat rewrite orb_true_iff in Hrule.
  destruct Hrule as [[[Hcase|Hcase]|Hcase]|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Ha Hray].
  (* each diagonal bisects the two corners it runs between *)
  - apply (bisect_ray_conclude decls premises _ _ q.(quad_a) q.(quad_d)
             q.(quad_b) q.(quad_c) Hdecls Hprem Ha Hray);
      [now apply not_eq_sym|now apply not_eq_sym|now apply not_eq_sym|].
    apply ender_two_pairs_bisect; auto.
    + apply cong_symmetry, cong_right_commutativity, Hda.
    + apply cong_right_commutativity, cong_symmetry, Hbc.
  - apply (bisect_ray_conclude decls premises _ _ q.(quad_c) q.(quad_b)
             q.(quad_d) q.(quad_a) Hdecls Hprem Ha Hray);
      [exact HBC|now apply not_eq_sym|exact HAC|].
    apply ender_two_pairs_bisect; auto.
    + apply cong_left_commutativity, Hbc.
    + apply cong_right_commutativity, Hda.
  - apply (bisect_ray_conclude decls premises _ _ q.(quad_b) q.(quad_a)
             q.(quad_c) q.(quad_d) Hdecls Hprem Ha Hray);
      [exact HAB|now apply not_eq_sym|now apply not_eq_sym|].
    apply ender_two_pairs_bisect; auto.
    + apply cong_left_commutativity, Hab.
    + apply cong_symmetry, cong_left_commutativity, Hcd.
  - apply (bisect_ray_conclude decls premises _ _ q.(quad_d) q.(quad_c)
             q.(quad_a) q.(quad_b) Hdecls Hprem Ha Hray);
      [exact HCD|now apply not_eq_sym|exact HBD|].
    apply ender_two_pairs_bisect; auto.
    + apply cong_left_commutativity, Hcd.
    + apply cong_symmetry, cong_left_commutativity, Hab.
Qed.

Lemma midpoint_ray_linked_out : forall facts v p q,
  Forall Interp facts ->
  point p <> point v ->
  midpoint_ray_linked facts v p q = true ->
  Out (point v) (point q) (point p).
Proof.
  intros facts v p q Hfacts Hp Hlink.
  unfold midpoint_ray_linked in Hlink. apply orb_true_iff in Hlink.
  destruct Hlink as [Heq|Hlink].
  { apply Ascii.eqb_eq in Heq. subst q. apply out_trivial. exact Hp. }
  apply existsb_exists in Hlink. destruct Hlink as [st [Hin Hst]].
  destruct st; try discriminate.
  apply andb_true_iff in Hst. destruct Hst as [Hq Hseg].
  apply Ascii.eqb_eq in Hq. subst p0.
  pose proof ((proj1 (Forall_forall _ _)) Hfacts (MidptOf s q) Hin) as Hmid.
  cbn in Hmid. apply segment_u_eqb_cases in Hseg.
  destruct Hseg as [Hseg|Hseg]; subst s; cbn in Hmid.
  - destruct (midpoint_distinct_1 (point q) (point v) (point p)
      (swap_diff _ _ Hp) Hmid)
      as [Hqv _].
    apply bet_out; [exact Hqv|exact (proj1 Hmid)].
  - unfold reverse_segment in Hmid. cbn in Hmid.
    destruct (midpoint_distinct_1 (point q) (point p) (point v)
      Hp Hmid) as [Hqp Hqv].
    apply bet_out_1; [exact Hqv|exact (proj1 Hmid)].
Qed.

Lemma rectangle_angle_matches_sound : forall facts e a,
  Forall Interp facts ->
  angle_well_formed point e -> right_angle point e ->
  rectangle_angle_matches facts e a = true ->
  angle_well_formed point a /\ right_angle point a.
Proof.
  intros facts [el ev er] [al av ar] Hfacts [Hel Her] Hright Hmatch.
  cbn in Hel, Her, Hright, Hmatch |- *.
  unfold rectangle_angle_matches in Hmatch.
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hv Hrays].
  pose proof (proj1 (Ascii.eqb_eq ev av) Hv) as Heq. subst av.
  apply orb_true_iff in Hrays; destruct Hrays as [Hrays|Hrays];
    apply andb_true_iff in Hrays; destruct Hrays as [Hl Hr].
  - pose proof (midpoint_ray_linked_out facts _ _ _ Hfacts Hel Hl) as Hol.
    pose proof (midpoint_ray_linked_out facts _ _ _ Hfacts Her Hr) as Hor.
    destruct (out_distinct _ _ _ Hol) as [Hal _].
    destruct (out_distinct _ _ _ Hor) as [Har _].
    split; [exact (conj Hal Har)|].
    apply Per_perm, l8_3 with (A := point er);
      [apply Per_perm, l8_3 with (A := point el);
       [exact Hright|exact Hel|apply out_col in Hol; Col]
      |exact Her|apply out_col in Hor; Col].
  - pose proof (midpoint_ray_linked_out facts _ _ _ Hfacts Hel Hl) as Hol.
    pose proof (midpoint_ray_linked_out facts _ _ _ Hfacts Her Hr) as Hor.
    destruct (out_distinct _ _ _ Hol) as [Har _].
    destruct (out_distinct _ _ _ Hor) as [Hal _].
    split; [exact (conj Hal Har)|].
    apply l8_3 with (A := point er);
      [apply Per_perm, l8_3 with (A := point el);
       [exact Hright|exact Hel|apply out_col in Hol; Col]
      |exact Her|apply out_col in Hor; Col].
Qed.

Lemma rectangle_corner_sound : forall facts q a,
  Forall Interp facts ->
  Audit.QuadrilateralWellFormed point (quad_name q) ->
  right_angle point (quad_corner_a q) ->
  right_angle point (quad_corner_b q) ->
  right_angle point (quad_corner_c q) ->
  right_angle point (quad_corner_d q) ->
  rectangle_corner_matches facts q a = true ->
  angle_well_formed point a /\ right_angle point a.
Proof.
  intros facts [A B C D] a Hfacts Hwf Hra Hrb Hrc Hrd Hmatch.
  unfold quad_name, Audit.QuadrilateralWellFormed in Hwf. cbn in Hwf.
  unfold rectangle_corner_matches in Hmatch. cbn in Hra, Hrb, Hrc, Hrd, Hmatch |- *.
  destruct Hwf as [HAB [HAC [HAD [HBC [HBD [HCD _]]]]]].
  assert (Hwa : angle_well_formed point
      (quad_corner_a (quadrilateral A B C D))) by
    (unfold angle_well_formed; cbn; split; congruence).
  assert (Hwb : angle_well_formed point
      (quad_corner_b (quadrilateral A B C D))) by
    (unfold angle_well_formed; cbn; split; congruence).
  assert (Hwc : angle_well_formed point
      (quad_corner_c (quadrilateral A B C D))) by
    (unfold angle_well_formed; cbn; split; congruence).
  assert (Hwd : angle_well_formed point
      (quad_corner_d (quadrilateral A B C D))) by
    (unfold angle_well_formed; cbn; split; congruence).
  repeat rewrite orb_true_iff in Hmatch.
  destruct Hmatch as [[[Hm|Hm]|Hm]|Hm].
  - eapply rectangle_angle_matches_sound; [exact Hfacts|exact Hwa|exact Hra|exact Hm].
  - eapply rectangle_angle_matches_sound; [exact Hfacts|exact Hwb|exact Hrb|exact Hm].
  - eapply rectangle_angle_matches_sound; [exact Hfacts|exact Hwc|exact Hrc|exact Hm].
  - eapply rectangle_angle_matches_sound; [exact Hfacts|exact Hwd|exact Hrd|exact Hm].
Qed.

Lemma pgram_consec_angs_sound : forall facts i conclusion,
  Forall Interp facts -> pgram_consec_angs_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold pgram_consec_angs_rule in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hp : Interp (Pgram q)) by (eapply lookup_step_sound; eauto).
  cbn in Hp. destruct Hp as [Hwf [Hpar1 Hpar2]].
  destruct Hwf as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol, HXac, HXbd.
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd [Hcda Hdab]].
  (* one instance of the theorem per side of the figure, reading the four
     vertices from that side's own starting corner *)
  repeat rewrite orb_true_iff in Hrule.
  destruct Hrule as [[[Hm|Hm]|Hm]|Hm]; apply (fact_eqb_sound _ _ Hm); cbn.
  - apply (ender_pgram_consec_angles _ _ _ _ X Hdab
             (ender_bets_sym _ _ _ HXbd) HXac (par_symmetry _ _ _ _ Hpar2)).
  - apply (ender_pgram_consec_angles _ _ _ _ X Hncol HXac HXbd Hpar1).
  - apply (ender_pgram_consec_angles _ _ _ _ X Hbcd HXbd
             (ender_bets_sym _ _ _ HXac) Hpar2).
  - apply (ender_pgram_consec_angles _ _ _ _ X Hcda
             (ender_bets_sym _ _ _ HXac) (ender_bets_sym _ _ _ HXbd)
             (par_symmetry _ _ _ _ Hpar1)).
Qed.

Lemma pgram_opp_sides_conv_sound : forall decls facts i j conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  pgram_opp_sides_conv_rule decls facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros decls facts i j conclusion Hdecls Hfacts Hrule.
  unfold pgram_opp_sides_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [first|] eqn:Hi; try discriminate.
  destruct first; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hj; try discriminate.
  destruct second; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hmatch].
  assert (Hs1 : Interp (ConSeg s s0)) by (eapply lookup_step_sound; eauto).
  assert (Hs2 : Interp (ConSeg s1 s2)) by (eapply lookup_step_sound; eauto).
  pose proof (declared_quadrilateral_sound _ _ Hdecls Hdeclared) as Hwf.
  pose proof Hwf as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
  (* both opposite pairs, whichever order the two dependencies came in *)
  assert (Hsides :
    Cong (point q.(quad_a)) (point q.(quad_b))
         (point q.(quad_c)) (point q.(quad_d)) /\
    Cong (point q.(quad_b)) (point q.(quad_c))
         (point q.(quad_d)) (point q.(quad_a))).
  { apply orb_true_iff in Hmatch. destruct Hmatch as [Hm|Hm];
      apply andb_true_iff in Hm; destruct Hm as [Hm1 Hm2].
    - split; [exact (cong_pair_sound _ _ _ _ Hm1 Hs1)
             |exact (cong_pair_sound _ _ _ _ Hm2 Hs2)].
    - split; [exact (cong_pair_sound _ _ _ _ Hm2 Hs2)
             |exact (cong_pair_sound _ _ _ _ Hm1 Hs1)]. }
  destruct Hsides as [Hab Hbc].
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd _].
  cbn. split; [exact Hwf|]. split.
  - exact (ender_pgram_from_opposite_sides _ _ _ _ X Hncol HXac HXbd Hab Hbc).
  - apply (ender_pgram_from_opposite_sides _ _ _ _ X Hbcd HXbd
             (ender_bets_sym _ _ _ HXac) Hbc).
    now apply cong_symmetry.
Qed.

(** An audited angle name that names the same angle as a kernel one is that
    angle, or its reversal -- the audited condition is on point names. *)
Definition kernel_angle (u : Audit.AngleName) : Angle :=
  angle u.(Audit.angle_first) u.(Audit.angle_vertex) u.(Audit.angle_last).

Lemma same_angle_name_cases : forall (x : Angle) (u : Audit.AngleName),
  Audit.SameAngleName (ang_name x) u ->
  x = kernel_angle u \/ x = reverse_angle (kernel_angle u).
Proof.
  intros [xl xv xr] [ul uv ur] [Hv [[H1 H2]|[H1 H2]]]; cbn in *; subst;
    [left|right]; reflexivity.
Qed.

Lemma kite_opp_con_ang_sound : forall facts i conclusion,
  Forall Interp facts -> kite_opp_con_ang_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold kite_opp_con_ang_rule in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hk : Interp (KiteP q a a0)) by (eapply lookup_step_sound; eauto).
  cbn in Hk. destruct Hk as [Hwf Hcase].
  pose proof Hwf as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [_ [_ Hdab]].
  apply (proj1 (fact_eqb_sound _ _ Hrule)).
  (* the premise names which two corners it makes congruent, up to how each is
     spelled, so read the congruence off those two and transport *)
  assert (Hselected : forall (x y : Angle) (u v : Audit.AngleName),
      Audit.SameAnglePair (ang_name x) (ang_name y) u v ->
      Interp (ConAng (kernel_angle u) (kernel_angle v)) ->
      Interp (ConAng x y)).
  { intros x y u v [[Hx Hy]|[Hy Hx]] Hconga;
      apply same_angle_name_cases in Hx; apply same_angle_name_cases in Hy;
      apply (conga_pair_conclude _ _ (kernel_angle u) (kernel_angle v));
      try exact Hconga; unfold angle_pair_eqb; apply orb_true_iff;
      [left|right]; apply andb_true_iff; split; now apply angle_u_eqb_intro. }
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.quad_angle_a, Audit.quad_angle_b, Audit.quad_angle_c,
    Audit.quad_angle_d, Audit.seg_start, Audit.seg_end, quad_name in Hcase.
  destruct Hcase as [[Hs1 [Hs2 Hpair]]|[Hs1 [Hs2 Hpair]]]; cbn in Hs1, Hs2, Hpair;
    apply (Hselected _ _ _ _ Hpair); cbn.
  - (* congruent sides meet at A and at C, so the corners at B and D agree *)
    destruct (ender_sss (point q.(quad_a)) (point q.(quad_b)) (point q.(quad_c))
                (point q.(quad_a)) (point q.(quad_d)) (point q.(quad_c)))
      as [_ [_ [_ [_ [Hangle _]]]]].
    + exact Hncol.
    + now apply cong_right_commutativity.
    + now apply cong_right_commutativity.
    + apply cong_reflexivity.
    + now apply conga_right_comm.
  - (* congruent sides meet at B and at D, so the corners at A and C agree *)
    destruct (ender_sss (point q.(quad_a)) (point q.(quad_b)) (point q.(quad_d))
                (point q.(quad_c)) (point q.(quad_b)) (point q.(quad_d)))
      as [_ [_ [_ [Hangle _]]]].
    + intro. apply Hdab. Col.
    + now apply cong_right_commutativity.
    + apply cong_reflexivity.
    + apply cong_right_commutativity, cong_symmetry, Hs2.
    + now apply conga_left_comm.
Qed.

Lemma pgram_consec_angs_conv_sound : forall decls facts i j conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  pgram_consec_angs_conv_rule decls facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros decls facts i j conclusion Hdecls Hfacts Hrule.
  unfold pgram_consec_angs_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [first|] eqn:Hi; try discriminate.
  destruct first; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hj; try discriminate.
  destruct second; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hmatch].
  assert (Hs1 : Interp (Supplementary a a0)) by (eapply lookup_step_sound; eauto).
  assert (Hs2 : Interp (Supplementary a1 a2)) by (eapply lookup_step_sound; eauto).
  pose proof (declared_quadrilateral_sound _ _ Hdecls Hdeclared) as Hwf.
  pose proof Hwf as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd [Hcda Hdab]].
  (* one supplementary pair per side direction, in either order and with the
     shared corner in either slot *)
  assert (Hsides : forall x y : Angle, Interp (Supplementary x y) ->
    (consec_pair_eqb x y (quad_corner_b q) (quad_corner_c q) = true \/
     consec_pair_eqb x y (quad_corner_d q) (quad_corner_a q) = true) ->
    Interp (Para (quad_side_ab q) (quad_side_cd q))).
  { intros x y Hxy [Hm|Hm]; apply (proj2 (fact_eqb_sound _ _ Hm)) in Hxy;
      cbn in Hxy |- *; unfold Audit.Parallel, seg_name, Audit.seg_start,
      Audit.seg_end; cbn.
    - exact (ender_pgram_from_consec_angles _ _ _ _ X Hncol HXac HXbd Hxy).
    - apply par_symmetry.
      apply (ender_pgram_from_consec_angles _ _ _ _ X Hcda
               (ender_bets_sym _ _ _ HXac) (ender_bets_sym _ _ _ HXbd) Hxy). }
  assert (Hsides' : forall x y : Angle, Interp (Supplementary x y) ->
    (consec_pair_eqb x y (quad_corner_a q) (quad_corner_b q) = true \/
     consec_pair_eqb x y (quad_corner_c q) (quad_corner_d q) = true) ->
    Interp (Para (quad_side_bc q) (quad_side_da q))).
  { intros x y Hxy [Hm|Hm]; apply (proj2 (fact_eqb_sound _ _ Hm)) in Hxy;
      cbn in Hxy |- *; unfold Audit.Parallel, seg_name, Audit.seg_start,
      Audit.seg_end; cbn.
    - apply par_symmetry.
      apply (ender_pgram_from_consec_angles _ _ _ _ X Hdab
               (ender_bets_sym _ _ _ HXbd) HXac Hxy).
    - exact (ender_pgram_from_consec_angles _ _ _ _ X Hbcd HXbd
               (ender_bets_sym _ _ _ HXac) Hxy). }
  cbn. split; [exact Hwf|].
  apply orb_true_iff in Hmatch. destruct Hmatch as [Hm|Hm];
    apply andb_true_iff in Hm; destruct Hm as [Hm1 Hm2];
    apply orb_true_iff in Hm1; apply orb_true_iff in Hm2.
  - split; [exact (Hsides _ _ Hs1 Hm1)|exact (Hsides' _ _ Hs2 Hm2)].
  - split; [exact (Hsides _ _ Hs2 Hm2)|exact (Hsides' _ _ Hs1 Hm1)].
Qed.

Lemma rect_pgram_ang_sound : forall facts i j conclusion,
  Forall Interp facts -> rect_pgram_ang_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold rect_pgram_ang_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [first|] eqn:Hi; try discriminate.
  destruct first; try discriminate.
  destruct (lookup_step facts j) as [second|] eqn:Hj; try discriminate.
  destruct second; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Heq Hcorner].
  apply quadrilateral_eqb_eq in Heq. subst q0.
  assert (Hright : Interp (RightAng a)) by (eapply lookup_step_sound; eauto).
  assert (Hp : Interp (Pgram q)) by (eapply lookup_step_sound; eauto).
  destruct Hright as [_ Hper]. unfold right_angle in Hper.
  cbn in Hp. destruct Hp as [Hwf [Hpar1 Hpar2]].
  pose proof Hwf as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol, HXac, HXbd.
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd [Hcda Hdab]].
  (* whichever corner was declared right, rotate the figure so that it is the
     one the theorem takes, and read the four right angles back off *)
  assert (Hcorners :
    Per (point q.(quad_d)) (point q.(quad_a)) (point q.(quad_b)) /\
    Per (point q.(quad_a)) (point q.(quad_b)) (point q.(quad_c)) /\
    Per (point q.(quad_b)) (point q.(quad_c)) (point q.(quad_d)) /\
    Per (point q.(quad_c)) (point q.(quad_d)) (point q.(quad_a))).
  { repeat rewrite orb_true_iff in Hcorner.
    destruct Hcorner as [[[Ha|Ha]|Ha]|Ha];
      apply angle_u_eqb_cases in Ha; unfold reverse_angle in Ha;
      destruct Ha as [Ha|Ha]; subst a; cbn in Hper.
    - destruct (ender_pgram_right_corner _ _ _ _ X Hdab
                  (ender_bets_sym _ _ _ HXbd) HXac
                  (par_symmetry _ _ _ _ Hpar2) Hpar1 Hper) as [H1 [H2 [H3 H4]]].
      auto.
    - destruct (ender_pgram_right_corner _ _ _ _ X Hdab
                  (ender_bets_sym _ _ _ HXbd) HXac
                  (par_symmetry _ _ _ _ Hpar2) Hpar1 (l8_2 _ _ _ Hper))
        as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ender_pgram_right_corner _ _ _ _ X Hncol HXac HXbd Hpar1 Hpar2
                  Hper) as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ender_pgram_right_corner _ _ _ _ X Hncol HXac HXbd Hpar1 Hpar2
                  (l8_2 _ _ _ Hper)) as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ender_pgram_right_corner _ _ _ _ X Hbcd HXbd
                  (ender_bets_sym _ _ _ HXac) Hpar2
                  (par_symmetry _ _ _ _ Hpar1) Hper) as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ender_pgram_right_corner _ _ _ _ X Hbcd HXbd
                  (ender_bets_sym _ _ _ HXac) Hpar2
                  (par_symmetry _ _ _ _ Hpar1) (l8_2 _ _ _ Hper))
        as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ender_pgram_right_corner _ _ _ _ X Hcda
                  (ender_bets_sym _ _ _ HXac) (ender_bets_sym _ _ _ HXbd)
                  (par_symmetry _ _ _ _ Hpar1) (par_symmetry _ _ _ _ Hpar2)
                  Hper) as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ender_pgram_right_corner _ _ _ _ X Hcda
                  (ender_bets_sym _ _ _ HXac) (ender_bets_sym _ _ _ HXbd)
                  (par_symmetry _ _ _ _ Hpar1) (par_symmetry _ _ _ _ Hpar2)
                  (l8_2 _ _ _ Hper)) as [H1 [H2 [H3 H4]]]. auto. }
  destruct Hcorners as [Hpa [Hpb [Hpc Hpd]]].
  cbn. unfold Audit.RightAngle, Audit.quad_angle_a, Audit.quad_angle_b,
    Audit.quad_angle_c, Audit.quad_angle_d, Audit.ang_start, Audit.ang_vertex,
    Audit.ang_end, quad_name; cbn.
  split; [exact (conj Hwf (conj Hpar1 Hpar2))|].
  split; [exact Hpa|]. split; [exact Hpb|]. split; [exact Hpc|exact Hpd].
Qed.

Lemma rect_diag_con_sound : forall facts i conclusion,
  Forall Interp facts -> rect_diag_con_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule. unfold rect_diag_con_rule in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hr : Interp (Rect q)) by (eapply lookup_step_sound; eauto).
  cbn in Hr. destruct Hr as [[Hwf [Hpar1 Hpar2]] [Hra [Hrb _]]].
  destruct Hwf as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  unfold Audit.Parallel, Audit.RightAngle, Audit.quad_ab, Audit.quad_bc,
    Audit.quad_cd, Audit.quad_da, Audit.quad_angle_a, Audit.quad_angle_b,
    Audit.seg_start, Audit.seg_end, Audit.ang_start, Audit.ang_vertex,
    Audit.ang_end in Hpar1, Hpar2, Hra, Hrb;
    cbn in Hpar1, Hpar2, Hra, Hrb, Hncol, HXac, HXbd.
  apply (fact_eqb_sound _ _ Hrule). cbn.
  exact (ender_rect_diagonals _ _ _ _ _ Hncol HXac HXbd Hpar1 Hpar2 Hra Hrb).
Qed.

Lemma rectangle_def_sound : forall facts i conclusion,
  Forall Interp facts -> rectangle_def_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule. unfold rectangle_def_rule in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hr : Interp (Rect q)) by (eapply lookup_step_sound; eauto).
  cbn in Hr. destruct Hr as [Hp [Hra [Hrb [Hrc Hrd]]]].
  destruct Hp as [Hwf [Hpar1 Hpar2]].
  destruct conclusion; try discriminate.
  - destruct Hwf as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol Hex]]]]]]].
    destruct Hex as [X [HXac HXbd]].
    unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
      cbn in Hpar1, Hpar2, Hncol, HXac, HXbd.
    pose proof (ender_pgram_opp_sides _ _ _ _ _ Hncol HXac HXbd Hpar1 Hpar2)
      as [Hc1 Hc2].
    apply orb_true_iff in Hrule. destruct Hrule as [Hm|Hm].
    + eapply cong_pair_conclude; [exact Hm|]. cbn. exact Hc1.
    + eapply cong_pair_conclude; [exact Hm|]. cbn. exact Hc2.
  - apply andb_true_iff in Hrule. destruct Hrule as [Ha Hb].
    pose proof (rectangle_corner_sound facts q a Hfacts Hwf Hra Hrb Hrc Hrd Ha) as [Hwa Hra'].
    pose proof (rectangle_corner_sound facts q a0 Hfacts Hwf Hra Hrb Hrc Hrd Hb) as [Hwb Hrb'].
    cbn in Hwa, Hwb, Hra', Hrb' |- *.
    destruct Hwa as [Hwa1 Hwa2]. destruct Hwb as [Hwb1 Hwb2].
    now apply l11_16.
  - apply andb_true_iff in Hrule. destruct Hrule as [Ha Hb].
    pose proof (rectangle_corner_sound facts q a Hfacts Hwf Hra Hrb Hrc Hrd Ha) as [_ Hra'].
    pose proof (rectangle_corner_sound facts q a0 Hfacts Hwf Hra Hrb Hrc Hrd Hb) as [_ Hrb'].
    exact (conj Hra' Hrb').
Qed.

Lemma pgram_opp_side_para_sound : forall decls facts i j conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  pgram_opp_side_para_rule decls facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros decls facts i j conclusion Hwf Hfacts Hrule.
  unfold pgram_opp_side_para_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdecl Hmatch].
  assert (Hcseg : Interp (ConSeg s s0)) by (eapply lookup_step_sound; eauto).
  assert (Hpara : Interp (Para s1 s2)) by (eapply lookup_step_sound; eauto).
  pose proof (declared_quadrilateral_sound _ _ Hwf Hdecl) as Hwfq.
  pose proof Hwfq as Hwfcopy.
  destruct Hwfcopy as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  cbn in Hncol, HXac, HXbd.
  cbn. split; [exact Hwfq|].
  apply orb_true_iff in Hmatch; destruct Hmatch as [Hm|Hm];
    apply andb_true_iff in Hm; destruct Hm as [HmC HmP];
    pose proof (cong_pair_sound _ _ _ _ HmC Hcseg) as HC;
    pose proof (para_pair_sound _ _ _ _ HmP Hpara) as HP;
    cbn in HC, HP.
  - assert (Hother : Par (point q.(quad_b)) (point q.(quad_c))
                         (point q.(quad_d)) (point q.(quad_a)))
      by (eapply ender_pgram_from_side; eauto).
    unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
    split; [exact HP|exact Hother].
  - assert (HXca : BetS (point q.(quad_c)) X (point q.(quad_a))).
    { destruct HXac as [Hb [Hd1 Hd2]].
      repeat split; [now apply between_symmetry| |];
        intro Heq; [apply Hd2|apply Hd1]; auto. }
    assert (Hncol2 : ~ Col (point q.(quad_b)) (point q.(quad_c))
                           (point q.(quad_d))).
    { destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
        as [Hn _]. exact Hn. }
    assert (Hother : Par (point q.(quad_c)) (point q.(quad_d))
                         (point q.(quad_a)) (point q.(quad_b)))
      by (eapply (ender_pgram_from_side (point q.(quad_b)) (point q.(quad_c))
                    (point q.(quad_d)) (point q.(quad_a)) X); eauto).
    unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
    split; [|exact HP].
    apply par_symmetry. exact Hother.
Qed.

Lemma altint_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  altint_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold altint_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hpara : Interp (Para s s0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc [Hbt1 [Hbt2 [Hbab [Hbcd Hos]]]]]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _
                Hlines Hbab Hbcd Hpara) as HP.
  destruct (ender_transversal_master _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP) as [Hm1 Hm2].
  unfold altint_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm].
  - eapply conga_pair_conclude; [exact Hm|]. cbn. exact Hm1.
  - eapply conga_pair_conclude; [exact Hm|]. cbn. exact Hm2.
Qed.

Lemma altext_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  altext_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold altext_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hpara : Interp (Para s s0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc [Hbt1 [Hbt2 [Hbab [Hbcd Hos]]]]]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _
                Hlines Hbab Hbcd Hpara) as HP.
  destruct (ender_transversal_altext _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP) as [He1 He2].
  unfold altext_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm].
  - eapply conga_pair_conclude; [exact Hm|]. cbn. exact He1.
  - eapply conga_pair_conclude; [exact Hm|]. cbn. exact He2.
Qed.

Lemma corresp_ang_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  corresp_ang_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold corresp_ang_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hpara : Interp (Para s s0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc [Hbt1 [Hbt2 [Hbab [Hbcd Hos]]]]]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _
                Hlines Hbab Hbcd Hpara) as HP.
  destruct (ender_transversal_corresp _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP) as [Hc1 [Hc2 [Hc3 Hc4]]].
  unfold corresp_pair in Hpairs.
  apply orb_true_iff in Hpairs. destruct Hpairs as [Hpairs|Hm].
  2:{ eapply conga_pair_conclude; [exact Hm|]. cbn. exact Hc4. }
  apply orb_true_iff in Hpairs. destruct Hpairs as [Hpairs|Hm].
  2:{ eapply conga_pair_conclude; [exact Hm|]. cbn. exact Hc3. }
  apply orb_true_iff in Hpairs. destruct Hpairs as [Hm|Hm].
  - eapply conga_pair_conclude; [exact Hm|]. cbn. exact Hc1.
  - eapply conga_pair_conclude; [exact Hm|]. cbn. exact Hc2.
Qed.

Lemma sameside_ang_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  sameside_ang_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold sameside_ang_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hpara : Interp (Para s s0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc [Hbt1 [Hbt2 [Hbab [Hbcd Hos]]]]]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _
                Hlines Hbab Hbcd Hpara) as HP.
  destruct (ender_transversal_sameside _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP) as [Hs1 Hs2].
  unfold sameside_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm].
  - eapply suppa_pair_conclude; [exact Hm|]. cbn. exact Hs1.
  - eapply suppa_pair_conclude; [exact Hm|]. cbn. exact Hs2.
Qed.

Lemma para_link_left : forall u v X Y,
  segment_u_eqb u v = true ->
  Par (point v.(seg_start)) (point v.(seg_end)) X Y ->
  Par (point u.(seg_start)) (point u.(seg_end)) X Y.
Proof.
  intros u v X Y Heq Hpar. apply segment_u_eqb_cases in Heq.
  destruct Heq as [->| ->]; [exact Hpar|].
  unfold reverse_segment. cbn. now apply par_left_comm.
Qed.

Lemma para_trans_sound : forall facts i j conclusion,
  Forall Interp facts ->
  para_transitive_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold para_transitive_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  assert (Hp1 : Interp (Para s1 s2)) by (eapply lookup_step_sound; eauto).
  assert (Hp2 : Interp (Para s3 s4)) by (eapply lookup_step_sound; eauto).
  cbn in Hp1, Hp2.
  unfold Audit.Parallel, seg_name, Audit.seg_start, Audit.seg_end
    in Hp1, Hp2; cbn in Hp1, Hp2.
  apply orb_true_iff in Hrule. destruct Hrule as [Hrule|Hcase4].
  2:{ apply andb_true_iff in Hcase4. destruct Hcase4 as [Hshared Hconc].
      eapply para_pair_conclude; [exact Hconc|]. cbn.
      apply ender_par_trans with (point s1.(seg_start)) (point s1.(seg_end)).
      - now apply par_symmetry.
      - apply (para_link_left s1 s4 _ _ Hshared).
        now apply par_symmetry. }
  apply orb_true_iff in Hrule. destruct Hrule as [Hrule|Hcase3].
  2:{ apply andb_true_iff in Hcase3. destruct Hcase3 as [Hshared Hconc].
      eapply para_pair_conclude; [exact Hconc|]. cbn.
      apply ender_par_trans with (point s1.(seg_start)) (point s1.(seg_end)).
      - now apply par_symmetry.
      - apply (para_link_left s1 s3 _ _ Hshared). exact Hp2. }
  apply orb_true_iff in Hrule. destruct Hrule as [Hcase1|Hcase2].
  - apply andb_true_iff in Hcase1. destruct Hcase1 as [Hshared Hconc].
    eapply para_pair_conclude; [exact Hconc|]. cbn.
    apply ender_par_trans with (point s2.(seg_start)) (point s2.(seg_end));
      [exact Hp1|].
    apply (para_link_left s2 s3 _ _ Hshared). exact Hp2.
  - apply andb_true_iff in Hcase2. destruct Hcase2 as [Hshared Hconc].
    eapply para_pair_conclude; [exact Hconc|]. cbn.
    apply ender_par_trans with (point s2.(seg_start)) (point s2.(seg_end));
      [exact Hp1|].
    apply (para_link_left s2 s4 _ _ Hshared).
    now apply par_symmetry.
Qed.

Lemma inscribed_semi_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  inscribed_semi_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold inscribed_semi_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hends Hex].
  assert (Hd : Interp (DiameterOf c s)) by (eapply lookup_step_sound; eauto).
  cbn in Hd. destruct Hd as [[Hswf [Hon1 Hon2]] Hbet].
  destruct Hon1 as [_ Hc1]. destruct Hon2 as [_ Hc2].
  cbn in Hc1, Hc2, Hbet, Hswf.
  rewrite premise_found_existsb in Hex.
  apply existsb_exists in Hex. destruct Hex as [pr [Hin Hw]].
  unfold inscribed_angle_premise in Hw.
  pose proof ((proj1 (Forall_forall _ _)) Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr.
  destruct (inscribed_witness pr.(premise_statement)) as [[c' a']|] eqn:Hwit;
    try discriminate.
  assert (Hps : pr.(premise_statement) = InscribedAngleOf c' a').
  { unfold inscribed_witness in Hwit.
    destruct pr.(premise_statement); try discriminate.
    now injection Hwit as <- <-. }
  rewrite Hps in Hpr. cbn in Hpr.
  apply andb_true_iff in Hw. destruct Hw as [Hceq Haeq].
  apply circle_eqb_eq in Hceq. subst c'.
  destruct Hpr as [HonA [HonV [HonB Hawf]]].
  destruct HonV as [_ HcV]. cbn in HcV, Hawf.
  assert (Hmid : Midpoint (point (c.(circle_c)))
                   (point s.(seg_start)) (point s.(seg_end))).
  { split; [exact Hbet|].
    assert (Hse : Cong (point (c.(circle_c))) (point s.(seg_start))
                       (point (c.(circle_c))) (point s.(seg_end))).
    { apply cong_transitivity with (point (c.(circle_c)))
          (point (c.(circle_r))); [exact Hc1|Cong]. }
    Cong. }
  apply angle_u_eqb_cases in Haeq.
  assert (HOV : Cong (point (c.(circle_c))) (point s.(seg_start))
                     (point (c.(circle_c))) (point (a.(ang_vertex)))).
  { assert (Hvx : point (a.(ang_vertex)) = point (a'.(ang_vertex)))
      by (destruct Haeq as [->| ->]; reflexivity).
    rewrite Hvx.
    apply cong_transitivity with (point (c.(circle_c)))
        (point (c.(circle_r))); [exact Hc1|Cong]. }
  assert (Hper : Per (point s.(seg_start)) (point (a.(ang_vertex)))
                     (point s.(seg_end))).
  { apply (ender_thales _ _ _ (point (c.(circle_c)))); assumption. }
  cbn. split.
  - destruct Haeq as [->| ->]; cbn in Hawf |- *.
    + exact Hawf.
    + unfold reverse_angle. cbn. destruct Hawf as [Hl Hr]. split; assumption.
  - apply segment_u_eqb_cases in Hends. destruct Hends as [Hends|Hends].
    + rewrite <- Hends in Hper. cbn in Hper.
      unfold right_angle. exact Hper.
    + unfold reverse_segment in Hends. injection Hends as Hl Hr.
      unfold right_angle. rewrite Hl, Hr. apply l8_2. exact Hper.
Qed.

(** * Rules added by the reason campaign: soundness *)

Lemma isos_trap_con_diags_sound : forall facts i j conclusion,
  Forall Interp facts ->
  isos_trap_con_diags_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold isos_trap_con_diags_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hq Hdiag].
  apply quadrilateral_eqb_eq in Hq. subst q0.
  assert (Hcong : Interp (ConSeg s s0)) by (eapply lookup_step_sound; eauto).
  assert (Htrap : Interp (TrapPremise q s1 s2))
    by (eapply lookup_step_sound; eauto).
  cbn in Htrap. destruct Htrap as [Htrap _].
  pose proof (cong_pair_sound _ _ _ _ Hdiag Hcong) as Hdiagonals.
  cbn in Hdiagonals |- *. split; [exact Htrap|].
  unfold Audit.SegmentCongruent, Audit.seg_start, Audit.seg_end; cbn.
  exact Hdiagonals.
Qed.

(** The audited parallelogram unpacked the way every rule below needs it: the
    crossing point, the noncollinear corner, and the two parallel pairs in
    GeoCoq's own spelling. *)
Lemma pgram_figure : forall q,
  Interp (Pgram q) ->
  exists X,
    ~ Col (point q.(quad_a)) (point q.(quad_b)) (point q.(quad_c)) /\
    BetS (point q.(quad_a)) X (point q.(quad_c)) /\
    BetS (point q.(quad_b)) X (point q.(quad_d)) /\
    Par (point q.(quad_a)) (point q.(quad_b))
        (point q.(quad_c)) (point q.(quad_d)) /\
    Par (point q.(quad_b)) (point q.(quad_c))
        (point q.(quad_d)) (point q.(quad_a)).
Proof.
  intros q Hp. cbn in Hp. destruct Hp as [Hwf [Hpar1 Hpar2]].
  destruct Hwf as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2.
  exists X.
  split; [exact Hncol|]. split; [exact HXac|]. split; [exact HXbd|].
  split; [exact Hpar1|exact Hpar2].
Qed.

Lemma pgram_opp_angs_conv_sound : forall decls facts i j conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  pgram_opp_angs_conv_rule decls facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros decls facts i j conclusion Hdecls Hfacts Hrule.
  unfold pgram_opp_angs_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hmatch].
  pose proof (declared_quadrilateral_sound _ _ Hdecls Hdeclared) as Hwf.
  assert (Hc1 : Interp (ConAng a a0)) by (eapply lookup_step_sound; eauto).
  assert (Hc2 : Interp (ConAng a1 a2)) by (eapply lookup_step_sound; eauto).
  (* both pairs, whichever order the two dependencies came in *)
  assert (Hcorners :
    CongA (point q.(quad_d)) (point q.(quad_a)) (point q.(quad_b))
          (point q.(quad_b)) (point q.(quad_c)) (point q.(quad_d)) /\
    CongA (point q.(quad_a)) (point q.(quad_b)) (point q.(quad_c))
          (point q.(quad_c)) (point q.(quad_d)) (point q.(quad_a))).
  { apply orb_true_iff in Hmatch. destruct Hmatch as [Hm|Hm];
      apply andb_true_iff in Hm; destruct Hm as [Hm1 Hm2].
    - split; [exact (conga_pair_sound _ _ _ _ Hm1 Hc1)
             |exact (conga_pair_sound _ _ _ _ Hm2 Hc2)].
    - split; [exact (conga_pair_sound _ _ _ _ Hm2 Hc2)
             |exact (conga_pair_sound _ _ _ _ Hm1 Hc1)]. }
  destruct Hcorners as [HopA HopB].
  pose proof Hwf as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd [_ _]].
  cbn. split; [exact Hwf|].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
  split.
  - apply (ender_pgram_from_consec_angles _ _ _ _ X Hncol HXac HXbd).
    exact (ender_quad_opposite_angles _ _ _ _ X Hncol HXac HXbd HopA HopB).
  - apply (ender_pgram_from_consec_angles _ _ _ _ X Hbcd HXbd
             (ender_bets_sym _ _ _ HXac)).
    apply (ender_quad_opposite_angles _ _ _ _ X Hbcd HXbd
             (ender_bets_sym _ _ _ HXac));
      [exact HopB|now apply conga_sym].
Qed.

(** The audited isosceles trapezoid unpacked: the crossing point, the
    noncollinear corner, and the congruent diagonals. *)
Lemma isos_trap_figure : forall q s1 s2,
  Interp (IsosTrapPremise q s1 s2) ->
  exists X,
    ~ Col (point q.(quad_a)) (point q.(quad_b)) (point q.(quad_c)) /\
    BetS (point q.(quad_a)) X (point q.(quad_c)) /\
    BetS (point q.(quad_b)) X (point q.(quad_d)) /\
    Cong (point q.(quad_a)) (point q.(quad_c))
         (point q.(quad_b)) (point q.(quad_d)).
Proof.
  intros q s1 s2 Hp. cbn in Hp. destruct Hp as [[[Hwf _] Hdiag] _].
  destruct Hwf as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
  unfold Audit.SegmentCongruent, Audit.seg_start, Audit.seg_end in Hdiag;
    cbn in Hdiag.
  exists X. split; [exact Hncol|]. split; [exact HXac|].
  split; [exact HXbd|exact Hdiag].
Qed.

Lemma isos_trap_base_angs_sound : forall facts i j conclusion,
  Forall Interp facts ->
  isos_trap_base_angs_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold isos_trap_base_angs_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hq Hmatch].
  apply quadrilateral_eqb_eq in Hq. subst q0.
  assert (Hangles : Interp (ConAng a a0)) by (eapply lookup_step_sound; eauto).
  assert (Htrap : Interp (TrapPremise q s s0))
    by (eapply lookup_step_sound; eauto).
  pose proof Htrap as Htrapcopy. cbn in Htrapcopy.
  destruct Htrapcopy as [Hshape Hpar].
  pose proof Hshape as Hwf. destruct Hwf as [Hwf _].
  destruct Hwf as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd [Hcda Hdab]].
  cbn. split; [exact Hshape|].
  unfold Audit.SegmentCongruent, Audit.seg_start, Audit.seg_end; cbn.
  (* the parallel pair the premise names, and the base angles at either end
     of it: four readings of one theorem, one per rotation *)
  apply orb_true_iff in Hmatch.
  destruct Hmatch as [Hm|Hm]; apply andb_true_iff in Hm;
    destruct Hm as [Hsides Hangs];
    pose proof (para_pair_sound _ _ _ _ Hsides Hpar) as Hparallel;
    cbn in Hparallel;
    apply orb_true_iff in Hangs; destruct Hangs as [Hm|Hm];
    pose proof (conga_pair_sound _ _ _ _ Hm Hangles) as Hbase; cbn in Hbase.
  - exact (ender_isos_trap_con_diagonals _ _ _ _ X Hncol HXac HXbd
             Hparallel Hbase).
  - assert (Hrot : Cong (point q.(quad_c)) (point q.(quad_a))
                        (point q.(quad_d)) (point q.(quad_b))).
    { apply (ender_isos_trap_con_diagonals _ _ _ _ X Hcda
               (ender_bets_sym _ _ _ HXac) (ender_bets_sym _ _ _ HXbd));
        [now apply par_symmetry|exact Hbase]. }
    Cong.
  - assert (Hrot : Cong (point q.(quad_b)) (point q.(quad_d))
                        (point q.(quad_c)) (point q.(quad_a))).
    { apply (ender_isos_trap_con_diagonals _ _ _ _ X Hbcd HXbd
               (ender_bets_sym _ _ _ HXac));
        [exact Hparallel|exact Hbase]. }
    Cong.
  - assert (Hrot : Cong (point q.(quad_d)) (point q.(quad_b))
                        (point q.(quad_a)) (point q.(quad_c))).
    { apply (ender_isos_trap_con_diagonals _ _ _ _ X Hdab
               (ender_bets_sym _ _ _ HXbd) HXac);
        [now apply par_symmetry|exact Hbase]. }
    Cong.
Qed.

Lemma isos_trap_base_angs_conv_sound : forall facts i conclusion,
  Forall Interp facts ->
  isos_trap_base_angs_conv_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold isos_trap_base_angs_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  assert (Hpremise : Interp (IsosTrapPremise q s s0))
    by (eapply lookup_step_sound; eauto).
  destruct (isos_trap_figure _ _ _ Hpremise)
    as [X [Hncol [HXac [HXbd Hdiag]]]].
  pose proof Hpremise as Hpar. cbn in Hpar. destruct Hpar as [_ Hpar].
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd [Hcda Hdab]].
  (* the parallel pair the premise names, and then the base angles at either
     end of it: four readings of one theorem, one per rotation *)
  apply orb_true_iff in Hrule.
  destruct Hrule as [Hm|Hm]; apply andb_true_iff in Hm;
    destruct Hm as [Hsides Hangles];
    pose proof (para_pair_sound _ _ _ _ Hsides Hpar) as Hparallel;
    cbn in Hparallel;
    apply orb_true_iff in Hangles; destruct Hangles as [Hm|Hm];
    apply (conga_pair_conclude _ _ _ _ Hm); cbn.
  - exact (ender_isos_trap_base_angles _ _ _ _ X Hncol HXac HXbd
             Hparallel Hdiag).
  - apply (ender_isos_trap_base_angles _ _ _ _ X Hcda
             (ender_bets_sym _ _ _ HXac) (ender_bets_sym _ _ _ HXbd));
      [now apply par_symmetry|Cong].
  - apply (ender_isos_trap_base_angles _ _ _ _ X Hbcd HXbd
             (ender_bets_sym _ _ _ HXac));
      [exact Hparallel|Cong].
  - apply (ender_isos_trap_base_angles _ _ _ _ X Hdab
             (ender_bets_sym _ _ _ HXbd) HXac);
      [now apply par_symmetry|Cong].
Qed.

Lemma rect_diag_con_conv_sound : forall facts i j conclusion,
  Forall Interp facts ->
  rect_diag_con_conv_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold rect_diag_con_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hq Hdiag].
  apply quadrilateral_eqb_eq in Hq. subst q0.
  assert (Hcong : Interp (ConSeg s s0)) by (eapply lookup_step_sound; eauto).
  assert (Hp : Interp (Pgram q)) by (eapply lookup_step_sound; eauto).
  pose proof (cong_pair_sound _ _ _ _ Hdiag Hcong) as Hdiagonals.
  cbn in Hdiagonals.
  destruct (pgram_figure q Hp) as [X [Hncol [HXac [HXbd [Hpar1 Hpar2]]]]].
  destruct (ender_pgram_con_diagonals_right _ _ _ _ X Hncol HXac HXbd
              Hpar1 Hpar2 Hdiagonals) as [HperA [HperB [HperC HperD]]].
  cbn. split; [exact Hp|].
  unfold Audit.RightAngle, Audit.quad_angle_a, Audit.quad_angle_b,
    Audit.quad_angle_c, Audit.quad_angle_d, Audit.ang_start, Audit.ang_vertex,
    Audit.ang_end; cbn.
  repeat split; assumption.
Qed.

Lemma rhombus_diag_perp_conv_sound : forall facts i j conclusion,
  Forall Interp facts ->
  rhombus_diag_perp_conv_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold rhombus_diag_perp_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hq Hmatch].
  apply quadrilateral_eqb_eq in Hq. subst q0.
  assert (Hperp : Interp (PerpAt s s0 p)) by (eapply lookup_step_sound; eauto).
  assert (Hp : Interp (Pgram q)) by (eapply lookup_step_sound; eauto).
  destruct (pgram_figure q Hp) as [X [Hncol [HXac [HXbd [Hpar1 Hpar2]]]]].
  cbn in Hperp. apply perp_in_perp in Hperp.
  assert (Hdiag : Definitions.Perp (point q.(quad_a)) (point q.(quad_c))
                                   (point q.(quad_b)) (point q.(quad_d))).
  { apply orb_true_iff in Hmatch.
    destruct Hmatch as [Hm|Hm]; apply andb_true_iff in Hm;
      destruct Hm as [H1 H2];
      apply segment_u_eqb_cases in H1; apply segment_u_eqb_cases in H2;
      destruct H1 as [->| ->]; destruct H2 as [->| ->];
      unfold reverse_segment, quad_diagonal_ac, quad_diagonal_bd in Hperp;
      cbn in Hperp;
      eauto 6 using perp_sym, perp_left_comm, perp_right_comm, perp_comm. }
  destruct (ender_pgram_perp_diagonals_rhombus _ _ _ _ X Hncol HXac HXbd
              Hpar1 Hpar2 Hdiag) as [Hab [Hbc Hcd]].
  cbn. split; [exact Hp|].
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
  repeat split; assumption.
Qed.

Lemma pgram_diag_bisect_conv_sound : forall decls facts i j conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  pgram_diag_bisect_conv_rule decls facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros decls facts i j conclusion Hdecls Hfacts Hrule.
  unfold pgram_diag_bisect_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hmatch].
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hsame].
  apply Ascii.eqb_eq in Hsame. subst p0.
  pose proof (declared_quadrilateral_sound _ _ Hdecls Hdeclared) as Hwf.
  pose proof Hwf as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol _]]]]]]]. cbn in Hncol.
  assert (Hb1 : Interp (SegBisectOf s s0 p))
    by (eapply lookup_step_sound; eauto).
  assert (Hb2 : Interp (SegBisectOf s1 s2 p))
    by (eapply lookup_step_sound; eauto).
  cbn in Hb1, Hb2.
  destruct Hb1 as [_ [_ Hmid1]]. destruct Hb2 as [_ [_ Hmid2]].
  assert (Hdiagonals :
    Midpoint (point p) (point q.(quad_a)) (point q.(quad_c)) /\
    Midpoint (point p) (point q.(quad_b)) (point q.(quad_d))).
  { apply orb_true_iff in Hmatch.
    assert (Hmove : forall (s t : Segment),
        segment_u_eqb s t = true ->
        Midpoint (point p) (point s.(seg_start)) (point s.(seg_end)) ->
        Midpoint (point p) (point t.(seg_start)) (point t.(seg_end))).
    { intros u v Huv Hm. apply segment_u_eqb_cases in Huv.
      destruct Huv as [->| ->]; [exact Hm|].
      unfold reverse_segment in Hm. cbn in Hm. now apply l7_2. }
    destruct Hmatch as [Hm|Hm];
      apply andb_true_iff in Hm; destruct Hm as [Hm Ht2];
      apply andb_true_iff in Hm; destruct Hm as [Hm Hb2'];
      apply andb_true_iff in Hm; destruct Hm as [_ Ht1];
      [split; [exact (Hmove _ _ Ht2 Hmid2)|exact (Hmove _ _ Ht1 Hmid1)]
      |split; [exact (Hmove _ _ Ht1 Hmid1)|exact (Hmove _ _ Ht2 Hmid2)]]. }
  destruct Hdiagonals as [Hac Hbd].
  destruct (ender_pgram_from_diagonal_midpoint _ _ _ _ _ Hncol Hac Hbd)
    as [Hpar1 Hpar2].
  cbn. split; [exact Hwf|].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
  split; assumption.
Qed.

Lemma perp_bisector_sound : forall facts i j conclusion,
  Forall Interp facts -> perp_bisector_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold perp_bisector_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [_ Hhalves].
  match goal with
  | Hy : lookup_step _ _ = Some (MidptOf ?sg ?pt) |- _ =>
      assert (Hmid : Interp (MidptOf sg pt))
        by (eapply lookup_step_sound; eauto)
  end.
  cbn in Hmid. destruct Hmid as [_ Hcong].
  eapply cong_pair_conclude; [exact Hhalves|cbn; exact Hcong].
Qed.

(** The tangent meaning hides which endpoint carries the right angle behind an
    existential.  Naming the far endpoint pins it down: the point of tangency
    is excluded by the meaning's own [Q <> p], so nothing else is left. *)
Lemma tangent_far_point : forall c s p e,
  segment_u_eqb s (segment p e) = true ->
  Interp (TangentAt c s p) ->
  Per (point c.(circle_c)) (point p) (point e) /\ point e <> point p.
Proof.
  intros c s p e Hshape Ht. cbn in Ht.
  destruct Ht as [Hswf [Hon [Hcol [Q [Hends [Hne Hper]]]]]].
  apply segment_u_eqb_cases in Hshape.
  destruct Hshape as [->| ->]; unfold reverse_segment in *; cbn in *;
    destruct Hends as [Hq|Hq]; subst Q;
    solve [contradiction | split; assumption].
Qed.

Lemma tangent_perp_conv_sound : forall facts i j conclusion,
  Forall Interp facts -> tangent_perp_conv_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold tangent_perp_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hlines].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hshape].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hfoot].
  apply andb_true_iff in Hrule. destruct Hrule as [Hcircle Htouch].
  apply circle_eqb_eq in Hcircle. subst c0.
  unfold ascii_eqb in Htouch, Hfoot.
  apply Ascii.eqb_eq in Htouch. apply Ascii.eqb_eq in Hfoot. subst p1 p0.
  assert (Hperp : Interp (PerpAt s0 s1 p)) by (eapply lookup_step_sound; eauto).
  assert (Hradius : Interp (RadiusOf c p)) by (eapply lookup_step_sound; eauto).
  assert (Hfigure : Interp (PerpAt s (segment c.(circle_c) p) p)).
  { apply orb_true_iff in Hlines.
    destruct Hlines as [Hm|Hm]; apply andb_true_iff in Hm;
      destruct Hm as [H1 H2].
    - exact (proj1 (perp_at_realign s0 s1 s (segment c.(circle_c) p) p p
                     H1 H2 (Ascii.eqb_refl p)) Hperp).
    - cbn. apply perp_in_sym.
      exact (proj1 (perp_at_realign s0 s1 (segment c.(circle_c) p) s p p
                     H2 H1 (Ascii.eqb_refl p)) Hperp). }
  cbn in Hfigure. destruct Hfigure as [Hswf [_ [Hcol [_ Hright]]]].
  destruct s as [a b]. cbn in Hswf, Hcol, Hright, Hshape |- *.
  unfold endpoint_of, ascii_eqb in Hshape. apply orb_true_iff in Hshape.
  split; [exact Hswf|]. split; [exact Hradius|]. split; [Col|].
  destruct Hshape as [Hp|Hp]; apply Ascii.eqb_eq in Hp; cbn in Hp; subst.
  - exists (point b). split; [now right|]. split.
    + now apply not_eq_sym.
    + apply l8_2, Hright; [apply col_trivial_3|apply col_trivial_1].
  - exists (point a). split; [now left|]. split.
    + exact Hswf.
    + apply l8_2, Hright; [apply col_trivial_1|apply col_trivial_1].
Qed.

Lemma con_tangents_ext_sound : forall facts i j conclusion,
  Forall Interp facts -> con_tangents_ext_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold con_tangents_ext_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hconc].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hshape'].
  apply andb_true_iff in Hrule. destruct Hrule as [Hcircle Hshape].
  apply circle_eqb_eq in Hcircle. subst c0.
  assert (Ht1 : Interp (TangentAt c s1 p)) by (eapply lookup_step_sound; eauto).
  assert (Ht2 : Interp (TangentAt c s2 p0)) by (eapply lookup_step_sound; eauto).
  pose proof Ht1 as Hon1. pose proof Ht2 as Hon2.
  cbn in Hon1, Hon2.
  destruct Hon1 as [_ [[_ Hr1] _]]. destruct Hon2 as [_ [[_ Hr2] _]].
  destruct (tangent_far_point _ _ _ _ Hshape Ht1) as [Hper1 _].
  destruct (tangent_far_point _ _ _ _ Hshape' Ht2) as [Hper2 _].
  apply (cong_pair_conclude _ _ (segment p (other_endpoint p s1))
                                (segment p0 (other_endpoint p s1)));
    [exact Hconc|cbn].
  apply (ender_tangents_congruent (point c.(circle_c)));
    [now apply l8_2|now apply l8_2|].
  apply cong_transitivity with (point c.(circle_c)) (point c.(circle_r));
    [Cong|Cong].
Qed.

Lemma radius_chord_bisect_sound : forall facts i j k conclusion,
  Forall Interp facts ->
  radius_chord_bisect_rule facts i j k conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j k conclusion Hfacts Hrule.
  unfold radius_chord_bisect_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  destruct (lookup_step facts k) as [z|] eqn:Hz; try discriminate;
    destruct z; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hchordline].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Htarget].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hperpline].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hbisector].
  apply andb_true_iff in Hrule. destruct Hrule as [Hcircle Hfoot].
  apply circle_eqb_eq in Hcircle. subst c0.
  unfold ascii_eqb in Hfoot. apply Ascii.eqb_eq in Hfoot. subst p0.
  assert (Hperp : Interp (PerpAt s1 s2 p)) by (eapply lookup_step_sound; eauto).
  assert (Hch : Interp (ChordOf c s3)) by (eapply lookup_step_sound; eauto).
  assert (Hfigure : Interp (PerpAt (segment c.(circle_c) p) s3 p))
    by (exact (proj1 (perp_at_realign s1 s2 (segment c.(circle_c) p) s3 p p
                       Hperpline Hchordline (Ascii.eqb_refl p)) Hperp)).
  cbn in Hfigure.
  destruct Hfigure as [Hcentre [Hchordwf [_ [Hcol Hright]]]].
  cbn in Hch. destruct Hch as [_ [[_ Hone] [_ Htwo]]].
  assert (Hmid : Midpoint (point p) (point s3.(seg_start))
                          (point s3.(seg_end))).
  { apply (ender_chord_foot_midpoint (point c.(circle_c)));
      [exact Hchordwf|Col| | |].
    - apply l8_2, Hright; [apply col_trivial_1|apply col_trivial_1].
    - apply l8_2, Hright; [apply col_trivial_1|apply col_trivial_3].
    - apply cong_transitivity with (point c.(circle_c)) (point c.(circle_r));
        [exact Hone|Cong]. }
  apply (proj2 (seg_bisect_realign s s0 (segment c.(circle_c) p) s3 p p
                 Hbisector Htarget (Ascii.eqb_refl p))).
  cbn. split; [exact Hcentre|]. split; [apply col_trivial_2|exact Hmid].
Qed.

(** The audited parallelogram says the same thing about every rotation of its
    name, so a rule that reads the figure from one corner can be run at each
    of the four in turn. *)
Lemma pgram_rotate : forall q, Interp (Pgram q) -> Interp (Pgram (rotate_quad q)).
Proof.
  intros q Hp.
  destruct (pgram_figure q Hp) as [X [Hncol [HXac [HXbd [Hpar1 Hpar2]]]]].
  pose proof Hp as Hwf. cbn in Hwf. destruct Hwf as [Hwf _].
  destruct Hwf as [Hab [Hac [Had [Hbc [Hbd Hcd]]]]].
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd _].
  cbn. split.
  - cbn. repeat split; try assumption; try (now apply not_eq_sym).
    exists X. split; [exact HXbd|exact (ender_bets_sym _ _ _ HXac)].
  - unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
    split; [exact Hpar2|now apply par_symmetry].
Qed.

Lemma rhomb_rotate : forall q, Interp (Rhomb q) -> Interp (Rhomb (rotate_quad q)).
Proof.
  intros q Hr. pose proof Hr as Hp. cbn in Hr, Hp.
  destruct Hp as [Hp _]. destruct Hr as [_ [Hab [Hbc Hcd]]].
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hab, Hbc, Hcd; cbn in *.
  cbn. split; [now apply pgram_rotate|].
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
  repeat split; [exact Hbc|exact Hcd|].
  apply cong_transitivity with (point q.(quad_c)) (point q.(quad_d)); [Cong|].
  apply cong_transitivity with (point q.(quad_b)) (point q.(quad_c)); Cong.
Qed.

(** Which of the two ways the bisector premise can be spelled does not matter:
    naming the ray from the far end, or the corner backwards, only commutes
    the two halves it claims are congruent. *)
Lemma bisector_corner_conga : forall a s r,
  bisector_at_corner a s r = true ->
  point r.(quad_a) <> point r.(quad_c) ->
  Interp (AngBisectOf a s) ->
  CongA (point r.(quad_b)) (point r.(quad_a)) (point r.(quad_c))
        (point r.(quad_c)) (point r.(quad_a)) (point r.(quad_d)).
Proof.
  intros a s r Hmatch Hne Hbis.
  unfold bisector_at_corner in Hmatch. apply andb_true_iff in Hmatch.
  destruct Hmatch as [Hang Hseg].
  apply angle_u_eqb_cases in Hang. apply segment_u_eqb_cases in Hseg.
  cbn in Hbis.
  destruct Hang as [->| ->]; destruct Hseg as [->| ->];
    unfold reverse_angle, reverse_segment, quad_corner_a,
      quad_diagonal_ac in Hbis; cbn in Hbis;
    destruct Hbis as [[Hvertex Hconga]|[Hvertex Hconga]]; cbn in Hvertex, Hconga;
    solve [ exact Hconga
          | apply conga_sym, conga_comm, Hconga
          | exfalso; apply Hne; now rewrite Hvertex ].
Qed.

Lemma pgram_bisector_rhombus_at : forall r a s,
  bisector_at_corner a s r = true ->
  Interp (AngBisectOf a s) -> Interp (Pgram r) -> Interp (Rhomb r).
Proof.
  intros r a s Hmatch Hbis Hp.
  destruct (pgram_figure r Hp) as [X [Hncol [HXac [HXbd [Hpar1 Hpar2]]]]].
  pose proof Hp as Hwf. cbn in Hwf. destruct Hwf as [Hwf _].
  assert (Hne : point r.(quad_a) <> point r.(quad_c))
    by (destruct Hwf as [_ [Hac _]]; exact Hac).
  pose proof (bisector_corner_conga _ _ _ Hmatch Hne Hbis) as Hconga.
  destruct (ender_pgram_bisector_rhombus _ _ _ _ X Hncol HXac HXbd
              Hpar1 Hpar2 Hconga) as [Hab [Hbc Hcd]].
  cbn. split; [exact Hp|].
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
  repeat split; assumption.
Qed.

Lemma rhombus_opp_bisect_conv_sound : forall facts i j k conclusion,
  Forall Interp facts ->
  rhombus_opp_bisect_conv_rule facts i j k conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j k conclusion Hfacts Hrule.
  unfold rhombus_opp_bisect_conv_rule in Hrule.
  destruct conclusion; try discriminate.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  destruct (lookup_step facts k) as [z|] eqn:Hz; try discriminate;
    destruct z; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hq Hsearch].
  apply quadrilateral_eqb_eq in Hq. subst q0.
  assert (Hb1 : Interp (AngBisectOf a s)) by (eapply lookup_step_sound; eauto).
  assert (Hb2 : Interp (AngBisectOf a0 s0)) by (eapply lookup_step_sound; eauto).
  assert (Hp : Interp (Pgram q)) by (eapply lookup_step_sound; eauto).
  apply existsb_exists in Hsearch. destruct Hsearch as [rot [Hin Hmatch]].
  assert (Hstep : forall r, Interp (Pgram r) ->
      (bisector_at_corner a s r &&
       bisector_at_corner a0 s0 (rotate_quad (rotate_quad r))) = true ->
      Interp (Rhomb r)).
  { intros r Hpr Hm. apply andb_true_iff in Hm. destruct Hm as [Hm _].
    exact (pgram_bisector_rhombus_at r a s Hm Hb1 Hpr). }
  destruct q as [qa qb qc qd].
  unfold quad_rotations in Hin. cbn in Hin.
  destruct Hin as [<-|[<-|[<-|[<-|[]]]]].
  - exact (Hstep _ Hp Hmatch).
  - exact (rhomb_rotate _ (rhomb_rotate _ (rhomb_rotate _
             (Hstep _ (pgram_rotate _ Hp) Hmatch)))).
  - exact (rhomb_rotate _ (rhomb_rotate _
             (Hstep _ (pgram_rotate _ (pgram_rotate _ Hp)) Hmatch))).
  - exact (rhomb_rotate _
             (Hstep _ (pgram_rotate _ (pgram_rotate _ (pgram_rotate _ Hp)))
                Hmatch)).
Qed.

(** Similarity in the kernel's own angle spelling, together with the two moves
    the correspondence search makes on a pair of triangles. *)
Definition similar_angles (t u : Triangle) : Prop :=
  CongA (point t.(tri_b)) (point t.(tri_a)) (point t.(tri_c))
        (point u.(tri_b)) (point u.(tri_a)) (point u.(tri_c)) /\
  CongA (point t.(tri_a)) (point t.(tri_b)) (point t.(tri_c))
        (point u.(tri_a)) (point u.(tri_b)) (point u.(tri_c)) /\
  CongA (point t.(tri_a)) (point t.(tri_c)) (point t.(tri_b))
        (point u.(tri_a)) (point u.(tri_c)) (point u.(tri_b)).

Lemma similar_angles_rotate_back : forall t u,
  similar_angles (rotate_triangle t) (rotate_triangle u) -> similar_angles t u.
Proof.
  intros [ta tb tc] [ua ub uc] [H1 [H2 H3]]. cbn in H1, H2, H3.
  unfold similar_angles. cbn.
  split; [exact H3|].
  split; now apply conga_comm.
Qed.

Lemma similar_angles_reverse : forall t u,
  similar_angles (reverse_triangle t) (reverse_triangle u) -> similar_angles t u.
Proof.
  intros [ta tb tc] [ua ub uc] [H1 [H2 H3]]. cbn in H1, H2, H3.
  unfold similar_angles. cbn.
  split; [now apply conga_comm|].
  split; now apply conga_comm.
Qed.

Lemma correspondences_similar : forall t u c,
  In c (correspondences t u) ->
  similar_angles (fst c) (snd c) -> similar_angles t u.
Proof.
  intros [A B C] [D E F] c Hin Hsim. unfold correspondences in Hin. cbn in Hin.
  repeat (destruct Hin as [<-|Hin];
    [cbn in Hsim |- *;
     solve [ exact Hsim
           | now apply similar_angles_rotate_back
           | now apply similar_angles_rotate_back,
                       similar_angles_rotate_back
           | now apply similar_angles_reverse
           | apply similar_angles_reverse;
             now apply similar_angles_rotate_back
           | apply similar_angles_reverse;
             now apply similar_angles_rotate_back,
                       similar_angles_rotate_back ]|]).
  contradiction.
Qed.

Lemma similar_angles_sim : forall t u,
  triangle_well_formed point t -> triangle_well_formed point u ->
  similar_angles t u -> Interp (SimTri t u).
Proof.
  intros t u Ht Hu [H1 [H2 H3]].
  apply triangle_well_formed_nondegenerate in Ht.
  apply triangle_well_formed_nondegenerate in Hu.
  destruct Ht as [Htab [Htbc [Htca Htcol]]].
  destruct Hu as [Huab [Hubc [Huca Hucol]]].
  cbn. unfold Audit.TriangleSimilar, Audit.TriangleWellFormed,
    Audit.AngleCongruent, Audit.angle_a, Audit.angle_b, Audit.angle_c,
    Audit.ang_start, Audit.ang_vertex, Audit.ang_end, tri_name; cbn.
  (* [CongA] is itself a conjunction, so the three angle congruences are
     placed one at a time rather than split into. *)
  split; [repeat split; assumption|].
  split; [repeat split; assumption|].
  split; [now apply conga_comm|].
  split; [exact H2|now apply conga_comm].
Qed.

Lemma aa_sim_sound : forall decls premises facts i j conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  aa_sim decls premises facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros decls premises facts i j conclusion Hwf Hprem Hall Hrule.
  unfold aa_sim in Hrule. destruct conclusion; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdecl Hsearch].
  apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
  apply existsb_exists in Hsearch. destruct Hsearch as [c [Hin Hmatch]].
  pose proof (correspondences_well_formed _ _ _ Hin Ht Hu) as [Hwt Hwu].
  unfold aa_sim_at in Hmatch.
  apply (schema2_sound _ _ _ _ _ _ _ Hwf Hprem Hall) in Hmatch.
  destruct Hmatch as [HatA HatB].
  apply similar_angles_sim; [exact Ht|exact Hu|].
  apply (correspondences_similar _ _ _ Hin).
  destruct c as [[A B C] [D E F]]. cbn in HatA, HatB, Hwt, Hwu |- *.
  unfold similar_angles. cbn.
  split; [exact HatA|]. split; [exact HatB|].
  now apply ender_third_angle.
Qed.

Lemma rule_valid_sound : forall decls premises facts reason conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  rule_valid decls premises facts reason conclusion = true ->
  Interp conclusion.
Proof.
  intros decls premises facts reason conclusion Hwf Hprem Hfacts Hvalid.
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
    + (* the declaration is what makes the two rays nondegenerate *)
      apply andb_true_iff in Hvalid. destruct Hvalid as [Hsame Hdeclared].
      apply (declared_angle_sound _ _ Hwf) in Hdeclared.
      apply angle_u_eqb_cases in Hsame.
      destruct Hsame as [Heq|Heq]; subst a;
        [destruct Hdeclared as [Hl Hr]; cbn; now apply conga_refl|].
      unfold reverse_angle in Hdeclared |- *. cbn in Hdeclared |- *.
      destruct Hdeclared as [Hl Hr]. now apply conga_pseudo_refl.
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hprem|exact Hfacts|exact Ht|exact sas_schema_sound|exact Hschema].
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hprem|exact Hfacts|exact Ht|exact sss_schema_sound|exact Hschema].
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hprem|exact Hfacts|exact Ht|exact asa_schema_sound|exact Hschema].
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hprem|exact Hfacts|exact Ht|exact aas_schema_sound|exact Hschema].
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
  - eapply ang_bisect_conv_sound; eauto.
  - destruct conclusion; try discriminate.
    apply andb_true_iff in Hvalid. destruct Hvalid as [Hdecl Hschema].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht Hu].
    eapply six_correspondences_sound;
      [exact Hwf|exact Hprem|exact Hfacts|exact Ht|exact rhl_schema_sound|exact Hschema].
  - eapply midpt_conv_sound; eauto.
  - eapply third_angle_sound; eauto.
  - eapply def_con_tri_sound; eauto.
  - eapply def_isosceles_sound; eauto.
  - eapply base_angle_sound; eauto.
  - eapply base_angle_conv_sound; eauto.
  - eapply def_equilateral_sound; eauto.
  - eapply def_equiangular_sound; eauto.
  - eapply equilat_equiang_sound; eauto.
  - eapply equiang_equilat_sound; eauto.
  - eapply con_supplements_sound; eauto.
  - eapply con_supplements_same_sound; eauto.
  - eapply con_complements_sound; eauto.
  - eapply con_complements_same_sound; eauto.
  - eapply def_linear_pair_sound; eauto.
  - eapply def_perp_sound; eauto.
  - eapply def_parallelogram_sound; eauto.
  - eapply pgram_opp_sides_sound; eauto.
  - eapply pgram_opp_angles_sound; eauto.
  - eapply pgram_consec_angs_sound; eauto.
  - eapply kite_opp_con_ang_sound; eauto.
  - eapply pgram_opp_sides_conv_sound; eauto.
  - eapply pgram_consec_angs_conv_sound; eauto.
  - eapply rect_pgram_ang_sound; eauto.
  - eapply pgram_opp_side_para_sound; eauto.
  - eapply rectangle_pgram_sound; eauto.
  - eapply rhombus_pgram_sound; eauto.
  - eapply rhombus_consec_sides_sound; eauto.
  - eapply rhombus_def_sound; eauto.
  - eapply rhombus_opp_bisect_sound; eauto.
  - eapply rect_diag_con_sound; eauto.
  - eapply rectangle_def_sound; eauto.
  - eapply altint_sound; eauto.
  - eapply altext_sound; eauto.
  - eapply corresp_ang_sound; eauto.
  - eapply sameside_ang_sound; eauto.
  - eapply altint_conv_sound; eauto.
  - eapply altext_conv_sound; eauto.
  - eapply corresp_ang_conv_sound; eauto.
  - eapply sameside_ang_conv_sound; eauto.
  - eapply para_trans_sound; eauto.
  - eapply def_radius_sound; eauto.
  - eapply inscribed_semi_sound; eauto.
  - eapply con_chords_arcs_sound; eauto.
  - eapply tangent_perp_sound; eauto.
  - eapply tangent_perp_conv_sound; eauto.
  - eapply con_tangents_ext_sound; eauto.
  - eapply radius_chord_bisect_sound; eauto.
  - eapply perp_bisector_sound; eauto.
  - eapply isos_trap_con_diags_sound; eauto.
  - eapply isos_trap_base_angs_sound; eauto.
  - eapply isos_trap_base_angs_conv_sound; eauto.
  - eapply pgram_diag_bisect_conv_sound; eauto.
  - eapply pgram_opp_angs_conv_sound; eauto.
  - eapply rect_diag_con_conv_sound; eauto.
  - eapply rhombus_diag_perp_conv_sound; eauto.
  - eapply rhombus_opp_bisect_conv_sound; eauto.
  - eapply aa_sim_sound; eauto.
Qed.

Lemma check_steps_sound : forall decls premises steps facts output,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  check_steps decls premises facts steps = Some output ->
  Forall Interp output.
Proof.
  intros decls premises steps. induction steps as [|s rest IH];
    intros facts output Hwf Hprem Hfacts Hcheck; cbn in Hcheck.
  - injection Hcheck as <-. exact Hfacts.
  - destruct (rule_valid decls premises facts (step_reason s)
              (step_conclusion s)) eqn:Hvalid; try discriminate.
    apply (IH (facts ++ [step_conclusion s]) output); auto.
    apply Forall_app. split; auto. constructor; auto.
    eapply rule_valid_sound; eauto.
Qed.

Theorem check_problem_sound : forall p,
  check_problem p = true ->
  declarations_well_formed point p.(problem_declarations) ->
  Forall (interp_premise point) p.(problem_premises) ->
  Interp p.(problem_goal).
Proof.
  intros p Hcheck Hwf Hprem. unfold check_problem in Hcheck.
  destruct (check_steps (problem_declarations p) (problem_premises p) []
            (problem_steps p)) as [facts|] eqn:Hsteps; try discriminate.
  apply existsb_exists in Hcheck. destruct Hcheck as [goal [Hin Heq]].
  pose proof (check_steps_sound _ _ _ _ _ Hwf Hprem (Forall_nil _) Hsteps) as Hall.
  apply (proj2 (fact_eqb_sound _ _ Heq)).
  eapply Forall_forall; eauto.
Qed.

End Soundness.
