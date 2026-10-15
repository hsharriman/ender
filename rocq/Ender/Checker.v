From Stdlib Require Import List String Bool Lia.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import GeoCoq.Main.Tarski_dev.Ch12_parallel.
Require Import GeoCoq.Main.Annexes.suma.
Require Import Ender.Syntax Ender.Geometry Ender.Semantics.
Require Ender.Inscribed.
Import ListNotations.
Import EnderSyntax.

Definition rotate_triangle (t : TriangleName) : TriangleName :=
  triangle_name t.(triangle_second) t.(triangle_third) t.(triangle_first).

Definition side_ab (t : TriangleName) := segment_name t.(triangle_first) t.(triangle_second).
Definition side_bc (t : TriangleName) := segment_name t.(triangle_second) t.(triangle_third).
Definition side_ca (t : TriangleName) := segment_name t.(triangle_third) t.(triangle_first).
Definition angle_a (t : TriangleName) := angle_name t.(triangle_second) t.(triangle_first) t.(triangle_third).
Definition angle_b (t : TriangleName) := angle_name t.(triangle_first) t.(triangle_second) t.(triangle_third).
Definition angle_c (t : TriangleName) := angle_name t.(triangle_first) t.(triangle_third) t.(triangle_second).

Definition reverse_segment (s : SegmentName) := segment_name s.(segment_second) s.(segment_first).
Definition segment_u_eqb (a b : SegmentName) : bool :=
  segment_eqb a b || segment_eqb a (reverse_segment b).
Definition segment_pair_eqb (a b c d : SegmentName) : bool :=
  (segment_u_eqb a c && segment_u_eqb b d) ||
  (segment_u_eqb a d && segment_u_eqb b c).

Lemma segment_u_eqb_refl : forall s, segment_u_eqb s s = true.
Proof.
  intros [a b]. unfold segment_u_eqb, segment_eqb, ascii_eqb. cbn.
  apply orb_true_iff. left. apply andb_true_iff. split; apply Ascii.eqb_refl.
Qed.

Lemma segment_u_eqb_reverse : forall a b,
  segment_u_eqb (segment_name a b) (segment_name b a) = true.
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
Definition reverse_angle (a : AngleName) :=
  angle_name a.(angle_last) a.(angle_vertex) a.(angle_first).
Definition angle_u_eqb (a b : AngleName) : bool :=
  angle_eqb a b || angle_eqb a (reverse_angle b).
Definition angle_pair_eqb (a b c d : AngleName) : bool :=
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
(** A quadrilateral is named by walking its boundary, so starting at another
    corner or walking the other way names the same figure; the other orders of
    four letters name a different, self-crossing one. *)
Definition rotate_quad (q : QuadrilateralName) : QuadrilateralName :=
  quadrilateral_name q.(quadrilateral_second) q.(quadrilateral_third) q.(quadrilateral_fourth) q.(quadrilateral_first).
Definition reverse_quad (q : QuadrilateralName) : QuadrilateralName :=
  quadrilateral_name q.(quadrilateral_fourth) q.(quadrilateral_third) q.(quadrilateral_second) q.(quadrilateral_first).
Definition quad_relabelings (q : QuadrilateralName) : list QuadrilateralName :=
  let r := rotate_quad in
  let v := reverse_quad q in
  [q; r q; r (r q); r (r (r q)); v; r v; r (r v); r (r (r v))].
Definition same_quadrilateral (q r : QuadrilateralName) : bool :=
  existsb (quadrilateral_eqb q) (quad_relabelings r).

(** Two triangle names with the same three vertices, in any order. *)
Definition same_vertices (t u : TriangleName) : bool :=
  triangle_mem t (triangle_orderings u).

Definition fact_eqb (expected actual : Statement) : bool :=
  match expected, actual with
  | ConSeg a b, ConSeg c d => segment_pair_eqb a b c d
  (* A [ref_*] fact names one object twice -- its audited meaning says so --
     so it stands in for a [con_*] form only of an object with itself. *)
  | ConSeg a b, RefSeg c d | RefSeg a b, ConSeg c d | RefSeg a b, RefSeg c d =>
      segment_pair_eqb a b c d && segment_u_eqb a b && segment_u_eqb c d
  | ConAng a b, ConAng c d => angle_pair_eqb a b c d
  | ConAng a b, RefAng c d | RefAng a b, ConAng c d | RefAng a b, RefAng c d =>
      angle_pair_eqb a b c d && angle_u_eqb a b && angle_u_eqb c d
  (* Unordered congruence is blind to the order of either triangle's
     vertices, and to which triangle comes first. *)
  | ConTri a b, ConTri c d =>
      (same_vertices a c && same_vertices b d) ||
      (same_vertices a d && same_vertices b c)
  | ConTriOrdered a b, ConTriOrdered c d | SimTri a b, SimTri c d =>
      triangle_eqb a c && triangle_eqb b d
  | Right a, Right b => angle_eqb a b
  | ConRight a b, ConRight c d => angle_pair_eqb a b c d
  | Perp a b p, Perp c d q =>
      segment_u_eqb a c && segment_u_eqb b d && ascii_eqb p q
  | Midpt a p, Midpt b q => segment_u_eqb a b && ascii_eqb p q
  | IntersectSeg a b p, IntersectSeg c d q =>
      segment_eqb a c && segment_eqb b d && ascii_eqb p q
  (* Reversing the ray commutes the two disjuncts of the bisector meaning. *)
  | AngBisect a b, AngBisect c d => angle_eqb a c && segment_u_eqb b d
  (* The bisector's line and the halved segment are both unoriented: [Col] is
     permutation-invariant, and [Midpoint] survives swapping the endpoints. *)
  | SegBisect a b p, SegBisect c d q =>
      segment_u_eqb a c && segment_u_eqb b d && ascii_eqb p q
  | OnLine a p, OnLine b q => segment_u_eqb a b && ascii_eqb p q
  | Isosceles a, Isosceles b | Equilateral a, Equilateral b
  | Equiangular a, Equiangular b => triangle_eqb a b
  (* [SuppA] is symmetric and unaffected by reversing either angle. *)
  | Supplementary a b, Supplementary c d
  | Complementary a b, Complementary c d => angle_pair_eqb a b c d
  | LinearPair a b, LinearPair c d => angle_eqb a c && angle_eqb b d
  (* [Par] is symmetric and unaffected by reversing either segment. *)
  | Para a b, Para c d => segment_pair_eqb a b c d
  (* Every quadrilateral shape says the same thing of any name for its
     figure.  A kite premise selects corners by name, so it matches exactly,
     as does the transversal's labeled figure. *)
  | Parallelogram a, Parallelogram b | Rectangle a, Rectangle b | Rhombus a, Rhombus b
  | IsosTrapezoid a, IsosTrapezoid b => same_quadrilateral a b
  | TrapezoidPremise q a b, TrapezoidPremise r c d
  | IsosTrapezoidPremise q a b, IsosTrapezoidPremise r c d =>
      same_quadrilateral q r && segment_eqb a c && segment_eqb b d
  | KitePremise q a b, KitePremise r c d =>
      quadrilateral_eqb q r && angle_eqb a c && angle_eqb b d
  | Transversal a b t1 i1 c d t2 i2, Transversal a' b' t1' i1' c' d' t2' i2' =>
      ascii_eqb a a' && ascii_eqb b b' && ascii_eqb t1 t1' &&
      ascii_eqb i1 i1' && ascii_eqb c c' && ascii_eqb d d' &&
      ascii_eqb t2 t2' && ascii_eqb i2 i2'
  | Radius c p, Radius c' p' => circle_eqb c c' && ascii_eqb p p'
  | Chord c s, Chord c' s' | Diameter c s, Diameter c' s' =>
      circle_eqb c c' && segment_eqb s s'
  | Tangent c s p, Tangent c' s' p' =>
      circle_eqb c c' && segment_eqb s s' && ascii_eqb p p'
  | InscribedAngle c a, InscribedAngle c' a'
  | MinorInscribedAngle c a, MinorInscribedAngle c' a'
  | MajorInscribedAngle c a, MajorInscribedAngle c' a' =>
      circle_eqb c c' && angle_eqb a a'
  | OnCirclePoint c p, OnCirclePoint c' p' => circle_eqb c c' && ascii_eqb p p'
  | CenterOnLine c s, CenterOnLine c' s' => circle_eqb c c' && segment_eqb s s'
  | ArcStatement a, ArcStatement a' => arc_eqb a a'
  | ConArc a b, ConArc a' b' => arc_eqb a a' && arc_eqb b b'
  | _, _ => false
  end.

Definition lookup_step (facts : list Statement) (index : nat) : option Statement :=
  match index with O => None | S n => nth_error facts n end.

(** An angle spanning the three vertices of a declared triangle has
    nondegenerate rays, because declaring a triangle asserts that its vertices
    are noncollinear. *)
Definition angle_of_triangle (t : TriangleName) (a : AngleName) : bool :=
  angle_eqb a (angle_name t.(triangle_second) t.(triangle_first) t.(triangle_third)) ||
  angle_eqb a (angle_name t.(triangle_third) t.(triangle_first) t.(triangle_second)) ||
  angle_eqb a (angle_name t.(triangle_first) t.(triangle_second) t.(triangle_third)) ||
  angle_eqb a (angle_name t.(triangle_third) t.(triangle_second) t.(triangle_first)) ||
  angle_eqb a (angle_name t.(triangle_first) t.(triangle_third) t.(triangle_second)) ||
  angle_eqb a (angle_name t.(triangle_second) t.(triangle_third) t.(triangle_first)).

(** A declared quadrilateral asserts that its four vertices are pairwise
    distinct, so any three of them, named apart, are an angle with
    nondegenerate rays.  Unlike a triangle, the three need not be consecutive:
    distinctness is all a well-formed angle wants, and every pair of vertices
    has it. *)
Definition quad_vertices (q : QuadrilateralName) : list PointId :=
  [q.(quadrilateral_first); q.(quadrilateral_second); q.(quadrilateral_third); q.(quadrilateral_fourth)].

Definition angle_of_quadrilateral (q : QuadrilateralName) (a : AngleName) : bool :=
  let vertex p := existsb (ascii_eqb p) (quad_vertices q) in
  vertex a.(angle_first) && vertex a.(angle_vertex) && vertex a.(angle_last) &&
  negb (ascii_eqb a.(angle_first) a.(angle_vertex)) &&
  negb (ascii_eqb a.(angle_last) a.(angle_vertex)).

(** A [seg:] line is audited as [SegmentWellFormed], so a declared segment is
    a source of the one fact a ray needs: that its two ends are different
    points. *)
Definition declared_segment (decls : Declarations) (s : SegmentName) : bool :=
  existsb (segment_u_eqb s) decls.(decl_segments).

(** An angle is nondegenerate if it spans a declared triangle's vertices, if it
    names three vertices of a declared quadrilateral, if both of its rays are
    declared segments -- which is the same two distinctness facts, written the
    way a figure with no triangle in it usually declares them -- or if it is
    itself declared on an [ang:] line, whose audited meaning is exactly
    [AngleWellFormed]. *)
Definition declared_angle (decls : Declarations) (a : AngleName) : bool :=
  existsb (fun t => angle_of_triangle t a) decls.(decl_triangles) ||
  existsb (fun q => angle_of_quadrilateral q a) decls.(decl_quadrilaterals) ||
  (declared_segment decls (segment_name a.(angle_first) a.(angle_vertex)) &&
   declared_segment decls (segment_name a.(angle_last) a.(angle_vertex))) ||
  existsb (angle_u_eqb a) decls.(decl_angles).

(** [q] names the same ray from [v] as [p]: the names are equal, or an
    [on_line] diagram premise places one of the two on the segment from [v]
    through the other.  [on_line] is audited as segment membership, so the
    premise supplies the betweenness an [Out] fact needs. *)
Definition on_segment_match (v p q : PointId) (s : SegmentName) (r : PointId) : bool :=
  ((segment_u_eqb s (segment_name v q) && ascii_eqb r p) ||
   (segment_u_eqb s (segment_name v p) && ascii_eqb r q)).

(** Diagram statements and midpoint givens all carry endpoint-inclusive
    segment membership.  Treat their named interior point uniformly when
    deciding whether two spellings name the same ray. *)
Definition statement_ray_linked (v p q : PointId) (s : Statement) : bool :=
  match s with
  | OnLine t r | Midpt t r => on_segment_match v p q t r
  | IntersectSeg t u r =>
      on_segment_match v p q t r || on_segment_match v p q u r
  | _ => false
  end.

Definition on_line_witness (s : Statement) : option (SegmentName * PointId) :=
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
    (expected actual : AngleName) : option (list Statement) :=
  if angle_u_eqb expected actual then Some []
  else if negb (declared_angle decls expected &&
                ascii_eqb expected.(angle_vertex) actual.(angle_vertex))
  then None
  else match ray_pair_used premises expected.(angle_vertex)
               expected.(angle_first) expected.(angle_last)
               actual.(angle_first) actual.(angle_last) with
       | Some used => Some used
       | None =>
           ray_pair_used premises expected.(angle_vertex)
             expected.(angle_first) expected.(angle_last)
             actual.(angle_last) actual.(angle_first)
       end.

Definition angle_ray_matches (decls : Declarations) (premises : list Premise)
    (expected actual : AngleName) : bool :=
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
    (a b c d : AngleName) : option (list Statement) :=
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

Definition sas_schema decls premises facts i j k (t u : TriangleName) : bool :=
  schema3 decls premises facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ca t) (side_ca u)).

Definition sss_schema decls premises facts i j k (t u : TriangleName) : bool :=
  schema3 decls premises facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u)).

Definition asa_schema decls premises facts i j k (t u : TriangleName) : bool :=
  schema3 decls premises facts i j k
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_b t) (angle_b u)).

(** The two angles are interchangeable in the citation: swapping them names
    the same three facts, so both orders are accepted. *)
Definition aas_schema decls premises facts i j k (t u : TriangleName) : bool :=
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
Definition rhl_schema decls premises facts i j k (t u : TriangleName) : bool :=
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
              TriangleName -> TriangleName -> bool)
    decls premises facts i j k t u : bool :=
  schema decls premises facts i j k t u ||
  schema decls premises facts i j k (rotate_triangle t) (rotate_triangle u) ||
  schema decls premises facts i j k (rotate_triangle (rotate_triangle t))
                               (rotate_triangle (rotate_triangle u)).

(** A criterion's dependency order fixes which vertex plays which role, so the
    correspondence must be searched in both orientations, not only in its three
    rotations. *)
Definition reverse_triangle (t : TriangleName) : TriangleName :=
  triangle_name t.(triangle_third) t.(triangle_second) t.(triangle_first).

Definition six_correspondences
    (schema : Declarations -> list Premise -> list Statement -> nat -> nat -> nat ->
              TriangleName -> TriangleName -> bool)
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
              TriangleName -> TriangleName -> option (list Statement))
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

Definition asa_schema_used decls premises facts i j k (t u : TriangleName) :=
  schema3_used decls premises facts i j k
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_b t) (angle_b u)).

Definition aas_schema_used decls premises facts i j k (t u : TriangleName) :=
  either_used
    (schema3_used decls premises facts i j k
      (ConAng (angle_c t) (angle_c u))
      (ConAng (angle_b t) (angle_b u))
      (ConSeg (side_ab t) (side_ab u)))
    (schema3_used decls premises facts i j k
      (ConAng (angle_b t) (angle_b u))
      (ConAng (angle_c t) (angle_c u))
      (ConSeg (side_ab t) (side_ab u))).

Definition rhl_schema_used decls premises facts i j k (t u : TriangleName) :=
  either_used
    (schema3_used decls premises facts i j k
      (ConRight (angle_b t) (angle_b u))
      (ConSeg (side_ca t) (side_ca u))
      (ConSeg (side_bc t) (side_bc u)))
    (schema3_used decls premises facts i j k
      (ConRight (angle_b t) (angle_b u))
      (ConSeg (side_bc t) (side_bc u))
      (ConSeg (side_ca t) (side_ca u))).

Definition sas_schema_used decls premises facts i j k (t u : TriangleName) :=
  schema3_used decls premises facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ca t) (side_ca u)).

Definition sss_schema_used decls premises facts i j k (t u : TriangleName) :=
  schema3_used decls premises facts i j k
    (ConSeg (side_ab t) (side_ab u))
    (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u)).

(** Declaring [t_ABC] asserts that its vertices are noncollinear, and that is
    invariant under renaming the triangle's vertices. *)
Definition triangle_permutations (t : TriangleName) : list TriangleName :=
  [ triangle_name t.(triangle_first) t.(triangle_second) t.(triangle_third); triangle_name t.(triangle_first) t.(triangle_third) t.(triangle_second)
  ; triangle_name t.(triangle_second) t.(triangle_first) t.(triangle_third); triangle_name t.(triangle_second) t.(triangle_third) t.(triangle_first)
  ; triangle_name t.(triangle_third) t.(triangle_first) t.(triangle_second); triangle_name t.(triangle_third) t.(triangle_second) t.(triangle_first) ].

Definition triangle_declared (decls : Declarations) (t : TriangleName) : bool :=
  existsb (fun d => triangle_mem t (triangle_permutations d))
          decls.(decl_triangles).

(** The same six readings [six_correspondences] searches, as data, for rules
    whose shape does not fit the three-dependency schema. *)
Definition correspondences (t u : TriangleName) : list (TriangleName * TriangleName) :=
  let r := rotate_triangle in
  let t' := reverse_triangle t in
  let u' := reverse_triangle u in
  [ (t, u); (r t, r u); (r (r t), r (r u))
  ; (t', u'); (r t', r u'); (r (r t'), r (r u')) ].

Definition declared_pair (decls : Declarations) (t u : TriangleName) : bool :=
  triangle_declared decls t && triangle_declared decls u.

(** A congruence criterion concludes [con_tri_ordered] for the correspondence
    as written, read in any of its six ways, and [con_tri] for any ordering of
    the second triangle. *)
Definition criterion_conclusion
    (schema : Declarations -> list Premise -> list Statement -> nat -> nat -> nat ->
              TriangleName -> TriangleName -> bool)
    decls premises facts i j k (conclusion : Statement) : bool :=
  match conclusion with
  | ConTriOrdered t u =>
      declared_pair decls t u &&
      six_correspondences schema decls premises facts i j k t u
  | ConTri t u =>
      declared_pair decls t u &&
      existsb (six_correspondences schema decls premises facts i j k t)
              (triangle_orderings u)
  | _ => false
  end.

Definition criterion_used
    (schema : Declarations -> list Premise -> list Statement -> nat -> nat -> nat ->
              TriangleName -> TriangleName -> option (list Statement))
    decls premises facts i j k (conclusion : Statement) : option (list Statement) :=
  match conclusion with
  | ConTriOrdered t u => six_correspondences_used schema decls premises facts i j k t u
  | ConTri t u =>
      first_used (six_correspondences_used schema decls premises facts i j k t)
                 (triangle_orderings u)
  | _ => None
  end.

(** What [cpctc] needs from an unordered [con_tri] is a correspondence, and
    the statement does not carry one.  The facts already established can: a
    correspondence is witnessed when a congruence criterion's three parts, or
    an ordered congruence, are among them, read in any of the six ways. *)
Definition supported decls premises (facts : list Statement)
    (expected : Statement) : bool :=
  existsb (dependency_matches decls premises expected) facts.

Definition supported3 decls premises facts (a b c : Statement) : bool :=
  supported decls premises facts a && supported decls premises facts b &&
  supported decls premises facts c.

Definition reading_witnessed decls premises facts (t u : TriangleName) : bool :=
  (* SAS *)
  supported3 decls premises facts
    (ConSeg (side_ab t) (side_ab u)) (ConAng (angle_a t) (angle_a u))
    (ConSeg (side_ca t) (side_ca u)) ||
  (* SSS *)
  supported3 decls premises facts
    (ConSeg (side_ab t) (side_ab u)) (ConSeg (side_bc t) (side_bc u))
    (ConSeg (side_ca t) (side_ca u)) ||
  (* ASA *)
  supported3 decls premises facts
    (ConAng (angle_a t) (angle_a u)) (ConSeg (side_ab t) (side_ab u))
    (ConAng (angle_b t) (angle_b u)) ||
  (* AAS *)
  supported3 decls premises facts
    (ConAng (angle_c t) (angle_c u)) (ConAng (angle_b t) (angle_b u))
    (ConSeg (side_ab t) (side_ab u)) ||
  (* HL *)
  supported3 decls premises facts
    (ConRight (angle_b t) (angle_b u)) (ConSeg (side_ca t) (side_ca u))
    (ConSeg (side_bc t) (side_bc u)) ||
  existsb (fact_eqb (ConTriOrdered t u)) facts.

Definition correspondence_witnessed decls premises facts (t u : TriangleName) : bool :=
  existsb (fun c => reading_witnessed decls premises facts (fst c) (snd c))
          (correspondences t u).

(** Correspondences compose, so a chain of witnessed ones through other
    triangles — the way [con_tri_transitive] chains congruences — witnesses
    one too.  The intermediate triangles are those the [con_tri] facts name,
    in every vertex order.  The search grows the set of triangles reached
    from [t] a round at a time and stops when a round adds nothing; a direct
    witness is tried first, so the usual one-step case costs no more. *)
Definition congruence_nodes (facts : list Statement) : list TriangleName :=
  flat_map (fun f =>
    match f with
    | ConTri a b | ConTriOrdered a b => triangle_orderings a ++ triangle_orderings b
    | _ => []
    end) facts.

Fixpoint reach_correspondences decls premises facts (fuel : nat)
    (nodes reached : list TriangleName) : list TriangleName :=
  match fuel with
  | O => reached
  | S fuel' =>
      let fresh := filter (fun w =>
        negb (triangle_mem w reached) &&
        existsb (fun u => correspondence_witnessed decls premises facts u w)
                reached) nodes in
      match fresh with
      | [] => reached
      | _ => reach_correspondences decls premises facts fuel' nodes
               (reached ++ fresh)
      end
  end.

Definition chain_witnessed decls premises facts (t u : TriangleName) : bool :=
  correspondence_witnessed decls premises facts t u ||
  let nodes := congruence_nodes facts in
  existsb (fun w => correspondence_witnessed decls premises facts w u)
          (reach_correspondences decls premises facts (List.length nodes) nodes [t]).

Definition cpctc_facts (t u : TriangleName) : list Statement :=
  [ ConSeg (side_ab t) (side_ab u)
  ; ConSeg (side_bc t) (side_bc u)
  ; ConSeg (side_ca t) (side_ca u)
  ; ConAng (angle_a t) (angle_a u)
  ; ConAng (angle_b t) (angle_b u)
  ; ConAng (angle_c t) (angle_c u)
  ].

Definition is_cpctc_fact (t u : TriangleName) (conclusion : Statement) : bool :=
  existsb (fun expected => fact_eqb expected conclusion) (cpctc_facts t u).

(** An ordered congruence names its correspondence; an unordered one leaves
    [cpctc] to find one the facts witness. *)
Definition cpctc_rule decls premises facts (i : nat) (conclusion : Statement)
    : bool :=
  match lookup_step facts i with
  | Some (ConTriOrdered t u) => is_cpctc_fact t u conclusion
  | Some (ConTri t u) =>
      declared_pair decls t u &&
      existsb (fun u' => chain_witnessed decls premises facts t u' &&
                         is_cpctc_fact t u' conclusion)
              (triangle_orderings u)
  | _ => false
  end.

(** Transitivity of congruence.  A dependency states a congruence between two
    like objects; the two dependencies must share one object, and the
    conclusion must congruate the remaining two.  Sharing is decided by the
    same object identity the corresponding [fact_eqb] case uses, so segments
    may be shared with either endpoint order while angles and triangles must
    be shared exactly. *)
Definition segment_congruence_pair (s : Statement) : option (SegmentName * SegmentName) :=
  match s with ConSeg a b | RefSeg a b => Some (a, b) | _ => None end.
Definition angle_congruence_pair (s : Statement) : option (AngleName * AngleName) :=
  match s with ConAng a b | RefAng a b => Some (a, b) | _ => None end.
Definition triangle_congruence_pair (s : Statement) : option (TriangleName * TriangleName) :=
  match s with ConTriOrdered a b => Some (a, b) | _ => None end.
(** An ordered congruence is in particular an unordered one. *)
Definition any_triangle_congruence_pair (s : Statement)
    : option (TriangleName * TriangleName) :=
  match s with ConTri a b | ConTriOrdered a b => Some (a, b) | _ => None end.

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
  match conclusion with
  | ConTriOrdered _ _ =>
      transitive_rule triangle_eqb ConTriOrdered triangle_congruence_pair
        facts i j conclusion
  | ConTri _ _ =>
      transitive_rule same_vertices ConTri any_triangle_congruence_pair
        facts i j conclusion
  | _ => false
  end.

(** Two right angles are congruent.  The audited [right] meaning supplies the
    nondegenerate rays that GeoCoq's [l11_16] needs, so this rule may conclude
    either [con_right] or [con_ang]. *)
Definition def_con_right_conclusion (a b : AngleName) (conclusion : Statement) : bool :=
  match conclusion with
  | ConRight c d | ConAng c d =>
      (angle_u_eqb a c && angle_u_eqb b d) || (angle_u_eqb a d && angle_u_eqb b c)
  | _ => false
  end.

Definition def_con_right (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some (Right a), Some (Right b) => def_con_right_conclusion a b conclusion
  | _, _ => false
  end.

(** Every angle whose vertex is the foot of a perpendicular and whose rays end
    on the two perpendicular segments is right.  [Perp_at] states exactly this
    for all points collinear with either segment, and segment endpoints are
    trivially collinear with their own segment. *)
Definition endpoint_of (c : PointId) (s : SegmentName) : bool :=
  ascii_eqb c s.(segment_first) || ascii_eqb c s.(segment_second).

Definition perp_right_angle (s t : SegmentName) (p : PointId) (a : AngleName) : bool :=
  ascii_eqb a.(angle_vertex) p &&
  ((endpoint_of a.(angle_first) s && endpoint_of a.(angle_last) t) ||
   (endpoint_of a.(angle_first) t && endpoint_of a.(angle_last) s)).

Definition perp_con_ang (decls : Declarations) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (Perp s t p) =>
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
  | Some (Midpt s p) =>
      fact_eqb (ConSeg (segment_name s.(segment_first) p) (segment_name p s.(segment_second))) conclusion
  | _ => false
  end.

(** Vertical angles.  Two segments crossing at [p] give two pairs of opposite
    angles at [p]; both members of the concluded pair must be declared
    nondegenerate.  The crossing itself declares them, since [check_problem]
    reads an [intersect_seg]'s half-segments as declared segments
    ([kernel_declarations]).  This reason takes no step dependency, so the
    crossing is looked up among the diagram premises. *)
Definition vertical_angle_pair (decls : Declarations) (s t : SegmentName)
    (p : PointId) (conclusion : Statement) : bool :=
  let opposite first second :=
    declared_angle decls first && declared_angle decls second &&
    fact_eqb (ConAng first second) conclusion in
  opposite (angle_name s.(segment_first) p t.(segment_first))
           (angle_name s.(segment_second) p t.(segment_second)) ||
  opposite (angle_name s.(segment_first) p t.(segment_second))
           (angle_name s.(segment_second) p t.(segment_first)).

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
  | Some (AngBisect a s) =>
      let halves far :=
        ConAng (angle_name a.(angle_first) a.(angle_vertex) far)
               (angle_name far a.(angle_vertex) a.(angle_last)) in
      (ascii_eqb s.(segment_first) a.(angle_vertex) &&
        fact_eqb (halves s.(segment_second)) conclusion) ||
      (ascii_eqb s.(segment_second) a.(angle_vertex) &&
        fact_eqb (halves s.(segment_first)) conclusion)
  | _ => false
  end.

(** Conservative converse of the angle-bisector definition.  The conclusion
    fixes both the outer angle and the named ray; the dependency must be
    exactly the two halves induced by that ray, modulo the unoriented angle
    symmetries accepted by [fact_eqb]. *)
Definition ang_bisect_conv (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | AngBisect a s, Some dependency =>
      let halves far :=
        ConAng (angle_name a.(angle_first) a.(angle_vertex) far)
               (angle_name far a.(angle_vertex) a.(angle_last)) in
      (ascii_eqb s.(segment_first) a.(angle_vertex) &&
        fact_eqb (halves s.(segment_second)) dependency) ||
      (ascii_eqb s.(segment_second) a.(angle_vertex) &&
        fact_eqb (halves s.(segment_first)) dependency)
  | _, _ => false
  end.

(** [def_perp] wants an [on_line] premise placing this point on this segment,
    and wants all of what [on_line] says: [perp_core_col] needs the segment
    nondegenerate as well as the point on it. *)
Definition on_line_premise (s : SegmentName) (p : PointId) (pr : Premise) : bool :=
  match on_line_witness pr.(premise_statement) with
  | Some (t, q) => segment_u_eqb s t && ascii_eqb p q
  | None => false
  end.

Definition on_line_premise_used (premises : list Premise) (s : SegmentName)
    (p : PointId) : option Statement :=
  premise_witness (on_line_premise s p) premises.

(** [midpt_conv] wants strictly less: only that the diagram puts [p] between
    the endpoints of [s].  [on_line] says that and more, but [intersect_seg]
    says it too, of each of the two segments it crosses — a crossing point lies
    between the endpoints of both.  Reading the crossing here is what lets a
    figure declared by its intersection serve a midpoint converse without also
    having to spell out an [on_line] for the same pair.  [Midpoint] is by
    definition the betweenness together with the congruence the dependency
    supplies, so this reads nothing else out of the premise. *)
Definition on_segment_statement (s : SegmentName) (p : PointId) (st : Statement)
    : bool :=
  match st with
  | OnLine t q => segment_u_eqb s t && ascii_eqb p q
  | IntersectSeg t u q =>
      (segment_u_eqb s t || segment_u_eqb s u) && ascii_eqb p q
  | _ => false
  end.

Definition on_segment_premise (s : SegmentName) (p : PointId) (pr : Premise) : bool :=
  on_segment_statement s p pr.(premise_statement).

Definition on_segment_premise_used (premises : list Premise) (s : SegmentName)
    (p : PointId) : option Statement :=
  premise_witness (on_segment_premise s p) premises.

(** Converse of the midpoint definition.  Congruent halves alone do not place
    the point between the endpoints, so this rule additionally requires a
    diagram premise that does. *)
Definition midpt_conv (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | Midpt s p =>
      match lookup_step facts i with
      | Some dependency =>
          fact_eqb (ConSeg (segment_name s.(segment_first) p) (segment_name p s.(segment_second)))
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
    (i j : nat) (t u : TriangleName) (conclusion : Statement) : bool :=
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
    (i j : nat) (t u : TriangleName) : bool :=
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
  | ConSeg x y, Some (Perp _ s2 p), Some (Midpt s q) =>
      ascii_eqb p q && segment_u_eqb s2 s &&
      segment_pair_eqb x y (segment_name s.(segment_first) q) (segment_name q s.(segment_second))
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
    (i1 i2 i3 i4 i5 i6 : nat) (t u : TriangleName) : bool :=
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
  let at_some := fun t u =>
    existsb (fun c => def_con_tri_at decls premises facts i1 i2 i3 i4 i5 i6
                        (fst c) (snd c))
            (correspondences t u) in
  match conclusion with
  | ConTriOrdered t u => declared_pair decls t u && at_some t u
  | ConTri t u => declared_pair decls t u && existsb (at_some t) (triangle_orderings u)
  | _ => false
  end.

(** Triangle shape statements.  Each names one declared triangle, which is
    where its nondegeneracy comes from. *)
Definition isosceles_pairs (t : TriangleName) : list Statement :=
  [ ConSeg (side_ab t) (side_bc t)
  ; ConSeg (side_bc t) (side_ca t)
  ; ConSeg (side_ca t) (side_ab t) ].

Definition def_isosceles (decls : Declarations) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | Isosceles t =>
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
Definition base_angle_sides (t : TriangleName) : Statement :=
  ConSeg (segment_name t.(triangle_first) t.(triangle_second)) (segment_name t.(triangle_first) t.(triangle_third)).
Definition base_angle_angles (t : TriangleName) : Statement :=
  ConAng (angle_name t.(triangle_first) t.(triangle_second) t.(triangle_third))
         (angle_name t.(triangle_first) t.(triangle_third) t.(triangle_second)).

Definition apex_readings (t : TriangleName) : list TriangleName :=
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
  | Equilateral t =>
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
  | Equiangular t =>
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
  | Equiangular t, Some (Equilateral u) => triangle_eqb t u
  | _, _ => false
  end.

Definition equiang_equilat (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Equilateral t, Some (Equiangular u) => triangle_eqb t u
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

(** The converse needs the figure as well as the measures: [supplementary]
    holds of two angles anywhere in the plane, while a linear pair also shares
    a ray and has its other two rays opposite.  The shared ray is the letter
    the two angles have in common; an [on_line] premise placing their common
    vertex on the segment between the two other letters makes those rays
    opposite.  The supplementary dependency is what makes every ray
    nondegenerate. *)
Definition linear_pair_figure (a b : AngleName) (s : SegmentName) (p : PointId)
    : bool :=
  let shares x y u v :=
    ascii_eqb x y && segment_u_eqb s (segment_name u v) in
  ascii_eqb a.(angle_vertex) p && ascii_eqb b.(angle_vertex) p &&
  (shares a.(angle_first) b.(angle_first) a.(angle_last) b.(angle_last) ||
   shares a.(angle_first) b.(angle_last) a.(angle_last) b.(angle_first) ||
   shares a.(angle_last) b.(angle_first) a.(angle_first) b.(angle_last) ||
   shares a.(angle_last) b.(angle_last) a.(angle_first) b.(angle_first)).

Definition linear_pair_conv_premise (a b : AngleName) (pr : Premise) : bool :=
  match on_line_witness pr.(premise_statement) with
  | Some (s, p) => linear_pair_figure a b s p
  | None => false
  end.

Definition linear_pair_conv (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | LinearPair a b, Some dependency =>
      fact_eqb (Supplementary a b) dependency &&
      premise_found (linear_pair_conv_premise a b) premises
  | _, _ => false
  end.

Definition linear_pair_conv_used (premises : list Premise)
    (conclusion : Statement) : option Statement :=
  match conclusion with
  | LinearPair a b => premise_witness (linear_pair_conv_premise a b) premises
  | _ => None
  end.

(** A right angle at [p] whose rays reach the two lines makes them
    perpendicular at [p].  [Perp_at] additionally demands that the whole of
    each line meet at right angles, so the [on_line] premise is what lets the
    right angle be transported from the ray to the line that contains it. *)
Definition other_endpoint (c : PointId) (s : SegmentName) : PointId :=
  if ascii_eqb c s.(segment_first) then s.(segment_second) else s.(segment_first).

Definition def_perp_shape (u s : SegmentName) (p x y : PointId) : bool :=
  endpoint_of p u && endpoint_of x s && endpoint_of y u.

Definition def_perp (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | Perp u s p =>
      match lookup_step facts i with
      | Some (Right a) =>
          ascii_eqb a.(angle_vertex) p &&
          (def_perp_shape u s p a.(angle_first) a.(angle_last) ||
           def_perp_shape u s p a.(angle_last) a.(angle_first)) &&
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
    (q : QuadrilateralName) : bool :=
  existsb (same_quadrilateral q) decls.(decl_quadrilaterals).

Definition quad_side_ab (q : QuadrilateralName) : SegmentName :=
  segment_name q.(quadrilateral_first) q.(quadrilateral_second).
Definition quad_side_bc (q : QuadrilateralName) : SegmentName :=
  segment_name q.(quadrilateral_second) q.(quadrilateral_third).
Definition quad_side_cd (q : QuadrilateralName) : SegmentName :=
  segment_name q.(quadrilateral_third) q.(quadrilateral_fourth).
Definition quad_side_da (q : QuadrilateralName) : SegmentName :=
  segment_name q.(quadrilateral_fourth) q.(quadrilateral_first).
Definition quad_corner_a (q : QuadrilateralName) : AngleName :=
  angle_name q.(quadrilateral_fourth) q.(quadrilateral_first) q.(quadrilateral_second).
Definition quad_corner_b (q : QuadrilateralName) : AngleName :=
  angle_name q.(quadrilateral_first) q.(quadrilateral_second) q.(quadrilateral_third).
Definition quad_corner_c (q : QuadrilateralName) : AngleName :=
  angle_name q.(quadrilateral_second) q.(quadrilateral_third) q.(quadrilateral_fourth).
Definition quad_corner_d (q : QuadrilateralName) : AngleName :=
  angle_name q.(quadrilateral_third) q.(quadrilateral_fourth) q.(quadrilateral_first).

Definition quad_diagonal_ac (q : QuadrilateralName) : SegmentName :=
  segment_name q.(quadrilateral_first) q.(quadrilateral_third).
Definition quad_diagonal_bd (q : QuadrilateralName) : SegmentName :=
  segment_name q.(quadrilateral_second) q.(quadrilateral_fourth).

Definition def_parallelogram_rule (decls : Declarations)
    (facts : list Statement) (i j : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Parallelogram q, Some (Para s1 s2), Some (Para s3 s4) =>
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
  | Parallelogram q, Some (Rectangle r) => same_quadrilateral q r
  | _, _ => false
  end.

Definition rhombus_pgram_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Parallelogram q, Some (Rhombus r) => same_quadrilateral q r
  | _, _ => false
  end.

Definition pgram_opp_sides_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConSeg s1 s2, Some (Parallelogram q) =>
      segment_pair_eqb s1 s2 (quad_side_ab q) (quad_side_cd q) ||
      segment_pair_eqb s1 s2 (quad_side_bc q) (quad_side_da q)
  | _, _ => false
  end.

Definition pgram_opp_angles_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConAng a b, Some (Parallelogram q) =>
      angle_pair_eqb a b (quad_corner_a q) (quad_corner_c q) ||
      angle_pair_eqb a b (quad_corner_b q) (quad_corner_d q)
  | _, _ => false
  end.

Definition rhombus_consec_sides_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Rhombus q, Some (Parallelogram r), Some (ConSeg s1 s2) =>
      same_quadrilateral q r &&
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
  | Some (Parallelogram q) =>
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
  | Parallelogram q, Some (ConSeg a b), Some (ConSeg c d) =>
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
  | Some (KitePremise _ a b) => fact_eqb (ConAng a b) conclusion
  | _ => false
  end.

(** Two corners supplementary to a third make a parallelogram: each
    supplementary pair shares a side, and that side is the transversal of the
    two the pair forces parallel.  The shared corner may sit on either side of
    either dependency, as [SuppA] is symmetric. *)
Definition consec_pair_eqb (a b : AngleName) (first second : AngleName) : bool :=
  fact_eqb (Supplementary first second) (Supplementary a b).

Definition pgram_consec_angs_conv_rule (decls : Declarations)
    (facts : list Statement) (i j : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Parallelogram q, Some (Supplementary a b), Some (Supplementary c d) =>
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
  | Rectangle q, Some (Right a), Some (Parallelogram r) =>
      same_quadrilateral q r &&
      (angle_u_eqb a (quad_corner_a q) || angle_u_eqb a (quad_corner_b q) ||
       angle_u_eqb a (quad_corner_c q) || angle_u_eqb a (quad_corner_d q))
  | _, _, _ => false
  end.

(** The audited rhombus meaning carries a congruence chain around all four
    sides.  Expose every unordered pair, not merely adjacent pairs. *)
Definition rhombus_def_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (Rhombus q) =>
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
    (s : SegmentName) (vertex opposite : PointId) : bool :=
  segment_u_eqb s (segment_name vertex opposite) ||
  (declared_segment decls s &&
   ((ascii_eqb s.(segment_first) vertex &&
       ray_linked premises vertex opposite s.(segment_second)) ||
    (ascii_eqb s.(segment_second) vertex &&
       ray_linked premises vertex opposite s.(segment_first)))).

(** The premise that placed the far end of the ray on the diagonal, when the
    ray was not spelled as the diagonal itself. *)
Definition bisector_ray_used (decls : Declarations) (premises : list Premise)
    (s : SegmentName) (vertex opposite : PointId) : option Statement :=
  if segment_u_eqb s (segment_name vertex opposite) then None
  else if negb (declared_segment decls s) then None
  else if ascii_eqb s.(segment_first) vertex then
    ray_link_witness premises vertex opposite s.(segment_second)
  else if ascii_eqb s.(segment_second) vertex then
    ray_link_witness premises vertex opposite s.(segment_first)
  else None.

Definition rhombus_opp_bisect_rule (decls : Declarations)
    (premises : list Premise) (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | AngBisect a s, Some (Rhombus q) =>
      (angle_u_eqb a (quad_corner_a q) &&
         bisector_ray decls premises s q.(quadrilateral_first) q.(quadrilateral_third)) ||
      (angle_u_eqb a (quad_corner_c q) &&
         bisector_ray decls premises s q.(quadrilateral_third) q.(quadrilateral_first)) ||
      (angle_u_eqb a (quad_corner_b q) &&
         bisector_ray decls premises s q.(quadrilateral_second) q.(quadrilateral_fourth)) ||
      (angle_u_eqb a (quad_corner_d q) &&
         bisector_ray decls premises s q.(quadrilateral_fourth) q.(quadrilateral_second))
  | _, _ => false
  end.

(** The two diagonals of a rectangle are congruent -- the diagonals, and
    nothing else: a pair of opposite sides is congruent too, but that is
    [pgram_opp_sides]. *)
Definition rect_diag_con_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (Rectangle q) =>
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
    | Midpt s m => ascii_eqb q m && segment_u_eqb s (segment_name v p)
    | _ => false
    end) facts.

Definition rectangle_angle_matches (facts : list Statement)
    (expected actual : AngleName) : bool :=
  ascii_eqb expected.(angle_vertex) actual.(angle_vertex) &&
  ((midpoint_ray_linked facts expected.(angle_vertex)
      expected.(angle_first) actual.(angle_first) &&
    midpoint_ray_linked facts expected.(angle_vertex)
      expected.(angle_last) actual.(angle_last)) ||
   (midpoint_ray_linked facts expected.(angle_vertex)
      expected.(angle_first) actual.(angle_last) &&
    midpoint_ray_linked facts expected.(angle_vertex)
      expected.(angle_last) actual.(angle_first))).

Definition rectangle_corner_matches (facts : list Statement)
    (q : QuadrilateralName) (a : AngleName) : bool :=
  rectangle_angle_matches facts (quad_corner_a q) a ||
  rectangle_angle_matches facts (quad_corner_b q) a ||
  rectangle_angle_matches facts (quad_corner_c q) a ||
  rectangle_angle_matches facts (quad_corner_d q) a.

(** A rectangle has four right, mutually congruent corners and congruent
    opposite sides.  Corner rays may be named by proved midpoints on a side. *)
Definition rectangle_def_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, conclusion with
  | Some (Rectangle q), ConRight a b | Some (Rectangle q), ConAng a b =>
      rectangle_corner_matches facts q a && rectangle_corner_matches facts q b
  | Some (Rectangle q), ConSeg a b =>
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
  | Parallelogram q, Some (ConSeg c1 c2), Some (Para p1 p2) =>
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
  | Parallelogram q, Some (ConAng a1 b1), Some (ConAng a2 b2) =>
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
  | Rectangle q, Some (ConSeg s1 s2), Some (Parallelogram r) =>
      same_quadrilateral q r &&
      segment_pair_eqb s1 s2 (quad_diagonal_ac q) (quad_diagonal_bd q)
  | _, _, _ => false
  end.

(** Perpendicular diagonals in a parallelogram make it a rhombus.  Only the
    two lines matter, so where the perpendicularity premise puts their meeting
    point is left alone: [Perp_at] already places it on both. *)
(** A pair of segments that are the two diagonals of [q], in either order
    and either direction. *)
Definition names_diagonals (q : QuadrilateralName) (s t : SegmentName) : bool :=
  (segment_u_eqb s (quad_diagonal_ac q) && segment_u_eqb t (quad_diagonal_bd q)) ||
  (segment_u_eqb s (quad_diagonal_bd q) && segment_u_eqb t (quad_diagonal_ac q)).

(** The forward diagonal theorems conclude about the point where the
    diagonals cross.  The audited quadrilateral has such a point but does not
    name it, so an [intersect_seg] premise of the two diagonals has to place
    the point the conclusion names. *)
Definition diagonals_cross_statement (q : QuadrilateralName) (p : PointId)
    (st : Statement) : bool :=
  match st with
  | IntersectSeg s t r => ascii_eqb r p && names_diagonals q s t
  | _ => false
  end.

Definition diagonals_cross_premise (q : QuadrilateralName) (p : PointId)
    (pr : Premise) : bool :=
  diagonals_cross_statement q p pr.(premise_statement).

(** The quadrilateral a forward diagonal rule reads off its dependency, and
    the segments and point its conclusion names. *)
Definition diagonal_rule_parts (r : Reason) (facts : list Statement)
    (conclusion : Statement)
    : option (QuadrilateralName * SegmentName * SegmentName * PointId) :=
  match r, conclusion with
  | PgramDiagBisect i, SegBisect s t p =>
      match lookup_step facts i with
      | Some (Parallelogram q) => Some (q, s, t, p)
      | _ => None
      end
  | RhombusDiagPerp i, Perp s t p =>
      match lookup_step facts i with
      | Some (Rhombus q) => Some (q, s, t, p)
      | _ => None
      end
  | KiteDiagPerp i, Perp s t p =>
      match lookup_step facts i with
      | Some (KitePremise q _ _) => Some (q, s, t, p)
      | _ => None
      end
  | _, _ => None
  end.

(** The diagonals of a parallelogram bisect each other, and those of a rhombus
    or a kite are perpendicular, at the point an [intersect_seg] premise puts
    on both. *)
Definition diagonal_rule (premises : list Premise) (facts : list Statement)
    (r : Reason) (conclusion : Statement) : bool :=
  match diagonal_rule_parts r facts conclusion with
  | Some (q, s, t, p) =>
      names_diagonals q s t && premise_found (diagonals_cross_premise q p) premises
  | None => false
  end.

Definition diagonal_rule_used (premises : list Premise) (facts : list Statement)
    (r : Reason) (conclusion : Statement) : option Statement :=
  match diagonal_rule_parts r facts conclusion with
  | Some (q, s, t, p) =>
      if names_diagonals q s t
      then premise_witness (diagonals_cross_premise q p) premises
      else None
  | None => None
  end.

Definition rhombus_diag_perp_conv_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Rhombus q, Some (Perp s1 s2 _), Some (Parallelogram r) =>
      same_quadrilateral q r &&
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
  | Parallelogram q, Some (SegBisect b1 t1 p), Some (SegBisect b2 t2 p') =>
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
Definition quad_rotations (q : QuadrilateralName) : list QuadrilateralName :=
  [q; rotate_quad q; rotate_quad (rotate_quad q);
   rotate_quad (rotate_quad (rotate_quad q))].

Definition bisector_at_corner (a : AngleName) (s : SegmentName)
    (r : QuadrilateralName) : bool :=
  angle_u_eqb a (quad_corner_a r) && segment_u_eqb s (quad_diagonal_ac r).

Definition rhombus_opp_bisect_conv_rule (facts : list Statement) (i j k : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j,
        lookup_step facts k with
  | Rhombus q, Some (AngBisect a1 s1), Some (AngBisect a2 s2), Some (Parallelogram r) =>
      same_quadrilateral q r &&
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
  | IsosTrapezoid q, Some (ConSeg s1 s2), Some (TrapezoidPremise r _ _) =>
      same_quadrilateral q r &&
      segment_pair_eqb s1 s2 (quad_diagonal_ac q) (quad_diagonal_bd q)
  | _, _, _ => false
  end.

(** Congruent base angles make a trapezoid isosceles -- congruent diagonals
    being what the audited [isos_trapezoid] means. *)
Definition isos_trap_base_angs_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | IsosTrapezoid q, Some (ConAng a b), Some (TrapezoidPremise r s1 s2) =>
      same_quadrilateral q r &&
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
  | ConAng a b, Some (IsosTrapezoidPremise q s1 s2) =>
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
  | Transversal a b t1 i1 c d t2 i2 => Some (a, b, t1, i1, c, d, t2, i2)
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

(** A transversal figure may leave a part undrawn by repeating a letter:
    a flanking point spelled as its crossing, or an exterior point spelled as
    either crossing.  The audited configuration keeps distinct letters
    distinct, so a part is drawn exactly when its letter is named apart. *)
Definition named_apart (p q : PointId) : bool := negb (ascii_eqb p q).

Definition exterior_drawn (t i j : PointId) : bool :=
  named_apart t i && named_apart t j.

(** A segment names a transversal's line when it matches, up to reversal,
    the flanking pair or a drawn flank joined to the crossing point, which
    the audited configuration places on the same line.  The crossing-point
    spellings are what let a corner figure — a line whose natural segment
    name *ends* at its crossing — cite that line. *)
Definition line_name_matches (s : SegmentName) (a b i1 : PointId) : bool :=
  segment_u_eqb s (segment_name a b) ||
  (named_apart a i1 && segment_u_eqb s (segment_name a i1)) ||
  (named_apart b i1 && segment_u_eqb s (segment_name i1 b)).

Definition transversal_lines_match (s1 s2 : SegmentName)
    (a b i1 c d i2 : PointId) : bool :=
  (line_name_matches s1 a b i1 && line_name_matches s2 c d i2) ||
  (line_name_matches s2 a b i1 && line_name_matches s1 c d i2).

(** A historical proof may name a transversal ray by an interior point
    supplied by [on_line], [midpt], or [intersect_seg].  This matcher is used
    when the transversal configuration itself supplies nondegeneracy. *)
Definition angle_ray_spelling (premises : list Premise)
    (expected actual : AngleName) : bool :=
  ascii_eqb expected.(angle_vertex) actual.(angle_vertex) &&
  ((ray_linked premises expected.(angle_vertex)
      expected.(angle_first) actual.(angle_first) &&
    ray_linked premises expected.(angle_vertex)
      expected.(angle_last) actual.(angle_last)) ||
   (ray_linked premises expected.(angle_vertex)
      expected.(angle_first) actual.(angle_last) &&
    ray_linked premises expected.(angle_vertex)
      expected.(angle_last) actual.(angle_first))).

Definition conga_ray_pair (premises : list Premise)
    (expected1 expected2 actual1 actual2 : AngleName) : bool :=
  (angle_ray_spelling premises expected1 actual1 &&
   angle_ray_spelling premises expected2 actual2) ||
  (angle_ray_spelling premises expected1 actual2 &&
   angle_ray_spelling premises expected2 actual1).

(** Each named angle pair is available only when the figure draws every
    point it uses. *)
Definition altint_pair (a b i1 c d i2 : PointId) (x y : AngleName) : bool :=
  (named_apart a i1 && named_apart d i2 &&
   angle_pair_eqb x y (angle_name a i1 i2) (angle_name d i2 i1)) ||
  (named_apart b i1 && named_apart c i2 &&
   angle_pair_eqb x y (angle_name b i1 i2) (angle_name c i2 i1)).
Definition altext_pair (a b t1 i1 c d t2 i2 : PointId) (x y : AngleName) : bool :=
  (exterior_drawn t1 i1 i2 && exterior_drawn t2 i2 i1 &&
   named_apart a i1 && named_apart d i2 &&
   angle_pair_eqb x y (angle_name t1 i1 a) (angle_name t2 i2 d)) ||
  (exterior_drawn t1 i1 i2 && exterior_drawn t2 i2 i1 &&
   named_apart b i1 && named_apart c i2 &&
   angle_pair_eqb x y (angle_name t1 i1 b) (angle_name t2 i2 c)).
Definition corresp_pair (a b t1 i1 c d t2 i2 : PointId) (x y : AngleName) : bool :=
  (exterior_drawn t2 i2 i1 && named_apart b i1 && named_apart d i2 &&
   angle_pair_eqb x y (angle_name i2 i1 b) (angle_name t2 i2 d)) ||
  (exterior_drawn t2 i2 i1 && named_apart a i1 && named_apart c i2 &&
   angle_pair_eqb x y (angle_name i2 i1 a) (angle_name t2 i2 c)) ||
  (exterior_drawn t1 i1 i2 && named_apart a i1 && named_apart c i2 &&
   angle_pair_eqb x y (angle_name t1 i1 a) (angle_name i1 i2 c)) ||
  (exterior_drawn t1 i1 i2 && named_apart b i1 && named_apart d i2 &&
   angle_pair_eqb x y (angle_name t1 i1 b) (angle_name i1 i2 d)).
Definition sameside_pair (a b i1 c d i2 : PointId) (x y : AngleName) : bool :=
  (named_apart b i1 && named_apart d i2 &&
   angle_pair_eqb x y (angle_name b i1 i2) (angle_name i1 i2 d)) ||
  (named_apart a i1 && named_apart c i2 &&
   angle_pair_eqb x y (angle_name a i1 i2) (angle_name i1 i2 c)).

Definition altint_check (s1 s2 : SegmentName) (x y : AngleName)
    (a b t1 i1 c d t2 i2 : PointId) : bool :=
  transversal_lines_match s1 s2 a b i1 c d i2 && altint_pair a b i1 c d i2 x y.

Definition altint_rule (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConAng x y, Some (Para s1 s2) =>
      transversal_premise_check (altint_check s1 s2 x y) premises
  | _, _ => false
  end.

Definition altext_check (s1 s2 : SegmentName) (x y : AngleName)
    (a b t1 i1 c d t2 i2 : PointId) : bool :=
  transversal_lines_match s1 s2 a b i1 c d i2 && altext_pair a b t1 i1 c d t2 i2 x y.

Definition altext_rule (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConAng x y, Some (Para s1 s2) =>
      transversal_premise_check (altext_check s1 s2 x y) premises
  | _, _ => false
  end.

Definition corresp_ang_check (s1 s2 : SegmentName) (x y : AngleName)
    (a b t1 i1 c d t2 i2 : PointId) : bool :=
  transversal_lines_match s1 s2 a b i1 c d i2 && corresp_pair a b t1 i1 c d t2 i2 x y.

Definition corresp_ang_rule (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConAng x y, Some (Para s1 s2) =>
      transversal_premise_check (corresp_ang_check s1 s2 x y) premises
  | _, _ => false
  end.

Definition sameside_ang_check (s1 s2 : SegmentName) (x y : AngleName)
    (a b t1 i1 c d t2 i2 : PointId) : bool :=
  transversal_lines_match s1 s2 a b i1 c d i2 && sameside_pair a b i1 c d i2 x y.

Definition sameside_ang_rule (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Supplementary x y, Some (Para s1 s2) =>
      transversal_premise_check (sameside_ang_check s1 s2 x y) premises
  | _, _ => false
  end.

Definition altint_conv_check (premises : list Premise) (s1 s2 : SegmentName)
    (x y : AngleName) (a b t1 i1 c d t2 i2 : PointId) : bool :=
  transversal_lines_match s1 s2 a b i1 c d i2 &&
  (altint_pair a b i1 c d i2 x y ||
   (named_apart a i1 && named_apart d i2 &&
    conga_ray_pair premises (angle_name a i1 i2) (angle_name d i2 i1) x y) ||
   (named_apart b i1 && named_apart c i2 &&
    conga_ray_pair premises (angle_name b i1 i2) (angle_name c i2 i1) x y)).

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
Definition inscribed_witness (s : Statement) : option (CircleName * AngleName) :=
  match s with InscribedAngle c a => Some (c, a) | _ => None end.

Definition def_radius_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConSeg s1 s2, Some (Radius c p) =>
      segment_pair_eqb s1 s2 (segment_name c.(circle_center) p)
                             (segment_name c.(circle_center) c.(circle_radius_point))
  | _, _ => false
  end.

(** The angle sits in a semicircle: its two ray points name the diameter's
    endpoints, and an [inscribed_angle] diagram premise places its vertex on
    the circle. *)
Definition inscribed_angle_premise (c : CircleName) (a : AngleName) (pr : Premise) : bool :=
  match inscribed_witness pr.(premise_statement) with
  | Some (c', a') => circle_eqb c c' && angle_u_eqb a a'
  | None => false
  end.

Definition inscribed_angle_premise_used (premises : list Premise) (c : CircleName)
    (a : AngleName) : option Statement :=
  premise_witness (inscribed_angle_premise c a) premises.

Definition inscribed_semi_rule (premises : list Premise)
    (facts : list Statement) (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Right a, Some (Diameter c s) =>
      segment_u_eqb (segment_name a.(angle_first) a.(angle_last)) s &&
      premise_found (inscribed_angle_premise c a) premises
  | _, _ => false
  end.

Definition con_chords_arcs_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConSeg s1 s2, Some (ConArc x y) =>
      segment_pair_eqb s1 s2 (segment_name x.(arc_first) x.(arc_second))
                             (segment_name y.(arc_first) y.(arc_second))
  | _, _ => false
  end.

(** The radius dependency names the point of tangency, anchoring the radius
    segment's spelling; the tangent fact itself carries the geometry. *)
Definition tangent_perp_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | Perp s1 s2 q, Some (Tangent c s p), Some (Radius c' p') =>
      circle_eqb c c' && ascii_eqb p' p && ascii_eqb q p &&
      ((segment_u_eqb s1 s && segment_u_eqb s2 (segment_name c.(circle_center) p)) ||
       (segment_u_eqb s2 s && segment_u_eqb s1 (segment_name c.(circle_center) p)))
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
  | Tangent c s p, Some (Perp s1 s2 q), Some (Radius c' p') =>
      circle_eqb c c' && ascii_eqb p' p && ascii_eqb q p && endpoint_of p s &&
      ((segment_u_eqb s1 s && segment_u_eqb s2 (segment_name c.(circle_center) p)) ||
       (segment_u_eqb s2 s && segment_u_eqb s1 (segment_name c.(circle_center) p)))
  | _, _, _ => false
  end.

(** Two tangents drawn to one circle from one outside point are congruent.
    Each dependency carries its own right angle to a radius; the shared far
    endpoint is what makes the two right triangles comparable. *)
Definition con_tangents_ext_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | ConSeg x y, Some (Tangent c s p), Some (Tangent c' s' p') =>
      let e := other_endpoint p s in
      circle_eqb c c' &&
      segment_u_eqb s (segment_name p e) && segment_u_eqb s' (segment_name p' e) &&
      segment_pair_eqb x y (segment_name p e) (segment_name p' e)
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
  | SegBisect b t p, Some (Perp s1 s2 q), Some (Radius c _),
    Some (Chord c' ch) =>
      circle_eqb c c' && ascii_eqb q p &&
      segment_u_eqb b (segment_name c.(circle_center) p) &&
      segment_u_eqb s1 (segment_name c.(circle_center) p) &&
      segment_u_eqb t ch && segment_u_eqb s2 ch
  | _, _, _, _ => false
  end.

(** The converse: the perpendicular bisector of a chord passes through the
    centre.  The centre is as far from the chord's two ends as each is from
    it, and in the plane every such point lies on the perpendicular bisector.
    The concluded line is the bisector's, in either direction, and the chord
    the bisector's target. *)
Definition chord_bisect_conv_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i, lookup_step facts j with
  | CenterOnLine c b, Some (PerpBisector b' t _), Some (Chord c' ch) =>
      circle_eqb c c' && segment_u_eqb b b' && segment_u_eqb t ch
  | _, _, _ => false
  end.

(** A statement placing [p] on circle [c], read off its audited meaning:
    every circle statement puts the points it names on the circle, except the
    centre and any point a tangent or a [center_on_line] names off it. *)
Definition places_on_circle (c : CircleName) (p : PointId) (s : Statement) : bool :=
  let on_arc (a : ArcName) :=
    circle_eqb c a.(arc_circle) &&
    (ascii_eqb p a.(arc_first) || ascii_eqb p a.(arc_second)) in
  match s with
  | OnCirclePoint c' q | Radius c' q | Tangent c' _ q =>
      circle_eqb c c' && ascii_eqb p q
  | Chord c' s | Diameter c' s => circle_eqb c c' && endpoint_of p s
  | InscribedAngle c' a | MinorInscribedAngle c' a | MajorInscribedAngle c' a =>
      circle_eqb c c' &&
      (ascii_eqb p a.(angle_first) || ascii_eqb p a.(angle_vertex) ||
       ascii_eqb p a.(angle_last))
  | ArcStatement a => on_arc a
  | ConArc a b => on_arc a || on_arc b
  | _ => false
  end.

Definition on_circle_premise (c : CircleName) (p : PointId) (pr : Premise) : bool :=
  places_on_circle c p pr.(premise_statement).

(** A segment from a line through the centre to a point on the circle is a
    radius.  The point is an end of the segment the dependency puts the
    centre in line with, and some premise places it on the circle: an
    [on_circle] premise, or any circle statement naming it there. *)
Definition def_radius_conv_rule (premises : list Premise) (facts : list Statement)
    (i : nat) (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | Radius c p, Some (CenterOnLine c' s) =>
      circle_eqb c c' && endpoint_of p s &&
      premise_found (on_circle_premise c p) premises
  | _, _ => false
  end.

Definition def_radius_conv_used (premises : list Premise) (conclusion : Statement)
    : option Statement :=
  match conclusion with
  | Radius c p => premise_witness (on_circle_premise c p) premises
  | _ => None
  end.

(** Two inscribed angles on one chord, as two steps state them: congruent
    when both name the same kind of arc, supplementary when one is minor and
    the other major.  The chord is the two angles' outer points, in either
    order, and the conclusion relates the two angles as [fact_eqb] reads
    them, in either order or direction. *)
Definition same_chord (a b : AngleName) : bool :=
  (ascii_eqb a.(angle_first) b.(angle_first) &&
   ascii_eqb a.(angle_last) b.(angle_last)) ||
  (ascii_eqb a.(angle_first) b.(angle_last) &&
   ascii_eqb a.(angle_last) b.(angle_first)).

Definition con_inscribed_angs_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some (MinorInscribedAngle c a), Some (MinorInscribedAngle c' b)
  | Some (MajorInscribedAngle c a), Some (MajorInscribedAngle c' b) =>
      circle_eqb c c' && same_chord a b && fact_eqb conclusion (ConAng a b)
  | _, _ => false
  end.

Definition supplementary_inscribed_angs_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some (MinorInscribedAngle c a), Some (MajorInscribedAngle c' b)
  | Some (MajorInscribedAngle c a), Some (MinorInscribedAngle c' b) =>
      circle_eqb c c' && same_chord a b &&
      fact_eqb conclusion (Supplementary a b)
  | _, _ => false
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
      all (criterion_used sas_schema_used decls premises facts i j k conclusion)
  | SSS i j k =>
      all (criterion_used sss_schema_used decls premises facts i j k conclusion)
  | ASA i j k =>
      all (criterion_used asa_schema_used decls premises facts i j k conclusion)
  | AAS i j k =>
      all (criterion_used aas_schema_used decls premises facts i j k conclusion)
  | RHL i j k =>
      all (criterion_used rhl_schema_used decls premises facts i j k conclusion)
  | InscribedSemi i =>
      match conclusion, dependency i with
      | Right a, Some (Diameter c _) =>
          one (inscribed_angle_premise_used premises c a)
      | _, _ => []
      end
  | RhombusOppBisect i =>
      match conclusion, dependency i with
      | AngBisect a s, Some (Rhombus q) =>
          (* the same four corner readings the rule tries, in the same order *)
          if angle_u_eqb a (quad_corner_a q) then
            one (bisector_ray_used decls premises s q.(quadrilateral_first) q.(quadrilateral_third))
          else if angle_u_eqb a (quad_corner_c q) then
            one (bisector_ray_used decls premises s q.(quadrilateral_third) q.(quadrilateral_first))
          else if angle_u_eqb a (quad_corner_b q) then
            one (bisector_ray_used decls premises s q.(quadrilateral_second) q.(quadrilateral_fourth))
          else if angle_u_eqb a (quad_corner_d q) then
            one (bisector_ray_used decls premises s q.(quadrilateral_fourth) q.(quadrilateral_second))
          else []
      | _, _ => []
      end
  | MidptConv _ =>
      match conclusion with
      | Midpt s p => one (on_segment_premise_used premises s p)
      | _ => []
      end
  | DefPerp _ =>
      match conclusion with
      | Perp _ s p => one (on_line_premise_used premises s p)
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
  | LinearPairConv _ => one (linear_pair_conv_used premises conclusion)
  | PgramDiagBisect _ | RhombusDiagPerp _ | KiteDiagPerp _ =>
      one (diagonal_rule_used premises facts reason conclusion)
  | DefRadiusConv _ => one (def_radius_conv_used premises conclusion)
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
      criterion_conclusion sas_schema decls premises facts i j k conclusion
  | SSS i j k =>
      criterion_conclusion sss_schema decls premises facts i j k conclusion
  | ASA i j k =>
      criterion_conclusion asa_schema decls premises facts i j k conclusion
  | AAS i j k =>
      criterion_conclusion aas_schema decls premises facts i j k conclusion
  | CPCTC i => cpctc_rule decls premises facts i conclusion
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
  | LinearPairConv i => linear_pair_conv premises facts i conclusion
  | PgramDiagBisect _ | RhombusDiagPerp _ | KiteDiagPerp _ =>
      diagonal_rule premises facts r conclusion
  | ChordBisectConv i j => chord_bisect_conv_rule facts i j conclusion
  | DefRadiusConv i => def_radius_conv_rule premises facts i conclusion
  | ConInscribedAngs i j => con_inscribed_angs_rule facts i j conclusion
  | SupplementaryInscribedAngs i j =>
      supplementary_inscribed_angs_rule facts i j conclusion
  | RHL i j k =>
      criterion_conclusion rhl_schema decls premises facts i j k conclusion
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
(** An [intersect_seg] premise is audited as a strict crossing, so the point
    differs from all four endpoints: each crossed segment and each of the four
    half-segments has two different ends, which is exactly what a [seg:] line
    asserts.  The kernel therefore reads them as declared segments, which is
    what lets [vert_ang] and the ray-matching rules use the crossing without a
    separate declaration. *)
Definition crossing_segments (pr : Premise) : list SegmentName :=
  match pr.(premise_statement) with
  | IntersectSeg s t p =>
      [s; t; segment_name s.(segment_first) p; segment_name p s.(segment_second);
       segment_name t.(segment_first) p; segment_name p t.(segment_second)]
  | _ => []
  end.

Definition kernel_declarations (decls : Declarations) (premises : list Premise)
    : Declarations :=
  declarations decls.(decl_triangles) decls.(decl_angles)
    decls.(decl_quadrilaterals) decls.(decl_circles)
    (decls.(decl_segments) ++ flat_map crossing_segments premises).

Definition check_problem (p : Problem) : bool :=
  match check_steps (kernel_declarations p.(problem_declarations) p.(problem_premises))
          p.(problem_premises) [] p.(problem_steps) with
  | Some facts => existsb (fact_eqb p.(problem_goal)) facts
  | None => false
  end.

Section Soundness.

Context `{TnEQD : Tarski_neutral_dimensionless_with_decidable_point_equality}.
Variable point : PointId -> Tpoint.

Notation Interp := (interp_statement point).

(** Statements now come from [Audit.v], whose constructors name their
    arguments; these proofs were written against the type-based names Rocq
    gives unnamed arguments ([s], [s0] for segments, [a], [a0] for angles, and
    so on).  [old_names] restores those names after a destruct. *)
Ltac old_name v :=
  let base_rename tmp :=
    lazymatch type of tmp with
    | SegmentName => let n := fresh "s" in rename tmp into n
    | AngleName => let n := fresh "a" in rename tmp into n
    | TriangleName => let n := fresh "t" in rename tmp into n
    | QuadrilateralName => let n := fresh "q" in rename tmp into n
    | CircleName => let n := fresh "c" in rename tmp into n
    | ArcName => let n := fresh "a" in rename tmp into n
    | PointName => let n := fresh "p" in rename tmp into n
    | _ => idtac
    end in
  tryif is_var v then
    (let tmp := fresh "old_name_tmp" in rename v into tmp; base_rename tmp)
  else idtac.

Ltac old_names_of st :=
  lazymatch st with
  | ?f ?x1 ?x2 ?x3 ?x4 ?x5 ?x6 ?x7 ?x8 =>
      old_name x1; old_name x2; old_name x3; old_name x4;
      old_name x5; old_name x6; old_name x7; old_name x8
  | ?f ?x1 ?x2 ?x3 ?x4 => old_name x1; old_name x2; old_name x3; old_name x4
  | ?f ?x1 ?x2 ?x3 => old_name x1; old_name x2; old_name x3
  | ?f ?x1 ?x2 => old_name x1; old_name x2
  | ?f ?x1 => old_name x1
  | _ => idtac
  end.

Ltac old_names_eq H :=
  lazymatch type of H with
  | _ = Some ?st => old_names_of st
  | _ => idtac
  end.

Ltac old_names_goal :=
  lazymatch goal with
  | |- interp_statement _ ?st => old_names_of st
  | _ => idtac
  end.


Lemma perp_at_realign : forall a b c d p q,
  segment_u_eqb a c = true -> segment_u_eqb b d = true ->
  ascii_eqb p q = true ->
  (Interp (Perp a b p) <-> Interp (Perp c d q)).
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
  (Interp (SegBisect a b p) <-> Interp (SegBisect c d q)).
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

(** * Unordered triangle congruence

    [ConTri t u] says [t] is congruent to some ordering of [u].  Reordering
    either triangle, or swapping them, keeps that true, which is what lets
    [fact_eqb] and transitivity ignore vertex order. *)
Ltac in_orderings := cbn; repeat (first [left; reflexivity | right]).

Lemma orderings_refl : forall t, In t (triangle_orderings t).
Proof. intros [A B C]. cbn. left. reflexivity. Qed.

Lemma orderings_sym : forall t u,
  In u (triangle_orderings t) -> In t (triangle_orderings u).
Proof.
  intros [A B C] u H. cbn in H.
  destruct H as [<-|[<-|[<-|[<-|[<-|[<-|[]]]]]]]; in_orderings.
Qed.

Lemma orderings_trans : forall t u v,
  In u (triangle_orderings t) -> In v (triangle_orderings u) ->
  In v (triangle_orderings t).
Proof.
  intros [A B C] u v Hu Hv. cbn in Hu.
  destruct Hu as [<-|[<-|[<-|[<-|[<-|[<-|[]]]]]]]; cbn in Hv;
    destruct Hv as [<-|[<-|[<-|[<-|[<-|[<-|[]]]]]]]; in_orderings.
Qed.

Lemma triangle_congruence_unfold : forall A B C D E F,
  triangle_congruence point (triangle_name A B C) (triangle_name D E F) =
  TriangleCongruent (point A) (point B) (point C) (point D) (point E) (point F).
Proof. reflexivity. Qed.

(** Reordering one triangle of an ordered congruence reorders the other to
    match. *)
Lemma congruence_reorder : forall t u t2,
  In t2 (triangle_orderings t) -> triangle_congruence point t u ->
  exists u2, In u2 (triangle_orderings u) /\ triangle_congruence point t2 u2.
Proof.
  intros [A B C] [D E F] t2 Hin Hc. cbn in Hin.
  rewrite triangle_congruence_unfold in Hc.
  destruct Hin as [<-|[<-|[<-|[<-|[<-|[<-|[]]]]]]].
  - exists (triangle_name D E F). split; [in_orderings|].
    rewrite triangle_congruence_unfold. exact Hc.
  - exists (triangle_name D F E). split; [in_orderings|].
    rewrite triangle_congruence_unfold.
    apply triangle_congruent_rotate, triangle_congruent_rotate,
      triangle_congruent_reverse. exact Hc.
  - exists (triangle_name E D F). split; [in_orderings|].
    rewrite triangle_congruence_unfold.
    apply triangle_congruent_rotate, triangle_congruent_reverse. exact Hc.
  - exists (triangle_name E F D). split; [in_orderings|].
    rewrite triangle_congruence_unfold.
    apply triangle_congruent_rotate. exact Hc.
  - exists (triangle_name F D E). split; [in_orderings|].
    rewrite triangle_congruence_unfold.
    apply triangle_congruent_rotate, triangle_congruent_rotate. exact Hc.
  - exists (triangle_name F E D). split; [in_orderings|].
    rewrite triangle_congruence_unfold.
    apply triangle_congruent_reverse. exact Hc.
Qed.

(** The audited ordered congruence -- both triangles genuine, three
    corresponding sides -- is the six corresponding parts on two genuine
    triangles: SSS supplies the angles. *)
Lemma ordered_congruence_parts : forall t u,
  Audit.TriangleCongruent point t u ->
  triangle_nondegenerate point t /\ triangle_nondegenerate point u /\
  triangle_congruence point t u.
Proof.
  intros [A B C] [D E F] H.
  unfold Audit.TriangleCongruent, Audit.TriangleWellFormed in H. cbn in H.
  destruct H as [[Hab [Hbc [Hca Hncol]]] [[Hde [Hef [Hfd Hncol']]] [H1 [H2 H3]]]].
  split; [repeat split; assumption|]. split; [repeat split; assumption|].
  rewrite triangle_congruence_unfold. apply ender_sss; assumption.
Qed.

Lemma ordered_congruence_of_parts : forall t u,
  triangle_nondegenerate point t -> triangle_nondegenerate point u ->
  triangle_congruence point t u -> Audit.TriangleCongruent point t u.
Proof.
  intros [A B C] [D E F] Ht Hu Hc.
  unfold triangle_nondegenerate in Ht, Hu. cbn in Ht, Hu.
  rewrite triangle_congruence_unfold in Hc. destruct Hc as [H1 [H2 [H3 _]]].
  unfold Audit.TriangleCongruent, Audit.TriangleWellFormed. cbn.
  split; [exact Ht|]. split; [exact Hu|]. split; [exact H1|split; assumption].
Qed.

Lemma nondegenerate_orderings : forall t t2,
  In t2 (triangle_orderings t) -> triangle_nondegenerate point t ->
  triangle_nondegenerate point t2.
Proof.
  intros [A B C] t2 Hin H. cbn in Hin. unfold triangle_nondegenerate in *.
  cbn in H. destruct H as [Hab [Hbc [Hca Hncol]]].
  destruct Hin as [<-|[<-|[<-|[<-|[<-|[<-|[]]]]]]]; cbn;
    repeat split;
    first [ assumption | now apply not_eq_sym
          | apply not_col_permutation_1; assumption
          | apply not_col_permutation_2; assumption
          | apply not_col_permutation_3; assumption
          | apply not_col_permutation_4; assumption
          | apply not_col_permutation_5; assumption ].
Qed.

Lemma loose_of_ordered : forall t u,
  Interp (ConTriOrdered t u) -> Interp (ConTri t u).
Proof. intros t u H. exists u. split; [apply orderings_refl|exact H]. Qed.

Lemma loose_reorder_left : forall t t2 u,
  In t2 (triangle_orderings t) -> Interp (ConTri t u) -> Interp (ConTri t2 u).
Proof.
  intros t t2 u Hin [u' [Hu' Hc]].
  destruct (ordered_congruence_parts _ _ Hc) as [Ht [Hu Hc6]].
  destruct (congruence_reorder t u' t2 Hin Hc6) as [u2 [Hu2 Hc2]].
  exists u2. split; [eapply orderings_trans; eauto|].
  apply ordered_congruence_of_parts; [|eapply nondegenerate_orderings; eauto|exact Hc2].
  eapply nondegenerate_orderings; eauto.
Qed.

Lemma loose_reorder_right : forall t u u2,
  In u2 (triangle_orderings u) -> Interp (ConTri t u) -> Interp (ConTri t u2).
Proof.
  intros t u u2 Hin [u' [Hu' Hc]]. exists u'. split; [|exact Hc].
  eapply orderings_trans; [apply orderings_sym; exact Hin|exact Hu'].
Qed.

Lemma loose_sym : forall t u, Interp (ConTri t u) -> Interp (ConTri u t).
Proof.
  intros t u [u' [Hu' Hc]].
  destruct (ordered_congruence_parts _ _ Hc) as [Ht [Hu Hc6]].
  assert (Hc' : triangle_congruence point u' t).
  { destruct t as [A B C], u' as [D E F].
    rewrite triangle_congruence_unfold in *. now apply triangle_congruent_sym. }
  destruct (congruence_reorder u' t u (orderings_sym _ _ Hu') Hc')
    as [t2 [Ht2 Hc2]].
  exists t2. split; [exact Ht2|].
  apply ordered_congruence_of_parts; [|eapply nondegenerate_orderings; eauto|exact Hc2].
  eapply nondegenerate_orderings; [apply orderings_sym; exact Hu'|exact Hu].
Qed.

Lemma loose_trans : forall x y z,
  Interp (ConTri x y) -> Interp (ConTri y z) -> Interp (ConTri x z).
Proof.
  intros x y z [y' [Hy' Hxy]] [z' [Hz' Hyz]].
  destruct (ordered_congruence_parts _ _ Hxy) as [Hx [Hy'n Hxy6]].
  destruct (ordered_congruence_parts _ _ Hyz) as [Hy [Hz'n Hyz6]].
  destruct (congruence_reorder y z' y' Hy' Hyz6) as [z2 [Hz2 Hyz2]].
  exists z2. split; [eapply orderings_trans; eauto|].
  apply ordered_congruence_of_parts;
    [exact Hx|eapply nondegenerate_orderings; eauto|].
  destruct x as [A B C], y' as [D E F], z2 as [G H I].
  rewrite triangle_congruence_unfold in *.
  eapply triangle_congruent_trans; eauto.
Qed.

Lemma loose_same_vertices : forall a b c d,
  fact_eqb (ConTri a b) (ConTri c d) = true ->
  (Interp (ConTri a b) <-> Interp (ConTri c d)).
Proof.
  intros a b c d H. cbn [fact_eqb] in H. unfold same_vertices in H.
  apply orb_true_iff in H.
  destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
    apply triangle_mem_spec in H1; apply triangle_mem_spec in H2;
    split; intro Hx.
  - apply (loose_reorder_right c b d (orderings_sym _ _ H2)).
    exact (loose_reorder_left a c b (orderings_sym _ _ H1) Hx).
  - apply (loose_reorder_right a d b H2).
    exact (loose_reorder_left c a d H1 Hx).
  - apply loose_sym.
    apply (loose_reorder_right d b c (orderings_sym _ _ H2)).
    exact (loose_reorder_left a d b (orderings_sym _ _ H1) Hx).
  - apply loose_sym in Hx.
    apply (loose_reorder_right a c b H2).
    exact (loose_reorder_left d a c H1 Hx).
Qed.

(** * Quadrilateral names

    Every quadrilateral meaning reads the same figure from any of its eight
    names, so it survives one rotation and one reversal, and therefore any
    relabeling [same_quadrilateral] accepts. *)
Lemma relabel_closed : forall (P : QuadrilateralName -> Prop),
  (forall q, P q -> P (rotate_quad q)) -> (forall q, P q -> P (reverse_quad q)) ->
  forall q r, same_quadrilateral q r = true -> P r -> P q.
Proof.
  intros P Hrot Hrev q r H Hr. unfold same_quadrilateral in H.
  apply existsb_exists in H. destruct H as [q' [Hin Heq]].
  apply quadrilateral_eqb_eq in Heq. subst q'.
  unfold quad_relabelings in Hin. cbn [In] in Hin.
  destruct Hin as [<-|[<-|[<-|[<-|[<-|[<-|[<-|[<-|[]]]]]]]]]; auto 8.
Qed.

Lemma same_quadrilateral_sym : forall q r,
  same_quadrilateral q r = true -> same_quadrilateral r q = true.
Proof.
  intros q [a b c d] H. unfold same_quadrilateral in H.
  apply existsb_exists in H. destruct H as [q' [Hin Heq]].
  apply quadrilateral_eqb_eq in Heq. subst q'.
  unfold same_quadrilateral. apply existsb_exists.
  exists (quadrilateral_name a b c d). split; [|apply quadrilateral_eqb_eq; reflexivity].
  unfold quad_relabelings in Hin. cbn in Hin.
  destruct Hin as [<-|[<-|[<-|[<-|[<-|[<-|[<-|[<-|[]]]]]]]]];
    cbn; repeat (first [left; reflexivity | right]).
Qed.

Lemma same_quadrilateral_iff : forall (P : QuadrilateralName -> Prop),
  (forall q, P q -> P (rotate_quad q)) -> (forall q, P q -> P (reverse_quad q)) ->
  forall q r, same_quadrilateral q r = true -> (P q <-> P r).
Proof.
  intros P Hrot Hrev q r H. split; intro Hp.
  - exact (relabel_closed P Hrot Hrev r q (same_quadrilateral_sym _ _ H) Hp).
  - exact (relabel_closed P Hrot Hrev q r H Hp).
Qed.

Lemma quad_wf_rotated : forall q,
  Audit.QuadrilateralWellFormed point q ->
  Audit.QuadrilateralWellFormed point (rotate_quad q).
Proof.
  intros [A B C D] Hwf. unfold Audit.QuadrilateralWellFormed in *. cbn in *.
  destruct Hwf as [Hab [Hac [Had [Hbc [Hbd [Hcd [Hncol [X [H1 H2]]]]]]]]].
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol H1 H2) as [Hbcd _].
  refine (conj Hbc (conj Hbd (conj (not_eq_sym Hab) (conj Hcd
    (conj (not_eq_sym Hac) (conj (not_eq_sym Had) (conj Hbcd _))))))).
  exists X. split; [exact H2|exact (ender_bets_sym _ _ _ H1)].
Qed.

Lemma quad_wf_reversed : forall q,
  Audit.QuadrilateralWellFormed point q ->
  Audit.QuadrilateralWellFormed point (reverse_quad q).
Proof.
  intros [A B C D] Hwf. unfold Audit.QuadrilateralWellFormed in *. cbn in *.
  destruct Hwf as [Hab [Hac [Had [Hbc [Hbd [Hcd [Hncol [X [H1 H2]]]]]]]]].
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol H1 H2) as [Hbcd _].
  refine (conj (not_eq_sym Hcd) (conj (not_eq_sym Hbd) (conj (not_eq_sym Had)
    (conj (not_eq_sym Hbc) (conj (not_eq_sym Hac) (conj (not_eq_sym Hab)
    (conj (not_col_permutation_3 _ _ _ Hbcd) _))))))).
  exists X. split; [exact (ender_bets_sym _ _ _ H2)|exact (ender_bets_sym _ _ _ H1)].
Qed.

Ltac quad_sides :=
  unfold Audit.Parallel, Audit.SegmentCongruent, Audit.RightAngle,
    Audit.quad_ab, Audit.quad_bc, Audit.quad_cd, Audit.quad_da,
    Audit.quad_angle_a, Audit.quad_angle_b, Audit.quad_angle_c,
    Audit.quad_angle_d, Audit.seg_start, Audit.seg_end, Audit.ang_start,
    Audit.ang_vertex, Audit.ang_end in *; cbn in *.

Lemma pgram_rotated : forall q, Interp (Parallelogram q) -> Interp (Parallelogram (rotate_quad q)).
Proof.
  intros q [Hwf [H1 H2]]. split; [exact (quad_wf_rotated q Hwf)|].
  destruct q as [A B C D]. quad_sides.
  split; [exact H2|now apply par_symmetry].
Qed.

Lemma pgram_reversed : forall q, Interp (Parallelogram q) -> Interp (Parallelogram (reverse_quad q)).
Proof.
  intros q [Hwf [H1 H2]]. split; [exact (quad_wf_reversed q Hwf)|].
  destruct q as [A B C D]. quad_sides.
  split; [now apply par_comm, par_symmetry|now apply par_comm].
Qed.

Lemma rect_rotated : forall q, Interp (Rectangle q) -> Interp (Rectangle (rotate_quad q)).
Proof.
  intros q [Hp [Ha [Hb [Hc Hd]]]]. split; [exact (pgram_rotated q Hp)|].
  destruct q as [A B C D]. quad_sides. tauto.
Qed.

Lemma rect_reversed : forall q, Interp (Rectangle q) -> Interp (Rectangle (reverse_quad q)).
Proof.
  intros q [Hp [Ha [Hb [Hc Hd]]]]. split; [exact (pgram_reversed q Hp)|].
  destruct q as [A B C D]. quad_sides.
  repeat split; apply l8_2; assumption.
Qed.

Lemma rhomb_rotated : forall q, Interp (Rhombus q) -> Interp (Rhombus (rotate_quad q)).
Proof.
  intros q [Hp [H1 [H2 H3]]]. split; [exact (pgram_rotated q Hp)|].
  destruct q as [A B C D]. quad_sides.
  assert (H4 : Cong (point A) (point B) (point D) (point A)).
  { apply cong_transitivity with (point C) (point D); [|exact H3].
    apply cong_transitivity with (point B) (point C); assumption. }
  repeat split; [exact H2|exact H3|Cong].
Qed.

Lemma rhomb_reversed : forall q, Interp (Rhombus q) -> Interp (Rhombus (reverse_quad q)).
Proof.
  intros q [Hp [H1 [H2 H3]]]. split; [exact (pgram_reversed q Hp)|].
  destruct q as [A B C D]. quad_sides.
  assert (H4 : Cong (point A) (point B) (point D) (point A)).
  { apply cong_transitivity with (point C) (point D); [|exact H3].
    apply cong_transitivity with (point B) (point C); assumption. }
  repeat split; Cong.
Qed.

Lemma trapezoid_rotated : forall q,
  Audit.IsTrapezoid point q ->
  Audit.IsTrapezoid point (rotate_quad q).
Proof.
  intros q [Hwf Hpar]. split; [exact (quad_wf_rotated q Hwf)|].
  destruct q as [A B C D]. quad_sides.
  destruct Hpar as [H|H]; [right; now apply par_symmetry|left; exact H].
Qed.

Lemma trapezoid_reversed : forall q,
  Audit.IsTrapezoid point q ->
  Audit.IsTrapezoid point (reverse_quad q).
Proof.
  intros q [Hwf Hpar]. split; [exact (quad_wf_reversed q Hwf)|].
  destruct q as [A B C D]. quad_sides.
  destruct Hpar as [H|H]; [left; now apply par_comm, par_symmetry
                          |right; now apply par_comm].
Qed.

Lemma isos_trapezoid_rotated : forall q,
  Audit.IsIsoscelesTrapezoid point q ->
  Audit.IsIsoscelesTrapezoid point (rotate_quad q).
Proof.
  intros q [Ht Hd]. split; [exact (trapezoid_rotated q Ht)|].
  destruct q as [A B C D]. quad_sides. Cong.
Qed.

Lemma isos_trapezoid_reversed : forall q,
  Audit.IsIsoscelesTrapezoid point q ->
  Audit.IsIsoscelesTrapezoid point (reverse_quad q).
Proof.
  intros q [Ht Hd]. split; [exact (trapezoid_reversed q Ht)|].
  destruct q as [A B C D]. quad_sides. Cong.
Qed.

Lemma isos_trap_rotated : forall q,
  Interp (IsosTrapezoid q) -> Interp (IsosTrapezoid (rotate_quad q)).
Proof. intros q H. exact (isos_trapezoid_rotated q H). Qed.
Lemma isos_trap_reversed : forall q,
  Interp (IsosTrapezoid q) -> Interp (IsosTrapezoid (reverse_quad q)).
Proof. intros q H. exact (isos_trapezoid_reversed q H). Qed.

Lemma trap_premise_rotated : forall a b q,
  Interp (TrapezoidPremise q a b) -> Interp (TrapezoidPremise (rotate_quad q) a b).
Proof. intros a b q [Ht Hp]. exact (conj (trapezoid_rotated q Ht) Hp). Qed.
Lemma trap_premise_reversed : forall a b q,
  Interp (TrapezoidPremise q a b) -> Interp (TrapezoidPremise (reverse_quad q) a b).
Proof. intros a b q [Ht Hp]. exact (conj (trapezoid_reversed q Ht) Hp). Qed.
Lemma isos_trap_premise_rotated : forall a b q,
  Interp (IsosTrapezoidPremise q a b) -> Interp (IsosTrapezoidPremise (rotate_quad q) a b).
Proof. intros a b q [Ht Hp]. exact (conj (isos_trapezoid_rotated q Ht) Hp). Qed.
Lemma isos_trap_premise_reversed : forall a b q,
  Interp (IsosTrapezoidPremise q a b) -> Interp (IsosTrapezoidPremise (reverse_quad q) a b).
Proof. intros a b q [Ht Hp]. exact (conj (isos_trapezoid_reversed q Ht) Hp). Qed.

(** What [fact_eqb] needs: a quadrilateral fact means the same under any of
    its figure's names. *)
Lemma quad_fact_eqb_sound : forall expected actual,
  match expected, actual with
  | Parallelogram _, Parallelogram _ | Rectangle _, Rectangle _ | Rhombus _, Rhombus _
  | IsosTrapezoid _, IsosTrapezoid _ | TrapezoidPremise _ _ _, TrapezoidPremise _ _ _
  | IsosTrapezoidPremise _ _ _, IsosTrapezoidPremise _ _ _ => True
  | _, _ => False
  end ->
  fact_eqb expected actual = true -> (Interp expected <-> Interp actual).
Proof.
  intros expected actual Hkind H.
  destruct expected, actual; try contradiction; cbn [fact_eqb] in H;
    try (apply andb_true_iff in H; destruct H as [H Hb];
         apply andb_true_iff in H; destruct H as [H Ha];
         apply segment_eqb_eq in Ha; apply segment_eqb_eq in Hb; subst);
    first
    [ exact (same_quadrilateral_iff (fun q => Interp (Parallelogram q))
               pgram_rotated pgram_reversed _ _ H)
    | exact (same_quadrilateral_iff (fun q => Interp (Rectangle q))
               rect_rotated rect_reversed _ _ H)
    | exact (same_quadrilateral_iff (fun q => Interp (Rhombus q))
               rhomb_rotated rhomb_reversed _ _ H)
    | exact (same_quadrilateral_iff (fun q => Interp (IsosTrapezoid q))
               isos_trap_rotated isos_trap_reversed _ _ H)
    | exact (same_quadrilateral_iff (fun q => Interp (TrapezoidPremise q _ _))
               (trap_premise_rotated _ _) (trap_premise_reversed _ _) _ _ H)
    | exact (same_quadrilateral_iff (fun q => Interp (IsosTrapezoidPremise q _ _))
               (isos_trap_premise_rotated _ _) (isos_trap_premise_reversed _ _)
               _ _ H) ].
Qed.

(** * Segment and angle congruences, and the [ref_*] forms *)
Lemma con_seg_pair_iff : forall a b c d,
  segment_pair_eqb a b c d = true -> (Interp (ConSeg a b) <-> Interp (ConSeg c d)).
Proof.
  intros a b c d H. unfold segment_pair_eqb in H. apply orb_true_iff in H.
  destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
    apply segment_u_eqb_cases in H1; apply segment_u_eqb_cases in H2;
    destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
    unfold reverse_segment; cbn; split; intro; Cong.
Qed.

Lemma con_ang_pair_iff : forall a b c d,
  angle_pair_eqb a b c d = true -> (Interp (ConAng a b) <-> Interp (ConAng c d)).
Proof.
  intros a b c d H. unfold angle_pair_eqb in H. apply orb_true_iff in H.
  destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
    apply angle_u_eqb_cases in H1; apply angle_u_eqb_cases in H2;
    destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
    unfold reverse_angle; cbn; split; intro; CongA.
Qed.

Lemma ref_seg_iff : forall a b,
  segment_u_eqb a b = true -> (Interp (RefSeg a b) <-> Interp (ConSeg a b)).
Proof.
  intros [a1 a2] [b1 b2] H. apply segment_u_eqb_cases in H.
  unfold reverse_segment in H. cbn in H.
  cbn. split; [intros [_ Hc]; exact Hc|intro Hc; split; [|exact Hc]].
  unfold Audit.SameSegmentName. cbn.
  destruct H as [H|H]; injection H as -> ->; [left|right]; split; reflexivity.
Qed.

Lemma ref_ang_iff : forall a b,
  angle_u_eqb a b = true -> (Interp (RefAng a b) <-> Interp (ConAng a b)).
Proof.
  intros [a1 a2 a3] [b1 b2 b3] H. apply angle_u_eqb_cases in H.
  unfold reverse_angle in H. cbn in H.
  cbn. split; [intros [_ Hc]; exact Hc|intro Hc; split; [|exact Hc]].
  unfold Audit.SameAngleName. cbn.
  destruct H as [H|H]; injection H as -> -> ->; (split; [reflexivity|]);
    [left|right]; split; reflexivity.
Qed.

Lemma ref_fact_eqb_sound : forall x y,
  match x, y with
  | ConSeg _ _, RefSeg _ _ | RefSeg _ _, ConSeg _ _ | RefSeg _ _, RefSeg _ _
  | ConAng _ _, RefAng _ _ | RefAng _ _, ConAng _ _
  | RefAng _ _, RefAng _ _ => True
  | _, _ => False
  end ->
  fact_eqb x y = true -> (Interp x <-> Interp y).
Proof.
  intros x y Hk H. destruct x, y; try contradiction; cbn [fact_eqb] in H;
    apply andb_true_iff in H; destruct H as [H Hcd];
    apply andb_true_iff in H; destruct H as [Hp Hab];
    try rewrite (ref_seg_iff _ _ Hab); try rewrite (ref_seg_iff _ _ Hcd);
    try rewrite (ref_ang_iff _ _ Hab); try rewrite (ref_ang_iff _ _ Hcd);
    first [exact (con_seg_pair_iff _ _ _ _ Hp) | exact (con_ang_pair_iff _ _ _ _ Hp)].
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
  { assert (Hsym : forall x y : AngleName, x = y \/ x = reverse_angle y ->
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
      cbn; unfold Audit.Parallel, Audit.seg_start, Audit.seg_end,
        reverse_segment; cbn; split; intro;
      eauto 6 using par_symmetry, par_left_comm, par_right_comm, par_comm. }
  destruct expected, actual;
    try (intros H; exact (loose_same_vertices _ _ _ _ H));
    try (intros H; apply (quad_fact_eqb_sound _ _); [exact I|exact H]);
    try (intros H; apply (ref_fact_eqb_sound _ _); [exact I|exact H]);
    cbn; try discriminate; intros H;
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
  Audit.QuadrilateralWellFormed point q ->
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
  point s.(segment_first) <> point s.(segment_second).
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
  Bet (point s.(segment_first)) (point r) (point s.(segment_second)) ->
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
    cbn in Hpr, Hc;
    first
    [ destruct Hpr as [[Hbet1 _] [Hbet2 _]]; apply orb_true_iff in Hc;
      destruct Hc as [Hc|Hc];
      [ eapply on_segment_match_out; [exact Hbet1|exact Hc|exact Hp|exact Hq]
      | eapply on_segment_match_out; [exact Hbet2|exact Hc|exact Hp|exact Hq] ]
    | destruct Hpr as [Hbet _];
      eapply on_segment_match_out; [exact Hbet|exact Hc|exact Hp|exact Hq]
    | destruct Hpr as [_ Hbet];
      eapply on_segment_match_out; [exact Hbet|exact Hc|exact Hp|exact Hq] ].
Qed.

(** The premises-yielding definition decides exactly what the plain reading of
    the rule says it does. *)
Lemma angle_ray_matches_unfold : forall decls premises e a,
  angle_ray_matches decls premises e a =
  (angle_u_eqb e a ||
   (declared_angle decls e &&
    ascii_eqb e.(angle_vertex) a.(angle_vertex) &&
    ((ray_linked premises e.(angle_vertex) e.(angle_first) a.(angle_first) &&
      ray_linked premises e.(angle_vertex) e.(angle_last) a.(angle_last)) ||
     (ray_linked premises e.(angle_vertex) e.(angle_first) a.(angle_last) &&
      ray_linked premises e.(angle_vertex) e.(angle_last) a.(angle_first))))).
Proof.
  intros decls premises e a.
  unfold angle_ray_matches, angle_ray_used, ray_pair_used.
  destruct (angle_u_eqb e a); [reflexivity|cbn].
  destruct (declared_angle decls e); [|reflexivity].
  destruct (ascii_eqb e.(angle_vertex) a.(angle_vertex)); [cbn|reflexivity].
  destruct (ray_linked premises e.(angle_vertex) e.(angle_first) a.(angle_first));
    destruct (ray_linked premises e.(angle_vertex) e.(angle_last) a.(angle_last));
    destruct (ray_linked premises e.(angle_vertex) e.(angle_first) a.(angle_last));
    destruct (ray_linked premises e.(angle_vertex) e.(angle_last) a.(angle_first));
    reflexivity.
Qed.

Lemma angle_ray_matches_sound : forall decls premises e a A B C,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  angle_ray_matches decls premises e a = true ->
  CongA (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last)) A B C ->
  CongA (point e.(angle_first)) (point e.(angle_vertex)) (point e.(angle_last)) A B C.
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
    apply conga_trans with (point a.(angle_first)) (point a.(angle_vertex))
                           (point a.(angle_last)); [|exact Hconga].
    apply out2__conga; assumption.
  - pose proof (ray_linked_out _ _ _ _ Hprem Hr1 Hel Hd2) as Ho1.
    pose proof (ray_linked_out _ _ _ _ Hprem Hr2 Her Hd1) as Ho2.
    apply conga_trans with (point a.(angle_last)) (point a.(angle_vertex))
                           (point a.(angle_first)); [|CongA].
    apply out2__conga; assumption.
Qed.

Lemma angle_ray_spelling_bridge : forall premises e a,
  Forall (interp_premise point) premises ->
  angle_well_formed point e -> angle_well_formed point a ->
  angle_ray_spelling premises e a = true ->
  CongA (point e.(angle_first)) (point e.(angle_vertex)) (point e.(angle_last))
        (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last)).
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
  CongA (point a1.(angle_first)) (point a1.(angle_vertex)) (point a1.(angle_last))
        (point a2.(angle_first)) (point a2.(angle_vertex)) (point a2.(angle_last)) ->
  CongA (point e1.(angle_first)) (point e1.(angle_vertex)) (point e1.(angle_last))
        (point e2.(angle_first)) (point e2.(angle_vertex)) (point e2.(angle_last)).
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
  - (* con_ang matched by a ray-renamed ref_ang *)
    cbn in Hactual |- *. destruct Hactual as [_ Hactual].
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
                   interp_triangle_congruence point (triangle_name A B C) (triangle_name D E F)).
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
              (reverse_triangle (triangle_name A B C)) (reverse_triangle (triangle_name D E F))).
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

Lemma criterion_conclusion_sound :
  forall schema decls premises facts i j k conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  (forall decls premises facts i j k t u,
    declarations_well_formed point decls ->
    Forall (interp_premise point) premises ->
    Forall Interp facts -> triangle_well_formed point t ->
    schema decls premises facts i j k t u = true ->
    interp_triangle_congruence point t u) ->
  criterion_conclusion schema decls premises facts i j k conclusion = true ->
  Interp conclusion.
Proof.
  intros schema decls premises facts i j k conclusion Hwf Hprem Hfacts
    Hschema H.
  unfold criterion_conclusion in H. destruct conclusion; try discriminate;
    apply andb_true_iff in H; destruct H as [Hdecl H];
    apply declared_pair_sound in Hdecl; try exact Hwf;
    destruct Hdecl as [Ht Hu].
  - apply existsb_exists in H. destruct H as [u' [Hin Hsix]].
    exists u'. split; [exact Hin|].
    apply ordered_congruence_of_parts.
    + now apply triangle_well_formed_nondegenerate.
    + apply (nondegenerate_orderings b u' Hin).
      now apply triangle_well_formed_nondegenerate.
    + change (interp_triangle_congruence point a u').
      eapply six_correspondences_sound; eauto.
  - apply ordered_congruence_of_parts;
      [now apply triangle_well_formed_nondegenerate
      |now apply triangle_well_formed_nondegenerate|].
    change (interp_triangle_congruence point a b).
    eapply six_correspondences_sound; eauto.
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
      injection Hpair as <- <-; first [exact Hs | exact (proj2 Hs)].
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
      injection Hpair as <- <-; first [exact Hs | exact (proj2 Hs)].
Qed.

Lemma con_tri_transitive_sound : forall facts i j conclusion,
  Forall Interp facts -> con_tri_transitive facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold con_tri_transitive in Hrule.
  destruct conclusion; try discriminate.
  { eapply transitive_rule_sound; [| | | |exact Hfacts|exact Hrule].
    - intros w x y Hsame Hcong. unfold same_vertices in Hsame.
      apply triangle_mem_spec in Hsame.
      exact (loose_reorder_right w x y (orderings_sym _ _ Hsame) Hcong).
    - intros x y. apply loose_sym.
    - intros x y z. apply loose_trans.
    - intros s x y Hpair Hs. destruct s; cbn in Hpair; try discriminate;
        injection Hpair as <- <-; [exact Hs|now apply loose_of_ordered]. }
  eapply transitive_rule_sound; [| | | |exact Hfacts|exact Hrule].
  - intros w x y Hsame Hcong. apply triangle_eqb_eq in Hsame. now subst.
  - intros x y Hcong.
    destruct (ordered_congruence_parts _ _ Hcong) as [Hx [Hy Hc]].
    apply ordered_congruence_of_parts; [exact Hy|exact Hx|].
    destruct x as [A B C], y as [D E F]. rewrite triangle_congruence_unfold in *.
    now apply triangle_congruent_sym.
  - intros x y z Hxy Hyz.
    destruct (ordered_congruence_parts _ _ Hxy) as [Hx [_ Hc1]].
    destruct (ordered_congruence_parts _ _ Hyz) as [_ [Hz Hc2]].
    apply ordered_congruence_of_parts; [exact Hx|exact Hz|].
    destruct x as [A B C], y as [D E F], z as [G H I].
    rewrite triangle_congruence_unfold in *.
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
  all: try old_names_eq Hfirst.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  all: try old_names_eq Hsecond.
  assert (Ha : Interp (Right a)) by (eapply lookup_step_sound; eauto).
  assert (Hb : Interp (Right a0)) by (eapply lookup_step_sound; eauto).
  cbn in Ha, Hb.
  assert (Hmove : forall x y, angle_u_eqb x y = true -> Interp (Right x) ->
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
  Col (point c) (point s.(segment_first)) (point s.(segment_second)).
Proof.
  intros c s H. unfold endpoint_of, ascii_eqb in H.
  apply orb_true_iff in H. destruct H as [H|H]; apply Ascii.eqb_eq in H; subst;
    [apply col_trivial_1|apply col_trivial_3].
Qed.

Lemma perp_right_angle_sound : forall s t p a,
  Interp (Perp s t p) -> perp_right_angle s t p a = true ->
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
  all: try old_names_eq Hlookup.
  assert (Hperp : Interp (Perp s s0 p)) by (eapply lookup_step_sound; eauto).
  destruct conclusion; try discriminate. all: try old_names_goal.
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
  all: try old_names_eq Hlookup.
  assert (Hmid : Interp (Midpt s p)) by (eapply lookup_step_sound; eauto).
  apply (fact_eqb_sound _ _ Hrule). cbn in Hmid |- *. apply Hmid.
Qed.

Lemma vertical_angle_pair_sound : forall decls s t p conclusion,
  declarations_well_formed point decls ->
  Interp (IntersectSeg s t p) ->
  vertical_angle_pair decls s t p conclusion = true -> Interp conclusion.
Proof.
  intros decls s t p conclusion Hwf Hcross Hpair.
  cbn in Hcross. destruct Hcross as [[Hs _] [Ht _]].
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
  all: try old_names_eq Hlookup.
  assert (Hbisect : Interp (AngBisect a s)) by (eapply lookup_step_sound; eauto).
  cbn in Hbisect.
  apply orb_true_iff in Hrule; destruct Hrule as [Hcase|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hvertex Heq];
    unfold ascii_eqb in Hvertex; apply Ascii.eqb_eq in Hvertex;
    apply (fact_eqb_sound _ _ Heq); cbn;
    destruct Hbisect as [[Hstart Hc]|[Hend Hc]].
  (* the named endpoint is the vertex, so the other disjunct can only hold when
     both endpoints name it and the two halves therefore coincide *)
  - exact Hc.
  - assert (Hsame : s.(segment_second) = s.(segment_first)) by congruence.
    rewrite Hsame. exact Hc.
  - assert (Hsame : s.(segment_first) = s.(segment_second)) by congruence.
    rewrite Hsame. exact Hc.
  - exact Hc.
Qed.

Lemma ang_bisect_conv_sound : forall facts i conclusion,
  Forall Interp facts -> ang_bisect_conv facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule. unfold ang_bisect_conv in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
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
  Bet (point t.(segment_first)) (point r) (point t.(segment_second)) ->
  Bet (point s.(segment_first)) (point r) (point s.(segment_second)).
Proof.
  intros s t r Hs Hbet. apply segment_u_eqb_cases in Hs.
  destruct Hs as [Heq|Heq]; subst s; [exact Hbet|].
  unfold reverse_segment. cbn. now apply between_symmetry.
Qed.

(** The only thing [midpt_conv] reads out of the diagram premise it found.
    [on_line] gives it directly; [intersect_seg] gives it of whichever of its
    two segments matched.  The midpoint converse needs nothing more. *)
Lemma on_segment_statement_sound : forall s p st,
  on_segment_statement s p st = true -> Interp st ->
  Bet (point s.(segment_first)) (point p) (point s.(segment_second)).
Proof.
  intros s p st Hmatch Hst. destruct st; try discriminate;
    cbn in Hmatch; apply andb_true_iff in Hmatch;
    destruct Hmatch as [Hseg Hpoint];
    unfold ascii_eqb in Hpoint; apply Ascii.eqb_eq in Hpoint; subst.
  - (* OnLine: the betweenness half of what it says *)
    cbn in Hst. destruct Hst as [_ Hbet].
    eapply segment_u_bet; eassumption.
  - (* IntersectSeg: either crossed segment may be the one named *)
    cbn in Hst. destruct Hst as [[Hbet1 _] [Hbet2 _]].
    apply orb_true_iff in Hseg. destruct Hseg as [Hseg|Hseg];
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
  unfold midpt_conv in Hrule. destruct conclusion; try discriminate. all: try old_names_goal.
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

Lemma supported_lookup : forall decls premises facts expected,
  supported decls premises facts expected = true ->
  exists i actual, lookup_step facts i = Some actual /\
    dependency_matches decls premises expected actual = true.
Proof.
  intros decls premises facts expected H. unfold supported in H.
  apply existsb_exists in H. destruct H as [actual [Hin Hm]].
  apply In_nth_error in Hin. destruct Hin as [n Hn].
  exists (S n), actual. split; [exact Hn|exact Hm].
Qed.

Lemma supported3_schema3 : forall decls premises facts a b c,
  supported3 decls premises facts a b c = true ->
  exists i j k, schema3 decls premises facts i j k a b c = true.
Proof.
  intros decls premises facts a b c H. unfold supported3 in H.
  apply andb_true_iff in H. destruct H as [H Hc].
  apply andb_true_iff in H. destruct H as [Ha Hb].
  destruct (supported_lookup _ _ _ _ Ha) as [i [x [Hx Hmx]]].
  destruct (supported_lookup _ _ _ _ Hb) as [j [y [Hy Hmy]]].
  destruct (supported_lookup _ _ _ _ Hc) as [k [z [Hz Hmz]]].
  exists i, j, k. rewrite schema3_unfold, Hx, Hy, Hz, Hmx, Hmy, Hmz.
  reflexivity.
Qed.

Lemma reading_witnessed_sound : forall decls premises facts t u,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  triangle_well_formed point t ->
  reading_witnessed decls premises facts t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros decls premises facts t u Hwf Hprem Hfacts Ht H.
  unfold reading_witnessed in H. repeat rewrite orb_true_iff in H.
  destruct H as [[[[[H|H]|H]|H]|H]|H].
  - destruct (supported3_schema3 _ _ _ _ _ _ H) as [i [j [k Hs]]].
    eapply sas_schema_sound; eauto.
  - destruct (supported3_schema3 _ _ _ _ _ _ H) as [i [j [k Hs]]].
    eapply sss_schema_sound; eauto.
  - destruct (supported3_schema3 _ _ _ _ _ _ H) as [i [j [k Hs]]].
    eapply asa_schema_sound; eauto.
  - destruct (supported3_schema3 _ _ _ _ _ _ H) as [i [j [k Hs]]].
    eapply aas_schema_sound; [exact Hwf|exact Hprem|exact Hfacts|exact Ht|].
    unfold aas_schema. rewrite Hs. reflexivity.
  - destruct (supported3_schema3 _ _ _ _ _ _ H) as [i [j [k Hs]]].
    eapply rhl_schema_sound; [exact Hwf|exact Hprem|exact Hfacts|exact Ht|].
    unfold rhl_schema. rewrite Hs. reflexivity.
  - apply existsb_exists in H. destruct H as [f [Hin Heq]].
    apply fact_eqb_sound in Heq.
    assert (Hord : Interp (ConTriOrdered t u))
      by (apply Heq; eapply Forall_forall; eauto).
    exact (proj2 (proj2 (ordered_congruence_parts _ _ Hord))).
Qed.

Lemma correspondence_first_well_formed : forall t u c,
  In c (correspondences t u) -> triangle_well_formed point t ->
  triangle_well_formed point (fst c).
Proof.
  intros t u c Hin Ht. unfold correspondences in Hin. cbn in Hin.
  repeat (destruct Hin as [<-|Hin];
    [cbn; repeat first [ apply rotated_well_formed
                       | apply reversed_well_formed ]; exact Ht|]).
  contradiction.
Qed.

Lemma correspondence_witnessed_sound : forall decls premises facts t u,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  triangle_well_formed point t ->
  correspondence_witnessed decls premises facts t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros decls premises facts t u Hwf Hprem Hfacts Ht H.
  unfold correspondence_witnessed in H.
  apply existsb_exists in H. destruct H as [c [Hin Hw]].
  apply (correspondences_congruent t u c Hin).
  eapply reading_witnessed_sound; eauto.
  eapply correspondence_first_well_formed; eauto.
Qed.

Lemma congruence_well_formed : forall t u,
  triangle_well_formed point t -> interp_triangle_congruence point t u ->
  triangle_well_formed point u.
Proof.
  intros [A B C] [D E F] Ht Hc. unfold triangle_well_formed in *. cbn in *.
  unfold interp_triangle_congruence in Hc. rewrite triangle_congruence_unfold in Hc.
  destruct Hc as [Hab [Hbc [Hca _]]].
  intro Hcol. apply Ht.
  apply (l4_13 (point D) (point E) (point F)); [exact Hcol|].
  unfold Cong_3. split; [Cong|split; Cong].
Qed.

Lemma interp_triangle_congruence_trans : forall t u v,
  interp_triangle_congruence point t u -> interp_triangle_congruence point u v ->
  interp_triangle_congruence point t v.
Proof.
  intros [A B C] [D E F] [G H I] Htu Huv. unfold interp_triangle_congruence in *.
  rewrite triangle_congruence_unfold in *.
  eapply triangle_congruent_trans; eauto.
Qed.

(** Every triangle the search reaches is [t] or congruent to it under the
    correspondence reached, and noncollinear. *)
Lemma reach_correspondences_sound : forall decls premises facts t fuel nodes reached,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  (forall u, In u reached ->
     (u = t \/ interp_triangle_congruence point t u) /\ triangle_well_formed point u) ->
  forall u, In u (reach_correspondences decls premises facts fuel nodes reached) ->
    (u = t \/ interp_triangle_congruence point t u) /\ triangle_well_formed point u.
Proof.
  intros decls premises facts t fuel. induction fuel as [|fuel IH];
    intros nodes reached Hwf Hprem Hfacts Hinv; cbn; [exact Hinv|].
  destruct (filter _ nodes) as [|w ws] eqn:Hfresh; [exact Hinv|].
  apply IH; [exact Hwf|exact Hprem|exact Hfacts|].
  intros u Hin. apply in_app_or in Hin. destruct Hin as [Hin|Hin]; [now apply Hinv|].
  rewrite <- Hfresh in Hin. apply filter_In in Hin. destruct Hin as [_ Hu].
  apply andb_true_iff in Hu. destruct Hu as [_ Hu].
  apply existsb_exists in Hu. destruct Hu as [x [Hx Hxu]].
  destruct (Hinv x Hx) as [Hxt Hwfx].
  assert (Hcxu : interp_triangle_congruence point x u)
    by (eapply correspondence_witnessed_sound; eauto).
  assert (Hctu : interp_triangle_congruence point t u)
    by (destruct Hxt as [->|Htx];
        [exact Hcxu|eapply interp_triangle_congruence_trans; eauto]).
  split; [now right|].
  eapply congruence_well_formed; [exact Hwfx|exact Hcxu].
Qed.

Lemma chain_witnessed_sound : forall decls premises facts t u,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  triangle_well_formed point t ->
  chain_witnessed decls premises facts t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros decls premises facts t u Hwf Hprem Hfacts Ht H.
  unfold chain_witnessed in H. apply orb_true_iff in H. destruct H as [H|H].
  - eapply correspondence_witnessed_sound; eauto.
  - apply existsb_exists in H. destruct H as [w [Hin Hwu]].
    destruct (reach_correspondences_sound decls premises facts t
                (List.length (congruence_nodes facts)) (congruence_nodes facts)
                [t] Hwf Hprem Hfacts) with (u := w) as [Htw Hwfw];
      [|exact Hin|].
    { intros x [<-|[]]. split; [now left|exact Ht]. }
    assert (Hcwu : interp_triangle_congruence point w u)
      by (eapply correspondence_witnessed_sound; eauto).
    destruct Htw as [->|Htw]; [exact Hcwu|].
    eapply interp_triangle_congruence_trans; eauto.
Qed.

Lemma cpctc_rule_sound : forall decls premises facts i conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  cpctc_rule decls premises facts i conclusion = true -> Interp conclusion.
Proof.
  intros decls premises facts i conclusion Hwf Hprem Hfacts H.
  unfold cpctc_rule in H.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  - apply andb_true_iff in H. destruct H as [Hdecl H].
    apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ht _].
    apply existsb_exists in H. destruct H as [u' [_ H]].
    apply andb_true_iff in H. destruct H as [Hw Hc].
    apply (cpctc_sound a u' conclusion); [|exact Hc].
    eapply chain_witnessed_sound; eauto.
  - apply (cpctc_sound a b conclusion); [|exact H].
    assert (Hord : Interp (ConTriOrdered a b)) by (eapply lookup_step_sound; eauto).
    exact (proj2 (proj2 (ordered_congruence_parts _ _ Hord))).
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
  assert (Hat : forall t u,
    existsb (fun c => def_con_tri_at decls premises facts i1 i2 i3 i4 i5 i6
                        (fst c) (snd c))
            (correspondences t u) = true ->
    interp_triangle_congruence point t u).
  { intros t u H.
    apply existsb_exists in H. destruct H as [c [Hin Hmatch]].
    apply (correspondences_congruent t u c Hin).
    unfold def_con_tri_at in Hmatch.
    apply (schema6_sound _ _ _ _ _ _ _ _ _ _ _ _ _ _ _ Hwf Hprem Hall) in Hmatch.
    destruct (fst c) as [A B C]; destruct (snd c) as [D E F].
    cbn in Hmatch |- *. unfold interp_triangle_congruence, triangle_congruence.
    cbn. tauto. }
  unfold def_con_tri in Hrule. destruct conclusion; try discriminate;
    apply andb_true_iff in Hrule; destruct Hrule as [Hdecl Hrule];
    apply declared_pair_sound in Hdecl; try exact Hwf; destruct Hdecl as [Ht Hu];
    apply triangle_well_formed_nondegenerate in Ht;
    apply triangle_well_formed_nondegenerate in Hu.
  - apply existsb_exists in Hrule. destruct Hrule as [u' [Hin Hmatch]].
    exists u'. split; [exact Hin|].
    apply ordered_congruence_of_parts;
      [exact Ht|exact (nondegenerate_orderings _ _ Hin Hu)|exact (Hat _ _ Hmatch)].
  - exact (ordered_congruence_of_parts _ _ Ht Hu (Hat _ _ Hrule)).
Qed.

Lemma def_isosceles_sound : forall decls facts i conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  def_isosceles decls facts i conclusion = true -> Interp conclusion.
Proof.
  intros decls facts i conclusion Hwf Hall Hrule.
  unfold def_isosceles in Hrule. destruct conclusion; try discriminate. all: try old_names_goal.
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
  unfold def_equilateral in Hrule. destruct conclusion; try discriminate. all: try old_names_goal.
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
  unfold def_equiangular in Hrule. destruct conclusion; try discriminate. all: try old_names_goal.
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  all: try old_names_eq Hlookup.
  apply triangle_eqb_eq in Hrule. subst t.
  assert (Hdep : Interp (Equilateral t0)) by (eapply lookup_step_sound; eauto).
  destruct t0 as [A B C]. cbn in Hdep |- *.
  destruct Hdep as [Hnd [Hab Hbc]]. split; [exact Hnd|].
  apply ender_equilateral_equiangular; [apply Hnd|exact Hab|exact Hbc].
Qed.

Lemma equiang_equilat_sound : forall facts i conclusion,
  Forall Interp facts -> equiang_equilat facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hall Hrule. unfold equiang_equilat in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  all: try old_names_eq Hlookup.
  apply triangle_eqb_eq in Hrule. subst t.
  assert (Hdep : Interp (Equiangular t0)) by (eapply lookup_step_sound; eauto).
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
  all: try old_names_eq Hfirst.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  all: try old_names_eq Hsecond.
  assert (Hs1 : Interp (Supplementary a a0)) by (eapply lookup_step_sound; eauto).
  assert (Hs2 : Interp (Supplementary a1 a2)) by (eapply lookup_step_sound; eauto).
  (* [SuppA] is symmetric, so the shared angle may occupy either slot of
     either dependency; realign it into the second slot of both. *)
  assert (Hcancel : forall x y z : AngleName,
      Interp (Supplementary x y) -> Interp (Supplementary z y) ->
      Interp (ConAng x z)).
  { intros x y z Hx Hz. cbn in Hx, Hz |- *.
    now apply (suppa2__conga123 _ _ _ (point (angle_first y)) (point (angle_vertex y))
                                (point (angle_last y))). }
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
  assert (Hzy : SuppA (point (angle_first z)) (point (angle_vertex z))
                      (point (angle_last z))
                      (point (angle_first y)) (point (angle_vertex y))
                      (point (angle_last y))).
  { apply (conga2_suppa__suppa (point (angle_first z)) (point (angle_vertex z))
             (point (angle_last z)) (point (angle_first w)) (point (angle_vertex w))
             (point (angle_last w)));
      [apply conga_refl; auto|now apply conga_sym|exact Hz]. }
  now apply (suppa2__conga123 _ _ _ (point (angle_first y)) (point (angle_vertex y))
                              (point (angle_last y))).
Qed.

Lemma con_supplements_sound : forall facts i j k conclusion,
  Forall Interp facts -> con_supplements facts i j k conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j k conclusion Hall Hrule. unfold con_supplements in Hrule.
  destruct (lookup_step facts i) as [first|] eqn:Hfirst; try discriminate.
  destruct first; try discriminate.
  all: try old_names_eq Hfirst.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  all: try old_names_eq Hsecond.
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
  assert (Hwy : CongA (point (angle_first w)) (point (angle_vertex w))
                      (point (angle_last w))
                      (point (angle_first y)) (point (angle_vertex y))
                      (point (angle_last y))) by (now apply conga_sym).
  assert (Hzz : CongA (point (angle_first z)) (point (angle_vertex z))
                      (point (angle_last z))
                      (point (angle_first z)) (point (angle_vertex z))
                      (point (angle_last z)))
    by (apply conga_refl; auto using not_eq_sym).
  assert (Hsuma2' : SumA (point (angle_first z)) (point (angle_vertex z))
                         (point (angle_last z))
                         (point (angle_first y)) (point (angle_vertex y))
                         (point (angle_last y)) X1 Y1 Z1)
    by (eapply conga3_suma__suma;
          [exact Hsuma2|exact Hzz|exact Hwy|exact Hright]).
  assert (Hsams2' : SAMS (point (angle_first z)) (point (angle_vertex z))
                         (point (angle_last z))
                         (point (angle_first y)) (point (angle_vertex y))
                         (point (angle_last y)))
    by (eapply conga2_sams__sams; [exact Hzz|exact Hwy|exact Hsams2]).
  now apply (sams2_suma2__conga123 _ _ _ _ _ _ (point (angle_first y))
               (point (angle_vertex y)) (point (angle_last y)) X1 Y1 Z1).
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
  all: try old_names_eq Hfirst.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  all: try old_names_eq Hsecond.
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
  all: try old_names_eq Hfirst.
  destruct (lookup_step facts j) as [second|] eqn:Hsecond; try discriminate.
  destruct second; try discriminate.
  all: try old_names_eq Hsecond.
  assert (Hc1 : Interp (Complementary a a0)) by (eapply lookup_step_sound; eauto).
  assert (Hc2 : Interp (Complementary a1 a2)) by (eapply lookup_step_sound; eauto).
  (* the shared angle may sit in either slot of either dependency; realign it
     into the second slot of both, then cancel it *)
  assert (Hcancel : forall x y z : AngleName,
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
  unfold Audit.LinearPairMeaning, Audit.AngleWellFormed, Audit.ang_start,
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
  all: try old_names_eq Hlookup.
  apply (fact_eqb_sound _ _ Hrule).
  apply linear_pair_is_supplementary.
  eapply lookup_step_sound; eauto.
Qed.

Lemma on_line_witness_some : forall st s p,
  on_line_witness st = Some (s, p) -> st = OnLine s p.
Proof. intros st s p H. destruct st; cbn in H; congruence. Qed.

Lemma segment_u_bet_named : forall s x y r,
  segment_u_eqb s (segment_name x y) = true ->
  Bet (point s.(segment_first)) (point r) (point s.(segment_second)) ->
  Bet (point x) (point r) (point y).
Proof.
  intros s x y r Hs Hbet. apply segment_u_eqb_cases in Hs.
  destruct Hs as [Heq|Heq]; subst s; cbn in Hbet; [exact Hbet|].
  now apply between_symmetry.
Qed.

Lemma linear_pair_figure_sound : forall a b s p,
  linear_pair_figure a b s p = true ->
  Bet (point s.(segment_first)) (point p) (point s.(segment_second)) ->
  Interp (Supplementary a b) -> Interp (LinearPair a b).
Proof.
  intros [A V C] [D W F] s p Hfig Hbet Hsupp.
  unfold linear_pair_figure in Hfig. cbn in Hfig.
  apply andb_true_iff in Hfig. destruct Hfig as [Hv Hcases].
  apply andb_true_iff in Hv. destruct Hv as [HV HW].
  unfold ascii_eqb in HV, HW. apply Ascii.eqb_eq in HV, HW. subst V W.
  cbn in Hsupp. apply suppa_distincts in Hsupp.
  destruct Hsupp as [HA [HC [HD HF]]].
  cbn. unfold Audit.LinearPairMeaning, Audit.AngleWellFormed, Audit.ang_start,
    Audit.ang_vertex, Audit.ang_end. cbn.
  split; [split; auto|]. split; [split; auto|]. split; [reflexivity|].
  rewrite !orb_true_iff in Hcases.
  destruct Hcases as [[[H|H]|H]|H]; apply andb_true_iff in H;
    destruct H as [Hshared Hline]; unfold ascii_eqb in Hshared;
    apply Ascii.eqb_eq in Hshared; subst;
    pose proof (segment_u_bet_named _ _ _ _ Hline Hbet) as Hb.
  - left. split; [apply out_trivial; auto|]. repeat split; auto.
  - right; left. split; [apply out_trivial; auto|]. repeat split; auto.
  - right; right; left. split; [apply out_trivial; auto|]. repeat split; auto.
  - right; right; right. split; [apply out_trivial; auto|]. repeat split; auto.
Qed.

(** Every ray is nondegenerate because the supplementary dependency says so,
    and the [on_line] premise is what makes the outer rays opposite. *)
Lemma linear_pair_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  linear_pair_conv premises facts i conclusion = true -> Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold linear_pair_conv in Hrule. destruct conclusion; try discriminate.
  all: try old_names_goal.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hsupp Hon].
  assert (Hdep : Interp dependency) by (eapply lookup_step_sound; eauto).
  apply (proj2 (fact_eqb_sound _ _ Hsupp)) in Hdep.
  rewrite premise_found_existsb in Hon.
  apply existsb_exists in Hon. destruct Hon as [pr [Hin Hmatch]].
  pose proof ((proj1 (@Forall_forall Premise (interp_premise point) premises))
                Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr. unfold linear_pair_conv_premise in Hmatch.
  destruct (on_line_witness (premise_statement pr)) as [[t q]|] eqn:Hw;
    try discriminate.
  apply on_line_witness_some in Hw. rewrite Hw in Hpr. cbn in Hpr.
  destruct Hpr as [_ Hbet].
  eapply linear_pair_figure_sound; eassumption.
Qed.

Lemma endpoints_determine : forall u p y, p <> y ->
  endpoint_of p u = true -> endpoint_of y u = true ->
  segment_u_eqb (segment_name p y) u = true.
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
  segment_u_eqb (segment_name x (other_endpoint x s)) s = true.
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
  point s.(segment_first) <> point s.(segment_second) ->
  Col (point s.(segment_first)) (point s.(segment_second)) (point p) ->
  Interp (Perp u s p).
Proof.
  intros u s p x y Hx Hy Hper Hpu Hyu Hxs Hne Hcol.
  assert (Hbase : Perp_at (point p) (point p) (point y) (point x) (point p))
    by (apply perp_in_sym, per_perp_in; auto).
  assert (Hspec : point x <> point (other_endpoint x s) /\
                  Col (point x) (point p) (point (other_endpoint x s))).
  { unfold other_endpoint, endpoint_of, ascii_eqb in *.
    destruct (Ascii.eqb x (segment_first s)) eqn:Hstart.
    - apply Ascii.eqb_eq in Hstart. rewrite Hstart. split; [exact Hne|Col].
    - apply orb_true_iff in Hxs. destruct Hxs as [Hbad|Hend]; [congruence|].
      apply Ascii.eqb_eq in Hend. rewrite Hend. split; [congruence|Col]. }
  destruct Hspec as [Hdistinct Hcollinear].
  assert (Hext : Interp (Perp (segment_name p y) (segment_name x (other_endpoint x s)) p)).
  { cbn. eapply perp_in_col_perp_in; [exact Hdistinct|exact Hcollinear|exact Hbase]. }
  apply (perp_at_realign (segment_name p y) (segment_name x (other_endpoint x s)) u s p p);
    [ apply endpoints_determine; [intro Heq; apply Hy; now rewrite Heq| |]; auto
    | now apply other_endpoint_spec
    | unfold ascii_eqb; apply Ascii.eqb_refl
    | exact Hext ].
Qed.

Lemma def_perp_core : forall u s p x y,
  point x <> point p -> point y <> point p ->
  Per (point x) (point p) (point y) ->
  endpoint_of p u = true -> endpoint_of y u = true ->
  endpoint_of x s = true -> Interp (OnLine s p) -> Interp (Perp u s p).
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
  unfold def_perp in Hrule. destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  all: try old_names_eq Hlookup.
  apply andb_true_iff in Hrule. destruct Hrule as [Hshape Hon].
  assert (Hright : Interp (Right a)) by (eapply lookup_step_sound; eauto).
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
  - eapply (def_perp_core _ _ _ (angle_first a) (angle_last a)); eassumption.
  - eapply (def_perp_core _ _ _ (angle_last a) (angle_first a)); try eassumption.
    now apply l8_2.
Qed.

(** Meaning-level transfer for quadrilateral side matching: a side named up
    to reversal and pair order carries its [Par] or [Cong] fact onto the
    canonical side segments. *)
Lemma para_pair_sound : forall s1 s2 a b,
  segment_pair_eqb s1 s2 a b = true ->
  Interp (Para s1 s2) ->
  Par (point a.(segment_first)) (point a.(segment_second))
      (point b.(segment_first)) (point b.(segment_second)).
Proof.
  intros s1 s2 a b Hpair Hpar.
  cbn in Hpar. unfold Audit.Parallel, Audit.seg_start,
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
  Cong (point a.(segment_first)) (point a.(segment_second))
       (point b.(segment_first)) (point b.(segment_second)).
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
  Cong (point a.(segment_first)) (point a.(segment_second))
       (point b.(segment_first)) (point b.(segment_second)) ->
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
  Audit.QuadrilateralWellFormed point q.
Proof.
  intros decls q Hwf H. destruct Hwf as [_ [_ Hq]].
  unfold declared_quadrilateral in H. apply existsb_exists in H.
  destruct H as [r [Hin Heq]].
  apply (relabel_closed (fun q => Audit.QuadrilateralWellFormed point q)
           quad_wf_rotated quad_wf_reversed q r Heq).
  now apply Hq.
Qed.

Lemma def_parallelogram_sound : forall decls facts i j conclusion,
  declarations_well_formed point decls -> Forall Interp facts ->
  def_parallelogram_rule decls facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros decls facts i j conclusion Hwf Hfacts Hrule.
  unfold def_parallelogram_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hr : Interp (Rectangle q0)) by (eapply lookup_step_sound; eauto).
  apply (relabel_closed (fun q => Interp (Parallelogram q)) pgram_rotated pgram_reversed q q0 Hrule).
  exact (proj1 Hr).
Qed.

Lemma rhombus_pgram_sound : forall facts i conclusion,
  Forall Interp facts -> rhombus_pgram_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold rhombus_pgram_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hr : Interp (Rhombus q0)) by (eapply lookup_step_sound; eauto).
  apply (relabel_closed (fun q => Interp (Parallelogram q)) pgram_rotated pgram_reversed q q0 Hrule).
  exact (proj1 Hr).
Qed.

Lemma para_pair_conclude : forall s1 s2 a b,
  segment_pair_eqb s1 s2 a b = true ->
  Par (point a.(segment_first)) (point a.(segment_second))
      (point b.(segment_first)) (point b.(segment_second)) ->
  Interp (Para s1 s2).
Proof.
  intros s1 s2 a b Hpair Hpar.
  cbn. unfold Audit.Parallel, Audit.seg_start, Audit.seg_end. cbn.
  unfold segment_pair_eqb in Hpair. apply orb_true_iff in Hpair.
  destruct Hpair as [Hcase|Hcase]; apply andb_true_iff in Hcase;
    destruct Hcase as [H1 H2];
    apply segment_u_eqb_cases in H1; apply segment_u_eqb_cases in H2;
    destruct H1 as [->| ->]; destruct H2 as [->| ->];
    unfold reverse_segment; cbn;
    eauto 6 using par_symmetry, par_left_comm, par_right_comm, par_comm.
Qed.

Lemma named_apart_neq : forall p q, named_apart p q = true -> p <> q.
Proof.
  intros p q H ->. unfold named_apart, ascii_eqb in H.
  rewrite (proj2 (Ascii.eqb_eq q q) eq_refl) in H. discriminate.
Qed.

(** What the audited configuration says about the parts the checker reads:
    a part named apart is drawn, and the figure is a relaxed transversal. *)
Lemma transversal_drawn : forall a b t1 i1 c d t2 i2,
  Audit.TransversalConfiguration point a b t1 i1 c d t2 i2 ->
  (named_apart a i1 = true -> point a <> point i1) /\
  (named_apart b i1 = true -> point b <> point i1) /\
  (named_apart c i2 = true -> point c <> point i2) /\
  (named_apart d i2 = true -> point d <> point i2) /\
  (exterior_drawn t1 i1 i2 = true -> BetS (point t1) (point i1) (point i2)) /\
  (exterior_drawn t2 i2 i1 = true -> BetS (point i1) (point i2) (point t2)).
Proof.
  intros a b t1 i1 c d t2 i2 Hcfg.
  unfold Audit.TransversalConfiguration in Hcfg.
  destruct Hcfg as [_ [Ht1 [Ht2 [_ [_ [Ha [Hb [_ [_ [Hc [Hd _]]]]]]]]]]].
  split; [intro H; exact (Ha (named_apart_neq _ _ H))|].
  split; [intro H; exact (Hb (named_apart_neq _ _ H))|].
  split; [intro H; exact (Hc (named_apart_neq _ _ H))|].
  split; [intro H; exact (Hd (named_apart_neq _ _ H))|].
  split; intro H; unfold exterior_drawn in H; apply andb_true_iff in H;
    destruct H as [H1 H2]; [apply Ht1|apply Ht2];
    apply named_apart_neq; assumption.
Qed.

Lemma transversal_relaxed : forall a b t1 i1 c d t2 i2,
  Audit.TransversalConfiguration point a b t1 i1 c d t2 i2 ->
  EnderTransversalRelaxed (point i1) (point i2)
    (point a) (point b) (point c) (point d) /\
  (point t1 = point i1 \/ point t1 = point i2 \/
   BetS (point t1) (point i1) (point i2)) /\
  (point t2 = point i2 \/ point t2 = point i1 \/
   BetS (point i1) (point i2) (point t2)).
Proof.
  intros a b t1 i1 c d t2 i2 Hcfg.
  unfold Audit.TransversalConfiguration in Hcfg.
  destruct Hcfg as [HI [Ht1 [Ht2 [Hab [HneAB [_ [_ [Hcd [HneCD [_ [_
    [Hac [Had [Hbc Hbd]]]]]]]]]]]]]].
  split; [exact (conj HI (conj Hab (conj HneAB (conj Hcd (conj HneCD
                  (conj Hac (conj Had (conj Hbc Hbd))))))))|].
  split.
  - destruct (Ascii.ascii_dec t1 i1) as [->|H1]; [left; reflexivity|].
    destruct (Ascii.ascii_dec t1 i2) as [->|H2]; [right; left; reflexivity|].
    right; right. exact (Ht1 H1 H2).
  - destruct (Ascii.ascii_dec t2 i2) as [->|H1]; [left; reflexivity|].
    destruct (Ascii.ascii_dec t2 i1) as [->|H2]; [right; left; reflexivity|].
    right; right. exact (Ht2 H1 H2).
Qed.

(** With every part drawn — no letter repeated across the slots that may
    repeat — the audited meaning is exactly the full configuration, so the
    relaxation changes nothing for a figure that spells all eight points. *)
Lemma transversal_configuration_full : forall a b t1 i1 c d t2 i2,
  a <> i1 -> b <> i1 -> c <> i2 -> d <> i2 ->
  t1 <> i1 -> t1 <> i2 -> t2 <> i2 -> t2 <> i1 ->
  (Audit.TransversalConfiguration point a b t1 i1 c d t2 i2 <->
   BetS (point t1) (point i1) (point i2) /\
   BetS (point i1) (point i2) (point t2) /\
   BetS (point a) (point i1) (point b) /\
   BetS (point c) (point i2) (point d) /\
   OS (point i1) (point i2) (point a) (point c)).
Proof.
  intros a b t1 i1 c d t2 i2 Ha Hb Hc Hd Ht1 Ht1' Ht2 Ht2'.
  unfold Audit.TransversalConfiguration. split.
  - intros [HI [HT1 [HT2 [Hab [_ [HA [HB [Hcd [_ [HC [HD [Hac _]]]]]]]]]]]].
    pose proof (HA Ha) as HA'. pose proof (HB Hb) as HB'.
    pose proof (HC Hc) as HC'. pose proof (HD Hd) as HD'.
    split; [exact (HT1 Ht1 Ht1')|]. split; [exact (HT2 Ht2 Ht2')|].
    split; [split; [exact Hab|split; auto]|].
    split; [split; [exact Hcd|split; auto]|].
    exact (Hac HA' HC').
  - intros [HT1 [HT2 [Hab [Hcd Hos]]]].
    pose proof HT1 as [_ [_ HI]].
    destruct (ender_transversal_full_relaxed _ _ _ _ _ _ HI Hab Hcd Hos)
      as [_ [Hbab [HneAB [Hbcd [HneCD Hsides]]]]].
    pose proof Hab as [_ [HA HB]]. pose proof Hcd as [_ [HC HD]].
    split; [exact HI|]. split; [intros; exact HT1|].
    split; [intros; exact HT2|].
    split; [exact Hbab|]. split; [exact HneAB|].
    split; [intros; exact HA|]. split; [intros; auto|].
    split; [exact Hbcd|]. split; [exact HneCD|].
    split; [intros; exact HC|]. split; [intros; auto|].
    exact Hsides.
Qed.

(** Transfer a [Par] fact between the spellings that name a transversal's
    line: all three candidate name pairs lie on that line by the audited
    betweenness, so [par_col2_par] carries parallelism across the renaming
    in both directions.  Reading a fact needs only the line's two distinct
    points; concluding one in a crossing spelling needs that flank drawn. *)
Lemma line_name_par_out : forall s a b i1 X Y,
  line_name_matches s a b i1 = true ->
  Bet (point a) (point i1) (point b) -> point a <> point b ->
  Par X Y (point s.(segment_first)) (point s.(segment_second)) ->
  Par X Y (point a) (point b).
Proof.
  intros s a b i1 X Y Hm Hbet HneAB Hpar.
  assert (HcolI : Col (point a) (point i1) (point b))
    by (apply bet_col; assumption).
  unfold line_name_matches in Hm.
  apply orb_true_iff in Hm. destruct Hm as [Hm|Hm].
  - apply orb_true_iff in Hm. destruct Hm as [Hm|Hm].
    + apply segment_u_eqb_cases in Hm; destruct Hm as [->| ->];
        unfold reverse_segment in Hpar; cbn in Hpar;
        [assumption|now apply par_right_comm].
    + apply andb_true_iff in Hm. destruct Hm as [_ Hm].
      apply segment_u_eqb_cases in Hm; destruct Hm as [->| ->];
        unfold reverse_segment in Hpar; cbn in Hpar.
      * apply (par_col2_par X Y (point a) (point i1) (point a) (point b)
                 HneAB Hpar); Col.
      * apply (par_col2_par X Y (point i1) (point a) (point a) (point b)
                 HneAB Hpar); Col.
  - apply andb_true_iff in Hm. destruct Hm as [_ Hm].
    apply segment_u_eqb_cases in Hm; destruct Hm as [->| ->];
      unfold reverse_segment in Hpar; cbn in Hpar.
    + apply (par_col2_par X Y (point i1) (point b) (point a) (point b)
               HneAB Hpar); Col.
    + apply (par_col2_par X Y (point b) (point i1) (point a) (point b)
               HneAB Hpar); Col.
Qed.

Lemma line_name_par_in : forall s a b i1 X Y,
  line_name_matches s a b i1 = true ->
  Bet (point a) (point i1) (point b) ->
  (named_apart a i1 = true -> point a <> point i1) ->
  (named_apart b i1 = true -> point b <> point i1) ->
  Par X Y (point a) (point b) ->
  Par X Y (point s.(segment_first)) (point s.(segment_second)).
Proof.
  intros s a b i1 X Y Hm Hbet Ha Hb Hpar.
  assert (HcolI : Col (point a) (point i1) (point b))
    by (apply bet_col; assumption).
  unfold line_name_matches in Hm.
  apply orb_true_iff in Hm. destruct Hm as [Hm|Hm].
  - apply orb_true_iff in Hm. destruct Hm as [Hm|Hm].
    + apply segment_u_eqb_cases in Hm; destruct Hm as [->| ->];
        unfold reverse_segment; cbn;
        [assumption|now apply par_right_comm].
    + apply andb_true_iff in Hm. destruct Hm as [Hna Hm].
      pose proof (Ha Hna) as HneA.
      apply segment_u_eqb_cases in Hm; destruct Hm as [->| ->];
        unfold reverse_segment; cbn.
      * apply (par_col2_par X Y (point a) (point b) (point a) (point i1)
                 HneA Hpar); Col.
      * apply par_right_comm.
        apply (par_col2_par X Y (point a) (point b) (point a) (point i1)
                 HneA Hpar); Col.
  - apply andb_true_iff in Hm. destruct Hm as [Hnb Hm].
    assert (HneIB : point i1 <> point b) by (intro Heq; apply (Hb Hnb); auto).
    apply segment_u_eqb_cases in Hm; destruct Hm as [->| ->];
      unfold reverse_segment; cbn.
    + apply (par_col2_par X Y (point a) (point b) (point i1) (point b)
               HneIB Hpar); Col.
    + apply par_right_comm.
      apply (par_col2_par X Y (point a) (point b) (point i1) (point b)
               HneIB Hpar); Col.
Qed.

Lemma transversal_para_sound : forall s1 s2 pa pb pt1 pi1 pc pd pt2 pi2,
  transversal_lines_match s1 s2 pa pb pi1 pc pd pi2 = true ->
  Audit.TransversalConfiguration point pa pb pt1 pi1 pc pd pt2 pi2 ->
  Interp (Para s1 s2) ->
  Par (point pa) (point pb) (point pc) (point pd).
Proof.
  intros s1 s2 pa pb pt1 pi1 pc pd pt2 pi2 Hm Hcfg Hpara.
  pose proof Hcfg as Hcfg'. unfold Audit.TransversalConfiguration in Hcfg'.
  destruct Hcfg' as [_ [_ [_ [Hab [HneAB [_ [_ [Hcd [HneCD _]]]]]]]]].
  cbn in Hpara. unfold Audit.Parallel, Audit.seg_start,
    Audit.seg_end in Hpara. cbn in Hpara.
  unfold transversal_lines_match in Hm.
  apply orb_true_iff in Hm; destruct Hm as [Hm|Hm];
    apply andb_true_iff in Hm; destruct Hm as [H1 H2].
  - apply par_symmetry.
    apply (line_name_par_out s1 pa pb pi1 _ _ H1 Hab HneAB).
    apply par_symmetry.
    apply (line_name_par_out s2 pc pd pi2 _ _ H2 Hcd HneCD).
    exact Hpara.
  - apply par_symmetry.
    apply (line_name_par_out s2 pa pb pi1 _ _ H1 Hab HneAB).
    apply par_symmetry.
    apply (line_name_par_out s1 pc pd pi2 _ _ H2 Hcd HneCD).
    apply par_symmetry. exact Hpara.
Qed.

Lemma transversal_para_conclude : forall s1 s2 pa pb pt1 pi1 pc pd pt2 pi2,
  transversal_lines_match s1 s2 pa pb pi1 pc pd pi2 = true ->
  Audit.TransversalConfiguration point pa pb pt1 pi1 pc pd pt2 pi2 ->
  Par (point pa) (point pb) (point pc) (point pd) ->
  Interp (Para s1 s2).
Proof.
  intros s1 s2 pa pb pt1 pi1 pc pd pt2 pi2 Hm Hcfg Hpar.
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd _]]]].
  pose proof Hcfg as Hcfg'. unfold Audit.TransversalConfiguration in Hcfg'.
  destruct Hcfg' as [_ [_ [_ [Hab [_ [_ [_ [Hcd _]]]]]]]].
  cbn. unfold Audit.Parallel, Audit.seg_start, Audit.seg_end. cbn.
  unfold transversal_lines_match in Hm.
  apply orb_true_iff in Hm; destruct Hm as [Hm|Hm];
    apply andb_true_iff in Hm; destruct Hm as [H1 H2].
  - apply (line_name_par_in s2 pc pd pi2 _ _ H2 Hcd Hc Hd).
    apply par_symmetry.
    apply (line_name_par_in s1 pa pb pi1 _ _ H1 Hab Ha Hb).
    apply par_symmetry. exact Hpar.
  - apply (line_name_par_in s2 pa pb pi1 _ _ H1 Hab Ha Hb).
    apply par_symmetry.
    apply (line_name_par_in s1 pc pd pi2 _ _ H2 Hcd Hc Hd).
    exact Hpar.
Qed.

Lemma conga_pair_sound : forall x y a b,
  angle_pair_eqb x y a b = true ->
  Interp (ConAng x y) ->
  CongA (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last))
        (point b.(angle_first)) (point b.(angle_vertex)) (point b.(angle_last)).
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
  CongA (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last))
        (point b.(angle_first)) (point b.(angle_vertex)) (point b.(angle_last)) ->
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
  SuppA (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last))
        (point b.(angle_first)) (point b.(angle_vertex)) (point b.(angle_last)).
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
  SuppA (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last))
        (point b.(angle_first)) (point b.(angle_vertex)) (point b.(angle_last)) ->
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
    Audit.TransversalConfiguration point pa pb pt1 pi1 pc pd pt2 pi2.
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
  assert (Hpremise : pr.(premise_statement) = Transversal pa pb pt1 pi1 pc pd pt2 pi2).
  { unfold transversal_witness in Hwit.
    destruct pr.(premise_statement); try discriminate.
    now injection Hwit as <- <- <- <- <- <- <- <-. }
  rewrite Hpremise in Hpr. cbn in Hpr.
  exists pa, pb, pt1, pi1, pc, pd, pt2, pi2. split; assumption.
Qed.

Lemma altint_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  altint_conv_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold altint_conv_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hconga : Interp (ConAng a a0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc Hcfg]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ _ _ Hlines Hcfg).
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ender_transversal_converse _ _ _ _ _ _ _ _ Hrel HT1 HT2).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos ET1 ET2 EA EB EC ED.
  apply (ender_transversal_master_conv (point pi1) (point pi2)); try assumption.
  assert (HI : point pi1 <> point pi2) by (destruct Hrel as [HI _]; exact HI).
  unfold altint_pair in Hpairs. repeat rewrite orb_true_iff in Hpairs.
  destruct Hpairs as [[[Hm|Hm]|Hm]|Hm];
    repeat rewrite andb_true_iff in Hm; destruct Hm as [[Hg1 Hg2] Hm].
  - left. pose proof (conga_pair_sound _ _ _ _ Hm Hconga) as HC. cbn in HC.
    rewrite (EA (Ha Hg1)), (ED (Hd Hg2)). exact HC.
  - right. pose proof (conga_pair_sound _ _ _ _ Hm Hconga) as HC. cbn in HC.
    rewrite (EB (Hb Hg1)), (EC (Hc Hg2)). exact HC.
  - left.
    assert (Hwf1 : angle_well_formed point (angle_name pa pi1 pi2))
      by (cbn; split; [exact (Ha Hg1)|auto]).
    assert (Hwf2 : angle_well_formed point (angle_name pd pi2 pi1))
      by (cbn; split; [exact (Hd Hg2)|exact HI]).
    pose proof (conga_ray_pair_sound _ _ _ _ _ Hprem Hwf1 Hwf2 Hm Hconga) as HC.
    cbn in HC. rewrite (EA (Ha Hg1)), (ED (Hd Hg2)). exact HC.
  - right.
    assert (Hwf1 : angle_well_formed point (angle_name pb pi1 pi2))
      by (cbn; split; [exact (Hb Hg1)|auto]).
    assert (Hwf2 : angle_well_formed point (angle_name pc pi2 pi1))
      by (cbn; split; [exact (Hc Hg2)|exact HI]).
    pose proof (conga_ray_pair_sound _ _ _ _ _ Hprem Hwf1 Hwf2 Hm Hconga) as HC.
    cbn in HC. rewrite (EB (Hb Hg1)), (EC (Hc Hg2)). exact HC.
Qed.

Lemma altext_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  altext_conv_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold altext_conv_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hconga : Interp (ConAng a a0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc Hcfg]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ _ _ Hlines Hcfg).
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ender_transversal_converse _ _ _ _ _ _ _ _ Hrel HT1 HT2).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos ET1 ET2 EA EB EC ED.
  apply (ender_transversal_altext_conv T1' (point pi1) (point pi2) T2');
    try assumption.
  unfold altext_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm]; repeat rewrite andb_true_iff in Hm; destruct Hm as [[[[Hg1 Hg2] Hg3] Hg4] Hm];
    pose proof (conga_pair_sound _ _ _ _ Hm Hconga) as HC; cbn in HC;
    rewrite (ET1 (Ht1 Hg1)), (ET2 (Ht2 Hg2)).
  - left. rewrite (EA (Ha Hg3)), (ED (Hd Hg4)). exact HC.
  - right. rewrite (EB (Hb Hg3)), (EC (Hc Hg4)). exact HC.
Qed.

Lemma corresp_ang_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  corresp_ang_conv_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold corresp_ang_conv_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hconga : Interp (ConAng a a0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc Hcfg]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ _ _ Hlines Hcfg).
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ender_transversal_converse _ _ _ _ _ _ _ _ Hrel HT1 HT2).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos ET1 ET2 EA EB EC ED.
  apply (ender_transversal_corresp_conv T1' (point pi1) (point pi2) T2');
    try assumption.
  unfold corresp_pair in Hpairs. repeat rewrite orb_true_iff in Hpairs.
  destruct Hpairs as [[[Hm|Hm]|Hm]|Hm]; repeat rewrite andb_true_iff in Hm; destruct Hm as [[[Hg1 Hg2] Hg3] Hm];
    pose proof (conga_pair_sound _ _ _ _ Hm Hconga) as HC; cbn in HC.
  - left. rewrite (ET2 (Ht2 Hg1)), (EB (Hb Hg2)), (ED (Hd Hg3)). exact HC.
  - right; left.
    rewrite (ET2 (Ht2 Hg1)), (EA (Ha Hg2)), (EC (Hc Hg3)). exact HC.
  - right; right; left.
    rewrite (ET1 (Ht1 Hg1)), (EA (Ha Hg2)), (EC (Hc Hg3)). exact HC.
  - right; right; right.
    rewrite (ET1 (Ht1 Hg1)), (EB (Hb Hg2)), (ED (Hd Hg3)). exact HC.
Qed.

Lemma sameside_ang_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  sameside_ang_conv_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold sameside_ang_conv_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hsupp : Interp (Supplementary a a0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc Hcfg]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ _ _ Hlines Hcfg).
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ender_transversal_converse _ _ _ _ _ _ _ _ Hrel HT1 HT2).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos ET1 ET2 EA EB EC ED.
  apply (ender_transversal_sameside_conv T1' (point pi1) (point pi2) T2');
    try assumption.
  unfold sameside_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm]; repeat rewrite andb_true_iff in Hm; destruct Hm as [[Hg1 Hg2] Hm];
    pose proof (suppa_pair_sound _ _ _ _ Hm Hsupp) as HC; cbn in HC.
  - left. rewrite (EB (Hb Hg1)), (ED (Hd Hg2)). exact HC.
  - right. rewrite (EA (Ha Hg1)), (EC (Hc Hg2)). exact HC.
Qed.

Lemma def_radius_sound : forall facts i conclusion,
  Forall Interp facts -> def_radius_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold def_radius_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hr : Interp (Radius c p)) by (eapply lookup_step_sound; eauto).
  cbn in Hr. destruct Hr as [Hwf Hcong]. cbn in Hcong.
  eapply cong_pair_conclude; [exact Hrule|]. cbn. exact Hcong.
Qed.

Lemma con_chords_arcs_sound : forall facts i conclusion,
  Forall Interp facts -> con_chords_arcs_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold con_chords_arcs_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hc : Interp (ConArc a a0)) by (eapply lookup_step_sound; eauto).
  cbn in Hc.
  destruct Hc as [Hwf1 [Hwf2 [Hkind [Hrad Hconga]]]].
  destruct Hwf1 as [Hne1 [Hon11 Hon12]].
  destruct Hwf2 as [Hne2 [Hon21 Hon22]].
  destruct Hon11 as [_ HcX1]. destruct Hon12 as [_ HcY1].
  destruct Hon21 as [_ HcX2]. destruct Hon22 as [_ HcY2].
  cbn in HcX1, HcY1, HcX2, HcY2, Hrad, Hconga.
  assert (HOX : Cong (point (a.(arc_circle)).(circle_center)) (point a.(arc_first))
                     (point (a0.(arc_circle)).(circle_center)) (point a0.(arc_first))).
  { apply cong_transitivity with (point (a.(arc_circle)).(circle_center))
        (point (a.(arc_circle)).(circle_radius_point)); [exact HcX1|].
    apply cong_transitivity with (point (a0.(arc_circle)).(circle_center))
        (point (a0.(arc_circle)).(circle_radius_point)); [exact Hrad|Cong]. }
  assert (HOY : Cong (point (a.(arc_circle)).(circle_center)) (point a.(arc_second))
                     (point (a0.(arc_circle)).(circle_center)) (point a0.(arc_second))).
  { apply cong_transitivity with (point (a.(arc_circle)).(circle_center))
        (point (a.(arc_circle)).(circle_radius_point)); [exact HcY1|].
    apply cong_transitivity with (point (a0.(arc_circle)).(circle_center))
        (point (a0.(arc_circle)).(circle_radius_point)); [exact Hrad|Cong]. }
  destruct (l11_49 (point a.(arc_first)) (point (a.(arc_circle)).(circle_center))
              (point a.(arc_second)) (point a0.(arc_first))
              (point (a0.(arc_circle)).(circle_center)) (point a0.(arc_second))
              Hconga HOX HOY) as [Hchord _].
  eapply cong_pair_conclude; [exact Hrule|]. cbn. exact Hchord.
Qed.

Lemma tangent_perp_sound : forall facts i j conclusion,
  Forall Interp facts -> tangent_perp_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold tangent_perp_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hor].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hqp].
  apply andb_true_iff in Hrule. destruct Hrule as [Hcirc Hpp].
  unfold ascii_eqb in Hqp. apply Ascii.eqb_eq in Hqp. subst p.
  assert (Ht : Interp (Tangent c s1 p0)) by (eapply lookup_step_sound; eauto).
  cbn in Ht. destruct Ht as [Hsegwf [Honp [Hcol HQ]]].
  destruct Honp as [Hcwf Hcongp]. cbn in Hcwf, Hcongp, Hsegwf, Hcol.
  assert (Hpp1 : ascii_eqb p0 p0 = true)
    by (unfold ascii_eqb; apply Ascii.eqb_refl).
  assert (HOp : point (c.(circle_center)) <> point p0).
  { intro Heq. apply Hcwf.
    rewrite <- Heq in Hcongp.
    apply (cong_identity _ _ (point c.(circle_center))). Cong. }
  destruct HQ as [Q [Hdisj [HQne HPer]]].
  assert (Hcore : Interp (Perp (segment_name c.(circle_center) p0) s1 p0)).
  { destruct Hdisj as [HQ1|HQ2].
    - apply (perp_core_col _ _ _ s1.(segment_first) c.(circle_center)).
      + rewrite HQ1 in HQne. exact HQne.
      + exact HOp.
      + apply l8_2. rewrite HQ1 in HPer. exact HPer.
      + unfold endpoint_of, ascii_eqb. cbn. rewrite Ascii.eqb_refl.
        now rewrite orb_true_r.
      + unfold endpoint_of, ascii_eqb. cbn. now rewrite Ascii.eqb_refl.
      + unfold endpoint_of, ascii_eqb. now rewrite Ascii.eqb_refl.
      + exact Hsegwf.
      + exact Hcol.
    - apply (perp_core_col _ _ _ s1.(segment_second) c.(circle_center)).
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
  - assert (Hsw : Interp (Perp s1 (segment_name c.(circle_center) p0) p0)).
    { cbn in Hcore |- *. apply perp_in_sym. exact Hcore. }
    exact (proj2 (perp_at_realign s s0 s1 (segment_name c.(circle_center) p0) p0 p0
                    H1 H2 Hpp1) Hsw).
  - exact (proj2 (perp_at_realign s s0 (segment_name c.(circle_center) p0) s1 p0 p0
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hp : Interp (Parallelogram q)) by (eapply lookup_step_sound; eauto).
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  all: try old_names_eq Hlookup.
  assert (Hp : Interp (Parallelogram q)) by (eapply lookup_step_sound; eauto).
  cbn in Hp. destruct Hp as [Hwf [Hpar1 Hpar2]].
  destruct Hwf as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol Hex]]]]]]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol.
  pose proof (ender_pgram_opp_angles
    (point q.(quadrilateral_first)) (point q.(quadrilateral_second))
    (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth))
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [Heq Hmatch].
  assert (Hp : Interp (Parallelogram q))
    by (apply (relabel_closed (fun q => Interp (Parallelogram q)) pgram_rotated pgram_reversed q q0 Heq);
        eapply lookup_step_sound; eauto).
  clear Hx Heq q0. rename q into q0.
  assert (Hcseg : Interp (ConSeg s s0)) by (eapply lookup_step_sound; eauto).
  cbn in Hp. destruct Hp as [Hwfq [Hpar1 Hpar2]].
  pose proof Hwfq as Hwfcopy.
  destruct Hwfcopy as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol, HXac, HXbd.
  assert (Hadj :
    Cong (point q0.(quadrilateral_first)) (point q0.(quadrilateral_second))
         (point q0.(quadrilateral_second)) (point q0.(quadrilateral_third)) \/
    Cong (point q0.(quadrilateral_second)) (point q0.(quadrilateral_third))
         (point q0.(quadrilateral_third)) (point q0.(quadrilateral_fourth)) \/
    Cong (point q0.(quadrilateral_third)) (point q0.(quadrilateral_fourth))
         (point q0.(quadrilateral_fourth)) (point q0.(quadrilateral_first)) \/
    Cong (point q0.(quadrilateral_fourth)) (point q0.(quadrilateral_first))
         (point q0.(quadrilateral_first)) (point q0.(quadrilateral_second))).
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
  all: try old_names_eq Hlookup.
  assert (Hr : Interp (Rhombus q)) by (eapply lookup_step_sound; eauto).
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
  segment_u_eqb s (segment_name v w) = true ->
  segment_u_eqb s (segment_name w v) = true.
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
  angle_u_eqb a (angle_name p v q) = true ->
  segment_u_eqb s (segment_name v w) = true ->
  CongA (point p) (point v) (point w) (point w) (point v) (point q) ->
  Interp (AngBisect a s).
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
  angle_u_eqb a (angle_name p v q) = true ->
  bisector_ray decls premises s v c = true ->
  point p <> point v -> point q <> point v -> point c <> point v ->
  CongA (point p) (point v) (point c) (point c) (point v) (point q) ->
  Interp (AngBisect a s).
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
    exact (bisect_conclude a (segment_name v finish) v p q finish Hangle
             (segment_u_eqb_refl _) (bisect_transport p v q c finish Hp Hq Hout Hhalves)).
  - assert (Hout : Out (point v) (point start) (point c))
      by (apply (ray_linked_out premises v c start Hprem Hlink Hc); exact Hdistinct).
    exact (bisect_conclude a (segment_name start v) v p q start Hangle
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  all: try old_names_eq Hlookup.
  assert (Hr : Interp (Rhombus q)) by (eapply lookup_step_sound; eauto).
  cbn in Hr. destruct Hr as [[Hwf _] [Hab [Hbc Hcd]]].
  destruct Hwf as [HAB [HAC [HAD [HBC [HBD [HCD _]]]]]].
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end
    in Hab, Hbc, Hcd, HAB, HAC, HAD, HBC, HBD, HCD.
  cbn in Hab, Hbc, Hcd, HAB, HAC, HAD, HBC, HBD, HCD.
  (* the four sides are mutually congruent, so both triangles a diagonal cuts
     have congruent legs at either end *)
  assert (Hda : Cong (point q.(quadrilateral_first)) (point q.(quadrilateral_second))
                     (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first))).
  { apply (cong_transitivity _ _ (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth)));
      [now apply (cong_transitivity _ _ (point q.(quadrilateral_second)) (point q.(quadrilateral_third)))
      |exact Hcd]. }
  repeat rewrite orb_true_iff in Hrule.
  destruct Hrule as [[[Hcase|Hcase]|Hcase]|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Ha Hray].
  (* each diagonal bisects the two corners it runs between *)
  - apply (bisect_ray_conclude decls premises _ _ q.(quadrilateral_first) q.(quadrilateral_fourth)
             q.(quadrilateral_second) q.(quadrilateral_third) Hdecls Hprem Ha Hray);
      [now apply not_eq_sym|now apply not_eq_sym|now apply not_eq_sym|].
    apply ender_two_pairs_bisect; auto.
    + apply cong_symmetry, cong_right_commutativity, Hda.
    + apply cong_right_commutativity, cong_symmetry, Hbc.
  - apply (bisect_ray_conclude decls premises _ _ q.(quadrilateral_third) q.(quadrilateral_second)
             q.(quadrilateral_fourth) q.(quadrilateral_first) Hdecls Hprem Ha Hray);
      [exact HBC|now apply not_eq_sym|exact HAC|].
    apply ender_two_pairs_bisect; auto.
    + apply cong_left_commutativity, Hbc.
    + apply cong_right_commutativity, Hda.
  - apply (bisect_ray_conclude decls premises _ _ q.(quadrilateral_second) q.(quadrilateral_first)
             q.(quadrilateral_third) q.(quadrilateral_fourth) Hdecls Hprem Ha Hray);
      [exact HAB|now apply not_eq_sym|now apply not_eq_sym|].
    apply ender_two_pairs_bisect; auto.
    + apply cong_left_commutativity, Hab.
    + apply cong_symmetry, cong_left_commutativity, Hcd.
  - apply (bisect_ray_conclude decls premises _ _ q.(quadrilateral_fourth) q.(quadrilateral_third)
             q.(quadrilateral_first) q.(quadrilateral_second) Hdecls Hprem Ha Hray);
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
  pose proof ((proj1 (Forall_forall _ _)) Hfacts (Midpt s q) Hin) as Hmid.
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
  Audit.QuadrilateralWellFormed point q ->
  right_angle point (quad_corner_a q) ->
  right_angle point (quad_corner_b q) ->
  right_angle point (quad_corner_c q) ->
  right_angle point (quad_corner_d q) ->
  rectangle_corner_matches facts q a = true ->
  angle_well_formed point a /\ right_angle point a.
Proof.
  intros facts [A B C D] a Hfacts Hwf Hra Hrb Hrc Hrd Hmatch.
  unfold Audit.QuadrilateralWellFormed in Hwf. cbn in Hwf.
  unfold rectangle_corner_matches in Hmatch. cbn in Hra, Hrb, Hrc, Hrd, Hmatch |- *.
  destruct Hwf as [HAB [HAC [HAD [HBC [HBD [HCD _]]]]]].
  assert (Hwa : angle_well_formed point
      (quad_corner_a (quadrilateral_name A B C D))) by
    (unfold angle_well_formed; cbn; split; congruence).
  assert (Hwb : angle_well_formed point
      (quad_corner_b (quadrilateral_name A B C D))) by
    (unfold angle_well_formed; cbn; split; congruence).
  assert (Hwc : angle_well_formed point
      (quad_corner_c (quadrilateral_name A B C D))) by
    (unfold angle_well_formed; cbn; split; congruence).
  assert (Hwd : angle_well_formed point
      (quad_corner_d (quadrilateral_name A B C D))) by
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
  all: try old_names_eq Hlookup.
  assert (Hp : Interp (Parallelogram q)) by (eapply lookup_step_sound; eauto).
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [first|] eqn:Hi; try discriminate.
  destruct first; try discriminate.
  all: try old_names_eq Hi.
  destruct (lookup_step facts j) as [second|] eqn:Hj; try discriminate.
  destruct second; try discriminate.
  all: try old_names_eq Hj.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hmatch].
  assert (Hs1 : Interp (ConSeg s s0)) by (eapply lookup_step_sound; eauto).
  assert (Hs2 : Interp (ConSeg s1 s2)) by (eapply lookup_step_sound; eauto).
  pose proof (declared_quadrilateral_sound _ _ Hdecls Hdeclared) as Hwf.
  pose proof Hwf as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
  (* both opposite pairs, whichever order the two dependencies came in *)
  assert (Hsides :
    Cong (point q.(quadrilateral_first)) (point q.(quadrilateral_second))
         (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth)) /\
    Cong (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
         (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first))).
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
Definition kernel_angle (u : Audit.AngleName) : AngleName :=
  angle_name u.(Audit.angle_first) u.(Audit.angle_vertex) u.(Audit.angle_last).

Lemma same_angle_name_cases : forall (x : AngleName) (u : Audit.AngleName),
  Audit.SameAngleName x u ->
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
  all: try old_names_eq Hlookup.
  assert (Hk : Interp (KitePremise q a a0)) by (eapply lookup_step_sound; eauto).
  cbn in Hk. destruct Hk as [Hwf Hcase].
  pose proof Hwf as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
  destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [_ [_ Hdab]].
  apply (proj1 (fact_eqb_sound _ _ Hrule)).
  (* the premise names which two corners it makes congruent, up to how each is
     spelled, so read the congruence off those two and transport *)
  assert (Hselected : forall (x y : AngleName) (u v : Audit.AngleName),
      Audit.SameAnglePair x y u v ->
      Interp (ConAng (kernel_angle u) (kernel_angle v)) ->
      Interp (ConAng x y)).
  { intros x y u v [[Hx Hy]|[Hy Hx]] Hconga;
      apply same_angle_name_cases in Hx; apply same_angle_name_cases in Hy;
      apply (conga_pair_conclude _ _ (kernel_angle u) (kernel_angle v));
      try exact Hconga; unfold angle_pair_eqb; apply orb_true_iff;
      [left|right]; apply andb_true_iff; split; now apply angle_u_eqb_intro. }
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.quad_angle_a, Audit.quad_angle_b, Audit.quad_angle_c,
    Audit.quad_angle_d, Audit.seg_start, Audit.seg_end in Hcase.
  destruct Hcase as [[Hs1 [Hs2 Hpair]]|[Hs1 [Hs2 Hpair]]]; cbn in Hs1, Hs2, Hpair;
    apply (Hselected _ _ _ _ Hpair); cbn.
  - (* congruent sides meet at A and at C, so the corners at B and D agree *)
    destruct (ender_sss (point q.(quadrilateral_first)) (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
                (point q.(quadrilateral_first)) (point q.(quadrilateral_fourth)) (point q.(quadrilateral_third)))
      as [_ [_ [_ [_ [Hangle _]]]]].
    + exact Hncol.
    + now apply cong_right_commutativity.
    + now apply cong_right_commutativity.
    + apply cong_reflexivity.
    + now apply conga_right_comm.
  - (* congruent sides meet at B and at D, so the corners at A and C agree *)
    destruct (ender_sss (point q.(quadrilateral_first)) (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth))
                (point q.(quadrilateral_third)) (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth)))
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [first|] eqn:Hi; try discriminate.
  destruct first; try discriminate.
  all: try old_names_eq Hi.
  destruct (lookup_step facts j) as [second|] eqn:Hj; try discriminate.
  destruct second; try discriminate.
  all: try old_names_eq Hj.
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
  assert (Hsides : forall x y : AngleName, Interp (Supplementary x y) ->
    (consec_pair_eqb x y (quad_corner_b q) (quad_corner_c q) = true \/
     consec_pair_eqb x y (quad_corner_d q) (quad_corner_a q) = true) ->
    Interp (Para (quad_side_ab q) (quad_side_cd q))).
  { intros x y Hxy [Hm|Hm]; apply (proj2 (fact_eqb_sound _ _ Hm)) in Hxy;
      cbn in Hxy |- *; unfold Audit.Parallel, Audit.seg_start,
      Audit.seg_end; cbn.
    - exact (ender_pgram_from_consec_angles _ _ _ _ X Hncol HXac HXbd Hxy).
    - apply par_symmetry.
      apply (ender_pgram_from_consec_angles _ _ _ _ X Hcda
               (ender_bets_sym _ _ _ HXac) (ender_bets_sym _ _ _ HXbd) Hxy). }
  assert (Hsides' : forall x y : AngleName, Interp (Supplementary x y) ->
    (consec_pair_eqb x y (quad_corner_a q) (quad_corner_b q) = true \/
     consec_pair_eqb x y (quad_corner_c q) (quad_corner_d q) = true) ->
    Interp (Para (quad_side_bc q) (quad_side_da q))).
  { intros x y Hxy [Hm|Hm]; apply (proj2 (fact_eqb_sound _ _ Hm)) in Hxy;
      cbn in Hxy |- *; unfold Audit.Parallel, Audit.seg_start,
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [first|] eqn:Hi; try discriminate.
  destruct first; try discriminate.
  all: try old_names_eq Hi.
  destruct (lookup_step facts j) as [second|] eqn:Hj; try discriminate.
  destruct second; try discriminate.
  all: try old_names_eq Hj.
  apply andb_true_iff in Hrule. destruct Hrule as [Heq Hcorner].
  assert (Hright : Interp (Right a)) by (eapply lookup_step_sound; eauto).
  assert (Hp : Interp (Parallelogram q))
    by (apply (relabel_closed (fun q => Interp (Parallelogram q)) pgram_rotated pgram_reversed q q0 Heq);
        eapply lookup_step_sound; eauto).
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
    Per (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first)) (point q.(quadrilateral_second)) /\
    Per (point q.(quadrilateral_first)) (point q.(quadrilateral_second)) (point q.(quadrilateral_third)) /\
    Per (point q.(quadrilateral_second)) (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth)) /\
    Per (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first))).
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
    Audit.ang_end; cbn.
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
  all: try old_names_eq Hlookup.
  assert (Hr : Interp (Rectangle q)) by (eapply lookup_step_sound; eauto).
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
  all: try old_names_eq Hlookup.
  assert (Hr : Interp (Rectangle q)) by (eapply lookup_step_sound; eauto).
  cbn in Hr. destruct Hr as [Hp [Hra [Hrb [Hrc Hrd]]]].
  destruct Hp as [Hwf [Hpar1 Hpar2]].
  destruct conclusion; try discriminate. all: try old_names_goal.
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
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
  - assert (Hother : Par (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
                         (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first)))
      by (eapply ender_pgram_from_side; eauto).
    unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
    split; [exact HP|exact Hother].
  - assert (HXca : BetS (point q.(quadrilateral_third)) X (point q.(quadrilateral_first))).
    { destruct HXac as [Hb [Hd1 Hd2]].
      repeat split; [now apply between_symmetry| |];
        intro Heq; [apply Hd2|apply Hd1]; auto. }
    assert (Hncol2 : ~ Col (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
                           (point q.(quadrilateral_fourth))).
    { destruct (ender_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
        as [Hn _]. exact Hn. }
    assert (Hother : Par (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth))
                         (point q.(quadrilateral_first)) (point q.(quadrilateral_second)))
      by (eapply (ender_pgram_from_side (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
                    (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first)) X); eauto).
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hpara : Interp (Para s s0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc Hcfg]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _ _ _
                Hlines Hcfg Hpara) as HP.
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ender_transversal_forward _ _ _ _ _ _ _ _ _ Hrel HT1 HT2 HP).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos HP' ET1 ET2 EA EB EC ED.
  destruct (ender_transversal_master _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP') as [Hm1 Hm2].
  unfold altint_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm]; repeat rewrite andb_true_iff in Hm; destruct Hm as [[Hg1 Hg2] Hm];
    eapply conga_pair_conclude; try exact Hm; cbn.
  - rewrite (EA (Ha Hg1)), (ED (Hd Hg2)) in Hm1. exact Hm1.
  - rewrite (EB (Hb Hg1)), (EC (Hc Hg2)) in Hm2. exact Hm2.
Qed.

Lemma altext_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  altext_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold altext_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hpara : Interp (Para s s0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc Hcfg]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _ _ _
                Hlines Hcfg Hpara) as HP.
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ender_transversal_forward _ _ _ _ _ _ _ _ _ Hrel HT1 HT2 HP).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos HP' ET1 ET2 EA EB EC ED.
  destruct (ender_transversal_altext _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP') as [He1 He2].
  unfold altext_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm]; repeat rewrite andb_true_iff in Hm; destruct Hm as [[[[Hg1 Hg2] Hg3] Hg4] Hm];
    eapply conga_pair_conclude; try exact Hm; cbn;
    rewrite (ET1 (Ht1 Hg1)), (ET2 (Ht2 Hg2)) in *.
  - rewrite (EA (Ha Hg3)), (ED (Hd Hg4)) in He1. exact He1.
  - rewrite (EB (Hb Hg3)), (EC (Hc Hg4)) in He2. exact He2.
Qed.

Lemma corresp_ang_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  corresp_ang_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold corresp_ang_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hpara : Interp (Para s s0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc Hcfg]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _ _ _
                Hlines Hcfg Hpara) as HP.
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ender_transversal_forward _ _ _ _ _ _ _ _ _ Hrel HT1 HT2 HP).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos HP' ET1 ET2 EA EB EC ED.
  destruct (ender_transversal_corresp _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP') as [Hc1 [Hc2 [Hc3 Hc4]]].
  unfold corresp_pair in Hpairs. repeat rewrite orb_true_iff in Hpairs.
  destruct Hpairs as [[[Hm|Hm]|Hm]|Hm]; repeat rewrite andb_true_iff in Hm; destruct Hm as [[[Hg1 Hg2] Hg3] Hm];
    eapply conga_pair_conclude; try exact Hm; cbn.
  - rewrite (ET2 (Ht2 Hg1)), (EB (Hb Hg2)), (ED (Hd Hg3)) in Hc1. exact Hc1.
  - rewrite (ET2 (Ht2 Hg1)), (EA (Ha Hg2)), (EC (Hc Hg3)) in Hc2. exact Hc2.
  - rewrite (ET1 (Ht1 Hg1)), (EA (Ha Hg2)), (EC (Hc Hg3)) in Hc3. exact Hc3.
  - rewrite (ET1 (Ht1 Hg1)), (EB (Hb Hg2)), (ED (Hd Hg3)) in Hc4. exact Hc4.
Qed.

Lemma sameside_ang_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  sameside_ang_rule premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hfacts Hrule.
  unfold sameside_ang_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hpara : Interp (Para s s0)) by (eapply lookup_step_sound; eauto).
  destruct (transversal_premise_sound _ _ Hprem Hrule)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc Hcfg]]]]]]]]].
  apply andb_true_iff in Hc. destruct Hc as [Hlines Hpairs].
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _ _ _
                Hlines Hcfg Hpara) as HP.
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ender_transversal_forward _ _ _ _ _ _ _ _ _ Hrel HT1 HT2 HP).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos HP' ET1 ET2 EA EB EC ED.
  destruct (ender_transversal_sameside _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP') as [Hs1 Hs2].
  unfold sameside_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm]; repeat rewrite andb_true_iff in Hm; destruct Hm as [[Hg1 Hg2] Hm];
    eapply suppa_pair_conclude; try exact Hm; cbn.
  - rewrite (EB (Hb Hg1)), (ED (Hd Hg2)) in Hs1. exact Hs1.
  - rewrite (EA (Ha Hg1)), (EC (Hc Hg2)) in Hs2. exact Hs2.
Qed.

Lemma para_link_left : forall u v X Y,
  segment_u_eqb u v = true ->
  Par (point v.(segment_first)) (point v.(segment_second)) X Y ->
  Par (point u.(segment_first)) (point u.(segment_second)) X Y.
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  assert (Hp1 : Interp (Para s1 s2)) by (eapply lookup_step_sound; eauto).
  assert (Hp2 : Interp (Para s3 s4)) by (eapply lookup_step_sound; eauto).
  cbn in Hp1, Hp2.
  unfold Audit.Parallel, Audit.seg_start, Audit.seg_end
    in Hp1, Hp2; cbn in Hp1, Hp2.
  apply orb_true_iff in Hrule. destruct Hrule as [Hrule|Hcase4].
  2:{ apply andb_true_iff in Hcase4. destruct Hcase4 as [Hshared Hconc].
      eapply para_pair_conclude; [exact Hconc|]. cbn.
      apply ender_par_trans with (point s1.(segment_first)) (point s1.(segment_second)).
      - now apply par_symmetry.
      - apply (para_link_left s1 s4 _ _ Hshared).
        now apply par_symmetry. }
  apply orb_true_iff in Hrule. destruct Hrule as [Hrule|Hcase3].
  2:{ apply andb_true_iff in Hcase3. destruct Hcase3 as [Hshared Hconc].
      eapply para_pair_conclude; [exact Hconc|]. cbn.
      apply ender_par_trans with (point s1.(segment_first)) (point s1.(segment_second)).
      - now apply par_symmetry.
      - apply (para_link_left s1 s3 _ _ Hshared). exact Hp2. }
  apply orb_true_iff in Hrule. destruct Hrule as [Hcase1|Hcase2].
  - apply andb_true_iff in Hcase1. destruct Hcase1 as [Hshared Hconc].
    eapply para_pair_conclude; [exact Hconc|]. cbn.
    apply ender_par_trans with (point s2.(segment_first)) (point s2.(segment_second));
      [exact Hp1|].
    apply (para_link_left s2 s3 _ _ Hshared). exact Hp2.
  - apply andb_true_iff in Hcase2. destruct Hcase2 as [Hshared Hconc].
    eapply para_pair_conclude; [exact Hconc|]. cbn.
    apply ender_par_trans with (point s2.(segment_first)) (point s2.(segment_second));
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  apply andb_true_iff in Hrule. destruct Hrule as [Hends Hex].
  assert (Hd : Interp (Diameter c s)) by (eapply lookup_step_sound; eauto).
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
  assert (Hps : pr.(premise_statement) = InscribedAngle c' a').
  { unfold inscribed_witness in Hwit.
    destruct pr.(premise_statement); try discriminate.
    now injection Hwit as <- <-. }
  rewrite Hps in Hpr. cbn in Hpr.
  apply andb_true_iff in Hw. destruct Hw as [Hceq Haeq].
  apply circle_eqb_eq in Hceq. subst c'.
  destruct Hpr as [HonA [HonV [HonB Hawf]]].
  destruct HonV as [_ HcV]. cbn in HcV, Hawf.
  assert (Hmid : Midpoint (point (c.(circle_center)))
                   (point s.(segment_first)) (point s.(segment_second))).
  { split; [exact Hbet|].
    assert (Hse : Cong (point (c.(circle_center))) (point s.(segment_first))
                       (point (c.(circle_center))) (point s.(segment_second))).
    { apply cong_transitivity with (point (c.(circle_center)))
          (point (c.(circle_radius_point))); [exact Hc1|Cong]. }
    Cong. }
  apply angle_u_eqb_cases in Haeq.
  assert (HOV : Cong (point (c.(circle_center))) (point s.(segment_first))
                     (point (c.(circle_center))) (point (a.(angle_vertex)))).
  { assert (Hvx : point (a.(angle_vertex)) = point (a'.(angle_vertex)))
      by (destruct Haeq as [->| ->]; reflexivity).
    rewrite Hvx.
    apply cong_transitivity with (point (c.(circle_center)))
        (point (c.(circle_radius_point))); [exact Hc1|Cong]. }
  assert (Hper : Per (point s.(segment_first)) (point (a.(angle_vertex)))
                     (point s.(segment_second))).
  { apply (ender_thales _ _ _ (point (c.(circle_center)))); assumption. }
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [Hq Hdiag].
  assert (Hcong : Interp (ConSeg s s0)) by (eapply lookup_step_sound; eauto).
  assert (Htrap : Interp (TrapezoidPremise q s1 s2))
    by (apply (relabel_closed (fun q => Interp (TrapezoidPremise q s1 s2))
                 (trap_premise_rotated s1 s2) (trap_premise_reversed s1 s2)
                 q q0 Hq);
        eapply lookup_step_sound; eauto).
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
  Interp (Parallelogram q) ->
  exists X,
    ~ Col (point q.(quadrilateral_first)) (point q.(quadrilateral_second)) (point q.(quadrilateral_third)) /\
    BetS (point q.(quadrilateral_first)) X (point q.(quadrilateral_third)) /\
    BetS (point q.(quadrilateral_second)) X (point q.(quadrilateral_fourth)) /\
    Par (point q.(quadrilateral_first)) (point q.(quadrilateral_second))
        (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth)) /\
    Par (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
        (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first)).
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hmatch].
  pose proof (declared_quadrilateral_sound _ _ Hdecls Hdeclared) as Hwf.
  assert (Hc1 : Interp (ConAng a a0)) by (eapply lookup_step_sound; eauto).
  assert (Hc2 : Interp (ConAng a1 a2)) by (eapply lookup_step_sound; eauto).
  (* both pairs, whichever order the two dependencies came in *)
  assert (Hcorners :
    CongA (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first)) (point q.(quadrilateral_second))
          (point q.(quadrilateral_second)) (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth)) /\
    CongA (point q.(quadrilateral_first)) (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
          (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first))).
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
  Interp (IsosTrapezoidPremise q s1 s2) ->
  exists X,
    ~ Col (point q.(quadrilateral_first)) (point q.(quadrilateral_second)) (point q.(quadrilateral_third)) /\
    BetS (point q.(quadrilateral_first)) X (point q.(quadrilateral_third)) /\
    BetS (point q.(quadrilateral_second)) X (point q.(quadrilateral_fourth)) /\
    Cong (point q.(quadrilateral_first)) (point q.(quadrilateral_third))
         (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth)).
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [Hq Hmatch].
  assert (Hangles : Interp (ConAng a a0)) by (eapply lookup_step_sound; eauto).
  assert (Htrap : Interp (TrapezoidPremise q s s0))
    by (apply (relabel_closed (fun q => Interp (TrapezoidPremise q s s0))
                 (trap_premise_rotated s s0) (trap_premise_reversed s s0)
                 q q0 Hq);
        eapply lookup_step_sound; eauto).
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
  - assert (Hrot : Cong (point q.(quadrilateral_third)) (point q.(quadrilateral_first))
                        (point q.(quadrilateral_fourth)) (point q.(quadrilateral_second))).
    { apply (ender_isos_trap_con_diagonals _ _ _ _ X Hcda
               (ender_bets_sym _ _ _ HXac) (ender_bets_sym _ _ _ HXbd));
        [now apply par_symmetry|exact Hbase]. }
    Cong.
  - assert (Hrot : Cong (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth))
                        (point q.(quadrilateral_third)) (point q.(quadrilateral_first))).
    { apply (ender_isos_trap_con_diagonals _ _ _ _ X Hbcd HXbd
               (ender_bets_sym _ _ _ HXac));
        [exact Hparallel|exact Hbase]. }
    Cong.
  - assert (Hrot : Cong (point q.(quadrilateral_fourth)) (point q.(quadrilateral_second))
                        (point q.(quadrilateral_first)) (point q.(quadrilateral_third))).
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hpremise : Interp (IsosTrapezoidPremise q s s0))
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [Hq Hdiag].
  assert (Hcong : Interp (ConSeg s s0)) by (eapply lookup_step_sound; eauto).
  assert (Hp : Interp (Parallelogram q))
    by (apply (relabel_closed (fun q => Interp (Parallelogram q)) pgram_rotated pgram_reversed q q0 Hq);
        eapply lookup_step_sound; eauto).
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

(** What an [intersect_seg] premise of the two diagonals says, with the
    diagonals read in [q]'s own vertex order. *)
Lemma diagonals_cross_sound : forall q p st,
  diagonals_cross_statement q p st = true -> Interp st ->
  BetS (point q.(quadrilateral_first)) (point p) (point q.(quadrilateral_third)) /\
  BetS (point q.(quadrilateral_second)) (point p) (point q.(quadrilateral_fourth)).
Proof.
  intros [A B C D] p st Hmatch Hst.
  destruct st; try discriminate. cbn in Hmatch.
  apply andb_true_iff in Hmatch. destruct Hmatch as [Hp Hnames].
  unfold ascii_eqb in Hp. apply Ascii.eqb_eq in Hp. subst.
  cbn in Hst. destruct Hst as [Hs Ht].
  unfold names_diagonals, quad_diagonal_ac, quad_diagonal_bd in Hnames. cbn in Hnames.
  apply orb_true_iff in Hnames.
  destruct Hnames as [Hn|Hn]; apply andb_true_iff in Hn; destruct Hn as [H1 H2];
    apply segment_u_eqb_cases in H1; apply segment_u_eqb_cases in H2;
    destruct H1 as [H1|H1]; destruct H2 as [H2|H2]; subst;
    unfold reverse_segment in Hs, Ht; cbn in Hs, Ht; cbn;
    first [ split; assumption
          | split; [assumption|now apply ender_bets_sym]
          | split; [now apply ender_bets_sym|assumption]
          | split; now apply ender_bets_sym ].
Qed.

(** A fact stated of the two diagonals in [q]'s order holds of any spelling
    [names_diagonals] accepts, for the two symmetric relations the diagonal
    rules conclude. *)
Lemma perp_diagonals_conclude : forall q s t p,
  names_diagonals q s t = true ->
  Perp_at (point p) (point q.(quadrilateral_first)) (point q.(quadrilateral_third))
    (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth)) ->
  Interp (Perp s t p).
Proof.
  intros q s t p Hnames Hperp. unfold names_diagonals in Hnames.
  apply orb_true_iff in Hnames.
  destruct Hnames as [Hn|Hn]; apply andb_true_iff in Hn; destruct Hn as [H1 H2].
  - apply (proj2 (perp_at_realign _ _ _ _ p p H1 H2 (Ascii.eqb_refl p))).
    exact Hperp.
  - apply (proj2 (perp_at_realign _ _ _ _ p p H1 H2 (Ascii.eqb_refl p))).
    cbn. now apply perp_in_sym.
Qed.

Lemma bisect_diagonals_conclude : forall q s t p,
  names_diagonals q s t = true ->
  point q.(quadrilateral_first) <> point q.(quadrilateral_third) ->
  point q.(quadrilateral_second) <> point q.(quadrilateral_fourth) ->
  BetS (point q.(quadrilateral_first)) (point p) (point q.(quadrilateral_third)) ->
  BetS (point q.(quadrilateral_second)) (point p) (point q.(quadrilateral_fourth)) ->
  Midpoint (point p) (point q.(quadrilateral_first)) (point q.(quadrilateral_third)) ->
  Midpoint (point p) (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth)) ->
  Interp (SegBisect s t p).
Proof.
  intros [A B C D] s t p Hnames HAC HBD [Hac _] [Hbd _] Hmac Hmbd.
  unfold names_diagonals in Hnames. apply orb_true_iff in Hnames.
  destruct Hnames as [Hn|Hn]; apply andb_true_iff in Hn; destruct Hn as [H1 H2].
  - apply (proj2 (seg_bisect_realign _ _ _ _ p p H1 H2 (Ascii.eqb_refl p))).
    cbn in *. split; [exact HAC|split; [apply bet_col in Hac; Col|exact Hmbd]].
  - apply (proj2 (seg_bisect_realign _ _ _ _ p p H1 H2 (Ascii.eqb_refl p))).
    cbn in *. split; [exact HBD|split; [apply bet_col in Hbd; Col|exact Hmac]].
Qed.

Lemma diagonal_rule_parts_cases : forall r facts conclusion q s t p,
  diagonal_rule_parts r facts conclusion = Some (q, s, t, p) ->
  exists i,
    (conclusion = SegBisect s t p /\ lookup_step facts i = Some (Parallelogram q)) \/
    (conclusion = Perp s t p /\ lookup_step facts i = Some (Rhombus q)) \/
    (conclusion = Perp s t p /\
     exists a b, lookup_step facts i = Some (KitePremise q a b)).
Proof.
  intros r facts conclusion q s t p H. unfold diagonal_rule_parts in H.
  destruct r; cbn in H; try discriminate; destruct conclusion; cbn in H;
    try discriminate;
    match type of H with
    | match lookup_step facts ?n with _ => _ end = _ =>
        destruct (lookup_step facts n) as [dep|] eqn:Hl; try discriminate;
        destruct dep; try discriminate; inversion H; subst; exists n; eauto 10
    end.
Qed.

(** Two opposite corners each equidistant from the other two make the
    diagonals perpendicular where they cross. *)
Lemma equidistant_diagonals_perp : forall A B C D M,
  A <> C -> Cong A B A D -> Cong C B C D ->
  BetS A M C -> BetS B M D ->
  Perp_at M A C B D.
Proof.
  intros A B C D M HAC HA HC [HbetAC _] [HbetBD [HBM _]].
  apply ender_equidistant_line_perp_at; auto.
  apply bet_col in HbetAC. Col.
Qed.

(** Each forward diagonal rule from its dependency and the crossing premise:
    a parallelogram through [Plg]'s shared midpoint, and a rhombus or a kite
    because two opposite corners are each equidistant from the other two. *)
Lemma diagonal_rule_sound : forall premises facts r conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  diagonal_rule premises facts r conclusion = true -> Interp conclusion.
Proof.
  intros premises facts r conclusion Hprem Hfacts Hrule.
  unfold diagonal_rule in Hrule.
  destruct (diagonal_rule_parts r facts conclusion) as [[[[q s] t] p]|] eqn:Hparts;
    try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [Hnames Hon].
  rewrite premise_found_existsb in Hon.
  apply existsb_exists in Hon. destruct Hon as [pr [Hin Hmatch]].
  pose proof ((proj1 (@Forall_forall Premise (interp_premise point) premises))
                Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr. unfold diagonals_cross_premise in Hmatch.
  destruct (diagonals_cross_sound _ _ _ Hmatch Hpr) as [Hac Hbd].
  destruct (diagonal_rule_parts_cases _ _ _ _ _ _ _ Hparts)
    as [i [[-> Hl]|[[-> Hl]|[-> [a [b Hl]]]]]].
  - (* parallelogram: the diagonals bisect each other *)
    assert (Hp : Interp (Parallelogram q)) by (eapply lookup_step_sound; eauto).
    destruct q as [A B C D]. cbn in Hp, Hac, Hbd.
    destruct Hp as [Hwfq [Hpar1 Hpar2]].
    destruct Hwfq as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol _]]]]]]].
    unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
      cbn in Hpar1, Hpar2, Hncol, HAC, HBD.
    assert (Hcol1 : Col (point A) (point C) (point p))
      by (destruct Hac as [Hb _]; apply bet_col in Hb; Col).
    assert (Hcol2 : Col (point B) (point D) (point p))
      by (destruct Hbd as [Hb _]; apply bet_col in Hb; Col).
    destruct (ender_pgram_diagonals_bisect _ _ _ _ _ Hncol Hpar1 Hpar2 HBD
                Hcol1 Hcol2) as [Hm1 Hm2].
    exact (bisect_diagonals_conclude (quadrilateral_name A B C D) s t p
             Hnames HAC HBD Hac Hbd Hm1 Hm2).
  - (* rhombus: all four sides congruent, so A and C are equidistant from B, D *)
    assert (Hr : Interp (Rhombus q)) by (eapply lookup_step_sound; eauto).
    destruct q as [A B C D]. cbn in Hr, Hac, Hbd.
    destruct Hr as [[Hwfq _] [H1 [H2 H3]]].
    destruct Hwfq as [_ [HAC _]].
    unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end in H1, H2, H3;
      cbn in H1, H2, H3, HAC.
    apply (perp_diagonals_conclude (quadrilateral_name A B C D));
      [exact Hnames|]. cbn.
    apply equidistant_diagonals_perp; auto.
    + apply cong_transitivity with (point B) (point C); [exact H1|].
      apply cong_transitivity with (point C) (point D); [exact H2|]. Cong.
    + Cong.
  - (* kite: one diagonal joins the two corners equidistant from the others *)
    assert (Hk : Interp (KitePremise q a b)) by (eapply lookup_step_sound; eauto).
    destruct q as [A B C D]. cbn in Hk, Hac, Hbd.
    destruct Hk as [Hwfq Hcase].
    destruct Hwfq as [_ [HAC [_ [_ [HBD _]]]]].
    unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end in Hcase;
      cbn in Hcase, HAC, HBD.
    apply (perp_diagonals_conclude (quadrilateral_name A B C D));
      [exact Hnames|]. cbn.
    destruct Hcase as [[H1 [H2 _]]|[H1 [H2 _]]].
    + apply equidistant_diagonals_perp; auto; Cong.
    + apply perp_in_sym, equidistant_diagonals_perp; auto; Cong.
Qed.

Lemma rhombus_diag_perp_conv_sound : forall facts i j conclusion,
  Forall Interp facts ->
  rhombus_diag_perp_conv_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold rhombus_diag_perp_conv_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [Hq Hmatch].
  assert (Hperp : Interp (Perp s s0 p)) by (eapply lookup_step_sound; eauto).
  assert (Hp : Interp (Parallelogram q))
    by (apply (relabel_closed (fun q => Interp (Parallelogram q)) pgram_rotated pgram_reversed q q0 Hq);
        eapply lookup_step_sound; eauto).
  destruct (pgram_figure q Hp) as [X [Hncol [HXac [HXbd [Hpar1 Hpar2]]]]].
  cbn in Hperp. apply perp_in_perp in Hperp.
  assert (Hdiag : Definitions.Perp (point q.(quadrilateral_first)) (point q.(quadrilateral_third))
                                   (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth))).
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hmatch].
  apply andb_true_iff in Hrule. destruct Hrule as [Hdeclared Hsame].
  apply Ascii.eqb_eq in Hsame. subst p0.
  pose proof (declared_quadrilateral_sound _ _ Hdecls Hdeclared) as Hwf.
  pose proof Hwf as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol _]]]]]]]. cbn in Hncol.
  assert (Hb1 : Interp (SegBisect s s0 p))
    by (eapply lookup_step_sound; eauto).
  assert (Hb2 : Interp (SegBisect s1 s2 p))
    by (eapply lookup_step_sound; eauto).
  cbn in Hb1, Hb2.
  destruct Hb1 as [_ [_ Hmid1]]. destruct Hb2 as [_ [_ Hmid2]].
  assert (Hdiagonals :
    Midpoint (point p) (point q.(quadrilateral_first)) (point q.(quadrilateral_third)) /\
    Midpoint (point p) (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth))).
  { apply orb_true_iff in Hmatch.
    assert (Hmove : forall (s t : SegmentName),
        segment_u_eqb s t = true ->
        Midpoint (point p) (point s.(segment_first)) (point s.(segment_second)) ->
        Midpoint (point p) (point t.(segment_first)) (point t.(segment_second))).
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [_ Hhalves].
  match goal with
  | Hy : lookup_step _ _ = Some (Midpt ?sg ?pt) |- _ =>
      assert (Hmid : Interp (Midpt sg pt))
        by (eapply lookup_step_sound; eauto)
  end.
  cbn in Hmid. destruct Hmid as [_ Hcong].
  eapply cong_pair_conclude; [exact Hhalves|cbn; exact Hcong].
Qed.

(** The tangent meaning hides which endpoint carries the right angle behind an
    existential.  Naming the far endpoint pins it down: the point of tangency
    is excluded by the meaning's own [Q <> p], so nothing else is left. *)
Lemma tangent_far_point : forall c s p e,
  segment_u_eqb s (segment_name p e) = true ->
  Interp (Tangent c s p) ->
  Per (point c.(circle_center)) (point p) (point e) /\ point e <> point p.
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hlines].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hshape].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hfoot].
  apply andb_true_iff in Hrule. destruct Hrule as [Hcircle Htouch].
  apply circle_eqb_eq in Hcircle. subst c0.
  unfold ascii_eqb in Htouch, Hfoot.
  apply Ascii.eqb_eq in Htouch. apply Ascii.eqb_eq in Hfoot. subst p1 p0.
  assert (Hperp : Interp (Perp s0 s1 p)) by (eapply lookup_step_sound; eauto).
  assert (Hradius : Interp (Radius c p)) by (eapply lookup_step_sound; eauto).
  assert (Hfigure : Interp (Perp s (segment_name c.(circle_center) p) p)).
  { apply orb_true_iff in Hlines.
    destruct Hlines as [Hm|Hm]; apply andb_true_iff in Hm;
      destruct Hm as [H1 H2].
    - exact (proj1 (perp_at_realign s0 s1 s (segment_name c.(circle_center) p) p p
                     H1 H2 (Ascii.eqb_refl p)) Hperp).
    - cbn. apply perp_in_sym.
      exact (proj1 (perp_at_realign s0 s1 (segment_name c.(circle_center) p) s p p
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hconc].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hshape'].
  apply andb_true_iff in Hrule. destruct Hrule as [Hcircle Hshape].
  apply circle_eqb_eq in Hcircle. subst c0.
  assert (Ht1 : Interp (Tangent c s1 p)) by (eapply lookup_step_sound; eauto).
  assert (Ht2 : Interp (Tangent c s2 p0)) by (eapply lookup_step_sound; eauto).
  pose proof Ht1 as Hon1. pose proof Ht2 as Hon2.
  cbn in Hon1, Hon2.
  destruct Hon1 as [_ [[_ Hr1] _]]. destruct Hon2 as [_ [[_ Hr2] _]].
  destruct (tangent_far_point _ _ _ _ Hshape Ht1) as [Hper1 _].
  destruct (tangent_far_point _ _ _ _ Hshape' Ht2) as [Hper2 _].
  apply (cong_pair_conclude _ _ (segment_name p (other_endpoint p s1))
                                (segment_name p0 (other_endpoint p s1)));
    [exact Hconc|cbn].
  apply (ender_tangents_congruent (point c.(circle_center)));
    [now apply l8_2|now apply l8_2|].
  apply cong_transitivity with (point c.(circle_center)) (point c.(circle_radius_point));
    [Cong|Cong].
Qed.

Lemma radius_chord_bisect_sound : forall facts i j k conclusion,
  Forall Interp facts ->
  radius_chord_bisect_rule facts i j k conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j k conclusion Hfacts Hrule.
  unfold radius_chord_bisect_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  destruct (lookup_step facts k) as [z|] eqn:Hz; try discriminate;
    destruct z; try discriminate.
  all: try old_names_eq Hz.
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hchordline].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Htarget].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hperpline].
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Hbisector].
  apply andb_true_iff in Hrule. destruct Hrule as [Hcircle Hfoot].
  apply circle_eqb_eq in Hcircle. subst c0.
  unfold ascii_eqb in Hfoot. apply Ascii.eqb_eq in Hfoot. subst p0.
  assert (Hperp : Interp (Perp s1 s2 p)) by (eapply lookup_step_sound; eauto).
  assert (Hch : Interp (Chord c s3)) by (eapply lookup_step_sound; eauto).
  assert (Hfigure : Interp (Perp (segment_name c.(circle_center) p) s3 p))
    by (exact (proj1 (perp_at_realign s1 s2 (segment_name c.(circle_center) p) s3 p p
                       Hperpline Hchordline (Ascii.eqb_refl p)) Hperp)).
  cbn in Hfigure.
  destruct Hfigure as [Hcentre [Hchordwf [_ [Hcol Hright]]]].
  cbn in Hch. destruct Hch as [_ [[_ Hone] [_ Htwo]]].
  assert (Hmid : Midpoint (point p) (point s3.(segment_first))
                          (point s3.(segment_second))).
  { apply (ender_chord_foot_midpoint (point c.(circle_center)));
      [exact Hchordwf|Col| | |].
    - apply l8_2, Hright; [apply col_trivial_1|apply col_trivial_1].
    - apply l8_2, Hright; [apply col_trivial_1|apply col_trivial_3].
    - apply cong_transitivity with (point c.(circle_center)) (point c.(circle_radius_point));
        [exact Hone|Cong]. }
  apply (proj2 (seg_bisect_realign s s0 (segment_name c.(circle_center) p) s3 p p
                 Hbisector Htarget (Ascii.eqb_refl p))).
  cbn. split; [exact Hcentre|]. split; [apply col_trivial_2|exact Hmid].
Qed.

(** The audited parallelogram says the same thing about every rotation of its
    name, so a rule that reads the figure from one corner can be run at each
    of the four in turn. *)
Lemma pgram_rotate : forall q, Interp (Parallelogram q) -> Interp (Parallelogram (rotate_quad q)).
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

Lemma rhomb_rotate : forall q, Interp (Rhombus q) -> Interp (Rhombus (rotate_quad q)).
Proof.
  intros q Hr. pose proof Hr as Hp. cbn in Hr, Hp.
  destruct Hp as [Hp _]. destruct Hr as [_ [Hab [Hbc Hcd]]].
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hab, Hbc, Hcd; cbn in *.
  cbn. split; [now apply pgram_rotate|].
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
  repeat split; [exact Hbc|exact Hcd|].
  apply cong_transitivity with (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth)); [Cong|].
  apply cong_transitivity with (point q.(quadrilateral_second)) (point q.(quadrilateral_third)); Cong.
Qed.

(** Which of the two ways the bisector premise can be spelled does not matter:
    naming the ray from the far end, or the corner backwards, only commutes
    the two halves it claims are congruent. *)
Lemma bisector_corner_conga : forall a s r,
  bisector_at_corner a s r = true ->
  point r.(quadrilateral_first) <> point r.(quadrilateral_third) ->
  Interp (AngBisect a s) ->
  CongA (point r.(quadrilateral_second)) (point r.(quadrilateral_first)) (point r.(quadrilateral_third))
        (point r.(quadrilateral_third)) (point r.(quadrilateral_first)) (point r.(quadrilateral_fourth)).
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
  Interp (AngBisect a s) -> Interp (Parallelogram r) -> Interp (Rhombus r).
Proof.
  intros r a s Hmatch Hbis Hp.
  destruct (pgram_figure r Hp) as [X [Hncol [HXac [HXbd [Hpar1 Hpar2]]]]].
  pose proof Hp as Hwf. cbn in Hwf. destruct Hwf as [Hwf _].
  assert (Hne : point r.(quadrilateral_first) <> point r.(quadrilateral_third))
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
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  destruct (lookup_step facts k) as [z|] eqn:Hz; try discriminate;
    destruct z; try discriminate.
  all: try old_names_eq Hz.
  apply andb_true_iff in Hrule. destruct Hrule as [Hq Hsearch].
  assert (Hb1 : Interp (AngBisect a s)) by (eapply lookup_step_sound; eauto).
  assert (Hb2 : Interp (AngBisect a0 s0)) by (eapply lookup_step_sound; eauto).
  assert (Hp : Interp (Parallelogram q))
    by (apply (relabel_closed (fun q => Interp (Parallelogram q)) pgram_rotated pgram_reversed q q0 Hq);
        eapply lookup_step_sound; eauto).
  apply existsb_exists in Hsearch. destruct Hsearch as [rot [Hin Hmatch]].
  assert (Hstep : forall r, Interp (Parallelogram r) ->
      (bisector_at_corner a s r &&
       bisector_at_corner a0 s0 (rotate_quad (rotate_quad r))) = true ->
      Interp (Rhombus r)).
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
Definition similar_angles (t u : TriangleName) : Prop :=
  CongA (point t.(triangle_second)) (point t.(triangle_first)) (point t.(triangle_third))
        (point u.(triangle_second)) (point u.(triangle_first)) (point u.(triangle_third)) /\
  CongA (point t.(triangle_first)) (point t.(triangle_second)) (point t.(triangle_third))
        (point u.(triangle_first)) (point u.(triangle_second)) (point u.(triangle_third)) /\
  CongA (point t.(triangle_first)) (point t.(triangle_third)) (point t.(triangle_second))
        (point u.(triangle_first)) (point u.(triangle_third)) (point u.(triangle_second)).

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
    Audit.ang_start, Audit.ang_vertex, Audit.ang_end; cbn.
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
  unfold aa_sim in Hrule. destruct conclusion; try discriminate. all: try old_names_goal.
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

Lemma endpoint_of_cases : forall p s, endpoint_of p s = true ->
  p = s.(segment_first) \/ p = s.(segment_second).
Proof.
  intros p s H. unfold endpoint_of, ascii_eqb in H.
  apply orb_true_iff in H. destruct H as [H|H]; apply Ascii.eqb_eq in H; auto.
Qed.

Lemma places_on_circle_sound : forall c p st,
  Interp st -> places_on_circle c p st = true ->
  Audit.OnCircle point c p.
Proof.
  intros c p st Hst H.
  destruct st; cbn in H; try discriminate.
  all: unfold ascii_eqb in *.
  all: repeat match type of H with
    | (_ && _)%bool = true => apply andb_true_iff in H; destruct H as [Hc H]
    end.
  all: try (apply circle_eqb_eq in Hc; subst).
  all: cbn in Hst.
  - (* tangent *)
    apply Ascii.eqb_eq in H. subst. destruct Hst as [_ [Hon _]]. exact Hon.
  - (* chord *)
    apply endpoint_of_cases in H. destruct Hst as [_ [H1 H2]].
    destruct H as [->| ->]; assumption.
  - (* arc *)
    apply orb_true_iff in H. destruct Hst as [_ [H1 H2]].
    destruct H as [H|H]; apply Ascii.eqb_eq in H; subst; assumption.
  - (* radius *)
    apply Ascii.eqb_eq in H. subst. exact Hst.
  - (* diameter *)
    apply endpoint_of_cases in H. destruct Hst as [[_ [H1 H2]] _].
    destruct H as [->| ->]; assumption.
  - (* inscribed angle *)
    rewrite !orb_true_iff in H. destruct Hst as [H1 [H2 [H3 _]]].
    destruct H as [[H|H]|H]; apply Ascii.eqb_eq in H; subst; assumption.
  - (* on_circle *)
    apply Ascii.eqb_eq in H. subst. exact Hst.
  - (* minor inscribed angle *)
    rewrite !orb_true_iff in H. destruct Hst as [[H1 [H2 [H3 _]]] _].
    destruct H as [[H|H]|H]; apply Ascii.eqb_eq in H; subst; assumption.
  - (* major inscribed angle *)
    rewrite !orb_true_iff in H. destruct Hst as [[H1 [H2 [H3 _]]] _].
    destruct H as [[H|H]|H]; apply Ascii.eqb_eq in H; subst; assumption.
  - (* congruent arcs *)
    destruct Hst as [[_ [Ha1 Ha2]] [[_ [Hb1 Hb2]] _]].
    apply orb_true_iff in H.
    destruct H as [H|H]; apply andb_true_iff in H; destruct H as [Hc H];
      apply circle_eqb_eq in Hc; subst; apply orb_true_iff in H;
      destruct H as [H|H]; apply Ascii.eqb_eq in H; subst; assumption.
Qed.

(** The conclusion is the [on_circle] fact itself, read as [radius]: the two
    have the same audited meaning, and the [center_on_line] dependency is
    the textbook's reason for calling the segment a radius. *)
Lemma def_radius_conv_sound : forall premises facts i conclusion,
  Forall (interp_premise point) premises ->
  def_radius_conv_rule premises facts i conclusion = true -> Interp conclusion.
Proof.
  intros premises facts i conclusion Hprem Hrule.
  unfold def_radius_conv_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|]; try discriminate;
    destruct x; try discriminate.
  apply andb_true_iff in Hrule. destruct Hrule as [_ Hon].
  rewrite premise_found_existsb in Hon.
  apply existsb_exists in Hon. destruct Hon as [pr [Hin Hmatch]].
  pose proof ((proj1 (@Forall_forall Premise (interp_premise point) premises))
                Hprem pr Hin) as Hpr.
  exact (places_on_circle_sound _ _ _ Hpr Hmatch).
Qed.

(** Inscribed angles, through [Inscribed.v]: GeoCoq's proofs of Euclid
    III.21 and III.22 with its two axiom-dependent lemmas re-proved.  The
    audited minor and major forms exclude a chord through the centre, so the
    vertex's side of the chord is the centre's side or the other one. *)
Lemma ender_inscribed_same_side : forall O R A B P Q,
  Cong O A O R -> Cong O B O R -> Cong O P O R -> Cong O Q O R ->
  ((OS A B O P /\ OS A B O Q) \/ (TS A B O P /\ TS A B O Q)) ->
  CongA A P B A Q B.
Proof.
  intros O R A B P Q HA HB HP HQ Hsides.
  assert (Hcop : Coplanar A B P O).
  { destruct Hsides as [[H _]|[H _]];
      [apply os__coplanar in H|apply ts__coplanar in H]; Cop. }
  assert (Hos : OS A B P Q).
  { destruct Hsides as [[HOP HOQ]|[HOP HOQ]].
    - apply one_side_transitivity with O; [apply one_side_symmetry|]; assumption.
    - apply l9_8_1 with O; apply l9_2; assumption. }
  apply (Inscribed.EnderInscribed.cop_onc4_os__conga O R A B P Q); assumption.
Qed.

Lemma ender_inscribed_opposite_sides : forall O R A B P Q,
  Cong O A O R -> Cong O B O R -> Cong O P O R -> Cong O Q O R ->
  OS A B O P -> TS A B O Q -> SuppA A P B A Q B.
Proof.
  intros O R A B P Q HA HB HP HQ HOP HOQ.
  assert (Hcop : Coplanar A B P O) by (apply os__coplanar in HOP; Cop).
  assert (Hts : TS A B P Q) by (apply l9_8_2 with O; assumption).
  apply (Inscribed.EnderInscribed.cop_onc4_ts__suppa O R A B P Q); assumption.
Qed.

(** The two angles' chord, read in [b]'s order, is [a]'s chord one way or
    the other. *)
Lemma same_chord_cases : forall a b, same_chord a b = true ->
  (b.(angle_first) = a.(angle_first) /\ b.(angle_last) = a.(angle_last)) \/
  (b.(angle_first) = a.(angle_last) /\ b.(angle_last) = a.(angle_first)).
Proof.
  intros a b H. unfold same_chord, ascii_eqb in H.
  apply orb_true_iff in H.
  destruct H as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
    apply Ascii.eqb_eq in H1, H2; auto.
Qed.

Lemma con_inscribed_angs_sound : forall facts i j conclusion,
  Forall Interp facts ->
  con_inscribed_angs_rule facts i j conclusion = true -> Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold con_inscribed_angs_rule in Hrule.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate;
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: apply andb_true_iff in Hrule; destruct Hrule as [Hrule Hconc];
    apply andb_true_iff in Hrule; destruct Hrule as [Hcircle Hchord];
    apply circle_eqb_eq in Hcircle; subst;
    apply (proj2 (fact_eqb_sound _ _ Hconc));
    assert (Hi := lookup_step_sound _ _ _ Hfacts Hx);
    assert (Hj := lookup_step_sound _ _ _ Hfacts Hy);
    cbn in Hi, Hj; unfold Audit.circ_center in *;
    destruct Hi as [[[_ Ha1] [[_ Hav] [[_ Ha2] _]]] Hsa];
    destruct Hj as [[[_ Hb1] [[_ Hbv] [[_ Hb2] _]]] Hsb];
    cbn; unfold Audit.ang_start, Audit.ang_vertex, Audit.ang_end in *;
    apply same_chord_cases in Hchord;
    destruct Hchord as [[Hf Hl]|[Hf Hl]]; rewrite Hf, Hl in *.
  - eapply ender_inscribed_same_side; eauto.
  - apply conga_right_comm. eapply ender_inscribed_same_side; eauto.
    left. split; [assumption|apply invert_one_side; assumption].
  - eapply ender_inscribed_same_side; eauto.
  - apply conga_right_comm. eapply ender_inscribed_same_side; eauto.
    right. split; [assumption|apply invert_two_sides; assumption].
Qed.

Lemma supplementary_inscribed_angs_sound : forall facts i j conclusion,
  Forall Interp facts ->
  supplementary_inscribed_angs_rule facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold supplementary_inscribed_angs_rule in Hrule.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate;
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: apply andb_true_iff in Hrule; destruct Hrule as [Hrule Hconc];
    apply andb_true_iff in Hrule; destruct Hrule as [Hcircle Hchord];
    apply circle_eqb_eq in Hcircle; subst;
    apply (proj2 (fact_eqb_sound _ _ Hconc));
    assert (Hi := lookup_step_sound _ _ _ Hfacts Hx);
    assert (Hj := lookup_step_sound _ _ _ Hfacts Hy);
    cbn in Hi, Hj; unfold Audit.circ_center in *;
    destruct Hi as [[[_ Ha1] [[_ Hav] [[_ Ha2] _]]] Hsa];
    destruct Hj as [[[_ Hb1] [[_ Hbv] [[_ Hb2] _]]] Hsb];
    cbn; unfold Audit.ang_start, Audit.ang_vertex, Audit.ang_end in *;
    apply same_chord_cases in Hchord;
    destruct Hchord as [[Hf Hl]|[Hf Hl]]; rewrite Hf, Hl in *.
  - eapply ender_inscribed_opposite_sides; eauto.
  - apply suppa_right_comm. eapply ender_inscribed_opposite_sides; eauto.
    apply invert_two_sides; assumption.
  - apply suppa_sym. eapply ender_inscribed_opposite_sides; eauto.
  - apply suppa_sym, suppa_left_comm.
    eapply ender_inscribed_opposite_sides; eauto.
    apply invert_one_side; assumption.
Qed.

(** Everything below assumes the plane, which only [chord_bisect_conv]
    needs: in three dimensions the points equidistant from a chord's ends
    fill a plane, not a line. *)
Context {T2D : @Tarski_2D Tn TnEQD}.

Lemma ender_center_on_bisector : forall X Y A B M O,
  X <> Y -> Col X Y M -> Midpoint M A B -> Perp_at M X Y A B ->
  Cong O A O B -> Col X Y O.
Proof.
  intros X Y A B M O HXY HcolM Hmid Hperp Hcong.
  destruct (eq_dec_points O M) as [->|HOM]; [exact HcolM|].
  assert (HAB : A <> B) by (destruct Hperp as [_ [HAB _]]; exact HAB).
  assert (HMA : M <> A).
  { intro HeqMA. subst M. apply HAB. apply is_midpoint_id. exact Hmid. }
  assert (HperO : Per O M A) by (exists B; split; [exact Hmid|exact Hcong]).
  destruct Hperp as [_ [_ [_ [_ Hall]]]].
  destruct (eq_dec_points X M) as [HXM|HXM].
  - subst M.
    assert (HperY : Per Y X A) by (apply Hall; [apply col_trivial_3|apply col_trivial_1]).
    assert (Hcol : Col O Y X) by (apply per2__col with A; auto).
    Col.
  - assert (HperX : Per X M A) by (apply Hall; [apply col_trivial_1|apply col_trivial_1]).
    assert (Hcol : Col O X M) by (apply per2__col with A; auto).
    ColR.
Qed.

Lemma chord_bisect_conv_sound : forall facts i j conclusion,
  Forall Interp facts ->
  chord_bisect_conv_rule facts i j conclusion = true -> Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  unfold chord_bisect_conv_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate;
    destruct y; try discriminate.
  all: try old_names_eq Hy.
  apply andb_true_iff in Hrule. destruct Hrule as [Hrule Htarget].
  apply andb_true_iff in Hrule. destruct Hrule as [Hcircle Hline].
  apply circle_eqb_eq in Hcircle. subst c0.
  assert (Hpb : Interp (PerpBisector s0 s1 p)) by (eapply lookup_step_sound; eauto).
  assert (Hch : Interp (Chord c s2)) by (eapply lookup_step_sound; eauto).
  cbn in Hpb, Hch.
  destruct Hpb as [[Hwf [Hcol Hmid]] Hperp].
  destruct Hch as [_ [[Hcwf Hone] [_ Htwo]]].
  (* The chord's ends are as far from the centre as each other. *)
  assert (Hcong : Cong (point c.(circle_center)) (point s1.(segment_first))
                       (point c.(circle_center)) (point s1.(segment_second))).
  { unfold Audit.circ_center in Hone, Htwo.
    apply segment_u_eqb_cases in Htarget.
    destruct Htarget as [->| ->]; cbn;
      apply cong_transitivity with (point c.(circle_center))
                                   (point c.(circle_radius_point)).
    - exact Hone.
    - apply cong_symmetry. exact Htwo.
    - exact Htwo.
    - apply cong_symmetry. exact Hone. }
  pose proof (ender_center_on_bisector _ _ _ _ _ _ Hwf Hcol Hmid Hperp Hcong)
    as Hcentre.
  cbn. split; [exact Hcwf|].
  apply segment_u_eqb_cases in Hline.
  destruct Hline as [->| ->]; cbn; split; auto; Col.
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
  - destruct conclusion; try discriminate. all: try old_names_goal.
    + apply (proj2 (ref_seg_iff _ _ Hvalid)).
      apply segment_u_eqb_cases in Hvalid. destruct Hvalid as [Hvalid|Hvalid].
      * subst. cbn. apply cong_reflexivity.
      * subst. unfold reverse_segment. cbn. apply cong_pseudo_reflexivity.
    + (* the declaration is what makes the two rays nondegenerate *)
      apply andb_true_iff in Hvalid. destruct Hvalid as [Hsame Hdeclared].
      apply (proj2 (ref_ang_iff _ _ Hsame)).
      apply (declared_angle_sound _ _ Hwf) in Hdeclared.
      apply angle_u_eqb_cases in Hsame.
      destruct Hsame as [Heq|Heq]; subst a;
        [destruct Hdeclared as [Hl Hr]; cbn; now apply conga_refl|].
      unfold reverse_angle in Hdeclared |- *. cbn in Hdeclared |- *.
      destruct Hdeclared as [Hl Hr]. now apply conga_pseudo_refl.
  - eapply criterion_conclusion_sound;
      [exact Hwf|exact Hprem|exact Hfacts|exact sas_schema_sound|exact Hvalid].
  - eapply criterion_conclusion_sound;
      [exact Hwf|exact Hprem|exact Hfacts|exact sss_schema_sound|exact Hvalid].
  - eapply criterion_conclusion_sound;
      [exact Hwf|exact Hprem|exact Hfacts|exact asa_schema_sound|exact Hvalid].
  - eapply criterion_conclusion_sound;
      [exact Hwf|exact Hprem|exact Hfacts|exact aas_schema_sound|exact Hvalid].
  - eapply cpctc_rule_sound; eauto.
  - eapply con_seg_transitive_sound; eauto.
  - eapply con_ang_transitive_sound; eauto.
  - eapply con_tri_transitive_sound; eauto.
  - eapply def_con_right_sound; eauto.
  - eapply perp_con_ang_sound; eauto.
  - eapply def_midpt_sound; eauto.
  - eapply vert_ang_sound; eauto.
  - eapply def_ang_bisect_sound; eauto.
  - eapply ang_bisect_conv_sound; eauto.
  - eapply criterion_conclusion_sound;
      [exact Hwf|exact Hprem|exact Hfacts|exact rhl_schema_sound|exact Hvalid].
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
  - eapply linear_pair_conv_sound; eauto.
  - eapply diagonal_rule_sound; eauto.
  - eapply diagonal_rule_sound; eauto.
  - eapply diagonal_rule_sound; eauto.
  - eapply chord_bisect_conv_sound; eauto.
  - eapply def_radius_conv_sound; eauto.
  - eapply con_inscribed_angs_sound; eauto.
  - eapply supplementary_inscribed_angs_sound; eauto.
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

Lemma crossing_segments_sound : forall pr s,
  interp_premise point pr -> In s (crossing_segments pr) ->
  point s.(segment_first) <> point s.(segment_second).
Proof.
  intros pr s Hpr Hin. unfold crossing_segments in Hin. unfold interp_premise in Hpr.
  destruct (premise_statement pr); try contradiction.
  cbn in Hpr. destruct Hpr as [[Hb1 [Hb2 Hb3]] [Hc1 [Hc2 Hc3]]].
  cbn in Hin.
  repeat (destruct Hin as [<-|Hin]; [cbn; first [assumption | now apply sym_not_eq
         | intro Heq; rewrite Heq in *; apply between_identity in Hb1; congruence
         | intro Heq; rewrite Heq in *; apply between_identity in Hc1; congruence]|]).
  contradiction.
Qed.

Lemma kernel_declarations_well_formed : forall decls premises,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  declarations_well_formed point (kernel_declarations decls premises).
Proof.
  intros decls premises [Ht [Ha [Hq [Hc Hs]]]] Hprem.
  split; [exact Ht|split; [exact Ha|split; [exact Hq|split; [exact Hc|]]]].
  intros s Hin. cbn in Hin. apply in_app_or in Hin. destruct Hin as [Hin|Hin].
  - now apply Hs.
  - apply in_flat_map in Hin. destruct Hin as [pr [Hpr Hin]].
    eapply crossing_segments_sound; [|exact Hin].
    exact (proj1 (Forall_forall _ _) Hprem pr Hpr).
Qed.

Theorem check_problem_sound : forall p,
  check_problem p = true ->
  declarations_well_formed point p.(problem_declarations) ->
  Forall (interp_premise point) p.(problem_premises) ->
  Interp p.(problem_goal).
Proof.
  intros p Hcheck Hwf0 Hprem. unfold check_problem in Hcheck.
  pose proof (kernel_declarations_well_formed _ _ Hwf0 Hprem) as Hwf.
  destruct (check_steps (kernel_declarations (problem_declarations p) (problem_premises p))
            (problem_premises p) []
            (problem_steps p)) as [facts|] eqn:Hsteps; try discriminate.
  apply existsb_exists in Hcheck. destruct Hcheck as [goal [Hin Heq]].
  pose proof (check_steps_sound _ _ _ _ _ Hwf Hprem (Forall_nil _) Hsteps) as Hall.
  apply (proj2 (fact_eqb_sound _ _ Heq)).
  eapply Forall_forall; eauto.
Qed.

End Soundness.
