From Stdlib Require Import List String Bool Lia PeanoNat.
Require Import GeoCoq.Main.Tarski_dev.Ch11_angles.
Require Import GeoCoq.Main.Tarski_dev.Ch12_parallel.
Require Import GeoCoq.Main.Annexes.suma.
Require Import Ghost.Syntax Ghost.Geometry Ghost.Semantics.
Require Ghost.Inscribed.
Require Ghost.Euclidean.
Require Ghost.Similarity.
Import ListNotations.
Import GhostSyntax.

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
  | InscribedAngle c a, InscribedAngle c' a' =>
      circle_eqb c c' && angle_eqb a a'
  | OnCirclePoint c p, OnCirclePoint c' p' => circle_eqb c c' && ascii_eqb p p'
  | CenterOnLine c s, CenterOnLine c' s' => circle_eqb c c' && segment_eqb s s'
  | ConArc a b, ConArc a' b' => arc_eqb a a' && arc_eqb b b'
  | _, _ => false
  end.

Definition lookup_step (facts : list Statement) (index : nat) : option Statement :=
  match index with O => None | S n => nth_error facts n end.

(** A dependency read where a rule needs a parallelogram: a rhombus or a
    rectangle is one, since the audited meaning of each begins with
    [IsParallelogram], so it is read as the parallelogram it names.  Only a
    slot that a rule matches against [Parallelogram] may use this; a slot that
    needs a rhombus or a rectangle reads the step with [lookup_step], so a
    plain parallelogram can never stand in for either. *)
Definition lookup_pgram (facts : list Statement) (index : nat) : option Statement :=
  match lookup_step facts index with
  | Some (Rhombus q) | Some (Rectangle q) => Some (Parallelogram q)
  | other => other
  end.

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

(** Two points the declarations make distinct: the ends of a declared
    segment, or two different vertices of a declared triangle or
    quadrilateral.  A well-formed triangle or quadrilateral has pairwise
    distinct vertices, so a figure that names [PR] only as a side of [t_QPR]
    need not repeat it on a [seg:] line. *)
Definition declared_distinct (decls : Declarations) (x y : PointId) : bool :=
  let vertices_of (vs : list PointId) :=
    existsb (ascii_eqb x) vs && existsb (ascii_eqb y) vs in
  negb (ascii_eqb x y) &&
  (declared_segment decls (segment_name x y) ||
   existsb (fun t => vertices_of [t.(triangle_first); t.(triangle_second);
                                  t.(triangle_third)])
     decls.(decl_triangles) ||
   existsb (fun q => vertices_of [q.(quadrilateral_first); q.(quadrilateral_second);
                                  q.(quadrilateral_third); q.(quadrilateral_fourth)])
     decls.(decl_quadrilaterals)).

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

(** ** One spelling per angle

    An angle may be named through any point on each of its rays: with
    [on_line(PR, T)], [a_QPT] and [a_QPR] are the same angle.  For checking
    only, each angle is given one canonical spelling: each ray is named by
    the least point, in character order, that the diagram premises place on
    it.  Steps, facts and reports keep the spelling the proof wrote; the
    canonical one is used to compare them.

    The points a ray can be named through are the ones the premises link
    to it, followed in chains: [U] on [PT] and [T] on [PR] put [U], [T] and
    [R] on one ray from [P].  A point counts only when it is known to differ
    from the vertex -- [on_line] and [intersect_seg] place their point
    strictly inside the segment, and declarations can say so too -- which is
    what makes the renaming an [Out] fact. *)
Definition statement_ray_points (s : Statement) : list PointId :=
  match s with
  | OnLine t r | Midpt t r => [t.(segment_first); t.(segment_second); r]
  | IntersectSeg t u r =>
      [t.(segment_first); t.(segment_second); u.(segment_first); u.(segment_second); r]
  | _ => []
  end.

Definition ray_points (premises : list Premise) : list PointId :=
  flat_map (fun pr => statement_ray_points pr.(premise_statement)) premises.

(** A link through a premise that places its point strictly inside a
    segment, as [on_line] and [intersect_seg] do: both linked points then
    differ from the vertex. *)
Definition strict_ray_link (v p q : PointId) (pr : Premise) : bool :=
  match pr.(premise_statement) with
  | OnLine t r => on_segment_match v p q t r
  | IntersectSeg t u r => on_segment_match v p q t r || on_segment_match v p q u r
  | _ => false
  end.

Definition strict_ray_linked (premises : list Premise) (v p q : PointId) : bool :=
  premise_found (strict_ray_link v p q) premises.

(** The points one premise links to the ray from [v] through [y], each
    known to differ from [v]: declared apart from it, or placed by a strict
    premise. *)
Definition ray_step (decls : Declarations) (premises : list Premise) (v y : PointId)
    : list PointId :=
  filter (fun x => (declared_distinct decls v x || strict_ray_linked premises v y x) &&
                   ray_linked premises v y x)
         (ray_points premises).

(** Whether [p] is known to differ from [v], so that a ray from [v] through
    it exists to be renamed. *)
Definition ray_anchored (decls : Declarations) (premises : list Premise) (v p : PointId)
    : bool :=
  declared_distinct decls v p ||
  existsb (strict_ray_linked premises v p) (ray_points premises).

Fixpoint ray_grow (fuel : nat) (step : PointId -> list PointId) (seen : list PointId)
    : list PointId :=
  match fuel with
  | O => seen
  | S n =>
      match filter (fun x => negb (existsb (ascii_eqb x) seen)) (flat_map step seen) with
      | [] => seen
      | fresh => ray_grow n step (seen ++ fresh)
      end
  end.

(** Every point on the ray from [v] through [p], [p] included. *)
Definition ray_class (decls : Declarations) (premises : list Premise) (v p : PointId)
    : list PointId :=
  if ray_anchored decls premises v p
  then ray_grow (S (List.length (ray_points premises))) (ray_step decls premises v) [p]
  else [p].

Definition point_ltb (x y : PointId) : bool :=
  Nat.ltb (Ascii.nat_of_ascii x) (Ascii.nat_of_ascii y).

Definition least_point (p : PointId) (xs : list PointId) : PointId :=
  fold_left (fun m x => if point_ltb x m then x else m) xs p.

Definition ray_rep (decls : Declarations) (premises : list Premise) (v p : PointId)
    : PointId :=
  least_point p (ray_class decls premises v p).

Definition canonical_angle (decls : Declarations) (premises : list Premise)
    (a : AngleName) : AngleName :=
  let v := a.(angle_vertex) in
  angle_name (ray_rep decls premises v a.(angle_first)) v
             (ray_rep decls premises v a.(angle_last)).

(** A segment from [v], read as the ray it names. *)
Definition canonical_ray (decls : Declarations) (premises : list Premise)
    (v : PointId) (s : SegmentName) : SegmentName :=
  if ascii_eqb s.(segment_first) v
  then segment_name v (ray_rep decls premises v s.(segment_second))
  else if ascii_eqb s.(segment_second) v
  then segment_name (ray_rep decls premises v s.(segment_first)) v
  else s.

(** The statements whose meaning depends only on their angles' rays.  The
    rest -- among them [ref_ang], whose meaning names the angle, and
    [linear_pair] and [inscribed_angle], which place points -- keep their
    spelling. *)
Definition canonical_statement (decls : Declarations) (premises : list Premise)
    (st : Statement) : Statement :=
  let ang := canonical_angle decls premises in
  match st with
  | Right a => Right (ang a)
  | ConAng a b => ConAng (ang a) (ang b)
  | ConRight a b => ConRight (ang a) (ang b)
  | Supplementary a b => Supplementary (ang a) (ang b)
  | Complementary a b => Complementary (ang a) (ang b)
  | AngBisect a s => AngBisect (ang a) (canonical_ray decls premises a.(angle_vertex) s)
  | _ => st
  end.

(** Whether two statements are the same once their angles are spelled
    canonically. *)
Definition canonical_eqb (decls : Declarations) (premises : list Premise)
    (expected actual : Statement) : bool :=
  fact_eqb (canonical_statement decls premises expected)
           (canonical_statement decls premises actual).

(** Every spelling of an angle through points on its rays. *)
Definition angle_spellings (decls : Declarations) (premises : list Premise)
    (a : AngleName) : list AngleName :=
  let v := a.(angle_vertex) in
  flat_map (fun p => map (fun q => angle_name p v q)
                         (ray_class decls premises v a.(angle_last)))
           (ray_class decls premises v a.(angle_first)).

(** Every spelling of a statement, the written one first.  A rule builds
    the angles it expects from the figure -- a triangle's corners, a
    quadrilateral's -- so a conclusion is tried in each spelling, not only
    the canonical one. *)
Definition statement_spellings (decls : Declarations) (premises : list Premise)
    (st : Statement) : list Statement :=
  let angs := angle_spellings decls premises in
  let pairs (k : AngleName -> AngleName -> Statement) a b :=
    flat_map (fun a' => map (k a') (angs b)) (angs a) in
  match st with
  | Right a => map Right (angs a)
  | ConAng a b => pairs ConAng a b
  | ConRight a b => pairs ConRight a b
  | Supplementary a b => pairs Supplementary a b
  | Complementary a b => pairs Complementary a b
  | _ => [st]
  end.

(** The premises that put two points of one ray class on the same ray: the
    ones a renaming of [st]'s angles leaned on. *)
Definition ray_class_premises (decls : Declarations) (premises : list Premise)
    (v p : PointId) : list Statement :=
  let cls := ray_class decls premises v p in
  map premise_statement
    (filter (fun pr => existsb (fun y => existsb (fun x =>
                 negb (ascii_eqb x y) && ray_link_premise v y x pr) cls) cls)
            premises).

Definition angle_ray_premises (decls : Declarations) (premises : list Premise)
    (a : AngleName) : list Statement :=
  ray_class_premises decls premises a.(angle_vertex) a.(angle_first) ++
  ray_class_premises decls premises a.(angle_vertex) a.(angle_last).

Definition statement_ray_premises (decls : Declarations) (premises : list Premise)
    (st : Statement) : list Statement :=
  let angs := angle_ray_premises decls premises in
  match st with
  | Right a => angs a
  | ConAng a b | ConRight a b | Supplementary a b | Complementary a b => angs a ++ angs b
  | AngBisect a s =>
      angs a ++
      (if ascii_eqb s.(segment_first) a.(angle_vertex)
       then ray_class_premises decls premises a.(angle_vertex) s.(segment_second)
       else if ascii_eqb s.(segment_second) a.(angle_vertex)
       then ray_class_premises decls premises a.(angle_vertex) s.(segment_first)
       else [])
  | _ => []
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

(** A triangle read from its last vertex back to its first. *)
Definition reverse_triangle (t : TriangleName) : TriangleName :=
  triangle_name t.(triangle_third) t.(triangle_second) t.(triangle_first).

(** The first of [xs] for which [f] finds the premises a match used. *)
Definition first_used {A : Type} (f : A -> option (list Statement)) (xs : list A)
    : option (list Statement) :=
  fold_right (fun x rest => match f x with Some p => Some p | None => rest end)
    None xs.

(** Declaring [t_ABC] asserts that its vertices are noncollinear, and that is
    invariant under renaming the triangle's vertices. *)
Definition triangle_permutations (t : TriangleName) : list TriangleName :=
  [ triangle_name t.(triangle_first) t.(triangle_second) t.(triangle_third); triangle_name t.(triangle_first) t.(triangle_third) t.(triangle_second)
  ; triangle_name t.(triangle_second) t.(triangle_first) t.(triangle_third); triangle_name t.(triangle_second) t.(triangle_third) t.(triangle_first)
  ; triangle_name t.(triangle_third) t.(triangle_first) t.(triangle_second); triangle_name t.(triangle_third) t.(triangle_second) t.(triangle_first) ].

Definition triangle_declared (decls : Declarations) (t : TriangleName) : bool :=
  existsb (fun d => triangle_mem t (triangle_permutations d))
          decls.(decl_triangles).

(** The six readings of a pair of triangles: the three rotations of the
    correspondence as written, and of its reversal.  A criterion's citation
    order fixes which vertex plays which role, so all six are tried. *)
Definition correspondences (t u : TriangleName) : list (TriangleName * TriangleName) :=
  let r := rotate_triangle in
  let t' := reverse_triangle t in
  let u' := reverse_triangle u in
  [ (t, u); (r t, r u); (r (r t), r (r u))
  ; (t', u'); (r t', r u'); (r (r t'), r (r u')) ].

Definition declared_pair (decls : Declarations) (t u : TriangleName) : bool :=
  triangle_declared decls t && triangle_declared decls u.

(** The parts a congruence criterion cites, for one correspondence.  [aas]
    and [rhl] accept two orders. *)
Definition sas_parts (t u : TriangleName) : list (list Statement) :=
  [[ConSeg (side_ab t) (side_ab u); ConAng (angle_a t) (angle_a u);
    ConSeg (side_ca t) (side_ca u)]].
Definition sss_parts (t u : TriangleName) : list (list Statement) :=
  [[ConSeg (side_ab t) (side_ab u); ConSeg (side_bc t) (side_bc u);
    ConSeg (side_ca t) (side_ca u)]].
Definition asa_parts (t u : TriangleName) : list (list Statement) :=
  [[ConAng (angle_a t) (angle_a u); ConSeg (side_ab t) (side_ab u);
    ConAng (angle_b t) (angle_b u)]].
Definition aas_parts (t u : TriangleName) : list (list Statement) :=
  [[ConAng (angle_c t) (angle_c u); ConAng (angle_b t) (angle_b u);
    ConSeg (side_ab t) (side_ab u)];
   [ConAng (angle_b t) (angle_b u); ConAng (angle_c t) (angle_c u);
    ConSeg (side_ab t) (side_ab u)]].
(** Right-hypotenuse-leg.  The bundled fixtures disagree about whether the
    hypotenuse or the leg is cited second, so both orders are accepted; two
    legs are not. *)
Definition rhl_parts (t u : TriangleName) : list (list Statement) :=
  [[ConRight (angle_b t) (angle_b u); ConSeg (side_ca t) (side_ca u);
    ConSeg (side_bc t) (side_bc u)];
   [ConRight (angle_b t) (angle_b u); ConSeg (side_bc t) (side_bc u);
    ConSeg (side_ca t) (side_ca u)]].
Definition def_con_tri_parts (t u : TriangleName) : list (list Statement) :=
  [[ConSeg (side_ab t) (side_ab u); ConSeg (side_bc t) (side_bc u);
    ConSeg (side_ca t) (side_ca u); ConAng (angle_a t) (angle_a u);
    ConAng (angle_b t) (angle_b u); ConAng (angle_c t) (angle_c u)]].

(** What [cpctc] needs from an unordered [con_tri] is a correspondence, and
    the statement does not carry one.  The facts already established can: a
    correspondence is witnessed when a congruence criterion's three parts, or
    an ordered congruence, are among them, read in any of the six ways. *)
Definition supported decls premises (facts : list Statement)
    (expected : Statement) : bool :=
  existsb (dependency_matches decls premises expected) facts.

(** The part lists of the five criteria, as one list of readings. *)
Definition criterion_readings (t u : TriangleName) : list (list Statement) :=
  sas_parts t u ++ sss_parts t u ++ asa_parts t u ++ aas_parts t u ++ rhl_parts t u.

Definition reading_witnessed decls premises facts (t u : TriangleName) : bool :=
  existsb (forallb (supported decls premises facts)) (criterion_readings t u) ||
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
      existsb (fun u' => is_cpctc_fact t u' conclusion &&
                         chain_witnessed decls premises facts t u')
              (triangle_orderings u)
  | _ => false
  end.

(** Reject impossible conclusions before searching correspondence chains.  The
    search order changes no result, including on rejected steps. *)
Lemma cpctc_conclusion_prefilter_equivalent : forall decls premises facts t u conclusion,
  existsb (fun u' => is_cpctc_fact t u' conclusion &&
                    chain_witnessed decls premises facts t u') (triangle_orderings u) =
  existsb (fun u' => chain_witnessed decls premises facts t u' &&
                    is_cpctc_fact t u' conclusion) (triangle_orderings u).
Proof.
  intros. assert (H : forall (f g : TriangleName -> bool) l,
    existsb (fun x => f x && g x) l = existsb (fun x => g x && f x) l).
  { intros f g l. induction l; cbn; [reflexivity|].
    rewrite (andb_comm (f a) (g a)), IHl. reflexivity. }
  apply H.
Qed.

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
    names, so the checker can decide which disjunct is available.  [far] is
    the ray's other endpoint. *)
Definition bisector_halves (a : AngleName) (far : PointId) : Statement :=
  ConAng (angle_name a.(angle_first) a.(angle_vertex) far)
         (angle_name far a.(angle_vertex) a.(angle_last)).

(** The halves may be named through any points along their rays, as a cited
    congruence may: with [on_line(PR, T)], the bisector [PR] halves [a_QPS]
    into [a_QPT] and [a_TPS]. *)
Definition def_ang_bisect (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (i : nat) (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (AngBisect a s) =>
      (ascii_eqb s.(segment_first) a.(angle_vertex) &&
        dependency_matches decls premises conclusion (bisector_halves a s.(segment_second))) ||
      (ascii_eqb s.(segment_second) a.(angle_vertex) &&
        dependency_matches decls premises conclusion (bisector_halves a s.(segment_first)))
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

(** A [proportion] fact read as the expected four lengths, in any spelling
    its meaning cannot tell apart: either end of a segment first, the two
    ratios exchanged, or both ratios inverted. *)
Definition proportion_matches (a b c d : SegmentName) (st : Statement) : bool :=
  match st with
  | Proportion a' b' c' d' =>
      let reads w x y z :=
        segment_u_eqb w a' && segment_u_eqb x b' &&
        segment_u_eqb y c' && segment_u_eqb z d' in
      reads a b c d || reads c d a b || reads b a d c || reads d c b a
  | _ => false
  end.

(** Corresponding angles of similar triangles are congruent.  [sim_tri]
    pairs the vertices in the order they are written, so, as for an ordered
    congruence in [cpctc], the angles at matching positions correspond.  The
    angles are spelled as the audited similarity spells them. *)
Definition sim_tri_angles (t u : TriangleName) : list Statement :=
  [ ConAng (Audit.angle_a t) (Audit.angle_a u)
  ; ConAng (Audit.angle_b t) (Audit.angle_b u)
  ; ConAng (Audit.angle_c t) (Audit.angle_c u)
  ].

Definition castc_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_step facts i with
  | Some (SimTri t u) =>
      existsb (fun expected => fact_eqb expected conclusion) (sim_tri_angles t u)
  | _ => false
  end.

(** Similarity is transitive.  As for an ordered congruence, the triangles
    must be shared exactly, since the vertex order states the
    correspondence; [SimTri] is symmetric, so either may be the shared one. *)
Definition similarity_pair (s : Statement) : option (TriangleName * TriangleName) :=
  match s with SimTri a b => Some (a, b) | _ => None end.

Definition sim_tri_transitive facts i j conclusion : bool :=
  transitive_rule triangle_eqb SimTri similarity_pair facts i j conclusion.

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

(** ** Angle pairs with a fixed total

    [supplementary] and [complementary] say that two angles' measures add up
    to a straight angle or a right angle.  Their rules are the same, so each
    is written once, over [pair], the statement, and [pair_of], which reads
    one back from a cited step. *)
Definition supplementary_pair (s : Statement) : option (AngleName * AngleName) :=
  match s with Supplementary a b => Some (a, b) | _ => None end.
Definition complementary_pair (s : Statement) : option (AngleName * AngleName) :=
  match s with Complementary a b => Some (a, b) | _ => None end.

Section AnglePairs.
Context (pair : AngleName -> AngleName -> Statement)
        (pair_of : Statement -> option (AngleName * AngleName)).

Definition cited_pair (facts : list Statement) (i : nat)
    : option (AngleName * AngleName) :=
  match lookup_step facts i with Some s => pair_of s | None => None end.

(** Two pairs give a congruence between their other angles when their
    partners are [linked].  Either angle of each pair may be the partner. *)
Definition partners_link (linked : AngleName -> AngleName -> bool)
    (a b c d : AngleName) (conclusion : Statement) : bool :=
  (linked b d && fact_eqb (ConAng a c) conclusion) ||
  (linked b c && fact_eqb (ConAng a d) conclusion) ||
  (linked a d && fact_eqb (ConAng b c) conclusion) ||
  (linked a c && fact_eqb (ConAng b d) conclusion).

(** Angles paired with congruent angles are congruent: the third citation
    is the congruence between the partners. *)
Definition congruent_partners_rule (facts : list Statement) (i j k : nat)
    (conclusion : Statement) : bool :=
  match cited_pair facts i, cited_pair facts j, lookup_step facts k with
  | Some (a, b), Some (c, d), Some witness =>
      partners_link (fun x y => fact_eqb (ConAng x y) witness) a b c d conclusion
  | _, _, _ => false
  end.

(** Angles paired with the same angle are congruent. *)
Definition shared_partner_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match cited_pair facts i, cited_pair facts j with
  | Some (a, b), Some (c, d) => partners_link angle_u_eqb a b c d conclusion
  | _, _ => false
  end.

(** A pair carries across a congruence of either of its angles:
    [pair(A, B)] and [con_ang(B, C)] give [pair(A, C)]. *)
Definition substitute_link (keep old x y : AngleName) (conclusion : Statement) : bool :=
  (angle_u_eqb old x && fact_eqb (pair keep y) conclusion) ||
  (angle_u_eqb old y && fact_eqb (pair keep x) conclusion).

Definition substitute_rule (facts : list Statement) (i j : nat)
    (conclusion : Statement) : bool :=
  match cited_pair facts i, lookup_step facts j with
  | Some (a, b), Some w =>
      match angle_congruence_pair w with
      | Some (x, y) => substitute_link a b x y conclusion || substitute_link b a x y conclusion
      | None => false
      end
  | _, _ => false
  end.
End AnglePairs.

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

Definition pgram_opp_sides_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_pgram facts i with
  | ConSeg s1 s2, Some (Parallelogram q) =>
      segment_pair_eqb s1 s2 (quad_side_ab q) (quad_side_cd q) ||
      segment_pair_eqb s1 s2 (quad_side_bc q) (quad_side_da q)
  | _, _ => false
  end.

Definition pgram_opp_angles_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_pgram facts i with
  | ConAng a b, Some (Parallelogram q) =>
      angle_pair_eqb a b (quad_corner_a q) (quad_corner_c q) ||
      angle_pair_eqb a b (quad_corner_b q) (quad_corner_d q)
  | _, _ => false
  end.

(** Two corners of a parallelogram that share a side are supplementary.  Only
    consecutive pairs: opposite corners are congruent instead, which is
    [pgram_opp_angs]. *)
Definition pgram_consec_angs_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match lookup_pgram facts i with
  | Some (Parallelogram q) =>
      fact_eqb (Supplementary (quad_corner_a q) (quad_corner_b q)) conclusion ||
      fact_eqb (Supplementary (quad_corner_b q) (quad_corner_c q)) conclusion ||
      fact_eqb (Supplementary (quad_corner_c q) (quad_corner_d q)) conclusion ||
      fact_eqb (Supplementary (quad_corner_d q) (quad_corner_a q)) conclusion
  | _ => false
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
    the diagonal does, and the declarations must make its ends distinct
    ([declared_distinct]), since [out2__conga] carries the halves across the
    renaming only if that end is not the corner itself. *)
Definition bisector_ray (decls : Declarations) (premises : list Premise)
    (s : SegmentName) (vertex opposite : PointId) : bool :=
  segment_u_eqb s (segment_name vertex opposite) ||
  (declared_distinct decls s.(segment_first) s.(segment_second) &&
   ((ascii_eqb s.(segment_first) vertex &&
       ray_linked premises vertex opposite s.(segment_second)) ||
    (ascii_eqb s.(segment_second) vertex &&
       ray_linked premises vertex opposite s.(segment_first)))).

(** The premise that placed the far end of the ray on the diagonal, when the
    ray was not spelled as the diagonal itself. *)
Definition bisector_ray_used (decls : Declarations) (premises : list Premise)
    (s : SegmentName) (vertex opposite : PointId) : option Statement :=
  if segment_u_eqb s (segment_name vertex opposite) then None
  else if negb (declared_distinct decls s.(segment_first) s.(segment_second))
  then None
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
      match lookup_pgram facts i with
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

(** A line perpendicular to one of two parallels is perpendicular to the
    other.  The [transversal] figure supplies where it crosses that other
    line: the concluded perpendicular names a segment on the transversal,
    which must be the one the cited [perp] uses, and a spelling of the other
    parallel through its crossing. *)
Definition segment_on_transversal (s : SegmentName) (t1 i1 i2 t2 : PointId) : bool :=
  let on p := ascii_eqb p t1 || ascii_eqb p i1 || ascii_eqb p i2 || ascii_eqb p t2 in
  on s.(segment_first) && on s.(segment_second).

Definition perp_transversal_check (n m : SegmentName) (q : PointId)
    (a b t1 i1 c d t2 i2 : PointId) : bool :=
  segment_on_transversal n t1 i1 i2 t2 &&
  ((ascii_eqb q i1 && line_name_matches m a b i1) ||
   (ascii_eqb q i2 && line_name_matches m c d i2)).

Definition perp_transversal_sources (n m : SegmentName) (perp para : Statement) : bool :=
  match perp, para with
  | Perp s t _, Para u v =>
      let partner l :=
        (segment_u_eqb l u && segment_u_eqb m v) ||
        (segment_u_eqb l v && segment_u_eqb m u) in
      (segment_u_eqb n s && partner t) || (segment_u_eqb n t && partner s)
  | _, _ => false
  end.

Definition perp_transversal_at (premises : list Premise) (facts : list Statement)
    (i j : nat) (n m : SegmentName) (q : PointId) : bool :=
  match lookup_step facts i, lookup_step facts j with
  | Some x, Some y =>
      perp_transversal_sources n m x y &&
      transversal_premise_check (perp_transversal_check n m q) premises
  | _, _ => false
  end.

Definition perp_transversal_rule (premises : list Premise) (facts : list Statement)
    (i j : nat) (conclusion : Statement) : bool :=
  match conclusion with
  | Perp x y q =>
      perp_transversal_at premises facts i j x y q ||
      perp_transversal_at premises facts i j y x q
  | _ => false
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

Definition con_chords_arcs_rule (facts : list Statement) (i : nat)
    (conclusion : Statement) : bool :=
  match conclusion, lookup_step facts i with
  | ConSeg s1 s2, Some (ConArc x y) =>
      segment_pair_eqb s1 s2 (segment_name x.(arc_first) x.(arc_second))
                             (segment_name y.(arc_first) y.(arc_second))
  | _, _ => false
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
  match s with
  | OnCirclePoint c' q | Radius c' q | Tangent c' _ q =>
      circle_eqb c c' && ascii_eqb p q
  | Chord c' s | Diameter c' s => circle_eqb c c' && endpoint_of p s
  | InscribedAngle c' a => circle_eqb c c' && ascii_eqb p a.(angle_vertex)
  | CircOrder c' ps => circle_eqb c c' && existsb (ascii_eqb p) ps
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

(** * Inscribed angles, read through a [circ_order] premise

    A [circ_order] premise lists a circle's named points in the order met
    going round it.  An inscribed angle's ray is traced to the first listed
    point, other than the vertex, that lies on it: the ray's own point if it
    is listed, or one an [on_line]-family premise puts on the same ray.  The
    list's order then says which side of the chord each vertex is on. *)
Definition listed (p : PointId) (ps : list PointId) : bool := existsb (ascii_eqb p) ps.

Fixpoint index_of (p : PointId) (ps : list PointId) : option nat :=
  match ps with
  | [] => None
  | q :: rest =>
      if ascii_eqb p q then Some 0
      else match index_of p rest with Some n => Some (S n) | None => None end
  end.

Definition trace_ray (premises : list Premise) (ps : list PointId) (v x : PointId)
    : option PointId :=
  find (fun A => negb (ascii_eqb A v) && ray_linked premises v x A) ps.

(** The chord an inscribed angle stands on: where its two rays meet the
    circle, two different listed points, with the vertex listed too. *)
Definition inscribed_chord (premises : list Premise) (ps : list PointId)
    (a : AngleName) : option (PointId * PointId) :=
  if listed a.(angle_vertex) ps then
    match trace_ray premises ps a.(angle_vertex) a.(angle_first),
          trace_ray premises ps a.(angle_vertex) a.(angle_last) with
    | Some A, Some B => if ascii_eqb A B then None else Some (A, B)
    | _, _ => None
    end
  else None.

(** Which of the two arcs between [A] and [B] the point [P] is on. *)
Definition arc_side (ps : list PointId) (A B P : PointId) : option bool :=
  match index_of A ps, index_of B ps, index_of P ps with
  | Some i, Some j, Some k =>
      Some (Audit.circOrderInside (Nat.min i j) (Nat.max i j) k)
  | _, _, _ => None
  end.

(** A [circ_order] list has to name every point the premises place on its
    circle, the circle's own radius point among them. *)
Definition circ_order_complete (premises : list Premise) (c : CircleName)
    (ps : list PointId) : bool :=
  listed c.(circle_radius_point) ps &&
  forallb (fun pr =>
             forallb (fun p => negb (places_on_circle c p pr.(premise_statement))
                               || listed p ps)
                     (Audit.statementPoints pr.(premise_statement)))
          premises.

Definition same_chord_points (A B A' B' : PointId) : bool :=
  (ascii_eqb A A' && ascii_eqb B B') || (ascii_eqb A B' && ascii_eqb B A').

(** Two inscribed angles on one chord: congruent when their vertices are on
    the same arc ([same] is true), supplementary when on opposite arcs. *)
Definition inscribed_pair_check (premises : list Premise) (c : CircleName)
    (a b : AngleName) (same : bool) (pr : Premise) : bool :=
  match pr.(premise_statement) with
  | CircOrder c' ps =>
      circle_eqb c c' && circ_order_complete premises c ps &&
      match inscribed_chord premises ps a, inscribed_chord premises ps b with
      | Some (A, B), Some (A', B') =>
          same_chord_points A B A' B' &&
          match arc_side ps A B a.(angle_vertex), arc_side ps A B b.(angle_vertex) with
          | Some x, Some y => Bool.eqb (Bool.eqb x y) same
          | _, _ => false
          end
      | _, _ => false
      end
  | _ => false
  end.

(** * Templates

    For most reasons, what a step must cite follows from what it concludes,
    read together with the problem's declarations, its diagram premises, and
    the facts proved so far.  Such a reason is given as a list of templates.
    A template lists, for each cited step in order, the statements that may
    be cited there and how a cited statement is compared with them.  A step
    is accepted when every step it cites matches some one template.

    External code reads the same templates to say what a rejected step was
    missing, so these lists are the only statement of those rules.  A
    template may read the facts proved so far, but never which of them the
    step cites: where an object the conclusion does not name has to be shared
    between two cited steps (the circle of two tangents, the point where two
    diagonals cross), each candidate is read off the proved facts, and the
    declarations or premises, and gets its own template. *)

(** How a cited statement is compared with a template's statement. *)
Inductive Matcher :=
(** [fact_eqb]: the spellings every rule accepts. *)
| AsWritten
(** [dependency_matches]: also an angle named by points along its rays, and
    a pair of right angles for an angle congruence. *)
| Loose
(** As written, but a rectangle or a rhombus counts as the parallelogram it
    names. *)
| PgramLike
(** A proportion, in any spelling its meaning cannot tell apart. *)
| ProportionMatch
(** A congruent angle pair, also with rays named by points along them.
    Only used where the figure shows that the rays are not degenerate. *)
| RayAngles
(** Perpendicular lines, wherever the cited fact puts their meeting point.
    The template's point is ignored. *)
| PerpAnyPoint
(** A trapezoid premise for the quadrilateral, whichever sides it names.
    The template's sides are ignored. *)
| TrapezoidAnySides
(** A radius fact for the circle, whatever point it names.  The template's
    point is ignored. *)
| RadiusAnyPoint.

Record Slot := slot { slot_matcher : Matcher; slot_statements : list Statement }.

(** [template_premises] are the diagram premises the template was read
    from; a step that matches the template uses them. *)
Record Template := template {
  template_slots : list Slot;
  template_premises : list Statement
}.

Definition written (xs : list Statement) : Slot := slot AsWritten xs.
Definition loose (xs : list Statement) : Slot := slot Loose xs.
Definition pgram_slot (q : QuadrilateralName) : Slot :=
  slot PgramLike [Parallelogram q].
Definition plain (slots : list Slot) : Template := template slots [].
Definition either_order (a b : Slot) : list Template := [plain [a; b]; plain [b; a]].
Definition only_if (b : bool) (ts : list Template) : list Template :=
  if b then ts else [].
Definition gated (b : bool) (xs : list Statement) : list Statement :=
  if b then xs else [].

(** What a template writes for an argument its matcher ignores. *)
Definition any_point : PointId := Ascii.ascii_of_nat 42.  (* [*] *)
Definition any_segment : SegmentName := segment_name any_point any_point.

(** ** Triangles *)

Definition loose_template (parts : list Statement) : Template :=
  plain (map (fun p => loose [p]) parts).

Definition correspondence_templates
    (parts : TriangleName -> TriangleName -> list (list Statement))
    (t u : TriangleName) : list Template :=
  flat_map (fun c => map loose_template (parts (fst c) (snd c)))
           (correspondences t u).

(** The citation order fixes which vertex plays which role, so all six
    correspondences of the two triangles are tried.  [con_tri_ordered] is
    concluded for the correspondence as written, and [con_tri] for any order
    of the second triangle. *)
Definition congruence_needs (decls : Declarations)
    (parts : TriangleName -> TriangleName -> list (list Statement))
    (conclusion : Statement) : list Template :=
  match conclusion with
  | ConTriOrdered t u =>
      only_if (declared_pair decls t u) (correspondence_templates parts t u)
  | ConTri t u =>
      only_if (declared_pair decls t u)
        (flat_map (correspondence_templates parts t) (triangle_orderings u))
  | _ => []
  end.

Definition aa_sim_parts (t u : TriangleName) : list Slot :=
  [loose [ConAng (angle_a t) (angle_a u)]; loose [ConAng (angle_b t) (angle_b u)]].
(** SAS similarity, with the congruent angle at the second vertex. *)
Definition sas_sim_parts (t u : TriangleName) : list Slot :=
  [slot ProportionMatch [Proportion (side_ab t) (side_ab u) (side_bc t) (side_bc u)];
   loose [ConAng (angle_b t) (angle_b u)]].
(** SSS similarity, as two proportions sharing the sides opposite the first
    vertex. *)
Definition sss_sim_parts (t u : TriangleName) : list Slot :=
  [slot ProportionMatch [Proportion (side_ab t) (side_ab u) (side_bc t) (side_bc u)];
   slot ProportionMatch [Proportion (side_bc t) (side_bc u) (side_ca t) (side_ca u)]].

Definition similarity_needs (decls : Declarations)
    (parts : TriangleName -> TriangleName -> list Slot)
    (conclusion : Statement) : list Template :=
  match conclusion with
  | SimTri t u =>
      only_if (declared_pair decls t u)
        (map (fun c => plain (parts (fst c) (snd c))) (correspondences t u))
  | _ => []
  end.

(** The two triangles are not named by the conclusion, so every declared
    pair is tried; declaring them is also what rules out degenerate ones. *)
Definition third_angle_needs (decls : Declarations) (conclusion : Statement)
    : list Template :=
  flat_map (fun t => flat_map (fun u => flat_map (fun c =>
      only_if (fact_eqb (ConAng (angle_c (fst c)) (angle_c (snd c))) conclusion)
        [loose_template [ConAng (angle_a (fst c)) (angle_a (snd c));
                         ConAng (angle_b (fst c)) (angle_b (snd c))]])
      (correspondences t u))
    decls.(decl_triangles)) decls.(decl_triangles).

Definition def_equilateral_needs (decls : Declarations) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | Equilateral t =>
      only_if (triangle_declared decls t)
        [loose_template [ConSeg (side_ab t) (side_bc t);
                         ConSeg (side_bc t) (side_ca t);
                         ConSeg (side_ca t) (side_ab t)]]
  | _ => []
  end.

Definition def_equiangular_needs (decls : Declarations) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | Equiangular t =>
      only_if (triangle_declared decls t)
        [loose_template [ConAng (angle_a t) (angle_b t);
                         ConAng (angle_b t) (angle_c t);
                         ConAng (angle_c t) (angle_a t)]]
  | _ => []
  end.

Definition equilat_equiang_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | Equiangular t => [plain [written [Equilateral t]]]
  | _ => []
  end.

Definition equiang_equilat_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | Equilateral t => [plain [written [Equiangular t]]]
  | _ => []
  end.

(** Two right angles are congruent, and the audited [right] meaning supplies
    the nondegenerate rays [l11_16] needs, so either [con_right] or [con_ang]
    may be concluded. *)
Definition def_con_right_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | ConRight c d | ConAng c d =>
      either_order (written [Right c; Right (reverse_angle c)])
                   (written [Right d; Right (reverse_angle d)])
  | _ => []
  end.

(** ** Quadrilaterals *)

(** Both pairs of opposite sides parallel.  A converse concludes a
    quadrilateral statement, so the declaration supplies its
    well-formedness. *)
Definition def_parallelogram_needs (decls : Declarations) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | Parallelogram q =>
      only_if (declared_quadrilateral decls q)
        (either_order (written [Para (quad_side_ab q) (quad_side_cd q)])
                      (written [Para (quad_side_bc q) (quad_side_da q)]))
  | _ => []
  end.

Definition rectangle_pgram_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | Parallelogram q => [plain [written [Rectangle q]]]
  | _ => []
  end.

Definition rhombus_pgram_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | Parallelogram q => [plain [written [Rhombus q]]]
  | _ => []
  end.

(** Both pairs of opposite sides congruent. *)
Definition pgram_opp_sides_conv_needs (decls : Declarations)
    (conclusion : Statement) : list Template :=
  match conclusion with
  | Parallelogram q =>
      only_if (declared_quadrilateral decls q)
        (either_order (written [ConSeg (quad_side_ab q) (quad_side_cd q)])
                      (written [ConSeg (quad_side_bc q) (quad_side_da q)]))
  | _ => []
  end.

(** Both pairs of opposite corners congruent. *)
Definition pgram_opp_angs_conv_needs (decls : Declarations)
    (conclusion : Statement) : list Template :=
  match conclusion with
  | Parallelogram q =>
      only_if (declared_quadrilateral decls q)
        (either_order (written [ConAng (quad_corner_a q) (quad_corner_c q)])
                      (written [ConAng (quad_corner_b q) (quad_corner_d q)]))
  | _ => []
  end.

(** Two pairs of consecutive corners supplementary, one pair along each
    direction of sides: each pair's shared side is a transversal of the two
    sides the pair makes parallel. *)
Definition pgram_consec_angs_conv_needs (decls : Declarations)
    (conclusion : Statement) : list Template :=
  match conclusion with
  | Parallelogram q =>
      only_if (declared_quadrilateral decls q)
        (either_order
           (written [Supplementary (quad_corner_b q) (quad_corner_c q);
                     Supplementary (quad_corner_d q) (quad_corner_a q)])
           (written [Supplementary (quad_corner_a q) (quad_corner_b q);
                     Supplementary (quad_corner_c q) (quad_corner_d q)]))
  | _ => []
  end.

(** One pair of opposite sides both congruent and parallel. *)
Definition pgram_opp_side_para_needs (decls : Declarations)
    (conclusion : Statement) : list Template :=
  match conclusion with
  | Parallelogram q =>
      only_if (declared_quadrilateral decls q)
        [plain [written [ConSeg (quad_side_ab q) (quad_side_cd q)];
                written [Para (quad_side_ab q) (quad_side_cd q)]];
         plain [written [ConSeg (quad_side_bc q) (quad_side_da q)];
                written [Para (quad_side_bc q) (quad_side_da q)]]]
  | _ => []
  end.

(** Points the step may name as the crossing of two diagonals: those proved
    facts bisect at, which is where the citations can come from, and those
    an [intersect_seg] premise places, for external code to suggest. *)
Definition crossing_candidates (premises : list Premise) (facts : list Statement)
    : list PointId :=
  nodup Ascii.ascii_dec
    (flat_map (fun st => match st with SegBisect _ _ p => [p] | _ => [] end) facts ++
     flat_map (fun pr => match pr.(premise_statement) with
                         | IntersectSeg _ _ p => [p]
                         | _ => []
                         end) premises).

(** Diagonals that bisect each other, at the same point. *)
Definition pgram_diag_bisect_conv_needs (decls : Declarations)
    (premises : list Premise) (facts : list Statement) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | Parallelogram q =>
      only_if (declared_quadrilateral decls q)
        (flat_map (fun p =>
           either_order
             (written [SegBisect (quad_diagonal_ac q) (quad_diagonal_bd q) p])
             (written [SegBisect (quad_diagonal_bd q) (quad_diagonal_ac q) p]))
           (crossing_candidates premises facts))
  | _ => []
  end.

(** One right corner of a parallelogram, whichever. *)
Definition rect_pgram_ang_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | Rectangle q =>
      [plain [written (flat_map (fun a => [Right a; Right (reverse_angle a)])
                        [quad_corner_a q; quad_corner_b q;
                         quad_corner_c q; quad_corner_d q]);
              pgram_slot q]]
  | _ => []
  end.

(** Congruent diagonals in a parallelogram. *)
Definition rect_diag_con_conv_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | Rectangle q =>
      [plain [written [ConSeg (quad_diagonal_ac q) (quad_diagonal_bd q)];
              pgram_slot q]]
  | _ => []
  end.

(** Two consecutive sides of a parallelogram congruent. *)
Definition rhombus_consec_sides_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | Rhombus q =>
      [plain [pgram_slot q;
              written [ConSeg (quad_side_ab q) (quad_side_bc q);
                       ConSeg (quad_side_bc q) (quad_side_cd q);
                       ConSeg (quad_side_cd q) (quad_side_da q);
                       ConSeg (quad_side_da q) (quad_side_ab q)]]]
  | _ => []
  end.

(** Perpendicular diagonals in a parallelogram.  Only the two lines matter,
    so where the perpendicularity puts their meeting point is left alone:
    [Perp_at] already places it on both. *)
Definition rhombus_diag_perp_conv_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | Rhombus q =>
      [plain [slot PerpAnyPoint
                [Perp (quad_diagonal_ac q) (quad_diagonal_bd q) any_point;
                 Perp (quad_diagonal_bd q) (quad_diagonal_ac q) any_point];
              pgram_slot q]]
  | _ => []
  end.

(** A diagonal bisecting the two corners it runs between makes a
    parallelogram a rhombus.  One bisected corner is already enough for the
    geometry, but the reason is stated of a pair of opposite corners, so the
    rule asks for both rather than letting one fact be cited twice; reading
    the figure from each corner in turn is what [quad_rotations] is for. *)
Definition corner_bisectors (r : QuadrilateralName) : list Statement :=
  [AngBisect (quad_corner_a r) (quad_diagonal_ac r);
   AngBisect (reverse_angle (quad_corner_a r)) (quad_diagonal_ac r)].

Definition rhombus_opp_bisect_conv_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | Rhombus q =>
      map (fun r => plain [written (corner_bisectors r);
                           written (corner_bisectors (rotate_quad (rotate_quad r)));
                           pgram_slot q])
          (quad_rotations q)
  | _ => []
  end.

(** Every spelling of a trapezoid premise naming [a] and [b] as its parallel
    sides. *)
Definition segment_spellings (s : SegmentName) : list SegmentName :=
  [s; reverse_segment s].

Definition trapezoid_spellings (q : QuadrilateralName) (a b : SegmentName)
    : list Statement :=
  flat_map (fun x => flat_map (fun y =>
      [TrapezoidPremise q x y; TrapezoidPremise q y x])
    (segment_spellings b)) (segment_spellings a).

(** A trapezoid with congruent diagonals is isosceles; that is the audited
    meaning of [isos_trapezoid] itself. *)
Definition isos_trap_con_diags_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | IsosTrapezoid q =>
      [plain [written [ConSeg (quad_diagonal_ac q) (quad_diagonal_bd q)];
              slot TrapezoidAnySides [TrapezoidPremise q any_segment any_segment]]]
  | _ => []
  end.

(** Congruent base angles, at either end of whichever pair of sides the
    premise names parallel. *)
Definition isos_trap_base_angs_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | IsosTrapezoid q =>
      [plain [written [ConAng (quad_corner_a q) (quad_corner_b q);
                       ConAng (quad_corner_c q) (quad_corner_d q)];
              written (trapezoid_spellings q (quad_side_ab q) (quad_side_cd q))];
       plain [written [ConAng (quad_corner_b q) (quad_corner_c q);
                       ConAng (quad_corner_d q) (quad_corner_a q)];
              written (trapezoid_spellings q (quad_side_bc q) (quad_side_da q))]]
  | _ => []
  end.

(** ** Parallel lines *)

(** One template list per [transversal] premise, read from its labeled
    points; a matching step uses the premise. *)
Definition from_transversals (premises : list Premise)
    (read : PointId -> PointId -> PointId -> PointId ->
            PointId -> PointId -> PointId -> PointId -> list (list Slot))
    : list Template :=
  flat_map (fun pr =>
    match transversal_witness pr.(premise_statement) with
    | Some (a, b, t1, i1, c, d, t2, i2) =>
        map (fun slots => template slots [pr.(premise_statement)])
            (read a b t1 i1 c d t2 i2)
    | None => []
    end) premises.

(** The names a transversal figure gives each of its two lines: the
    flanking pair, or a drawn flank joined to the crossing point. *)
Definition line_names (a b i1 : PointId) : list SegmentName :=
  segment_name a b ::
  (if named_apart a i1 then [segment_name a i1] else []) ++
  (if named_apart b i1 then [segment_name i1 b] else []).

Definition parallel_spellings (a b i1 c d i2 : PointId) : list Statement :=
  flat_map (fun l1 => map (Para l1) (line_names c d i2)) (line_names a b i1).

Definition altint_needs (premises : list Premise) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | ConAng x y =>
      from_transversals premises (fun a b t1 i1 c d t2 i2 =>
        if altint_pair a b i1 c d i2 x y
        then [[written (parallel_spellings a b i1 c d i2)]] else [])
  | _ => []
  end.

Definition altext_needs (premises : list Premise) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | ConAng x y =>
      from_transversals premises (fun a b t1 i1 c d t2 i2 =>
        if altext_pair a b t1 i1 c d t2 i2 x y
        then [[written (parallel_spellings a b i1 c d i2)]] else [])
  | _ => []
  end.

Definition corresp_ang_needs (premises : list Premise) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | ConAng x y =>
      from_transversals premises (fun a b t1 i1 c d t2 i2 =>
        if corresp_pair a b t1 i1 c d t2 i2 x y
        then [[written (parallel_spellings a b i1 c d i2)]] else [])
  | _ => []
  end.

Definition sameside_ang_needs (premises : list Premise) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | Supplementary x y =>
      from_transversals premises (fun a b t1 i1 c d t2 i2 =>
        if sameside_pair a b i1 c d i2 x y
        then [[written (parallel_spellings a b i1 c d i2)]] else [])
  | _ => []
  end.

(** The converses cite one angle pair the figure draws.  For alternate
    interior angles the rays may also be named by points along them. *)
Definition altint_conv_needs (premises : list Premise) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | Para s1 s2 =>
      from_transversals premises (fun a b t1 i1 c d t2 i2 =>
        if transversal_lines_match s1 s2 a b i1 c d i2
        then [[slot RayAngles
                 (gated (named_apart a i1 && named_apart d i2)
                    [ConAng (angle_name a i1 i2) (angle_name d i2 i1)] ++
                  gated (named_apart b i1 && named_apart c i2)
                    [ConAng (angle_name b i1 i2) (angle_name c i2 i1)])]]
        else [])
  | _ => []
  end.

Definition altext_conv_needs (premises : list Premise) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | Para s1 s2 =>
      from_transversals premises (fun a b t1 i1 c d t2 i2 =>
        let drawn := exterior_drawn t1 i1 i2 && exterior_drawn t2 i2 i1 in
        if transversal_lines_match s1 s2 a b i1 c d i2
        then [[written
                 (gated (drawn && named_apart a i1 && named_apart d i2)
                    [ConAng (angle_name t1 i1 a) (angle_name t2 i2 d)] ++
                  gated (drawn && named_apart b i1 && named_apart c i2)
                    [ConAng (angle_name t1 i1 b) (angle_name t2 i2 c)])]]
        else [])
  | _ => []
  end.

Definition corresp_ang_conv_needs (premises : list Premise)
    (conclusion : Statement) : list Template :=
  match conclusion with
  | Para s1 s2 =>
      from_transversals premises (fun a b t1 i1 c d t2 i2 =>
        if transversal_lines_match s1 s2 a b i1 c d i2
        then [[written
                 (gated (exterior_drawn t2 i2 i1 && named_apart b i1 && named_apart d i2)
                    [ConAng (angle_name i2 i1 b) (angle_name t2 i2 d)] ++
                  gated (exterior_drawn t2 i2 i1 && named_apart a i1 && named_apart c i2)
                    [ConAng (angle_name i2 i1 a) (angle_name t2 i2 c)] ++
                  gated (exterior_drawn t1 i1 i2 && named_apart a i1 && named_apart c i2)
                    [ConAng (angle_name t1 i1 a) (angle_name i1 i2 c)] ++
                  gated (exterior_drawn t1 i1 i2 && named_apart b i1 && named_apart d i2)
                    [ConAng (angle_name t1 i1 b) (angle_name i1 i2 d)])]]
        else [])
  | _ => []
  end.

Definition sameside_ang_conv_needs (premises : list Premise)
    (conclusion : Statement) : list Template :=
  match conclusion with
  | Para s1 s2 =>
      from_transversals premises (fun a b t1 i1 c d t2 i2 =>
        if transversal_lines_match s1 s2 a b i1 c d i2
        then [[written
                 (gated (named_apart b i1 && named_apart d i2)
                    [Supplementary (angle_name b i1 i2) (angle_name i1 i2 d)] ++
                  gated (named_apart a i1 && named_apart c i2)
                    [Supplementary (angle_name a i1 i2) (angle_name i1 i2 c)])]]
        else [])
  | _ => []
  end.

(** ** Circles *)

Definition statement_circles (s : Statement) : list CircleName :=
  match s with
  | Tangent c _ _ | Chord c _ | Radius c _ | Diameter c _ | InscribedAngle c _
  | OnCirclePoint c _ | CenterOnLine c _ | CircOrder c _ => [c]
  | _ => []
  end.

Fixpoint dedup_circles (seen rest : list CircleName) : list CircleName :=
  match rest with
  | [] => []
  | c :: tail =>
      if existsb (circle_eqb c) seen then dedup_circles seen tail
      else c :: dedup_circles (c :: seen) tail
  end.

(** Circles a step may be about when its conclusion does not name one: those
    of the proved facts, which is where the citations can come from, and
    the declared and premised ones, for external code to suggest. *)
Definition circle_candidates (decls : Declarations) (premises : list Premise)
    (facts : list Statement) : list CircleName :=
  dedup_circles []
    (flat_map statement_circles facts ++ decls.(decl_circles) ++
     flat_map (fun pr => statement_circles pr.(premise_statement)) premises).

(** A tangent is perpendicular to the radius at the point of tangency; the
    radius fact names that point. *)
Definition tangent_perp_needs (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (conclusion : Statement) : list Template :=
  match conclusion with
  | Perp s1 s2 q =>
      flat_map (fun c =>
        flat_map (fun sr =>
          only_if (segment_u_eqb (snd sr) (segment_name c.(circle_center) q))
            [plain [written [Tangent c (fst sr) q; Tangent c (reverse_segment (fst sr)) q];
                    written [Radius c q]]])
          [(s1, s2); (s2, s1)])
        (circle_candidates decls premises facts)
  | _ => []
  end.

(** The converse.  The audited tangent meaning is this figure, so the rule
    assembles it.  The point of tangency has to be an endpoint of the
    tangent segment, which is where the segment's nondegeneracy comes back
    as the [Q <> p] the meaning asks for. *)
Definition tangent_perp_conv_needs (conclusion : Statement) : list Template :=
  match conclusion with
  | Tangent c s p =>
      only_if (endpoint_of p s)
        [plain [written [Perp s (segment_name c.(circle_center) p) p;
                         Perp (segment_name c.(circle_center) p) s p];
                written [Radius c p]]]
  | _ => []
  end.

Definition segment_ends (s : SegmentName) : list (PointId * PointId) :=
  [(s.(segment_first), s.(segment_second)); (s.(segment_second), s.(segment_first))].

(** Two tangents to one circle from one outside point are congruent.  The
    conclusion names the two tangent segments, which share their far end. *)
Definition con_tangents_ext_needs (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (conclusion : Statement) : list Template :=
  match conclusion with
  | ConSeg x y =>
      flat_map (fun c =>
        flat_map (fun fg =>
          flat_map (fun pe =>
            flat_map (fun pe' =>
              only_if (ascii_eqb (snd pe) (snd pe'))
                [plain [written [Tangent c (segment_name (fst pe) (snd pe)) (fst pe);
                                 Tangent c (segment_name (snd pe) (fst pe)) (fst pe)];
                        written [Tangent c (segment_name (fst pe') (snd pe)) (fst pe');
                                 Tangent c (segment_name (snd pe) (fst pe')) (fst pe')]]])
              (segment_ends (snd fg)))
            (segment_ends (fst fg)))
          [(x, y); (y, x)])
        (circle_candidates decls premises facts)
  | _ => []
  end.

(** The radii an [on_line] premise puts [p] on: [on_line(OR, M)] puts M on
    the radius OR, so it yields R and the premise. *)
Definition radii_through (premises : list Premise) (centre p : PointId)
    : list (PointId * Statement) :=
  flat_map (fun pr =>
    match pr.(premise_statement) with
    | OnLine s r =>
        if ascii_eqb r p then
          if ascii_eqb s.(segment_first) centre
          then [(s.(segment_second), pr.(premise_statement))]
          else if ascii_eqb s.(segment_second) centre
          then [(s.(segment_first), pr.(premise_statement))]
          else []
        else []
    | _ => []
    end) premises.

(** A radius perpendicular to a chord bisects it.  The perpendicularity
    names the foot, and both the concluded bisector and the perpendicular's
    first segment run from the centre to it; the chord fact is what puts the
    chord's ends the same distance away.  The cited radius must be the one
    the perpendicular runs along: an [on_line] premise puts the foot on the
    segment from the centre to the radius's point. *)
Definition radius_chord_bisect_needs (decls : Declarations)
    (premises : list Premise) (facts : list Statement) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | SegBisect b t p =>
      flat_map (fun c =>
        only_if (segment_u_eqb b (segment_name c.(circle_center) p))
          (map (fun rw =>
             template [written [Perp (segment_name c.(circle_center) p) t p];
                       written [Radius c (fst rw)];
                       written [Chord c t; Chord c (reverse_segment t)]]
                      [snd rw])
             (radii_through premises c.(circle_center) p)))
        (circle_candidates decls premises facts)
  | _ => []
  end.

(** An angle in a semicircle: its rays meet the circle at the ends of a
    diameter, as traced through a [circ_order] premise. *)
Definition inscribed_semi_needs (premises : list Premise) (conclusion : Statement)
    : list Template :=
  match conclusion with
  | Right a' =>
      flat_map (fun pr =>
        match pr.(premise_statement) with
        | CircOrder c ps =>
            if circ_order_complete premises c ps then
              flat_map (fun a =>
                match inscribed_chord premises ps a with
                | Some (A, B) =>
                    [template [written [InscribedAngle c a];
                               written [Diameter c (segment_name A B);
                                        Diameter c (segment_name B A)]]
                              [pr.(premise_statement)]]
                | None => []
                end) [a'; reverse_angle a']
            else []
        | _ => []
        end) premises
  | _ => []
  end.

Definition angle_pair_readings (x y : AngleName) : list (AngleName * AngleName) :=
  let rx := reverse_angle x in
  let ry := reverse_angle y in
  [(x, y); (rx, y); (x, ry); (rx, ry); (y, x); (ry, x); (y, rx); (ry, rx)].

(** Two inscribed angles on one chord: congruent when their vertices are on
    the same arc ([same] is true), supplementary when on opposite arcs. *)
Definition inscribed_pair_needs (premises : list Premise) (same : bool)
    (conclusion : Statement) : list Template :=
  let readings :=
    match conclusion with
    | ConAng x y | RefAng x y | Supplementary x y => angle_pair_readings x y
    | _ => []
    end in
  flat_map (fun pr =>
    match pr.(premise_statement) with
    | CircOrder c _ =>
        flat_map (fun ab =>
          if fact_eqb conclusion
               (if same then ConAng (fst ab) (snd ab)
                else Supplementary (fst ab) (snd ab)) &&
             inscribed_pair_check premises c (fst ab) (snd ab) same pr
          then [template [written [InscribedAngle c (fst ab)];
                          written [InscribedAngle c (snd ab)]]
                         [pr.(premise_statement)]]
          else []) readings
    | _ => []
    end) premises.

(** ** Which reasons are given by templates *)

(** The step numbers a reason cites.  [given] and [vert_ang] cite a premise
    label rather than a step, and [reflex] cites nothing. *)
Definition reason_dependencies (r : Reason) : list nat :=
  match r with
  | Given _ | Reflex | VertAng _ | Incomplete => []
  | CPCTC i | CASTC i | PerpConAng i | DefMidpt i | DefAngBisect i | AngBisectConv i
  | MidptConv i | DefIsosceles i | BaseAngle i | BaseAngleConv i
  | EquilatEquiang i | EquiangEquilat i | DefLinearPair i | DefPerp i
  | PgramOppSides i | PgramOppAngles i | PgramConsecAngs i | KiteOppConAng i
  | RectanglePgram i
  | RhombusPgram i | RhombusDef i | RhombusOppBisect i | RectDiagCon i
  | RectangleDef i | AltInt i | AltExt i | CorrespAng i | SamesideAng i
  | AltIntConv i | AltExtConv i | CorrespAngConv i | SamesideAngConv i
  | DefRadius i | ConChordsArcs i
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
  | AASim i j | SSSSim i j | SASSim i j | ChordBisectConv i j
  | SimTriTrans i j | SuppTrans i j | CompTrans i j | PerpTransversal i j
  | ConInscribedAngs i j
  | SuppInscribedAngs i j | InscribedSemi i j => [i; j]
  | SAS i j k | SSS i j k | ASA i j k | AAS i j k | RHL i j k
  | DefEquilateral i j k | DefEquiangular i j k | ConSupplements i j k
  | RadiusChordBisect i j k | RhombusOppBisectConv i j k
  | ConComplements i j k => [i; j; k]
  | DefConTri i j k l m n => [i; j; k; l; m; n]
  end.

(** The templates of a reason given by them, or [None] for a reason with a
    rule of its own.  The citation numbers inside [r] are not read. *)
Definition reason_needs (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (r : Reason) (conclusion : Statement)
    : option (list Template) :=
  match r with
  | SAS _ _ _ => Some (congruence_needs decls sas_parts conclusion)
  | SSS _ _ _ => Some (congruence_needs decls sss_parts conclusion)
  | ASA _ _ _ => Some (congruence_needs decls asa_parts conclusion)
  | AAS _ _ _ => Some (congruence_needs decls aas_parts conclusion)
  | RHL _ _ _ => Some (congruence_needs decls rhl_parts conclusion)
  | DefConTri _ _ _ _ _ _ => Some (congruence_needs decls def_con_tri_parts conclusion)
  | AASim _ _ => Some (similarity_needs decls aa_sim_parts conclusion)
  | SASSim _ _ => Some (similarity_needs decls sas_sim_parts conclusion)
  | SSSSim _ _ => Some (similarity_needs decls sss_sim_parts conclusion)
  | ThirdAngle _ _ => Some (third_angle_needs decls conclusion)
  | DefEquilateral _ _ _ => Some (def_equilateral_needs decls conclusion)
  | DefEquiangular _ _ _ => Some (def_equiangular_needs decls conclusion)
  | EquilatEquiang _ => Some (equilat_equiang_needs conclusion)
  | EquiangEquilat _ => Some (equiang_equilat_needs conclusion)
  | DefConRight _ _ => Some (def_con_right_needs conclusion)
  | DefParallelogram _ _ => Some (def_parallelogram_needs decls conclusion)
  | RectanglePgram _ => Some (rectangle_pgram_needs conclusion)
  | RhombusPgram _ => Some (rhombus_pgram_needs conclusion)
  | PgramOppSidesConv _ _ => Some (pgram_opp_sides_conv_needs decls conclusion)
  | PgramOppAngsConv _ _ => Some (pgram_opp_angs_conv_needs decls conclusion)
  | PgramConsecAngsConv _ _ => Some (pgram_consec_angs_conv_needs decls conclusion)
  | PgramOppSidePara _ _ => Some (pgram_opp_side_para_needs decls conclusion)
  | PgramDiagBisectConv _ _ =>
      Some (pgram_diag_bisect_conv_needs decls premises facts conclusion)
  | RectPgramAng _ _ => Some (rect_pgram_ang_needs conclusion)
  | RectDiagConConv _ _ => Some (rect_diag_con_conv_needs conclusion)
  | RhombusConsecSides _ _ => Some (rhombus_consec_sides_needs conclusion)
  | RhombusDiagPerpConv _ _ => Some (rhombus_diag_perp_conv_needs conclusion)
  | RhombusOppBisectConv _ _ _ => Some (rhombus_opp_bisect_conv_needs conclusion)
  | IsosTrapConDiags _ _ => Some (isos_trap_con_diags_needs conclusion)
  | IsosTrapBaseAngs _ _ => Some (isos_trap_base_angs_needs conclusion)
  | AltInt _ => Some (altint_needs premises conclusion)
  | AltExt _ => Some (altext_needs premises conclusion)
  | CorrespAng _ => Some (corresp_ang_needs premises conclusion)
  | SamesideAng _ => Some (sameside_ang_needs premises conclusion)
  | AltIntConv _ => Some (altint_conv_needs premises conclusion)
  | AltExtConv _ => Some (altext_conv_needs premises conclusion)
  | CorrespAngConv _ => Some (corresp_ang_conv_needs premises conclusion)
  | SamesideAngConv _ => Some (sameside_ang_conv_needs premises conclusion)
  | TangentPerp _ _ => Some (tangent_perp_needs decls premises facts conclusion)
  | TangentPerpConv _ _ => Some (tangent_perp_conv_needs conclusion)
  | ConTangentsExt _ _ => Some (con_tangents_ext_needs decls premises facts conclusion)
  | RadiusChordBisect _ _ _ =>
      Some (radius_chord_bisect_needs decls premises facts conclusion)
  | InscribedSemi _ _ => Some (inscribed_semi_needs premises conclusion)
  | ConInscribedAngs _ _ => Some (inscribed_pair_needs premises true conclusion)
  | SuppInscribedAngs _ _ => Some (inscribed_pair_needs premises false conclusion)
  | _ => None
  end.

(** ** Matching a step against its templates *)

Definition pgram_view (s : Statement) : Statement :=
  match s with
  | Rhombus q | Rectangle q => Parallelogram q
  | other => other
  end.

Definition matcher_accepts (decls : Declarations) (premises : list Premise)
    (m : Matcher) (expected actual : Statement) : bool :=
  match m with
  | AsWritten => fact_eqb expected actual || canonical_eqb decls premises expected actual
  | Loose => dependency_matches decls premises expected actual ||
             canonical_eqb decls premises expected actual
  | PgramLike => fact_eqb expected (pgram_view actual)
  | ProportionMatch =>
      match expected with
      | Proportion a b c d => proportion_matches a b c d actual
      | _ => false
      end
  | RayAngles =>
      match expected, actual with
      | ConAng e1 e2, ConAng x y =>
          angle_pair_eqb x y e1 e2 || conga_ray_pair premises e1 e2 x y
      | _, _ => false
      end
  | PerpAnyPoint =>
      match expected, actual with
      | Perp a b _, Perp c d _ => segment_u_eqb a c && segment_u_eqb b d
      | _, _ => false
      end
  | TrapezoidAnySides =>
      match expected, actual with
      | TrapezoidPremise q _ _, TrapezoidPremise r _ _ => same_quadrilateral q r
      | _, _ => false
      end
  | RadiusAnyPoint =>
      match expected, actual with
      | Radius c _, Radius c' _ => circle_eqb c c'
      | _, _ => false
      end
  end.

Definition slot_ok decls premises (facts : list Statement) (s : Slot) (i : nat)
    : bool :=
  match lookup_step facts i with
  | Some actual =>
      existsb (fun e => matcher_accepts decls premises s.(slot_matcher) e actual)
              s.(slot_statements)
  | None => false
  end.

Fixpoint slots_ok decls premises (facts : list Statement) (slots : list Slot)
    (deps : list nat) : bool :=
  match slots, deps with
  | [], [] => true
  | s :: slots', i :: deps' =>
      slot_ok decls premises facts s i && slots_ok decls premises facts slots' deps'
  | _, _ => false
  end.

Definition template_valid decls premises (facts : list Statement)
    (ts : list Template) (deps : list nat) : bool :=
  existsb (fun t => slots_ok decls premises facts t.(template_slots) deps) ts.

(** The diagram premises a step that matched one of [ts] used: those the
    first matching template was read from, and those a [Loose] slot used to
    move an angle along its rays. *)
Definition slot_used decls premises (facts : list Statement) (s : Slot) (i : nat)
    : list Statement :=
  (* a statement matched only once its angles were spelled canonically
     leaned on the premises that renamed them *)
  let canonical_used actual :=
    match find (fun e => canonical_eqb decls premises e actual) s.(slot_statements) with
    | Some e => statement_ray_premises decls premises e ++
                statement_ray_premises decls premises actual
    | None => []
    end in
  match s.(slot_matcher), lookup_step facts i with
  | Loose, Some actual =>
      match first_used (fun e => dependency_used decls premises e actual)
                       s.(slot_statements) with
      | Some ps => ps
      | None => canonical_used actual
      end
  | AsWritten, Some actual =>
      if existsb (fun e => fact_eqb e actual) s.(slot_statements) then []
      else canonical_used actual
  | _, _ => []
  end.

Fixpoint slots_used decls premises (facts : list Statement) (slots : list Slot)
    (deps : list nat) : list Statement :=
  match slots, deps with
  | s :: slots', i :: deps' =>
      slot_used decls premises facts s i ++ slots_used decls premises facts slots' deps'
  | _, _ => []
  end.

Definition template_used decls premises (facts : list Statement)
    (ts : list Template) (deps : list nat) : list Statement :=
  match find (fun t => slots_ok decls premises facts t.(template_slots) deps) ts with
  | Some t => t.(template_premises) ++ slots_used decls premises facts t.(template_slots) deps
  | None => []
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
  match reason_needs decls premises facts reason conclusion with
  | Some ts => template_used decls premises facts ts (reason_dependencies reason)
  | None =>
  match reason with
  | VertAng label => one (vert_ang_witness decls premises label conclusion)
  | DefAngBisect i =>
      match dependency i with
      | Some (AngBisect a s) =>
          (* the same two readings the rule tries, in the same order *)
          let reading far := dependency_used decls premises conclusion
                               (bisector_halves a far) in
          match (if ascii_eqb s.(segment_first) a.(angle_vertex)
                 then reading s.(segment_second) else None) with
          | Some used => used
          | None =>
              all (if ascii_eqb s.(segment_second) a.(angle_vertex)
                   then reading s.(segment_first) else None)
          end
      | _ => []
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
  | PerpTransversal i j =>
      match conclusion with
      | Perp x y q =>
          if perp_transversal_at premises facts i j x y q
          then transversal (perp_transversal_check x y q)
          else if perp_transversal_at premises facts i j y x q
          then transversal (perp_transversal_check y x q)
          else []
      | _ => []
      end
  | LinearPairConv _ => one (linear_pair_conv_used premises conclusion)
  | PgramDiagBisect _ | RhombusDiagPerp _ | KiteDiagPerp _ =>
      one (diagonal_rule_used premises facts reason conclusion)
  | DefRadiusConv _ => one (def_radius_conv_used premises conclusion)
  | _ => []
  end
  end.

(** What an incomplete step stands for.  It is true in every model -- a
    segment is congruent to itself whatever its ends -- so admitting it costs
    soundness nothing, and it names the point [?], which no source text can
    spell, so no later step can cite it as a fact about the figure. *)
Definition incomplete_point : PointId := Ascii.ascii_of_nat 63.  (* [?] *)
Definition incomplete_fact : Statement :=
  RefSeg (segment_name incomplete_point incomplete_point)
         (segment_name incomplete_point incomplete_point).

Definition bespoke_rule_valid (decls : Declarations) (premises : list Premise)
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
  | CPCTC i => cpctc_rule decls premises facts i conclusion
  | ConSegTrans i j => con_seg_transitive facts i j conclusion
  | ConAngTrans i j => con_ang_transitive facts i j conclusion
  | ConTriTrans i j => con_tri_transitive facts i j conclusion
  | PerpConAng i => perp_con_ang decls facts i conclusion
  | DefMidpt i => def_midpt facts i conclusion
  | VertAng label => vert_ang decls premises label conclusion
  | DefAngBisect i => def_ang_bisect decls premises facts i conclusion
  | AngBisectConv i => ang_bisect_conv facts i conclusion
  | MidptConv i => midpt_conv premises facts i conclusion
  | DefIsosceles i => def_isosceles decls facts i conclusion
  | BaseAngle i => base_angle decls facts i conclusion
  | BaseAngleConv i => base_angle_conv decls facts i conclusion
  | ConSupplements i j k => congruent_partners_rule supplementary_pair facts i j k conclusion
  | ConSupplementsSame i j => shared_partner_rule supplementary_pair facts i j conclusion
  | ConComplements i j k => congruent_partners_rule complementary_pair facts i j k conclusion
  | ConComplementsSame i j => shared_partner_rule complementary_pair facts i j conclusion
  | DefLinearPair i => def_linear_pair facts i conclusion
  | DefPerp i => def_perp premises facts i conclusion
  | PgramOppSides i => pgram_opp_sides_rule facts i conclusion
  | PgramOppAngles i => pgram_opp_angles_rule facts i conclusion
  | PgramConsecAngs i => pgram_consec_angs_rule facts i conclusion
  | KiteOppConAng i => kite_opp_con_ang_rule facts i conclusion
  | RhombusDef i => rhombus_def_rule facts i conclusion
  | RhombusOppBisect i =>
      rhombus_opp_bisect_rule decls premises facts i conclusion
  | RectDiagCon i => rect_diag_con_rule facts i conclusion
  | RectangleDef i => rectangle_def_rule facts i conclusion
  | ParaTrans i j => para_transitive_rule facts i j conclusion
  | DefRadius i => def_radius_rule facts i conclusion
  | ConChordsArcs i => con_chords_arcs_rule facts i conclusion
  | PerpBisect i j => perp_bisector_rule facts i j conclusion
  | IsosTrapBaseAngsConv i =>
      isos_trap_base_angs_conv_rule facts i conclusion
  | CASTC i => castc_rule facts i conclusion
  | SimTriTrans i j => sim_tri_transitive facts i j conclusion
  | SuppTrans i j => substitute_rule Supplementary supplementary_pair facts i j conclusion
  | CompTrans i j => substitute_rule Complementary complementary_pair facts i j conclusion
  | PerpTransversal i j => perp_transversal_rule premises facts i j conclusion
  | LinearPairConv i => linear_pair_conv premises facts i conclusion
  | PgramDiagBisect _ | RhombusDiagPerp _ | KiteDiagPerp _ =>
      diagonal_rule premises facts r conclusion
  | ChordBisectConv i j => chord_bisect_conv_rule facts i j conclusion
  | DefRadiusConv i => def_radius_conv_rule premises facts i conclusion
  | Incomplete => statement_eqb incomplete_fact conclusion
  | _ => false
  end.

(** A reason given by templates is accepted when the steps it cites match
    one of them; any other reason is checked by its own rule above. *)
Definition rule_valid_as_written (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (r : Reason) (conclusion : Statement) : bool :=
  match reason_needs decls premises facts r conclusion with
  | Some ts => template_valid decls premises facts ts (reason_dependencies r)
  | None => bespoke_rule_valid decls premises facts r conclusion
  end.

(** A step is valid when its rule accepts it as written, in another spelling
    of its conclusion's angles, or with the angles of its conclusion and of
    every earlier step spelled canonically.  The first two cover a rule that
    builds the angles it expects from the figure; the last, a rule that
    compares the angles of cited steps with each other. *)
Definition rule_valid (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (r : Reason) (conclusion : Statement) : bool :=
  existsb (rule_valid_as_written decls premises facts r)
          (statement_spellings decls premises conclusion) ||
  rule_valid_as_written decls premises
    (map (canonical_statement decls premises) facts) r
    (canonical_statement decls premises conclusion).

(** A fact states the goal when it does once their angles are spelled
    canonically. *)
Definition goal_matches (decls : Declarations) (premises : list Premise)
    (goal fact : Statement) : bool :=
  fact_eqb goal fact || canonical_eqb decls premises goal fact.

Definition rule_diagram_premises (decls : Declarations) (premises : list Premise)
    (facts : list Statement) (reason : Reason) (conclusion : Statement)
    : list Statement :=
  let canonical := map (canonical_statement decls premises) facts in
  let cited_renamings :=
    flat_map (fun i => match lookup_step facts i with
                       | Some st => statement_ray_premises decls premises st
                       | None => []
                       end) (reason_dependencies reason) in
  dedup_statements []
    (if rule_valid_as_written decls premises facts reason conclusion
     then rule_diagram_premises_raw decls premises facts reason conclusion
     else match find (rule_valid_as_written decls premises facts reason)
                     (statement_spellings decls premises conclusion) with
          | Some respelled =>
              rule_diagram_premises_raw decls premises facts reason respelled ++
              statement_ray_premises decls premises conclusion
          | None =>
              if rule_valid_as_written decls premises canonical reason
                   (canonical_statement decls premises conclusion)
              then rule_diagram_premises_raw decls premises canonical reason
                     (canonical_statement decls premises conclusion) ++
                   statement_ray_premises decls premises conclusion ++
                   cited_renamings
              else rule_diagram_premises_raw decls premises facts reason conclusion
          end).

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
    (decls.(decl_segments) ++ flat_map crossing_segments premises)
    decls.(decl_arcs).

(** * Arcs

    An arc [r_OAB] is the minor arc from [A] to [B] of the circle centred at
    [O].  An [arc:] line declares it, and a statement may name only declared
    arcs.  A declaration is accepted only when the problem shows the arc
    exists: one declared circle is centred at [O], [A] and [B] are two
    points of it other than [O], each is the circle's radius point or put on
    it by a premise, and no premise makes [AB] a diameter, which has no minor
    arc.  These checks only reject problems; what an arc means comes from its
    declaration's audited meaning. *)
Definition circles_centered_at (decls : Declarations) (o : PointId) : list CircleName :=
  filter (fun c => ascii_eqb c.(circle_center) o) decls.(decl_circles).

Definition point_on_declared_circle (premises : list Premise) (c : CircleName)
    (p : PointId) : bool :=
  ascii_eqb p c.(circle_radius_point) || premise_found (on_circle_premise c p) premises.

Definition diameter_premise (c : CircleName) (a : ArcName) (pr : Premise) : bool :=
  match pr.(premise_statement) with
  | Diameter c' s =>
      circle_eqb c c' &&
      segment_u_eqb s (segment_name a.(arc_first) a.(arc_second))
  | _ => false
  end.

(** Why an arc declaration is rejected, if it is. *)
Inductive ArcProblem :=
| ArcCenterNotCircle | ArcCenterAmbiguous | ArcPointsNotDistinct
| ArcPointNotOnCircle (p : PointId) | ArcIsDiameter.

Definition arc_declaration_problem (decls : Declarations) (premises : list Premise)
    (a : ArcName) : option ArcProblem :=
  match circles_centered_at decls a.(arc_center) with
  | [] => Some ArcCenterNotCircle
  | [c] =>
      if ascii_eqb a.(arc_first) a.(arc_second) ||
         ascii_eqb a.(arc_first) a.(arc_center) ||
         ascii_eqb a.(arc_second) a.(arc_center)
      then Some ArcPointsNotDistinct
      else if negb (point_on_declared_circle premises c a.(arc_first))
      then Some (ArcPointNotOnCircle a.(arc_first))
      else if negb (point_on_declared_circle premises c a.(arc_second))
      then Some (ArcPointNotOnCircle a.(arc_second))
      else if premise_found (diameter_premise c a) premises
      then Some ArcIsDiameter
      else None
  | _ => Some ArcCenterAmbiguous
  end.

Definition statement_arcs (s : Statement) : list ArcName :=
  match s with
  | ConArc a b => [a; b]
  | _ => []
  end.

Definition arc_declared (decls : Declarations) (a : ArcName) : bool :=
  existsb (arc_u_eqb a) decls.(decl_arcs).

(** The arcs the premises and the goal name without declaring. *)
Definition undeclared_arcs (decls : Declarations) (premises : list Premise)
    (goal : Statement) : list ArcName :=
  filter (fun a => negb (arc_declared decls a))
    (flat_map (fun pr => statement_arcs pr.(premise_statement)) premises ++
     statement_arcs goal).

Definition arcs_valid (decls : Declarations) (premises : list Premise)
    (goal : Statement) : bool :=
  forallb (fun a => match arc_declaration_problem decls premises a with
                    | None => true | Some _ => false end) decls.(decl_arcs) &&
  match undeclared_arcs decls premises goal with [] => true | _ => false end.

Definition check_problem (p : Problem) : bool :=
  arcs_valid p.(problem_declarations) p.(problem_premises) p.(problem_goal) &&
  match check_steps (kernel_declarations p.(problem_declarations) p.(problem_premises))
          p.(problem_premises) [] p.(problem_steps) with
  | Some facts =>
      existsb (goal_matches
                 (kernel_declarations p.(problem_declarations) p.(problem_premises))
                 p.(problem_premises) p.(problem_goal)) facts
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
  rewrite triangle_congruence_unfold. apply ghost_sss; assumption.
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
  destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol H1 H2) as [Hbcd _].
  refine (conj Hbc (conj Hbd (conj (not_eq_sym Hab) (conj Hcd
    (conj (not_eq_sym Hac) (conj (not_eq_sym Had) (conj Hbcd _))))))).
  exists X. split; [exact H2|exact (ghost_bets_sym _ _ _ H1)].
Qed.

Lemma quad_wf_reversed : forall q,
  Audit.QuadrilateralWellFormed point q ->
  Audit.QuadrilateralWellFormed point (reverse_quad q).
Proof.
  intros [A B C D] Hwf. unfold Audit.QuadrilateralWellFormed in *. cbn in *.
  destruct Hwf as [Hab [Hac [Had [Hbc [Hbd [Hcd [Hncol [X [H1 H2]]]]]]]]].
  destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol H1 H2) as [Hbcd _].
  refine (conj (not_eq_sym Hcd) (conj (not_eq_sym Hbd) (conj (not_eq_sym Had)
    (conj (not_eq_sym Hbc) (conj (not_eq_sym Hac) (conj (not_eq_sym Hab)
    (conj (not_col_permutation_3 _ _ _ Hbcd) _))))))).
  exists X. split; [exact (ghost_bets_sym _ _ _ H2)|exact (ghost_bets_sym _ _ _ H1)].
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
            (split; [congruence|now apply between_symmetry])
          | unfold reverse_segment, BetS; cbn;
            split; intros [Hbet [Hne1 Hne2]];
            (split; [now apply between_symmetry|split; auto using not_eq_sym]) ].
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

Lemma lookup_pgram_sound : forall facts i statement,
  Forall Interp facts -> lookup_pgram facts i = Some statement -> Interp statement.
Proof.
  intros facts i statement Hall Hlookup. unfold lookup_pgram in Hlookup.
  destruct (lookup_step facts i) as [found|] eqn:Hfound; try discriminate.
  pose proof (lookup_step_sound _ _ _ Hall Hfound) as Hint.
  destruct found; injection Hlookup as <-; try exact Hint; exact (proj1 Hint).
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

Lemma vertex_member : forall (x : PointId) vs,
  existsb (ascii_eqb x) vs = true -> In x vs.
Proof.
  intros x vs H. apply existsb_exists in H. destruct H as [v [Hin Heq]].
  unfold ascii_eqb in Heq. apply Ascii.eqb_eq in Heq. now subst.
Qed.

Lemma declared_distinct_sound : forall decls x y,
  declarations_well_formed point decls ->
  declared_distinct decls x y = true ->
  point x <> point y.
Proof.
  intros decls x y Hwf H. pose proof Hwf as [Hwft [_ [Hwfq _]]].
  unfold declared_distinct in H. apply andb_true_iff in H.
  destruct H as [Hneq H]. apply negb_true_iff in Hneq.
  assert (Hxy : x <> y).
  { intro E. subst. unfold ascii_eqb in Hneq.
    now rewrite Ascii.eqb_refl in Hneq. }
  repeat rewrite orb_true_iff in H. destruct H as [[Hseg|Htri]|Hquad].
  - exact (declared_segment_sound _ _ Hwf Hseg).
  - apply existsb_exists in Htri. destruct Htri as [t [Hin Hv]].
    apply andb_true_iff in Hv. destruct Hv as [Hx Hy].
    apply vertex_member in Hx, Hy.
    pose proof (Hwft t Hin) as Ht. unfold triangle_well_formed in Ht.
    apply not_col_distincts in Ht. destruct Ht as [_ [Hab [Hbc Hac]]].
    cbn in Hx, Hy.
    destruct Hx as [<-|[<-|[<-|[]]]]; destruct Hy as [<-|[<-|[<-|[]]]];
      first [exfalso; now apply Hxy | assumption | now apply not_eq_sym].
  - apply existsb_exists in Hquad. destruct Hquad as [q [Hin Hv]].
    apply andb_true_iff in Hv. destruct Hv as [Hx Hy].
    apply vertex_member in Hx, Hy.
    pose proof (Hwfq q Hin) as Hq.
    destruct Hq as [HAB [HAC [HAD [HBC [HBD [HCD _]]]]]].
    cbn in Hx, Hy.
    destruct Hx as [<-|[<-|[<-|[<-|[]]]]]; destruct Hy as [<-|[<-|[<-|[<-|[]]]]];
      first [exfalso; now apply Hxy | assumption | now apply not_eq_sym].
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

Ltac forall_parts H :=
  repeat match type of H with
  | Forall _ (_ :: _) =>
      let Hp := fresh "Hpart" in
      apply Forall_cons_iff in H; destruct H as [Hp H]
  | Forall _ [] => clear H
  end.

Lemma sas_parts_sound : forall a b ps, triangle_well_formed point a ->
  In ps (sas_parts a b) -> Forall Interp ps -> interp_triangle_congruence point a b.
Proof.
  intros [A B C] [D E F] ps Hwf Hin Hps. cbn in Hin. destruct Hin as [<-|[]].
  forall_parts Hps. cbn in *. eapply ghost_sas; eauto; Cong.
Qed.

Lemma sss_parts_sound : forall a b ps, triangle_well_formed point a ->
  In ps (sss_parts a b) -> Forall Interp ps -> interp_triangle_congruence point a b.
Proof.
  intros [A B C] [D E F] ps Hwf Hin Hps. cbn in Hin. destruct Hin as [<-|[]].
  forall_parts Hps. cbn in *. now apply ghost_sss.
Qed.

Lemma asa_parts_sound : forall a b ps, triangle_well_formed point a ->
  In ps (asa_parts a b) -> Forall Interp ps -> interp_triangle_congruence point a b.
Proof.
  intros [A B C] [D E F] ps Hwf Hin Hps. cbn in Hin. destruct Hin as [<-|[]].
  forall_parts Hps. cbn in *. now apply ghost_asa.
Qed.

Lemma aas_parts_sound : forall a b ps, triangle_well_formed point a ->
  In ps (aas_parts a b) -> Forall Interp ps -> interp_triangle_congruence point a b.
Proof.
  intros [A B C] [D E F] ps Hwf Hin Hps. cbn in Hin.
  destruct Hin as [<-|[<-|[]]]; forall_parts Hps; cbn in *;
    apply ghost_aas; auto; now apply conga_comm.
Qed.

Lemma rhl_parts_sound : forall a b ps, triangle_well_formed point a ->
  In ps (rhl_parts a b) -> Forall Interp ps -> interp_triangle_congruence point a b.
Proof.
  intros [A B C] [D E F] ps Hwf Hin Hps.
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
    apply ghost_sss; auto; Cong. }
  cbn in Hin. destruct Hin as [<-|[<-|[]]]; forall_parts Hps; cbn in *;
    destruct Hpart as [Hper Hper']; now apply Hbuild.
Qed.

Lemma reversed_well_formed : forall t,
  triangle_well_formed point t -> triangle_well_formed point (reverse_triangle t).
Proof.
  intros [A B C]. unfold triangle_well_formed, reverse_triangle; cbn.
  intros Hncol Hcol. apply Hncol. Col.
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

Lemma def_ang_bisect_sound : forall decls premises facts i conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Forall Interp facts -> def_ang_bisect decls premises facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros decls premises facts i conclusion Hwf Hprem Hfacts Hrule.
  unfold def_ang_bisect in Hrule.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  all: try old_names_eq Hlookup.
  assert (Hbisect : Interp (AngBisect a s)) by (eapply lookup_step_sound; eauto).
  cbn in Hbisect.
  apply orb_true_iff in Hrule; destruct Hrule as [Hcase|Hcase];
    apply andb_true_iff in Hcase; destruct Hcase as [Hvertex Hmatch];
    unfold ascii_eqb in Hvertex; apply Ascii.eqb_eq in Hvertex;
    apply (dependency_matches_sound _ _ _ _ Hwf Hprem Hmatch);
    unfold bisector_halves; cbn;
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
  unfold reverse_segment, BetS in *. cbn in Hon |- *.
  destruct Hon as [Hbet [Hne1 Hne2]].
  split; [now apply between_symmetry|split; auto using not_eq_sym].
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
    cbn in Hst. destruct Hst as [Hbet _].
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

Lemma reading_witnessed_sound : forall decls premises facts t u,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  triangle_well_formed point t ->
  reading_witnessed decls premises facts t u = true ->
  interp_triangle_congruence point t u.
Proof.
  intros decls premises facts t u Hwf Hprem Hfacts Ht H.
  unfold reading_witnessed in H. apply orb_true_iff in H.
  destruct H as [H|H].
  - apply existsb_exists in H. destruct H as [ps [Hin Hsup]].
    assert (Hps : Forall Interp ps).
    { apply Forall_forall. intros x Hx.
      destruct (supported_lookup _ _ _ _ (proj1 (forallb_forall _ _) Hsup x Hx))
        as [i [y [Hy Hm]]].
      exact (dependency_matches_sound _ _ _ _ Hwf Hprem Hm
               (lookup_step_sound _ _ _ Hfacts Hy)). }
    unfold criterion_readings in Hin. repeat rewrite in_app_iff in Hin.
    destruct Hin as [Hin|[Hin|[Hin|[Hin|Hin]]]];
      [ exact (sas_parts_sound _ _ _ Ht Hin Hps)
      | exact (sss_parts_sound _ _ _ Ht Hin Hps)
      | exact (asa_parts_sound _ _ _ Ht Hin Hps)
      | exact (aas_parts_sound _ _ _ Ht Hin Hps)
      | exact (rhl_parts_sound _ _ _ Ht Hin Hps) ].
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
    apply andb_true_iff in H. destruct H as [Hc Hw].
    apply (cpctc_sound a u' conclusion); [|exact Hc].
    eapply chain_witnessed_sound; eauto.
  - apply (cpctc_sound a b conclusion); [|exact H].
    assert (Hord : Interp (ConTriOrdered a b)) by (eapply lookup_step_sound; eauto).
    exact (proj2 (proj2 (ordered_congruence_parts _ _ Hord))).
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
  now apply ghost_base_angle.
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
  now apply ghost_base_angle_conv.
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

Lemma complement_sym : forall a b,
  Interp (Complementary a b) -> Interp (Complementary b a).
Proof.
  intros a b [X [Y [Z [Hper [Hsams Hsuma]]]]]. cbn in Hsams, Hsuma |- *.
  exists X, Y, Z.
  split; [exact Hper|split; [now apply sams_sym|now apply suma_sym]].
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

(** What the shared angle-pair rules need of a pair statement. *)
Record AnglePairLaws (pair : AngleName -> AngleName -> Statement)
    (pair_of : Statement -> option (AngleName * AngleName)) : Prop := {
  pair_of_sound : forall s x y, pair_of s = Some (x, y) -> Interp s -> Interp (pair x y);
  pair_sym : forall x y, Interp (pair x y) -> Interp (pair y x);
  (** A pair names nondegenerate angles. *)
  pair_wf : forall x y, Interp (pair x y) -> Interp (ConAng y y);
  (** An angle may be replaced by a congruent one. *)
  pair_respects : forall x y z,
    Interp (pair x y) -> Interp (ConAng y z) -> Interp (pair x z);
  (** Angles paired with congruent angles are congruent. *)
  pair_transfer : forall x y z w,
    Interp (pair x y) -> Interp (pair z w) -> Interp (ConAng y w) -> Interp (ConAng x z)
}.

Section AnglePairsSound.
Context (pair : AngleName -> AngleName -> Statement)
        (pair_of : Statement -> option (AngleName * AngleName))
        (L : AnglePairLaws pair pair_of).

Lemma cited_pair_sound : forall facts i x y,
  Forall Interp facts -> cited_pair pair_of facts i = Some (x, y) -> Interp (pair x y).
Proof.
  intros facts i x y Hall H. unfold cited_pair in H.
  destruct (lookup_step facts i) as [s|] eqn:Hs; [|discriminate].
  apply (pair_of_sound _ _ L s); [exact H|eapply lookup_step_sound; eauto].
Qed.

(** An angle written backwards is congruent to itself as written. *)
Lemma linked_angle_sound : forall y w,
  angle_u_eqb y w = true -> Interp (ConAng w w) -> Interp (ConAng y w).
Proof.
  intros y w H Hw. apply angle_u_eqb_cases in H.
  destruct H as [->| ->]; [exact Hw|].
  unfold reverse_angle. cbn in Hw |- *. CongA.
Qed.

Lemma partners_link_sound : forall linked a b c d conclusion,
  Interp (pair a b) -> Interp (pair c d) ->
  (forall y w, linked y w = true -> Interp (ConAng w w) -> Interp (ConAng y w)) ->
  partners_link linked a b c d conclusion = true -> Interp conclusion.
Proof.
  intros linked a b c d conclusion Hab Hcd Hlinked H.
  pose proof (pair_sym _ _ L _ _ Hab) as Hba.
  pose proof (pair_sym _ _ L _ _ Hcd) as Hdc.
  pose proof (pair_wf _ _ L _ _ Hcd) as Hdd.
  pose proof (pair_wf _ _ L _ _ Hdc) as Hcc.
  unfold partners_link in H. repeat rewrite orb_true_iff in H.
  destruct H as [[[H|H]|H]|H]; apply andb_true_iff in H; destruct H as [Hl Heq];
    apply (fact_eqb_sound _ _ Heq).
  - exact (pair_transfer _ _ L a b c d Hab Hcd (Hlinked _ _ Hl Hdd)).
  - exact (pair_transfer _ _ L a b d c Hab Hdc (Hlinked _ _ Hl Hcc)).
  - exact (pair_transfer _ _ L b a c d Hba Hcd (Hlinked _ _ Hl Hdd)).
  - exact (pair_transfer _ _ L b a d c Hba Hdc (Hlinked _ _ Hl Hcc)).
Qed.

Lemma congruent_partners_rule_sound : forall facts i j k conclusion,
  Forall Interp facts ->
  congruent_partners_rule pair_of facts i j k conclusion = true -> Interp conclusion.
Proof.
  intros facts i j k conclusion Hall H. unfold congruent_partners_rule in H.
  destruct (cited_pair pair_of facts i) as [[a b]|] eqn:Hi; [|discriminate].
  destruct (cited_pair pair_of facts j) as [[c d]|] eqn:Hj; [|discriminate].
  destruct (lookup_step facts k) as [w|] eqn:Hk; [|discriminate].
  assert (Hw : Interp w) by (eapply lookup_step_sound; eauto).
  refine (partners_link_sound _ a b c d conclusion
            (cited_pair_sound _ _ _ _ Hall Hi) (cited_pair_sound _ _ _ _ Hall Hj) _ H).
  intros y z Hl _. exact (proj2 (fact_eqb_sound _ _ Hl) Hw).
Qed.

Lemma shared_partner_rule_sound : forall facts i j conclusion,
  Forall Interp facts ->
  shared_partner_rule pair_of facts i j conclusion = true -> Interp conclusion.
Proof.
  intros facts i j conclusion Hall H. unfold shared_partner_rule in H.
  destruct (cited_pair pair_of facts i) as [[a b]|] eqn:Hi; [|discriminate].
  destruct (cited_pair pair_of facts j) as [[c d]|] eqn:Hj; [|discriminate].
  exact (partners_link_sound _ a b c d conclusion
           (cited_pair_sound _ _ _ _ Hall Hi) (cited_pair_sound _ _ _ _ Hall Hj)
           linked_angle_sound H).
Qed.

Lemma substitute_link_sound : forall keep old x y conclusion,
  Interp (pair keep old) -> Interp (ConAng x y) ->
  substitute_link pair keep old x y conclusion = true -> Interp conclusion.
Proof.
  intros keep old x y conclusion Hpair Hxy H.
  pose proof (pair_wf _ _ L _ _ Hpair) as Hold.
  unfold substitute_link in H. apply orb_true_iff in H.
  destruct H as [H|H]; apply andb_true_iff in H; destruct H as [Hlink Heq];
    apply (fact_eqb_sound _ _ Heq); apply (pair_respects _ _ L _ _ _ Hpair).
  - (* old is x: old ~ x ~ y *)
    apply angle_u_eqb_cases in Hlink.
    destruct Hlink as [->| ->]; [exact Hxy|].
    unfold reverse_angle in Hold. cbn in Hold, Hxy |- *.
    eapply conga_trans; [|exact Hxy]. CongA.
  - (* old is y: old ~ y ~ x *)
    apply angle_u_eqb_cases in Hlink.
    destruct Hlink as [->| ->]; cbn in Hxy |- *; [now apply conga_sym|].
    unfold reverse_angle in Hold. cbn in Hold |- *.
    eapply conga_trans; [|apply conga_sym; exact Hxy]. CongA.
Qed.

Lemma substitute_rule_sound : forall facts i j conclusion,
  Forall Interp facts ->
  substitute_rule pair pair_of facts i j conclusion = true -> Interp conclusion.
Proof.
  intros facts i j conclusion Hall H. unfold substitute_rule in H.
  destruct (cited_pair pair_of facts i) as [[a b]|] eqn:Hi; [|discriminate].
  destruct (lookup_step facts j) as [w|] eqn:Hj; [|discriminate].
  destruct (angle_congruence_pair w) as [[x y]|] eqn:Hpair; [|discriminate].
  pose proof (cited_pair_sound _ _ _ _ Hall Hi) as Hab.
  assert (Hxy : Interp (ConAng x y)).
  { assert (Hw : Interp w) by (eapply lookup_step_sound; eauto).
    destruct w; cbn in Hpair; try discriminate;
      injection Hpair as <- <-; first [exact Hw | exact (proj2 Hw)]. }
  apply orb_true_iff in H. destruct H as [H|H].
  - exact (substitute_link_sound _ _ _ _ _ Hab Hxy H).
  - exact (substitute_link_sound _ _ _ _ _ (pair_sym _ _ L _ _ Hab) Hxy H).
Qed.
End AnglePairsSound.

Lemma supplementary_laws : AnglePairLaws Supplementary supplementary_pair.
Proof.
  split.
  - intros s x y H Hs. destruct s; cbn in H; try discriminate.
    injection H as <- <-. exact Hs.
  - intros x y H. cbn in *. now apply suppa_sym.
  - intros x y H. cbn in *.
    pose proof (suppa_distincts _ _ _ _ _ _ H) as Hd. spliter.
    apply conga_refl; auto.
  - intros x y z Hxy Hyz. cbn in *.
    pose proof (suppa_distincts _ _ _ _ _ _ Hxy) as Hd. spliter.
    eapply conga2_suppa__suppa; [apply conga_refl; auto|exact Hyz|exact Hxy].
  - exact supplements_transfer.
Qed.

Lemma complementary_laws : AnglePairLaws Complementary complementary_pair.
Proof.
  split.
  - intros s x y H Hs. destruct s; cbn in H; try discriminate.
    injection H as <- <-. exact Hs.
  - exact complement_sym.
  - exact complementary_second_refl.
  - intros x y z [X [Y [Z [Hper [Hsams Hsuma]]]]] Hyz. cbn in Hsams, Hsuma, Hyz |- *.
    pose proof (suma_distincts _ _ _ _ _ _ _ _ _ Hsuma) as Hd. spliter.
    assert (Hxx : CongA (point (angle_first x)) (point (angle_vertex x))
                        (point (angle_last x))
                        (point (angle_first x)) (point (angle_vertex x))
                        (point (angle_last x)))
      by (apply conga_refl; auto using not_eq_sym).
    exists X, Y, Z. split; [exact Hper|]. split.
    + eapply conga2_sams__sams; [exact Hxx|exact Hyz|exact Hsams].
    + eapply conga3_suma__suma;
        [exact Hsuma|exact Hxx|exact Hyz|apply conga_refl; auto using not_eq_sym].
  - exact complements_transfer.
Qed.

(** ** Angles named along their rays

    A renaming moves a ray's named point along the ray.  [SideOk v p p']:
    [p'] is [p], or on the ray from [v] through [p]. *)
Definition SideOk (v p p' : PointId) : Prop :=
  p' = p \/ Out (point v) (point p) (point p').

Definition SameAngle (a a' : AngleName) : Prop :=
  a'.(angle_vertex) = a.(angle_vertex) /\
  SideOk a.(angle_vertex) a.(angle_first) a'.(angle_first) /\
  SideOk a.(angle_vertex) a.(angle_last) a'.(angle_last).

(** A segment from [v], read as a ray, renamed along itself. *)
Definition SameRay (v : PointId) (s s' : SegmentName) : Prop :=
  (s.(segment_first) = v /\ s'.(segment_first) = v /\
   SideOk v s.(segment_second) s'.(segment_second)) \/
  (s.(segment_second) = v /\ s'.(segment_second) = v /\
   SideOk v s.(segment_first) s'.(segment_first)) \/
  s' = s.

(** [st'] is [st] with its angles renamed along their rays. *)
Definition Respelled (st st' : Statement) : Prop :=
  match st, st' with
  | Right a, Right a' => SameAngle a a'
  | ConAng a b, ConAng a' b' | ConRight a b, ConRight a' b'
  | Supplementary a b, Supplementary a' b'
  | Complementary a b, Complementary a' b' => SameAngle a a' /\ SameAngle b b'
  | AngBisect a s, AngBisect a' s' => SameAngle a a' /\ SameRay a.(angle_vertex) s s'
  | _, _ => st' = st
  end.

Lemma side_ok_swap : forall v p p', SideOk v p p' -> SideOk v p' p.
Proof.
  intros v p p' [->|H]; [now left|right; now apply l6_6].
Qed.

Lemma side_out : forall v p p',
  point p <> point v -> SideOk v p p' -> Out (point v) (point p) (point p').
Proof. intros v p p' Hp [->|H]; [now apply out_trivial|exact H]. Qed.

Lemma side_distinct : forall v p p',
  point p <> point v -> SideOk v p p' -> point p' <> point v.
Proof.
  intros v p p' Hp H. exact (proj2 (out_distinct _ _ _ (side_out _ _ _ Hp H))).
Qed.

Lemma same_angle_sym : forall a a', SameAngle a a' -> SameAngle a' a.
Proof.
  intros a a' [Hv [H1 H2]]. split; [now symmetry|].
  rewrite Hv. split; now apply side_ok_swap.
Qed.

Lemma same_angle_conga : forall a a',
  SameAngle a a' ->
  point a.(angle_first) <> point a.(angle_vertex) ->
  point a.(angle_last) <> point a.(angle_vertex) ->
  CongA (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last))
        (point a'.(angle_first)) (point a'.(angle_vertex)) (point a'.(angle_last)).
Proof.
  intros a a' [Hv [H1 H2]] Hp Hq. rewrite Hv.
  apply out2__conga; apply l6_6; now apply side_out.
Qed.

(** A renamed angle is congruent to the original, given the original is
    nondegenerate, as any angle in a congruence is. *)
Lemma same_angle_conga_of : forall a a' X Y Z,
  SameAngle a a' ->
  CongA (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last)) X Y Z ->
  CongA (point a'.(angle_first)) (point a'.(angle_vertex)) (point a'.(angle_last)) X Y Z.
Proof.
  intros a a' X Y Z Hs H.
  destruct (conga_distinct _ _ _ _ _ _ H) as [_ [Hp [Hq _]]].
  eapply conga_trans; [apply conga_sym, (same_angle_conga a a' Hs Hp Hq)|exact H].
Qed.

Lemma per_side_first : forall v p p' q,
  SideOk v p p' -> Per (point p) (point v) (point q) -> Per (point p') (point v) (point q).
Proof.
  intros v p p' q [->|Hout] Hper; [exact Hper|].
  apply (l8_3 _ _ _ _ Hper); [exact (proj1 (out_distinct _ _ _ Hout))|].
  now apply out_col.
Qed.

Lemma per_respelled : forall a a',
  SameAngle a a' ->
  Per (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last)) ->
  Per (point a'.(angle_first)) (point a'.(angle_vertex)) (point a'.(angle_last)).
Proof.
  intros a a' [Hv [H1 H2]] Hper. rewrite Hv.
  apply (per_side_first _ _ _ _ H1). apply l8_2.
  apply (per_side_first _ _ _ _ H2). now apply l8_2.
Qed.

(** The two halves of a bisected angle, carried across renamings of the
    angle's sides and of the bisector. *)
Lemma halves_respelled : forall v p q f p' q' f',
  SideOk v p p' -> SideOk v q q' -> SideOk v f f' ->
  CongA (point p) (point v) (point f) (point f) (point v) (point q) ->
  CongA (point p') (point v) (point f') (point f') (point v) (point q').
Proof.
  intros v p q f p' q' f' Hp Hq Hf H.
  destruct (conga_distinct _ _ _ _ _ _ H) as [_ [Hpv [Hfv [Hfv' Hqv]]]].
  eapply conga_trans; [|eapply conga_trans; [exact H|]].
  - apply conga_sym, out2__conga; apply l6_6; now apply side_out.
  - apply out2__conga; apply l6_6; now apply side_out.
Qed.

Lemma pair_respelled : forall pair pair_of, AnglePairLaws pair pair_of ->
  forall a b a' b', SameAngle a a' -> SameAngle b b' ->
  Interp (pair a b) -> Interp (pair a' b').
Proof.
  intros pair pair_of L a b a' b' Ha Hb H.
  assert (Hbb : Interp (ConAng b b')).
  { pose proof (pair_wf _ _ L _ _ H) as Hw. cbn in Hw |- *.
    destruct (conga_distinct _ _ _ _ _ _ Hw) as [_ [Hp [Hq _]]].
    exact (same_angle_conga b b' Hb Hp Hq). }
  pose proof (pair_respects _ _ L _ _ _ H Hbb) as H1.
  apply (pair_sym _ _ L) in H1.
  assert (Haa : Interp (ConAng a a')).
  { pose proof (pair_wf _ _ L _ _ H1) as Hw. cbn in Hw |- *.
    destruct (conga_distinct _ _ _ _ _ _ Hw) as [_ [Hp [Hq _]]].
    exact (same_angle_conga a a' Ha Hp Hq). }
  apply (pair_sym _ _ L). exact (pair_respects _ _ L _ _ _ H1 Haa).
Qed.

Lemma respelled_interp : forall st st', Respelled st st' -> Interp st -> Interp st'.
Proof.
  intros st st' Hr H.
  destruct st; cbn [Respelled] in Hr;
    try (subst st'; exact H);
    destruct st'; try (discriminate Hr); try (rewrite Hr; exact H).
  - (* right *)
    cbn in H |- *. destruct H as [[Hp Hq] Hper].
    pose proof Hr as Hs. destruct Hr as [Hv [H1 H2]].
    unfold Audit.AngleWellFormed in *. cbn in *.
    split; [split|].
    + rewrite Hv. exact (side_distinct _ _ _ Hp H1).
    + rewrite Hv. exact (side_distinct _ _ _ Hq H2).
    + exact (per_respelled _ _ Hs Hper).
  - (* con_ang *)
    destruct Hr as [Ha Hb]. cbn in H |- *.
    apply (same_angle_conga_of _ _ _ _ _ Ha).
    apply conga_sym. apply (same_angle_conga_of _ _ _ _ _ Hb). now apply conga_sym.
  - (* con_right *)
    destruct Hr as [Ha Hb]. cbn in H |- *. destruct H as [H1 H2].
    split; [exact (per_respelled _ _ Ha H1)|exact (per_respelled _ _ Hb H2)].
  - (* ang_bisect *)
    destruct Hr as [Ha Hs]. destruct Ha as [Hv [H1 H2]].
    cbn in H |- *. unfold Audit.AngleBisector in *. cbn in *. rewrite Hv.
    destruct Hs as [[Hf [Hf' Hside]]|[[Hf [Hf' Hside]] | ->]];
      destruct H as [[Hb Hc]|[Hb Hc]].
    + left. split; [exact Hf'|]. eapply halves_respelled; eauto.
    + exfalso. rewrite Hf in Hc. destruct (conga_distinct _ _ _ _ _ _ Hc) as [_ [_ [Hx _]]].
      now apply Hx.
    + exfalso. rewrite Hf in Hc. destruct (conga_distinct _ _ _ _ _ _ Hc) as [_ [_ [Hx _]]].
      now apply Hx.
    + right. split; [exact Hf'|]. eapply halves_respelled; eauto.
    + left. split; [exact Hb|]. eapply halves_respelled; eauto. now left.
    + right. split; [exact Hb|]. eapply halves_respelled; eauto. now left.
  - destruct Hr as [Ha Hb]. exact (pair_respelled _ _ supplementary_laws _ _ _ _ Ha Hb H).
  - destruct Hr as [Ha Hb]. exact (pair_respelled _ _ complementary_laws _ _ _ _ Ha Hb H).
Qed.

Lemma respelled_sym : forall st st', Respelled st st' -> Respelled st' st.
Proof.
  intros st st' Hr.
  destruct st; cbn [Respelled] in Hr;
    try (subst st'; cbn [Respelled]; reflexivity);
    destruct st'; try (discriminate Hr); try (rewrite Hr; cbn [Respelled]; reflexivity);
    cbn [Respelled].
  - now apply same_angle_sym.
  - destruct Hr; split; now apply same_angle_sym.
  - destruct Hr; split; now apply same_angle_sym.
  - destruct Hr as [Ha Hs]. split; [now apply same_angle_sym|].
    destruct Ha as [Hv _]. rewrite Hv.
    destruct Hs as [[H1 [H2 H3]]|[[H1 [H2 H3]] | ->]].
    + left. repeat split; auto. now apply side_ok_swap.
    + right; left. repeat split; auto. now apply side_ok_swap.
    + right; right. reflexivity.
  - destruct Hr; split; now apply same_angle_sym.
  - destruct Hr; split; now apply same_angle_sym.
Qed.

Lemma respelled_iff : forall st st', Respelled st st' -> (Interp st <-> Interp st').
Proof.
  intros st st' H. split; [now apply respelled_interp|].
  apply respelled_interp. now apply respelled_sym.
Qed.

Lemma on_segment_match_strict : forall v p q s r,
  on_segment_match v p q s r = true ->
  BetS (point s.(segment_first)) (point r) (point s.(segment_second)) ->
  point p <> point v /\ point q <> point v.
Proof.
  intros v p q s r H [Hbet [H1 H2]]. unfold on_segment_match in H.
  apply orb_true_iff in H.
  destruct H as [H|H]; apply andb_true_iff in H; destruct H as [Hs Hr];
    unfold ascii_eqb in Hr; apply Ascii.eqb_eq in Hr; subst r;
    apply segment_u_eqb_cases in Hs; destruct Hs as [-> | ->];
    unfold reverse_segment in *; cbn in *;
    split; intro E; rewrite E in *;
    first [congruence | apply between_identity in Hbet; congruence].
Qed.

Lemma strict_ray_linked_distinct : forall premises v p q,
  Forall (interp_premise point) premises ->
  strict_ray_linked premises v p q = true ->
  point p <> point v /\ point q <> point v.
Proof.
  intros premises v p q Hprem H. unfold strict_ray_linked in H.
  rewrite premise_found_existsb in H. apply existsb_exists in H.
  destruct H as [pr [Hin Hc]].
  pose proof ((proj1 (Forall_forall _ _)) Hprem pr Hin) as Hpr.
  unfold interp_premise in Hpr. unfold strict_ray_link in Hc.
  destruct (premise_statement pr); try discriminate; cbn in Hpr.
  - exact (on_segment_match_strict _ _ _ _ _ Hc Hpr).
  - destruct Hpr as [Ha Hb]. apply orb_true_iff in Hc.
    destruct Hc as [Hc|Hc]; [exact (on_segment_match_strict _ _ _ _ _ Hc Ha)
                            |exact (on_segment_match_strict _ _ _ _ _ Hc Hb)].
Qed.

(** The points [ray_class] collects are on the ray. *)
Lemma ray_grow_side : forall decls premises v p,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  point p <> point v ->
  forall fuel seen, (forall y, In y seen -> SideOk v p y) ->
  forall x, In x (ray_grow fuel (ray_step decls premises v) seen) -> SideOk v p x.
Proof.
  intros decls premises v p Hwf Hprem Hp fuel.
  induction fuel as [|n IH]; intros seen Hseen x Hx; cbn [ray_grow] in Hx;
    [exact (Hseen x Hx)|].
  destruct (filter _ _) as [|f fs] eqn:Hfresh; [exact (Hseen x Hx)|].
  apply (IH (seen ++ f :: fs)); [|exact Hx].
  intros y Hy. apply in_app_or in Hy. destruct Hy as [Hy|Hy]; [exact (Hseen y Hy)|].
  rewrite <- Hfresh in Hy. apply filter_In in Hy. destruct Hy as [Hy _].
  apply in_flat_map in Hy. destruct Hy as [z [Hz Hy]].
  unfold ray_step in Hy. apply filter_In in Hy. destruct Hy as [_ Hc].
  apply andb_true_iff in Hc. destruct Hc as [Hd Hl].
  assert (Hyv : point y <> point v).
  { apply orb_true_iff in Hd. destruct Hd as [Hd|Hd].
    - exact (not_eq_sym (declared_distinct_sound _ _ _ Hwf Hd)).
    - exact (proj2 (strict_ray_linked_distinct _ _ _ _ Hprem Hd)). }
  pose proof (Hseen z Hz) as Hzs.
  pose proof (side_distinct _ _ _ Hp Hzs) as Hzv.
  pose proof (l6_6 _ _ _ (ray_linked_out premises v z y Hprem Hl Hzv Hyv)) as Hzy.
  right. destruct Hzs as [->|Hpz]; [exact Hzy|exact (l6_7 _ _ _ _ Hpz Hzy)].
Qed.

Lemma ray_class_side : forall decls premises v p x,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  In x (ray_class decls premises v p) -> SideOk v p x.
Proof.
  intros decls premises v p x Hwf Hprem Hx. unfold ray_class in Hx.
  destruct (ray_anchored decls premises v p) eqn:Hd.
  - eapply ray_grow_side; [exact Hwf|exact Hprem| | |exact Hx].
    + unfold ray_anchored in Hd. apply orb_true_iff in Hd. destruct Hd as [Hd|Hd].
      * exact (not_eq_sym (declared_distinct_sound _ _ _ Hwf Hd)).
      * apply existsb_exists in Hd. destruct Hd as [z [_ Hz]].
        exact (proj1 (strict_ray_linked_distinct _ _ _ _ Hprem Hz)).
    + intros y [<-|[]]. now left.
  - destruct Hx as [<-|[]]. now left.
Qed.

Lemma least_point_in : forall xs p, least_point p xs = p \/ In (least_point p xs) xs.
Proof.
  unfold least_point. induction xs as [|x xs IH]; intros p; cbn [fold_left]; [now left|].
  destruct (point_ltb x p).
  - destruct (IH x) as [H|H]; [rewrite H; right; now left|right; now right].
  - destruct (IH p) as [H|H]; [now left|right; now right].
Qed.

Lemma ray_rep_side : forall decls premises v p,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  SideOk v p (ray_rep decls premises v p).
Proof.
  intros decls premises v p Hwf Hprem. unfold ray_rep.
  destruct (least_point_in (ray_class decls premises v p) p) as [H|H].
  - rewrite H. now left.
  - exact (ray_class_side _ _ _ _ _ Hwf Hprem H).
Qed.

Lemma canonical_angle_same : forall decls premises a,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  SameAngle a (canonical_angle decls premises a).
Proof.
  intros decls premises a Hwf Hprem. unfold canonical_angle, SameAngle. cbn.
  split; [reflexivity|]. split; now apply ray_rep_side.
Qed.

Lemma canonical_respelled : forall decls premises st,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  Respelled st (canonical_statement decls premises st).
Proof.
  intros decls premises st Hwf Hprem.
  pose proof (canonical_angle_same decls premises) as Hc.
  destruct st; cbn [canonical_statement Respelled]; try reflexivity;
    try (now apply Hc); try (split; now apply Hc).
  split; [now apply Hc|]. unfold SameRay, canonical_ray.
  destruct (ascii_eqb (segment_first s) (angle_vertex a)) eqn:H1.
  - apply Ascii.eqb_eq in H1. left. cbn. repeat split; auto.
    now apply ray_rep_side.
  - destruct (ascii_eqb (segment_second s) (angle_vertex a)) eqn:H2.
    + apply Ascii.eqb_eq in H2. right; left. cbn. repeat split; auto.
      now apply ray_rep_side.
    + right; right. reflexivity.
Qed.

Lemma angle_spellings_same : forall decls premises a a',
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  In a' (angle_spellings decls premises a) -> SameAngle a a'.
Proof.
  intros decls premises a a' Hwf Hprem H. unfold angle_spellings in H.
  apply in_flat_map in H. destruct H as [p [Hp H]].
  apply in_map_iff in H. destruct H as [q [<- Hq]].
  unfold SameAngle. cbn. split; [reflexivity|].
  split; eapply ray_class_side; eauto.
Qed.

Lemma statement_spellings_respelled : forall decls premises st st',
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  In st' (statement_spellings decls premises st) -> Respelled st st'.
Proof.
  intros decls premises st st' Hwf Hprem H.
  pose proof (angle_spellings_same decls premises) as Hs.
  destruct st; cbn [statement_spellings] in H;
    try (destruct H as [<-|[]]; cbn [Respelled]; reflexivity).
  (* a bisector keeps its spelling *)
  all: try (destruct H as [<-|[]]; cbn [Respelled];
            split; [split; [reflexivity|split; now left]|right; right; reflexivity]).
  all: try (apply in_map_iff in H; destruct H as [a' [<- Ha]]; cbn [Respelled];
             now eauto).
  all: apply in_flat_map in H; destruct H as [a' [Ha H]];
    apply in_map_iff in H; destruct H as [b' [<- Hb]]; cbn [Respelled]; split; eauto.
Qed.

Lemma canonical_eqb_sound : forall decls premises expected actual,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  canonical_eqb decls premises expected actual = true ->
  Interp actual -> Interp expected.
Proof.
  intros decls premises expected actual Hwf Hprem H Ha. unfold canonical_eqb in H.
  apply (proj2 (respelled_iff _ _ (canonical_respelled decls premises expected Hwf Hprem))).
  apply (proj2 (fact_eqb_sound _ _ H)).
  exact (proj1 (respelled_iff _ _ (canonical_respelled decls premises actual Hwf Hprem)) Ha).
Qed.

Lemma goal_matches_sound : forall decls premises goal fact,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  goal_matches decls premises goal fact = true -> Interp fact -> Interp goal.
Proof.
  intros decls premises goal fact Hwf Hprem H Hf. unfold goal_matches in H.
  apply orb_true_iff in H. destruct H as [H|H].
  - exact (proj2 (fact_eqb_sound _ _ H) Hf).
  - exact (canonical_eqb_sound _ _ _ _ Hwf Hprem H Hf).
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
  destruct Hpr as [Hbet _].
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
  cbn in Hline. destruct Hline as [Hbet [Hn1 Hn2]].
  assert (Hne : point (segment_first s) <> point (segment_second s)).
  { intro E. rewrite <- E in Hbet. apply between_identity in Hbet. congruence. }
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
  GhostTransversalRelaxed (point i1) (point i2)
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
    destruct (ghost_transversal_full_relaxed _ _ _ _ _ _ HI Hab Hcd Hos)
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
  destruct Hc as [[Hr1 _] [[Hr2 _] [HOX Hconga]]].
  (* Each arc's endpoints are equally far from its centre, so the second
     radii match through the first. *)
  assert (HOY : Cong (point a.(arc_center)) (point a.(arc_second))
                     (point a0.(arc_center)) (point a0.(arc_second))).
  { apply cong_transitivity with (point a.(arc_center)) (point a.(arc_first)); [Cong|].
    apply cong_transitivity with (point a0.(arc_center)) (point a0.(arc_first));
      [exact HOX|exact Hr2]. }
  destruct (l11_49 (point a.(arc_first)) (point a.(arc_center))
              (point a.(arc_second)) (point a0.(arc_first))
              (point a0.(arc_center)) (point a0.(arc_second))
              Hconga HOX HOY) as [Hchord _].
  eapply cong_pair_conclude; [exact Hrule|]. cbn. exact Hchord.
Qed.

(** Everything above holds in neutral geometry.  [third_angle] is the first
    rule that genuinely needs the parallel postulate, so the assumption enters
    here rather than at the top of the section; every lemma stated before this
    point is free of it. *)
Context {TE : @Tarski_euclidean Tn TnEQD}.

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

Lemma pgram_opp_sides_sound : forall facts i conclusion,
  Forall Interp facts -> pgram_opp_sides_rule facts i conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i conclusion Hfacts Hrule.
  unfold pgram_opp_sides_rule in Hrule.
  destruct conclusion; try discriminate. all: try old_names_goal.
  destruct (lookup_pgram facts i) as [x|] eqn:Hx; try discriminate;
    destruct x; try discriminate.
  all: try old_names_eq Hx.
  assert (Hp : Interp (Parallelogram q)) by (eapply lookup_pgram_sound; eauto).
  cbn in Hp. destruct Hp as [Hwfq [Hpar1 Hpar2]].
  destruct Hwfq as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol, HXac, HXbd.
  pose proof (ghost_pgram_opp_sides _ _ _ _ _ Hncol HXac HXbd Hpar1 Hpar2)
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
  destruct (lookup_pgram facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  all: try old_names_eq Hlookup.
  assert (Hp : Interp (Parallelogram q)) by (eapply lookup_pgram_sound; eauto).
  cbn in Hp. destruct Hp as [Hwf [Hpar1 Hpar2]].
  destruct Hwf as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol Hex]]]]]]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol.
  pose proof (ghost_pgram_opp_angles
    (point q.(quadrilateral_first)) (point q.(quadrilateral_second))
    (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth))
    (conj HAB (conj HAC HBC)) Hncol Hpar1 Hpar2) as [Hang1 Hang2].
  apply orb_true_iff in Hrule. destruct Hrule as [Hm|Hm].
  - eapply conga_pair_conclude; [exact Hm|]. cbn. now apply conga_sym.
  - eapply conga_pair_conclude; [exact Hm|]. cbn. exact Hang1.
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
Lemma ghost_two_pairs_bisect : forall V P Q W,
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
  pose proof (declared_distinct_sound _ _ _ Hwf Hdeclared) as Hdistinct.
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
    apply ghost_two_pairs_bisect; auto.
    + apply cong_symmetry, cong_right_commutativity, Hda.
    + apply cong_right_commutativity, cong_symmetry, Hbc.
  - apply (bisect_ray_conclude decls premises _ _ q.(quadrilateral_third) q.(quadrilateral_second)
             q.(quadrilateral_fourth) q.(quadrilateral_first) Hdecls Hprem Ha Hray);
      [exact HBC|now apply not_eq_sym|exact HAC|].
    apply ghost_two_pairs_bisect; auto.
    + apply cong_left_commutativity, Hbc.
    + apply cong_right_commutativity, Hda.
  - apply (bisect_ray_conclude decls premises _ _ q.(quadrilateral_second) q.(quadrilateral_first)
             q.(quadrilateral_third) q.(quadrilateral_fourth) Hdecls Hprem Ha Hray);
      [exact HAB|now apply not_eq_sym|now apply not_eq_sym|].
    apply ghost_two_pairs_bisect; auto.
    + apply cong_left_commutativity, Hab.
    + apply cong_symmetry, cong_left_commutativity, Hcd.
  - apply (bisect_ray_conclude decls premises _ _ q.(quadrilateral_fourth) q.(quadrilateral_third)
             q.(quadrilateral_first) q.(quadrilateral_second) Hdecls Hprem Ha Hray);
      [exact HCD|now apply not_eq_sym|exact HBD|].
    apply ghost_two_pairs_bisect; auto.
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
  destruct (lookup_pgram facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  all: try old_names_eq Hlookup.
  assert (Hp : Interp (Parallelogram q)) by (eapply lookup_pgram_sound; eauto).
  cbn in Hp. destruct Hp as [Hwf [Hpar1 Hpar2]].
  destruct Hwf as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol, HXac, HXbd.
  destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd [Hcda Hdab]].
  (* one instance of the theorem per side of the figure, reading the four
     vertices from that side's own starting corner *)
  repeat rewrite orb_true_iff in Hrule.
  destruct Hrule as [[[Hm|Hm]|Hm]|Hm]; apply (fact_eqb_sound _ _ Hm); cbn.
  - apply (ghost_pgram_consec_angles _ _ _ _ X Hdab
             (ghost_bets_sym _ _ _ HXbd) HXac (par_symmetry _ _ _ _ Hpar2)).
  - apply (ghost_pgram_consec_angles _ _ _ _ X Hncol HXac HXbd Hpar1).
  - apply (ghost_pgram_consec_angles _ _ _ _ X Hbcd HXbd
             (ghost_bets_sym _ _ _ HXac) Hpar2).
  - apply (ghost_pgram_consec_angles _ _ _ _ X Hcda
             (ghost_bets_sym _ _ _ HXac) (ghost_bets_sym _ _ _ HXbd)
             (par_symmetry _ _ _ _ Hpar1)).
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
  destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
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
    destruct (ghost_sss (point q.(quadrilateral_first)) (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
                (point q.(quadrilateral_first)) (point q.(quadrilateral_fourth)) (point q.(quadrilateral_third)))
      as [_ [_ [_ [_ [Hangle _]]]]].
    + exact Hncol.
    + now apply cong_right_commutativity.
    + now apply cong_right_commutativity.
    + apply cong_reflexivity.
    + now apply conga_right_comm.
  - (* congruent sides meet at B and at D, so the corners at A and C agree *)
    destruct (ghost_sss (point q.(quadrilateral_first)) (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth))
                (point q.(quadrilateral_third)) (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth)))
      as [_ [_ [_ [Hangle _]]]].
    + intro. apply Hdab. Col.
    + now apply cong_right_commutativity.
    + apply cong_reflexivity.
    + apply cong_right_commutativity, cong_symmetry, Hs2.
    + now apply conga_left_comm.
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
  exact (ghost_rect_diagonals _ _ _ _ _ Hncol HXac HXbd Hpar1 Hpar2 Hra Hrb).
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
    pose proof (ghost_pgram_opp_sides _ _ _ _ _ Hncol HXac HXbd Hpar1 Hpar2)
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
      apply ghost_par_trans with (point s1.(segment_first)) (point s1.(segment_second)).
      - now apply par_symmetry.
      - apply (para_link_left s1 s4 _ _ Hshared).
        now apply par_symmetry. }
  apply orb_true_iff in Hrule. destruct Hrule as [Hrule|Hcase3].
  2:{ apply andb_true_iff in Hcase3. destruct Hcase3 as [Hshared Hconc].
      eapply para_pair_conclude; [exact Hconc|]. cbn.
      apply ghost_par_trans with (point s1.(segment_first)) (point s1.(segment_second)).
      - now apply par_symmetry.
      - apply (para_link_left s1 s3 _ _ Hshared). exact Hp2. }
  apply orb_true_iff in Hrule. destruct Hrule as [Hcase1|Hcase2].
  - apply andb_true_iff in Hcase1. destruct Hcase1 as [Hshared Hconc].
    eapply para_pair_conclude; [exact Hconc|]. cbn.
    apply ghost_par_trans with (point s2.(segment_first)) (point s2.(segment_second));
      [exact Hp1|].
    apply (para_link_left s2 s3 _ _ Hshared). exact Hp2.
  - apply andb_true_iff in Hcase2. destruct Hcase2 as [Hshared Hconc].
    eapply para_pair_conclude; [exact Hconc|]. cbn.
    apply ghost_par_trans with (point s2.(segment_first)) (point s2.(segment_second));
      [exact Hp1|].
    apply (para_link_left s2 s4 _ _ Hshared).
    now apply par_symmetry.
Qed.

(** * Rules added by the reason campaign: soundness *)

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
  destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
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
  - exact (ghost_isos_trap_base_angles _ _ _ _ X Hncol HXac HXbd
             Hparallel Hdiag).
  - apply (ghost_isos_trap_base_angles _ _ _ _ X Hcda
             (ghost_bets_sym _ _ _ HXac) (ghost_bets_sym _ _ _ HXbd));
      [now apply par_symmetry|Cong].
  - apply (ghost_isos_trap_base_angles _ _ _ _ X Hbcd HXbd
             (ghost_bets_sym _ _ _ HXac));
      [exact Hparallel|Cong].
  - apply (ghost_isos_trap_base_angles _ _ _ _ X Hdab
             (ghost_bets_sym _ _ _ HXbd) HXac);
      [now apply par_symmetry|Cong].
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
          | split; [assumption|now apply ghost_bets_sym]
          | split; [now apply ghost_bets_sym|assumption]
          | split; now apply ghost_bets_sym ].
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
    (conclusion = SegBisect s t p /\ lookup_pgram facts i = Some (Parallelogram q)) \/
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
    | match lookup_pgram facts ?n with _ => _ end = _ =>
        destruct (lookup_pgram facts n) as [dep|] eqn:Hl; try discriminate;
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
  apply ghost_equidistant_line_perp_at; auto.
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
    assert (Hp : Interp (Parallelogram q)) by (eapply lookup_pgram_sound; eauto).
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
    destruct (ghost_pgram_diagonals_bisect _ _ _ _ _ Hncol Hpar1 Hpar2 HBD
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

(** The audited parallelogram says the same thing about every rotation of its
    name, so a rule that reads the figure from one corner can be run at each
    of the four in turn. *)
Lemma pgram_rotate : forall q, Interp (Parallelogram q) -> Interp (Parallelogram (rotate_quad q)).
Proof.
  intros q Hp.
  destruct (pgram_figure q Hp) as [X [Hncol [HXac [HXbd [Hpar1 Hpar2]]]]].
  pose proof Hp as Hwf. cbn in Hwf. destruct Hwf as [Hwf _].
  destruct Hwf as [Hab [Hac [Had [Hbc [Hbd Hcd]]]]].
  destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd _].
  cbn. split.
  - cbn. repeat split; try assumption; try (now apply not_eq_sym).
    exists X. split; [exact HXbd|exact (ghost_bets_sym _ _ _ HXac)].
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
  destruct (ghost_pgram_bisector_rhombus _ _ _ _ X Hncol HXac HXbd
              Hpar1 Hpar2 Hconga) as [Hab [Hbc Hcd]].
  cbn. split; [exact Hp|].
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
  repeat split; assumption.
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
  - (* radius *)
    apply Ascii.eqb_eq in H. subst. exact Hst.
  - (* diameter *)
    apply endpoint_of_cases in H. destruct Hst as [[_ [H1 H2]] _].
    destruct H as [->| ->]; assumption.
  - (* inscribed angle: only its vertex is on the circle *)
    apply Ascii.eqb_eq in H. subst. destruct Hst as [Hv _]. exact Hv.
  - (* on_circle *)
    apply Ascii.eqb_eq in H. subst. exact Hst.
  - (* circ_order *)
    apply existsb_exists in H. destruct H as [q [Hin Hq]].
    apply Ascii.eqb_eq in Hq. subst q.
    unfold Audit.IsCircOrder in Hst. cbv beta zeta in Hst.
    destruct Hst as [_ [Hon _]].
    exact ((proj1 (Forall_forall _ _)) Hon p Hin).
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

(** Everything below assumes the plane, which only [chord_bisect_conv]
    needs: in three dimensions the points equidistant from a chord's ends
    fill a plane, not a line. *)
Context {T2D : @Tarski_2D Tn TnEQD}.

Lemma ghost_center_on_bisector : forall X Y A B M O,
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
  pose proof (ghost_center_on_bisector _ _ _ _ _ _ Hwf Hcol Hmid Hperp Hcong)
    as Hcentre.
  cbn. split; [exact Hcwf|].
  apply segment_u_eqb_cases in Hline.
  destruct Hline as [->| ->]; cbn; split; auto; Col.
Qed.

(** ** Inscribed angles through [circ_order]

    The list's order fixes which side of each chord every listed point is on,
    and with at least three points that makes listed points at different
    positions different points.  GeoCoq's Euclid III.21 and III.22, through
    [Inscribed.v], need the four points coplanar, which the plane gives. *)
Lemma index_of_spec : forall p ps i, index_of p ps = Some i ->
  i < List.length ps /\ nth i ps Audit.circOrderDefault = p.
Proof.
  intros p ps. induction ps as [|q rest IH]; intros i H; cbn in H; [discriminate|].
  destruct (ascii_eqb p q) eqn:E.
  - injection H as <-. unfold ascii_eqb in E. apply Ascii.eqb_eq in E. subst.
    cbn. split; [lia|reflexivity].
  - destruct (index_of p rest) as [n|] eqn:Hn; [|discriminate].
    injection H as <-. destruct (IH n eq_refl) as [Hlt Hnth].
    cbn. split; [lia|exact Hnth].
Qed.

Lemma index_of_listed : forall p ps, listed p ps = true ->
  exists i, index_of p ps = Some i.
Proof.
  intros p ps. induction ps as [|q rest IH]; cbn; intros H; [discriminate|].
  destruct (ascii_eqb p q) eqn:E; [eauto|].
  cbn in H. destruct (IH H) as [n Hn]. rewrite Hn. eauto.
Qed.

Lemma listed_In : forall p ps, listed p ps = true -> In p ps.
Proof.
  intros p ps H. unfold listed in H. apply existsb_exists in H.
  destruct H as [q [Hin Hq]]. unfold ascii_eqb in Hq.
  apply Ascii.eqb_eq in Hq. now subst.
Qed.

Lemma In_listed : forall p ps, In p ps -> listed p ps = true.
Proof.
  intros p ps H. unfold listed. apply existsb_exists. exists p.
  split; [exact H|]. unfold ascii_eqb. apply Ascii.eqb_refl.
Qed.

Lemma circ_order_positions_distinct : forall c ps i j,
  Audit.IsCircOrder point c ps ->
  i < List.length ps -> j < List.length ps -> i <> j ->
  point (nth i ps Audit.circOrderDefault) <> point (nth j ps Audit.circOrderDefault).
Proof.
  intros c ps i j Hco Hi Hj Hij Heq.
  unfold Audit.IsCircOrder in Hco. cbv beta zeta in Hco.
  destruct Hco as [Hlen [_ Hord]].
  assert (Hk : exists k, k < List.length ps /\ k <> i /\ k <> j).
  { destruct (Nat.eq_dec i 0); destruct (Nat.eq_dec j 0);
      destruct (Nat.eq_dec i 1); destruct (Nat.eq_dec j 1);
      first [exists 2; lia | exists 1; lia | exists 0; lia]. }
  destruct Hk as [k [Hk [Hki Hkj]]].
  destruct (Nat.lt_ge_cases i j) as [Hlt|Hge].
  - specialize (Hord i j k k Hlt Hj Hk Hk Hki Hkj Hki Hkj).
    rewrite Bool.eqb_reflx in Hord.
    apply one_side_not_col123 in Hord. apply Hord. rewrite Heq. Col.
  - assert (Hlt : j < i) by lia.
    specialize (Hord j i k k Hlt Hi Hk Hk Hkj Hki Hkj Hki).
    rewrite Bool.eqb_reflx in Hord.
    apply one_side_not_col123 in Hord. apply Hord. rewrite Heq. Col.
Qed.

Lemma listed_points_distinct : forall c ps p q,
  Audit.IsCircOrder point c ps -> listed p ps = true -> listed q ps = true ->
  p <> q -> point p <> point q.
Proof.
  intros c ps p q Hco Hp Hq Hpq.
  destruct (index_of_listed _ _ Hp) as [i Hi].
  destruct (index_of_listed _ _ Hq) as [j Hj].
  destruct (index_of_spec _ _ _ Hi) as [Hil Hin].
  destruct (index_of_spec _ _ _ Hj) as [Hjl Hjn].
  rewrite <- Hin, <- Hjn.
  apply (circ_order_positions_distinct c); try assumption.
  intros ->. apply Hpq. congruence.
Qed.

Lemma listed_on_circle : forall c ps p,
  Audit.IsCircOrder point c ps -> listed p ps = true ->
  Cong (point c.(circle_center)) (point p)
       (point c.(circle_center)) (point c.(circle_radius_point)).
Proof.
  intros c ps p Hco Hp.
  unfold Audit.IsCircOrder in Hco. cbv beta zeta in Hco.
  destruct Hco as [_ [Hon _]].
  pose proof ((proj1 (Forall_forall _ _)) Hon p (listed_In _ _ Hp)) as [_ H].
  exact H.
Qed.

Lemma trace_ray_sound : forall premises c ps v x A,
  Forall (interp_premise point) premises ->
  Audit.IsCircOrder point c ps -> listed v ps = true ->
  point x <> point v ->
  trace_ray premises ps v x = Some A ->
  listed A ps = true /\ A <> v /\ Out (point v) (point A) (point x).
Proof.
  intros premises c ps v x A Hprem Hco Hv Hx Htr.
  unfold trace_ray in Htr. apply find_some in Htr.
  destruct Htr as [Hin Hc]. apply andb_true_iff in Hc. destruct Hc as [Hne Hlink].
  assert (HAv : A <> v).
  { intros ->. unfold ascii_eqb in Hne. rewrite Ascii.eqb_refl in Hne. discriminate. }
  assert (HA : listed A ps = true) by (now apply In_listed).
  split; [exact HA|]. split; [exact HAv|].
  apply (ray_linked_out premises v x A Hprem Hlink Hx).
  apply (listed_points_distinct c ps); assumption.
Qed.

Lemma inscribed_chord_sound : forall premises c ps a A B,
  Forall (interp_premise point) premises ->
  Audit.IsCircOrder point c ps -> Interp (InscribedAngle c a) ->
  inscribed_chord premises ps a = Some (A, B) ->
  listed a.(angle_vertex) ps = true /\ listed A ps = true /\ listed B ps = true /\
  A <> B /\ A <> a.(angle_vertex) /\ B <> a.(angle_vertex) /\
  Out (point a.(angle_vertex)) (point A) (point a.(angle_first)) /\
  Out (point a.(angle_vertex)) (point B) (point a.(angle_last)).
Proof.
  intros premises c ps a A B Hprem Hco Hia Hch.
  unfold inscribed_chord in Hch.
  destruct (listed a.(angle_vertex) ps) eqn:Hv; [|discriminate].
  destruct (trace_ray premises ps a.(angle_vertex) a.(angle_first)) as [A0|] eqn:HtA;
    [|discriminate].
  destruct (trace_ray premises ps a.(angle_vertex) a.(angle_last)) as [B0|] eqn:HtB;
    [|discriminate].
  destruct (ascii_eqb A0 B0) eqn:HAB; [discriminate|].
  injection Hch as <- <-.
  cbn in Hia. destruct Hia as [_ [[Hs He] _]].
  destruct (trace_ray_sound _ _ _ _ _ _ Hprem Hco Hv Hs HtA) as [HlA [HAv HoA]].
  destruct (trace_ray_sound _ _ _ _ _ _ Hprem Hco Hv He HtB) as [HlB [HBv HoB]].
  assert (HAB' : A0 <> B0).
  { intros ->. unfold ascii_eqb in HAB. rewrite Ascii.eqb_refl in HAB. discriminate. }
  exact (conj eq_refl (conj HlA (conj HlB (conj HAB' (conj HAv (conj HBv (conj HoA HoB))))))).
Qed.

Lemma arc_side_sides : forall c ps A B P Q x y,
  Audit.IsCircOrder point c ps ->
  listed A ps = true -> listed B ps = true ->
  listed P ps = true -> listed Q ps = true ->
  A <> B -> P <> A -> P <> B -> Q <> A -> Q <> B ->
  arc_side ps A B P = Some x -> arc_side ps A B Q = Some y ->
  if Bool.eqb x y then OS (point A) (point B) (point P) (point Q)
  else TS (point A) (point B) (point P) (point Q).
Proof.
  intros c ps A B P Q x y Hco HA HB HP HQ HAB HPA HPB HQA HQB Hx Hy.
  destruct (index_of_listed _ _ HA) as [iA EA].
  destruct (index_of_listed _ _ HB) as [iB EB].
  destruct (index_of_listed _ _ HP) as [iP EP].
  destruct (index_of_listed _ _ HQ) as [iQ EQ].
  unfold arc_side in Hx, Hy. rewrite EA, EB, EP in Hx. rewrite EA, EB, EQ in Hy.
  injection Hx as <-. injection Hy as <-.
  destruct (index_of_spec _ _ _ EA) as [LA NA].
  destruct (index_of_spec _ _ _ EB) as [LB NB].
  destruct (index_of_spec _ _ _ EP) as [LP NP].
  destruct (index_of_spec _ _ _ EQ) as [LQ NQ].
  assert (Hne : forall i j p q, nth i ps Audit.circOrderDefault = p -> nth j ps Audit.circOrderDefault = q ->
                  p <> q -> i <> j) by (intros; congruence).
  pose proof (Hne _ _ _ _ NA NB HAB) as DAB.
  pose proof (Hne _ _ _ _ NP NA HPA) as DPA.
  pose proof (Hne _ _ _ _ NP NB HPB) as DPB.
  pose proof (Hne _ _ _ _ NQ NA HQA) as DQA.
  pose proof (Hne _ _ _ _ NQ NB HQB) as DQB.
  unfold Audit.IsCircOrder in Hco. cbv beta zeta in Hco.
  destruct Hco as [_ [_ Hord]].
  destruct (Nat.lt_ge_cases iA iB) as [Hlt|Hge].
  - rewrite (Nat.min_l iA iB), (Nat.max_r iA iB) by lia.
    specialize (Hord iA iB iP iQ Hlt LB LP LQ DPA DPB DQA DQB).
    rewrite <- NA, <- NB, <- NP, <- NQ. exact Hord.
  - assert (Hlt : iB < iA) by lia.
    rewrite (Nat.min_r iA iB), (Nat.max_l iA iB) by lia.
    specialize (Hord iB iA iP iQ Hlt LA LP LQ DPB DPA DQB DQA).
    rewrite <- NA, <- NB, <- NP, <- NQ.
    destruct (Bool.eqb _ _);
      [apply invert_one_side | apply invert_two_sides]; exact Hord.
Qed.

(** A congruent segment may stand in for any length of a proportion; a
    matched segment is the expected one or its reversal. *)
Lemma segment_u_eqb_cong : forall s s', segment_u_eqb s s' = true ->
  Cong (point s'.(segment_first)) (point s'.(segment_second))
       (point s.(segment_first)) (point s.(segment_second)).
Proof.
  intros s s' H. apply segment_u_eqb_cases in H.
  destruct H as [Heq|Heq]; subst s; cbn; Cong.
Qed.

(** Both segments of a proportion read from their other ends. *)
Lemma proportional_reverse : forall A B C D E F G H,
  Similarity.GhostSimilarity.Proportional A B C D E F G H ->
  Similarity.GhostSimilarity.Proportional B A D C F E H G.
Proof.
  intros A B C D E F G H Hp.
  apply (Similarity.GhostSimilarity.proportional_cong A B C D E F G H); Cong.
Qed.

Lemma castc_rule_sound : forall facts i conclusion,
  Forall Interp facts -> castc_rule facts i conclusion = true -> Interp conclusion.
Proof.
  intros facts i conclusion Hfacts H.
  unfold castc_rule in H.
  destruct (lookup_step facts i) as [dependency|] eqn:Hlookup; try discriminate.
  destruct dependency; try discriminate.
  assert (Hsim : Interp (SimTri a b)) by (eapply lookup_step_sound; eauto).
  destruct Hsim as [_ [_ [Ha [Hb Hc]]]].
  unfold sim_tri_angles in H. cbn [existsb] in H.
  repeat rewrite orb_true_iff in H.
  repeat match goal with
  | H : _ \/ _ |- _ => destruct H as [H|H]
  end;
  try discriminate;
  apply fact_eqb_sound in H; apply H; first [exact Ha|exact Hb|exact Hc].
Qed.

Lemma sim_tri_transitive_sound : forall facts i j conclusion,
  Forall Interp facts -> sim_tri_transitive facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros facts i j conclusion Hfacts Hrule.
  eapply transitive_rule_sound; [| | | |exact Hfacts|exact Hrule].
  - intros w x y Hsame Hsim. apply triangle_eqb_eq in Hsame. now subst.
  - intros x y [Hx [Hy [Ha [Hb Hc]]]].
    split; [exact Hy|]. split; [exact Hx|].
    split; [now apply conga_sym|]. split; now apply conga_sym.
  - intros x y z [Hx [_ [Ha1 [Hb1 Hc1]]]] [_ [Hz [Ha2 [Hb2 Hc2]]]].
    split; [exact Hx|]. split; [exact Hz|].
    split; [eapply conga_trans; eauto|].
    split; eapply conga_trans; eauto.
  - intros s x y Hpair Hs. destruct s; cbn in Hpair; try discriminate.
    injection Hpair as <- <-. exact Hs.
Qed.

(** A line perpendicular to one of two parallels meets the other at right
    angles wherever it crosses it. *)
Lemma perp_transversal_core : forall N1 N2 L1 L2 M1 M2 Q,
  Definitions.Perp N1 N2 L1 L2 -> Definitions.Par L1 L2 M1 M2 -> Col Q N1 N2 -> Col Q M1 M2 ->
  Perp_at Q N1 N2 M1 M2.
Proof.
  intros N1 N2 L1 L2 M1 M2 Q HPerp HPar HN HM.
  apply l8_14_2_1b_bis; [|exact HN|exact HM].
  apply perp_sym.
  apply (Euclidean.GhostEuclidean.cop_par_perp__perp L1 L2 M1 M2 N1 N2 HPar);
    [now apply perp_sym|apply all_coplanar].
Qed.

Lemma perp_transversal_sources_sound : forall n m s t p u v,
  perp_transversal_sources n m (Perp s t p) (Para u v) = true ->
  Interp (Perp s t p) -> Interp (Para u v) ->
  exists L1 L2,
    Definitions.Perp (point n.(segment_first)) (point n.(segment_second)) L1 L2 /\
    Definitions.Par L1 L2 (point m.(segment_first)) (point m.(segment_second)).
Proof.
  intros n m s t p u v H Hperp Hpar.
  cbn in Hperp, Hpar. apply perp_in_perp in Hperp. unfold Parallel in Hpar.
  assert (Hcase : forall N l,
    segment_u_eqb n N = true ->
    Definitions.Perp (point N.(segment_first)) (point N.(segment_second))
                     (point l.(segment_first)) (point l.(segment_second)) ->
    (segment_u_eqb l u && segment_u_eqb m v ||
     segment_u_eqb l v && segment_u_eqb m u) = true ->
    exists L1 L2,
      Definitions.Perp (point n.(segment_first)) (point n.(segment_second)) L1 L2 /\
      Definitions.Par L1 L2 (point m.(segment_first)) (point m.(segment_second))).
  { intros N l Hn HP Hpartner.
    apply segment_u_eqb_cases in Hn.
    apply orb_true_iff in Hpartner.
    destruct Hpartner as [Hpartner|Hpartner];
      apply andb_true_iff in Hpartner; destruct Hpartner as [Hl Hm];
      apply segment_u_eqb_cases in Hl; apply segment_u_eqb_cases in Hm;
      [exists (point u.(segment_first)), (point u.(segment_second))
      |exists (point v.(segment_first)), (point v.(segment_second))];
      destruct Hn as [->| ->]; destruct Hl as [->| ->]; destruct Hm as [->| ->];
      unfold reverse_segment in *; cbn in *; split; Perp; Par. }
  unfold perp_transversal_sources in H.
  apply orb_true_iff in H. destruct H as [H|H];
    apply andb_true_iff in H; destruct H as [Hn Hpartner].
  - exact (Hcase s t Hn Hperp Hpartner).
  - exact (Hcase t s Hn (perp_sym _ _ _ _ Hperp) Hpartner).
Qed.

(** Every point a transversal figure names on its transversal lies on the
    line through the two crossings. *)
Lemma segment_on_transversal_col : forall s t1 i1 i2 t2,
  segment_on_transversal s t1 i1 i2 t2 = true ->
  (point t1 = point i1 \/ point t1 = point i2 \/
   BetS (point t1) (point i1) (point i2)) ->
  (point t2 = point i2 \/ point t2 = point i1 \/
   BetS (point i1) (point i2) (point t2)) ->
  Col (point i1) (point i2) (point s.(segment_first)) /\
  Col (point i1) (point i2) (point s.(segment_second)).
Proof.
  intros s t1 i1 i2 t2 H HT1 HT2.
  assert (Hon : forall x, (ascii_eqb x t1 || ascii_eqb x i1 || ascii_eqb x i2 ||
                           ascii_eqb x t2) = true -> Col (point i1) (point i2) (point x)).
  { intros x Hx. repeat rewrite orb_true_iff in Hx.
    destruct Hx as [[[Hx|Hx]|Hx]|Hx]; unfold ascii_eqb in Hx;
      apply Ascii.eqb_eq in Hx; subst x; [|Col|Col|].
    - destruct HT1 as [E|[E|[Hb _]]]; [rewrite E; Col|rewrite E; Col|].
      apply bet_col in Hb. Col.
    - destruct HT2 as [E|[E|[Hb _]]]; [rewrite E; Col|rewrite E; Col|].
      apply bet_col in Hb. Col. }
  unfold segment_on_transversal in H. apply andb_true_iff in H.
  destruct H as [H1 H2]. split; apply Hon; assumption.
Qed.

(** Every spelling of a crossed line lies on that line. *)
Lemma line_name_col : forall s a b i1,
  line_name_matches s a b i1 = true ->
  Bet (point a) (point i1) (point b) ->
  Col (point a) (point b) (point s.(segment_first)) /\
  Col (point a) (point b) (point s.(segment_second)).
Proof.
  intros s a b i1 Hm Hbet.
  apply bet_col in Hbet.
  unfold line_name_matches in Hm. repeat rewrite orb_true_iff in Hm.
  destruct Hm as [[Hm|Hm]|Hm];
    try (apply andb_true_iff in Hm; destruct Hm as [_ Hm]);
    apply segment_u_eqb_cases in Hm; destruct Hm as [->| ->];
    unfold reverse_segment; cbn; split; Col.
Qed.

Lemma perp_transversal_at_sound : forall premises facts i j n m q,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  perp_transversal_at premises facts i j n m q = true ->
  Perp_at (point q) (point n.(segment_first)) (point n.(segment_second))
          (point m.(segment_first)) (point m.(segment_second)).
Proof.
  intros premises facts i j n m q Hprem Hfacts H.
  unfold perp_transversal_at in H.
  destruct (lookup_step facts i) as [x|] eqn:Hx; try discriminate.
  destruct (lookup_step facts j) as [y|] eqn:Hy; try discriminate.
  apply andb_true_iff in H. destruct H as [Hsrc Htr].
  assert (Hix : Interp x) by (eapply lookup_step_sound; eauto).
  assert (Hiy : Interp y) by (eapply lookup_step_sound; eauto).
  assert (Hlines : exists L1 L2,
    Definitions.Perp (point n.(segment_first)) (point n.(segment_second)) L1 L2 /\
    Definitions.Par L1 L2 (point m.(segment_first)) (point m.(segment_second))).
  { destruct x; try discriminate; destruct y; try discriminate.
    eapply perp_transversal_sources_sound; eauto. }
  destruct Hlines as [L1 [L2 [HPerp HPar]]].
  destruct (transversal_premise_sound _ _ Hprem Htr)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hc Hcfg]]]]]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg)
    as [[HI [Hab [HneAB [Hcd [HneCD _]]]]] [HT1 HT2]].
  unfold perp_transversal_check in Hc. apply andb_true_iff in Hc.
  destruct Hc as [Hon Hcross].
  destruct (segment_on_transversal_col _ _ _ _ _ Hon HT1 HT2) as [HN1 HN2].
  apply (perp_transversal_core _ _ L1 L2 _ _ _ HPerp HPar).
  - apply orb_true_iff in Hcross.
    destruct Hcross as [Hq|Hq]; apply andb_true_iff in Hq; destruct Hq as [Hq _];
      unfold ascii_eqb in Hq; apply Ascii.eqb_eq in Hq; subst q;
      apply (col3 (point pi1) (point pi2)); Col.
  - apply orb_true_iff in Hcross.
    destruct Hcross as [Hq|Hq]; apply andb_true_iff in Hq; destruct Hq as [Hq Hm];
      unfold ascii_eqb in Hq; apply Ascii.eqb_eq in Hq; subst q.
    + destruct (line_name_col _ _ _ _ Hm Hab) as [HM1 HM2].
      apply (col3 (point pa) (point pb)); [exact HneAB| |exact HM1|exact HM2].
      apply bet_col in Hab. Col.
    + destruct (line_name_col _ _ _ _ Hm Hcd) as [HM1 HM2].
      apply (col3 (point pc) (point pd)); [exact HneCD| |exact HM1|exact HM2].
      apply bet_col in Hcd. Col.
Qed.

Lemma perp_transversal_sound : forall premises facts i j conclusion,
  Forall (interp_premise point) premises -> Forall Interp facts ->
  perp_transversal_rule premises facts i j conclusion = true ->
  Interp conclusion.
Proof.
  intros premises facts i j conclusion Hprem Hfacts Hrule.
  unfold perp_transversal_rule in Hrule.
  destruct conclusion; try discriminate.
  apply orb_true_iff in Hrule. cbn. destruct Hrule as [H|H].
  - exact (perp_transversal_at_sound _ _ _ _ _ _ _ Hprem Hfacts H).
  - apply perp_in_sym.
    exact (perp_transversal_at_sound _ _ _ _ _ _ _ Hprem Hfacts H).
Qed.

(** * Templates are sound

    A template holds when, in each slot, one of its statements holds, read
    the way the slot's matcher reads it.  Each reason's lemma below shows
    that its templates are enough for the conclusion; [template_valid_sound]
    shows that the steps a matched step cites make the template hold. *)

Definition SlotHolds (m : Matcher) (e : Statement) : Prop :=
  match m with
  | AsWritten | Loose | PgramLike => Interp e
  | ProportionMatch =>
      match e with
      | Proportion a b c d =>
          Similarity.GhostSimilarity.Proportional
            (point a.(segment_first)) (point a.(segment_second))
            (point b.(segment_first)) (point b.(segment_second))
            (point c.(segment_first)) (point c.(segment_second))
            (point d.(segment_first)) (point d.(segment_second))
      | _ => False
      end
  | RayAngles =>
      match e with
      | ConAng e1 e2 =>
          angle_well_formed point e1 -> angle_well_formed point e2 -> Interp e
      | _ => False
      end
  | PerpAnyPoint =>
      match e with
      | Perp a b _ => exists p, Interp (Perp a b p)
      | _ => False
      end
  | TrapezoidAnySides =>
      match e with
      | TrapezoidPremise q _ _ => exists a b, Interp (TrapezoidPremise q a b)
      | _ => False
      end
  | RadiusAnyPoint =>
      match e with
      | Radius c _ => exists p, Interp (Radius c p)
      | _ => False
      end
  end.

Definition SlotSatisfied (s : Slot) : Prop :=
  exists e, In e s.(slot_statements) /\ SlotHolds s.(slot_matcher) e.

Definition TemplateHolds (t : Template) : Prop :=
  Forall SlotSatisfied t.(template_slots).

Lemma proportion_matches_sound : forall a b c d x,
  proportion_matches a b c d x = true -> Interp x ->
  Similarity.GhostSimilarity.Proportional
    (point a.(segment_first)) (point a.(segment_second))
    (point b.(segment_first)) (point b.(segment_second))
    (point c.(segment_first)) (point c.(segment_second))
    (point d.(segment_first)) (point d.(segment_second)).
Proof.
  intros a b c d x H Hint.
  destruct x; cbn in H; try discriminate.
  cbn in Hint. destruct Hint as [_ [_ [_ [_ Hprop]]]].
  change (Similarity.GhostSimilarity.Proportional
    (point a0.(segment_first)) (point a0.(segment_second))
    (point b0.(segment_first)) (point b0.(segment_second))
    (point c0.(segment_first)) (point c0.(segment_second))
    (point d0.(segment_first)) (point d0.(segment_second))) in Hprop.
  repeat rewrite orb_true_iff in H. repeat rewrite andb_true_iff in H.
  destruct H as [[[H|H]|H]|H]; destruct H as [[[Ha Hb] Hc] Hd];
    apply segment_u_eqb_cong in Ha; apply segment_u_eqb_cong in Hb;
    apply segment_u_eqb_cong in Hc; apply segment_u_eqb_cong in Hd.
  - exact (Similarity.GhostSimilarity.proportional_cong _ _ _ _ _ _ _ _
      _ _ _ _ _ _ _ _ Hprop Ha Hb Hc Hd).
  - apply Similarity.GhostSimilarity.proportional_swap.
    exact (Similarity.GhostSimilarity.proportional_cong _ _ _ _ _ _ _ _
      _ _ _ _ _ _ _ _ Hprop Ha Hb Hc Hd).
  - apply Similarity.GhostSimilarity.proportional_invert.
    exact (Similarity.GhostSimilarity.proportional_cong _ _ _ _ _ _ _ _
      _ _ _ _ _ _ _ _ Hprop Ha Hb Hc Hd).
  - apply Similarity.GhostSimilarity.proportional_swap,
          Similarity.GhostSimilarity.proportional_invert.
    exact (Similarity.GhostSimilarity.proportional_cong _ _ _ _ _ _ _ _
      _ _ _ _ _ _ _ _ Hprop Ha Hb Hc Hd).
Qed.

Lemma matcher_accepts_sound : forall decls premises m expected actual,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises ->
  matcher_accepts decls premises m expected actual = true ->
  Interp actual -> SlotHolds m expected.
Proof.
  intros decls premises m expected actual Hwf Hprem Hm Ha.
  destruct m; cbn [matcher_accepts SlotHolds] in Hm |- *.
  - apply orb_true_iff in Hm. destruct Hm as [Hm|Hm].
    + exact (proj2 (fact_eqb_sound _ _ Hm) Ha).
    + exact (canonical_eqb_sound _ _ _ _ Hwf Hprem Hm Ha).
  - apply orb_true_iff in Hm. destruct Hm as [Hm|Hm].
    + exact (dependency_matches_sound _ _ _ _ Hwf Hprem Hm Ha).
    + exact (canonical_eqb_sound _ _ _ _ Hwf Hprem Hm Ha).
  - apply (proj2 (fact_eqb_sound _ _ Hm)).
    destruct actual; cbn [pgram_view]; try exact Ha; exact (proj1 Ha).
  - destruct expected; try discriminate.
    exact (proportion_matches_sound _ _ _ _ _ Hm Ha).
  - destruct expected; try discriminate; destruct actual; try discriminate.
    intros Hw1 Hw2. apply orb_true_iff in Hm. destruct Hm as [Hm|Hm].
    + exact (conga_pair_sound _ _ _ _ Hm Ha).
    + exact (conga_ray_pair_sound _ _ _ _ _ Hprem Hw1 Hw2 Hm Ha).
  - destruct expected; try discriminate; destruct actual; try discriminate.
    exists p0.
    assert (Heq : fact_eqb (Perp a b p0) (Perp a0 b0 p0) = true)
      by (cbn [fact_eqb]; rewrite Hm; apply Ascii.eqb_refl).
    exact (proj2 (fact_eqb_sound _ _ Heq) Ha).
  - destruct expected; try discriminate; destruct actual; try discriminate.
    exists a0, b0.
    assert (Heq : fact_eqb (TrapezoidPremise q a0 b0) (TrapezoidPremise q0 a0 b0) = true)
      by (cbn [fact_eqb]; rewrite Hm;
          rewrite (proj2 (segment_eqb_eq a0 a0) eq_refl);
          rewrite (proj2 (segment_eqb_eq b0 b0) eq_refl); reflexivity).
    exact (proj2 (fact_eqb_sound _ _ Heq) Ha).
  - destruct expected; try discriminate; destruct actual; try discriminate.
    apply circle_eqb_eq in Hm. subst c0. exists p0. exact Ha.
Qed.

Lemma slots_ok_sound : forall decls premises facts slots deps,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  slots_ok decls premises facts slots deps = true ->
  Forall SlotSatisfied slots.
Proof.
  intros decls premises facts slots. induction slots as [|s slots IH];
    intros [|i deps] Hwf Hprem Hall Hok; cbn in Hok; try discriminate.
  - constructor.
  - apply andb_true_iff in Hok. destruct Hok as [Hs Hrest].
    constructor; [|exact (IH deps Hwf Hprem Hall Hrest)].
    unfold slot_ok in Hs.
    destruct (lookup_step facts i) as [actual|] eqn:Hl; [|discriminate].
    apply existsb_exists in Hs. destruct Hs as [e [Hin He]].
    exists e. split; [exact Hin|].
    exact (matcher_accepts_sound _ _ _ _ _ Hwf Hprem He
             (lookup_step_sound _ _ _ Hall Hl)).
Qed.

Lemma template_valid_sound : forall decls premises facts ts deps,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  template_valid decls premises facts ts deps = true ->
  exists t, In t ts /\ TemplateHolds t.
Proof.
  intros decls premises facts ts deps Hwf Hprem Hall H.
  apply existsb_exists in H. destruct H as [t [Hin Hok]].
  exists t. split; [exact Hin|].
  exact (slots_ok_sound _ _ _ _ _ Hwf Hprem Hall Hok).
Qed.

Lemma angle_u_eqb_refl : forall a, angle_u_eqb a a = true.
Proof.
  intros a. unfold angle_u_eqb. now rewrite (proj2 (angle_eqb_eq a a) eq_refl).
Qed.

(** Turns [TemplateHolds] of a written-out template into one hypothesis per
    slot, and splits each slot into one case per statement it lists. *)
Ltac open_slots H :=
  unfold TemplateHolds, plain, written, loose, pgram_slot, loose_template in H;
  cbn [template_slots map] in H;
  repeat match type of H with
  | Forall _ (_ :: _) =>
      let Hs := fresh "Hslot" in
      apply Forall_cons_iff in H; destruct H as [Hs H];
      let e := fresh "e" in
      let Hin := fresh "Hin" in
      let He := fresh "He" in
      destruct Hs as [e [Hin He]];
      cbn [slot_statements slot_matcher SlotHolds] in Hin, He
  | Forall _ [] => clear H
  end.

Ltac pick_statements :=
  repeat match goal with
  | Hin : In ?e (_ :: _) |- _ => destruct Hin as [Hin|Hin]; [subst e|]
  | Hin : In _ [] |- _ => destruct Hin
  end.

(** Splits [In t [t1; t2; ...]] into one goal per template. *)
Ltac template_cases Hin :=
  repeat match type of Hin with
  | In _ (_ :: _) => destruct Hin as [<-|Hin]
  | In _ [] => destruct Hin
  end.

Ltac no_template Hin := try solve [destruct Hin].

Lemma segment_u_eqb_rev_l : forall s, segment_u_eqb (reverse_segment s) s = true.
Proof.
  intros [a b]. unfold segment_u_eqb, reverse_segment. cbn.
  rewrite (proj2 (segment_eqb_eq (segment_name b a) (segment_name b a)) eq_refl).
  apply orb_true_r.
Qed.

Lemma angle_u_eqb_rev_l : forall a, angle_u_eqb (reverse_angle a) a = true.
Proof.
  intros [x v y]. unfold angle_u_eqb, reverse_angle. cbn.
  rewrite (proj2 (angle_eqb_eq (angle_name y v x) (angle_name y v x)) eq_refl).
  apply orb_true_r.
Qed.

Lemma segment_u_eqb_rev_r : forall s, segment_u_eqb s (reverse_segment s) = true.
Proof.
  intros [a b]. unfold segment_u_eqb, reverse_segment. cbn.
  rewrite (proj2 (segment_eqb_eq (segment_name a b) (segment_name a b)) eq_refl).
  apply orb_true_r.
Qed.

Lemma angle_u_eqb_rev_r : forall a, angle_u_eqb a (reverse_angle a) = true.
Proof.
  intros [x v y]. unfold angle_u_eqb, reverse_angle. cbn.
  rewrite (proj2 (angle_eqb_eq (angle_name x v y) (angle_name x v y)) eq_refl).
  apply orb_true_r.
Qed.

(** Proves a Boolean match that a template guarantees by construction. *)
Ltac btrue :=
  lazymatch goal with
  | |- (_ || _) = true =>
      apply orb_true_iff; first [left; btrue | right; btrue]
  | |- (_ && _) = true => apply andb_true_iff; split; btrue
  | |- _ =>
      first [ apply segment_u_eqb_refl | apply segment_u_eqb_rev_l
            | apply segment_u_eqb_rev_r | apply segment_u_eqb_reverse
            | apply angle_u_eqb_refl | apply angle_u_eqb_rev_l
            | apply angle_u_eqb_rev_r
            | apply Ascii.eqb_refl | reflexivity
            | progress unfold segment_pair_eqb, angle_pair_eqb; btrue ]
  end.


(** Every part a [loose_template] lists holds. *)
Lemma loose_template_holds : forall ps,
  TemplateHolds (loose_template ps) -> Forall Interp ps.
Proof.
  unfold TemplateHolds, loose_template, plain. cbn [template_slots].
  induction ps as [|p ps IH]; intros H; [constructor|].
  cbn [map] in H. apply Forall_cons_iff in H. destruct H as [[e [Hin He]] H].
  cbn in Hin. destruct Hin as [<-|[]].
  constructor; [exact He|exact (IH H)].
Qed.


(** A congruence criterion whose parts, for one correspondence, make the
    triangles congruent concludes what [congruence_needs] says it does. *)
Lemma congruence_needs_core : forall decls parts conclusion t,
  declarations_well_formed point decls ->
  (forall a b ps, triangle_well_formed point a -> In ps (parts a b) ->
     Forall Interp ps -> interp_triangle_congruence point a b) ->
  In t (congruence_needs decls parts conclusion) -> TemplateHolds t ->
  Interp conclusion.
Proof.
  intros decls parts conclusion t Hwf Hparts Hin Ht.
  assert (Hat : forall a b, triangle_well_formed point a ->
    triangle_well_formed point b ->
    In t (correspondence_templates parts a b) ->
    interp_triangle_congruence point a b).
  { intros a b Ha Hb Hin'. unfold correspondence_templates in Hin'.
    apply in_flat_map in Hin'. destruct Hin' as [c [Hc Hin']].
    apply in_map_iff in Hin'. destruct Hin' as [ps [<- Hps]].
    apply (correspondences_congruent a b c Hc).
    destruct (correspondences_well_formed a b c Hc Ha Hb) as [Hwa _].
    exact (Hparts _ _ ps Hwa Hps (loose_template_holds ps Ht)). }
  destruct conclusion; cbn [congruence_needs] in Hin; no_template Hin;
    unfold only_if in Hin;
    (destruct (declared_pair decls a b) eqn:Hdecl; [|destruct Hin]);
    apply declared_pair_sound in Hdecl; try exact Hwf;
    destruct Hdecl as [Ht' Hu].
  - apply in_flat_map in Hin. destruct Hin as [u' [Hu' Hin]].
    exists u'. split; [exact Hu'|].
    assert (Hwu' : triangle_well_formed point u').
    { pose proof (triangle_well_formed_nondegenerate _ _ Hu) as Hnd.
      pose proof (nondegenerate_orderings b u' Hu' Hnd) as Hnd'.
      destruct u' as [D E F]. destruct Hnd' as [_ [_ [_ Hncol]]]. exact Hncol. }
    apply ordered_congruence_of_parts.
    + now apply triangle_well_formed_nondegenerate.
    + now apply triangle_well_formed_nondegenerate.
    + exact (Hat _ _ Ht' Hwu' Hin).
  - apply ordered_congruence_of_parts;
      [now apply triangle_well_formed_nondegenerate
      |now apply triangle_well_formed_nondegenerate|].
    exact (Hat _ _ Ht' Hu Hin).
Qed.



Lemma def_con_tri_parts_sound : forall a b ps, triangle_well_formed point a ->
  In ps (def_con_tri_parts a b) -> Forall Interp ps ->
  interp_triangle_congruence point a b.
Proof.
  intros [A B C] [D E F] ps Hwf Hin Hps. cbn in Hin. destruct Hin as [<-|[]].
  forall_parts Hps. cbn in *. unfold interp_triangle_congruence, triangle_congruence.
  cbn. tauto.
Qed.

(** A similarity reason whose slots, for one correspondence, give its three
    angle pairs concludes what [similarity_needs] says it does. *)
Lemma similarity_needs_core : forall decls parts conclusion t,
  declarations_well_formed point decls ->
  (forall a b, triangle_well_formed point a -> triangle_well_formed point b ->
     TemplateHolds (plain (parts a b)) -> similar_angles a b) ->
  In t (similarity_needs decls parts conclusion) -> TemplateHolds t ->
  Interp conclusion.
Proof.
  intros decls parts conclusion t Hwf Hparts Hin Ht.
  destruct conclusion; cbn [similarity_needs] in Hin; no_template Hin.
  unfold only_if in Hin.
  destruct (declared_pair decls a b) eqn:Hdecl; [|destruct Hin].
  apply declared_pair_sound in Hdecl; [|exact Hwf]. destruct Hdecl as [Ha Hb].
  apply in_map_iff in Hin. destruct Hin as [c [<- Hc]].
  pose proof (correspondences_well_formed _ _ _ Hc Ha Hb) as [Hwa Hwb].
  apply similar_angles_sim; [exact Ha|exact Hb|].
  apply (correspondences_similar _ _ _ Hc).
  exact (Hparts _ _ Hwa Hwb Ht).
Qed.

Lemma aa_sim_parts_sound : forall a b,
  triangle_well_formed point a -> triangle_well_formed point b ->
  TemplateHolds (plain (aa_sim_parts a b)) -> similar_angles a b.
Proof.
  intros [A B C] [D E F] Hwa Hwb Ht. unfold aa_sim_parts in Ht.
  open_slots Ht; pick_statements.
  cbn in He, He0, Hwa, Hwb |- *. unfold similar_angles. cbn.
  split; [exact He|]. split; [exact He0|].
  now apply ghost_third_angle.
Qed.

Lemma sas_sim_parts_sound : forall a b,
  triangle_well_formed point a -> triangle_well_formed point b ->
  TemplateHolds (plain (sas_sim_parts a b)) -> similar_angles a b.
Proof.
  intros [A B C] [D E F] Hwa Hwb Ht. unfold sas_sim_parts in Ht.
  open_slots Ht; pick_statements.
  rename He into Hprop, He0 into Hang.
  cbn in Hprop, Hang, Hwa, Hwb |- *. unfold triangle_well_formed in Hwa, Hwb.
  destruct (Similarity.GhostSimilarity.sas_similar
    (point A) (point B) (point C) (point D) (point E) (point F) Hwa Hwb Hang)
    as [HangA HangC].
  { apply (Similarity.GhostSimilarity.proportional_cong
      (point A) (point B) (point D) (point E) (point B) (point C) (point E) (point F));
      [exact Hprop|Cong|Cong|Cong|Cong]. }
  unfold similar_angles. cbn.
  split; [exact HangA|]. split; [exact Hang|now apply conga_comm].
Qed.

Lemma sss_sim_parts_sound : forall a b,
  triangle_well_formed point a -> triangle_well_formed point b ->
  TemplateHolds (plain (sss_sim_parts a b)) -> similar_angles a b.
Proof.
  intros [A B C] [D E F] Hwa Hwb Ht. unfold sss_sim_parts in Ht.
  open_slots Ht; pick_statements.
  rename He into Hprop1, He0 into Hprop2.
  cbn in Hprop1, Hprop2, Hwa, Hwb |- *. unfold triangle_well_formed in Hwa, Hwb.
  destruct (Similarity.GhostSimilarity.sss_similar
    (point A) (point B) (point C) (point D) (point E) (point F) Hwa Hwb)
    as [HangA [HangB HangC]].
  - apply (Similarity.GhostSimilarity.proportional_cong
      (point A) (point B) (point D) (point E) (point B) (point C) (point E) (point F));
      [exact Hprop1|Cong|Cong|Cong|Cong].
  - apply (Similarity.GhostSimilarity.proportional_cong
      (point B) (point C) (point E) (point F) (point C) (point A) (point F) (point D));
      [exact Hprop2|Cong|Cong|Cong|Cong].
  - unfold similar_angles. cbn.
    split; [exact HangA|]. split; [exact HangB|now apply conga_comm].
Qed.

(** A template read from a [transversal] premise comes with the drawn
    configuration that premise means. *)
Lemma from_transversals_sound : forall premises read t,
  Forall (interp_premise point) premises ->
  In t (from_transversals premises read) ->
  exists pa pb pt1 pi1 pc pd pt2 pi2,
    In t.(template_slots) (read pa pb pt1 pi1 pc pd pt2 pi2) /\
    Audit.TransversalConfiguration point pa pb pt1 pi1 pc pd pt2 pi2.
Proof.
  intros premises read t Hprem Hin.
  unfold from_transversals in Hin. apply in_flat_map in Hin.
  destruct Hin as [pr [Hpr Hin]].
  pose proof ((proj1 (Forall_forall _ _)) Hprem pr Hpr) as Hint.
  unfold interp_premise in Hint.
  destruct (transversal_witness pr.(premise_statement))
    as [[[[[[[[pa pb] pt1] pi1] pc] pd] pt2] pi2]|] eqn:Hwit; [|destruct Hin].
  assert (Hpremise : pr.(premise_statement) = Transversal pa pb pt1 pi1 pc pd pt2 pi2).
  { unfold transversal_witness in Hwit.
    destruct pr.(premise_statement); try discriminate.
    now injection Hwit as <- <- <- <- <- <- <- <-. }
  rewrite Hpremise in Hint. cbn in Hint.
  apply in_map_iff in Hin. destruct Hin as [slots [<- Hslots]].
  exists pa, pb, pt1, pi1, pc, pd, pt2, pi2. split; [exact Hslots|exact Hint].
Qed.

Lemma line_names_match : forall l a b i1,
  In l (line_names a b i1) -> line_name_matches l a b i1 = true.
Proof.
  intros l a b i1 Hin. unfold line_names in Hin. unfold line_name_matches.
  destruct (named_apart a i1); destruct (named_apart b i1);
    cbn in Hin; repeat destruct Hin as [<-|Hin]; try destruct Hin; btrue.
Qed.

Lemma parallel_spellings_match : forall a b i1 c d i2 e,
  In e (parallel_spellings a b i1 c d i2) ->
  exists s1 s2, e = Para s1 s2 /\
    transversal_lines_match s1 s2 a b i1 c d i2 = true.
Proof.
  intros a b i1 c d i2 e Hin. unfold parallel_spellings in Hin.
  apply in_flat_map in Hin. destruct Hin as [l1 [Hl1 Hin]].
  apply in_map_iff in Hin. destruct Hin as [l2 [<- Hl2]].
  exists l1, l2. split; [reflexivity|].
  unfold transversal_lines_match.
  rewrite (line_names_match _ _ _ _ Hl1), (line_names_match _ _ _ _ Hl2).
  reflexivity.
Qed.

Lemma in_gated : forall g (xs : list Statement) e,
  In e (gated g xs) -> g = true /\ In e xs.
Proof. intros [|] xs e H; cbn in H; [auto|destruct H]. Qed.

(** Splits a slot whose statements are [gated] into one case per statement,
    each with the condition it was drawn under. *)
Ltac gated_cases H :=
  repeat match type of H with
  | In _ (_ ++ _) => apply in_app_iff in H; destruct H as [H|H]
  end;
  let Hg := fresh "Hg" in
  apply in_gated in H; destruct H as [Hg H]; destruct H as [<-|[]];
  repeat rewrite andb_true_iff in Hg.

(** The one slot of a transversal template, opened. *)
Ltac transversal_slot Hslots Ht :=
  destruct Hslots as [Hslots|[]];
  unfold TemplateHolds in Ht; rewrite <- Hslots in Ht;
  apply Forall_cons_iff in Ht;
  let e := fresh "e" in let Hine := fresh "Hine" in let He := fresh "He" in
  destruct Ht as [[e [Hine He]] _];
  unfold written in Hine, He;
  cbn [slot_statements slot_matcher SlotHolds] in Hine, He.


Lemma sas_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (congruence_needs decls sas_parts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  exact (congruence_needs_core _ _ _ _ Hwf sas_parts_sound Hin Ht).
Qed.

Lemma sss_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (congruence_needs decls sss_parts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  exact (congruence_needs_core _ _ _ _ Hwf sss_parts_sound Hin Ht).
Qed.

Lemma asa_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (congruence_needs decls asa_parts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  exact (congruence_needs_core _ _ _ _ Hwf asa_parts_sound Hin Ht).
Qed.

Lemma aas_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (congruence_needs decls aas_parts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  exact (congruence_needs_core _ _ _ _ Hwf aas_parts_sound Hin Ht).
Qed.

Lemma rhl_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (congruence_needs decls rhl_parts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  exact (congruence_needs_core _ _ _ _ Hwf rhl_parts_sound Hin Ht).
Qed.

Lemma def_con_tri_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (congruence_needs decls def_con_tri_parts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  exact (congruence_needs_core _ _ _ _ Hwf def_con_tri_parts_sound Hin Ht).
Qed.

Lemma aa_sim_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (similarity_needs decls aa_sim_parts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  exact (similarity_needs_core _ _ _ _ Hwf aa_sim_parts_sound Hin Ht).
Qed.

Lemma sas_sim_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (similarity_needs decls sas_sim_parts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  exact (similarity_needs_core _ _ _ _ Hwf sas_sim_parts_sound Hin Ht).
Qed.

Lemma sss_sim_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (similarity_needs decls sss_sim_parts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  exact (similarity_needs_core _ _ _ _ Hwf sss_sim_parts_sound Hin Ht).
Qed.

Lemma third_angle_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (third_angle_needs decls conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  unfold third_angle_needs in Hin.
  apply in_flat_map in Hin. destruct Hin as [a [Ha Hin]].
  apply in_flat_map in Hin. destruct Hin as [b [Hb Hin]].
  apply in_flat_map in Hin. destruct Hin as [c [Hc Hin]].
  unfold only_if in Hin.
  destruct (fact_eqb _ conclusion) eqn:Hconclusion; [|destruct Hin].
  destruct Hin as [<-|[]].
  assert (Hwft : forall x, In x decls.(decl_triangles) ->
                 triangle_well_formed point x) by apply Hwf.
  pose proof (correspondences_well_formed a b c Hc (Hwft a Ha) (Hwft b Hb))
    as [Hwt Hwu].
  apply loose_template_holds in Ht. forall_parts Ht.
  apply (fact_eqb_sound _ _ Hconclusion).
  destruct c as [[A B C] [D E F]]. cbn in Hpart, Hpart0, Hwt, Hwu |- *.
  now apply ghost_third_angle.
Qed.

Lemma def_equilateral_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (def_equilateral_needs decls conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [def_equilateral_needs] in Hin; no_template Hin.
  unfold only_if in Hin.
  destruct (triangle_declared decls t0) eqn:Hdeclared; [|destruct Hin].
  destruct Hin as [<-|[]].
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply triangle_well_formed_nondegenerate in Hdeclared.
  apply loose_template_holds in Ht. forall_parts Ht.
  destruct t0 as [A B C]. cbn in Hpart, Hpart0, Hpart1, Hdeclared |- *. tauto.
Qed.

Lemma def_equiangular_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (def_equiangular_needs decls conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [def_equiangular_needs] in Hin; no_template Hin.
  unfold only_if in Hin.
  destruct (triangle_declared decls t0) eqn:Hdeclared; [|destruct Hin].
  destruct Hin as [<-|[]].
  apply (triangle_declared_sound decls _ Hwf) in Hdeclared.
  apply triangle_well_formed_nondegenerate in Hdeclared.
  apply loose_template_holds in Ht. forall_parts Ht.
  destruct t0 as [A B C]. cbn in Hpart, Hpart0, Hdeclared |- *.
  split; [exact Hdeclared|]. split; CongA.
Qed.

Lemma equilat_equiang_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (equilat_equiang_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [equilat_equiang_needs] in Hin; no_template Hin.
  template_cases Hin; open_slots Ht; pick_statements.
  destruct t0 as [A B C]. cbn in He |- *.
  destruct He as [Hnd [Hab Hbc]]. split; [exact Hnd|].
  apply ghost_equilateral_equiangular; [apply Hnd|exact Hab|exact Hbc].
Qed.

Lemma equiang_equilat_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (equiang_equilat_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [equiang_equilat_needs] in Hin; no_template Hin.
  template_cases Hin; open_slots Ht; pick_statements.
  destruct t0 as [A B C]. cbn in He |- *.
  destruct He as [Hnd [HangA HangB]]. split; [exact Hnd|].
  apply ghost_equiangular_equilateral; [apply Hnd|exact HangA|exact HangB].
Qed.

Lemma def_con_right_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (def_con_right_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  assert (Hmove : forall x y, angle_u_eqb x y = true -> Interp (Right x) ->
            angle_well_formed point y /\ right_angle point y).
  { intros x y Hxy [Hw Hper]. split.
    - now apply (angle_u_eqb_well_formed _ _ Hxy).
    - now apply (angle_u_eqb_right _ _ Hxy). }
  destruct conclusion; cbn [def_con_right_needs] in Hin; no_template Hin;
    unfold either_order in Hin; template_cases Hin; open_slots Ht; pick_statements;
    (assert (Hc : angle_well_formed point a /\ right_angle point a)
       by first [ (eapply (Hmove _ a); [idtac|exact He]); btrue
                | (eapply (Hmove _ a); [idtac|exact He0]); btrue ]);
    (assert (Hd : angle_well_formed point b /\ right_angle point b)
       by first [ (eapply (Hmove _ b); [idtac|exact He]); btrue
                | (eapply (Hmove _ b); [idtac|exact He0]); btrue ]);
    destruct Hc as [[Hcl Hcr] Hcp], Hd as [[Hdl Hdr] Hdp];
    unfold right_angle in Hcp, Hdp; cbn;
    solve [ tauto | now apply l11_16 ].
Qed.

Lemma def_parallelogram_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (def_parallelogram_needs decls conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [def_parallelogram_needs] in Hin; no_template Hin.
  unfold only_if in Hin.
  destruct (declared_quadrilateral decls q) eqn:Hd; [|destruct Hin].
  pose proof (declared_quadrilateral_sound _ _ Hwf Hd) as Hq.
  unfold either_order in Hin. template_cases Hin; open_slots Ht; pick_statements;
    cbn; unfold Audit.IsParallelogram; (split; [exact Hq|]);
    first [split; [exact He|exact He0] | split; [exact He0|exact He]].
Qed.

Lemma rectangle_pgram_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (rectangle_pgram_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [rectangle_pgram_needs] in Hin; no_template Hin.
  template_cases Hin; open_slots Ht; pick_statements. exact (proj1 He).
Qed.

Lemma rhombus_pgram_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (rhombus_pgram_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [rhombus_pgram_needs] in Hin; no_template Hin.
  template_cases Hin; open_slots Ht; pick_statements. exact (proj1 He).
Qed.

Lemma pgram_opp_sides_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (pgram_opp_sides_conv_needs decls conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [pgram_opp_sides_conv_needs] in Hin; no_template Hin.
  unfold only_if in Hin.
  destruct (declared_quadrilateral decls q) eqn:Hd; [|destruct Hin].
  pose proof (declared_quadrilateral_sound _ _ Hwf Hd) as Hwfq.
  assert (Hcore : Interp (ConSeg (quad_side_ab q) (quad_side_cd q)) ->
                  Interp (ConSeg (quad_side_bc q) (quad_side_da q)) ->
                  Interp (Parallelogram q)).
  { intros Hab Hbc. cbn in Hab, Hbc.
    pose proof Hwfq as Hwfcopy.
    destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
    destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
    destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
      as [Hbcd _].
    cbn. split; [exact Hwfq|]. split.
    - exact (ghost_pgram_from_opposite_sides _ _ _ _ X Hncol HXac HXbd Hab Hbc).
    - apply (ghost_pgram_from_opposite_sides _ _ _ _ X Hbcd HXbd
               (ghost_bets_sym _ _ _ HXac) Hbc).
      now apply cong_symmetry. }
  unfold either_order in Hin.
  template_cases Hin; open_slots Ht; pick_statements; auto.
Qed.

Lemma pgram_opp_angs_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (pgram_opp_angs_conv_needs decls conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [pgram_opp_angs_conv_needs] in Hin; no_template Hin.
  unfold only_if in Hin.
  destruct (declared_quadrilateral decls q) eqn:Hd; [|destruct Hin].
  pose proof (declared_quadrilateral_sound _ _ Hwf Hd) as Hwfq.
  assert (Hcore : Interp (ConAng (quad_corner_a q) (quad_corner_c q)) ->
                  Interp (ConAng (quad_corner_b q) (quad_corner_d q)) ->
                  Interp (Parallelogram q)).
  { intros HopA HopB. cbn in HopA, HopB.
    pose proof Hwfq as Hwfcopy.
    destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
    destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
    destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
      as [Hbcd [_ _]].
    cbn. split; [exact Hwfq|].
    unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
    split.
    - apply (ghost_pgram_from_consec_angles _ _ _ _ X Hncol HXac HXbd).
      exact (ghost_quad_opposite_angles _ _ _ _ X Hncol HXac HXbd HopA HopB).
    - apply (ghost_pgram_from_consec_angles _ _ _ _ X Hbcd HXbd
               (ghost_bets_sym _ _ _ HXac)).
      apply (ghost_quad_opposite_angles _ _ _ _ X Hbcd HXbd
               (ghost_bets_sym _ _ _ HXac));
        [exact HopB|now apply conga_sym]. }
  unfold either_order in Hin.
  template_cases Hin; open_slots Ht; pick_statements; auto.
Qed.

Lemma pgram_consec_angs_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (pgram_consec_angs_conv_needs decls conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [pgram_consec_angs_conv_needs] in Hin; no_template Hin.
  unfold only_if in Hin.
  destruct (declared_quadrilateral decls q) eqn:Hd; [|destruct Hin].
  pose proof (declared_quadrilateral_sound _ _ Hwf Hd) as Hwfq.
  pose proof Hwfq as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
  destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd [Hcda Hdab]].
  (* one supplementary pair per side direction *)
  assert (Hsides :
    Interp (Supplementary (quad_corner_b q) (quad_corner_c q)) \/
    Interp (Supplementary (quad_corner_d q) (quad_corner_a q)) ->
    Interp (Para (quad_side_ab q) (quad_side_cd q))).
  { intros [Hxy|Hxy]; cbn in Hxy |- *; unfold Audit.Parallel, Audit.seg_start,
      Audit.seg_end; cbn.
    - exact (ghost_pgram_from_consec_angles _ _ _ _ X Hncol HXac HXbd Hxy).
    - apply par_symmetry.
      apply (ghost_pgram_from_consec_angles _ _ _ _ X Hcda
               (ghost_bets_sym _ _ _ HXac) (ghost_bets_sym _ _ _ HXbd) Hxy). }
  assert (Hsides' :
    Interp (Supplementary (quad_corner_a q) (quad_corner_b q)) \/
    Interp (Supplementary (quad_corner_c q) (quad_corner_d q)) ->
    Interp (Para (quad_side_bc q) (quad_side_da q))).
  { intros [Hxy|Hxy]; cbn in Hxy |- *; unfold Audit.Parallel, Audit.seg_start,
      Audit.seg_end; cbn.
    - apply par_symmetry.
      apply (ghost_pgram_from_consec_angles _ _ _ _ X Hdab
               (ghost_bets_sym _ _ _ HXbd) HXac Hxy).
    - exact (ghost_pgram_from_consec_angles _ _ _ _ X Hbcd HXbd
               (ghost_bets_sym _ _ _ HXac) Hxy). }
  unfold either_order in Hin.
  template_cases Hin; open_slots Ht; pick_statements;
    cbn; (split; [exact Hwfq|]);
    (split; [exact (Hsides ltac:(auto))|exact (Hsides' ltac:(auto))]).
Qed.

Lemma pgram_opp_side_para_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (pgram_opp_side_para_needs decls conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [pgram_opp_side_para_needs] in Hin; no_template Hin.
  unfold only_if in Hin.
  destruct (declared_quadrilateral decls q) eqn:Hd; [|destruct Hin].
  pose proof (declared_quadrilateral_sound _ _ Hwf Hd) as Hwfq.
  pose proof Hwfq as Hwfcopy.
  destruct Hwfcopy as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  cbn in Hncol, HXac, HXbd.
  template_cases Hin; open_slots Ht; pick_statements;
    rename He into HC, He0 into HP; cbn in HC, HP |- *;
    (split; [exact Hwfq|]);
    unfold Audit.Parallel in HP.
  - assert (Hother : Par (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
                         (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first)))
      by (eapply ghost_pgram_from_side; eauto).
    unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
    split; [exact HP|exact Hother].
  - assert (HXca : BetS (point q.(quadrilateral_third)) X (point q.(quadrilateral_first))).
    { destruct HXac as [Hb [Hd1 Hd2]].
      repeat split; [now apply between_symmetry| |];
        intro Heq; [apply Hd2|apply Hd1]; auto. }
    assert (Hncol2 : ~ Col (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
                           (point q.(quadrilateral_fourth))).
    { destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
        as [Hn _]. exact Hn. }
    assert (Hother : Par (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth))
                         (point q.(quadrilateral_first)) (point q.(quadrilateral_second)))
      by (eapply (ghost_pgram_from_side (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
                    (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first)) X); eauto).
    unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
    split; [|exact HP].
    apply par_symmetry. exact Hother.
Qed.

Lemma pgram_diag_bisect_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (pgram_diag_bisect_conv_needs decls premises facts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [pgram_diag_bisect_conv_needs] in Hin; no_template Hin.
  unfold only_if in Hin.
  destruct (declared_quadrilateral decls q) eqn:Hd; [|destruct Hin].
  pose proof (declared_quadrilateral_sound _ _ Hwf Hd) as Hwfq.
  pose proof Hwfq as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol _]]]]]]]. cbn in Hncol.
  assert (Hcore : forall p,
    Interp (SegBisect (quad_diagonal_ac q) (quad_diagonal_bd q) p) ->
    Interp (SegBisect (quad_diagonal_bd q) (quad_diagonal_ac q) p) ->
    Interp (Parallelogram q)).
  { intros p H1 H2. cbn in H1, H2.
    destruct H1 as [_ [_ Hbd]]. destruct H2 as [_ [_ Hac]].
    destruct (ghost_pgram_from_diagonal_midpoint _ _ _ _ _ Hncol Hac Hbd)
      as [Hpar1 Hpar2].
    cbn. split; [exact Hwfq|].
    unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
      Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
    split; assumption. }
  apply in_flat_map in Hin. destruct Hin as [p [_ Hin]].
  unfold either_order in Hin.
  template_cases Hin; open_slots Ht; pick_statements; eauto.
Qed.

Lemma rect_pgram_ang_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (rect_pgram_ang_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [rect_pgram_ang_needs] in Hin; no_template Hin.
  template_cases Hin; open_slots Ht.
  destruct Hin0 as [<-|[]]. rename He0 into Hp.
  cbn in Hp. destruct Hp as [Hwfq [Hpar1 Hpar2]].
  pose proof Hwfq as Hwfcopy.
  destruct Hwfcopy as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol, HXac, HXbd.
  destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
    as [Hbcd [Hcda Hdab]].
  (* whichever corner is right, rotate the figure so that it is the one the
     theorem takes, and read the four right angles back off *)
  assert (Hcorners :
    Per (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first)) (point q.(quadrilateral_second)) /\
    Per (point q.(quadrilateral_first)) (point q.(quadrilateral_second)) (point q.(quadrilateral_third)) /\
    Per (point q.(quadrilateral_second)) (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth)) /\
    Per (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first))).
  { cbn [flat_map app] in Hin. pick_statements;
      destruct He as [_ Hper]; unfold right_angle, reverse_angle in Hper;
      cbn in Hper.
    - destruct (ghost_pgram_right_corner _ _ _ _ X Hdab
                  (ghost_bets_sym _ _ _ HXbd) HXac
                  (par_symmetry _ _ _ _ Hpar2) Hpar1 Hper) as [H1 [H2 [H3 H4]]].
      auto.
    - destruct (ghost_pgram_right_corner _ _ _ _ X Hdab
                  (ghost_bets_sym _ _ _ HXbd) HXac
                  (par_symmetry _ _ _ _ Hpar2) Hpar1 (l8_2 _ _ _ Hper))
        as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ghost_pgram_right_corner _ _ _ _ X Hncol HXac HXbd Hpar1 Hpar2
                  Hper) as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ghost_pgram_right_corner _ _ _ _ X Hncol HXac HXbd Hpar1 Hpar2
                  (l8_2 _ _ _ Hper)) as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ghost_pgram_right_corner _ _ _ _ X Hbcd HXbd
                  (ghost_bets_sym _ _ _ HXac) Hpar2
                  (par_symmetry _ _ _ _ Hpar1) Hper) as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ghost_pgram_right_corner _ _ _ _ X Hbcd HXbd
                  (ghost_bets_sym _ _ _ HXac) Hpar2
                  (par_symmetry _ _ _ _ Hpar1) (l8_2 _ _ _ Hper))
        as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ghost_pgram_right_corner _ _ _ _ X Hcda
                  (ghost_bets_sym _ _ _ HXac) (ghost_bets_sym _ _ _ HXbd)
                  (par_symmetry _ _ _ _ Hpar1) (par_symmetry _ _ _ _ Hpar2)
                  Hper) as [H1 [H2 [H3 H4]]]. auto.
    - destruct (ghost_pgram_right_corner _ _ _ _ X Hcda
                  (ghost_bets_sym _ _ _ HXac) (ghost_bets_sym _ _ _ HXbd)
                  (par_symmetry _ _ _ _ Hpar1) (par_symmetry _ _ _ _ Hpar2)
                  (l8_2 _ _ _ Hper)) as [H1 [H2 [H3 H4]]]. auto. }
  destruct Hcorners as [Hpa [Hpb [Hpc Hpd]]].
  cbn. unfold Audit.RightAngle, Audit.quad_angle_a, Audit.quad_angle_b,
    Audit.quad_angle_c, Audit.quad_angle_d, Audit.ang_start, Audit.ang_vertex,
    Audit.ang_end; cbn.
  split; [exact (conj Hwfq (conj Hpar1 Hpar2))|].
  split; [exact Hpa|]. split; [exact Hpb|]. split; [exact Hpc|exact Hpd].
Qed.

Lemma rect_diag_con_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (rect_diag_con_conv_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [rect_diag_con_conv_needs] in Hin; no_template Hin.
  template_cases Hin; open_slots Ht; pick_statements.
  rename He into Hdiagonals, He0 into Hp. cbn in Hdiagonals.
  destruct (pgram_figure q Hp) as [X [Hncol [HXac [HXbd [Hpar1 Hpar2]]]]].
  destruct (ghost_pgram_con_diagonals_right _ _ _ _ X Hncol HXac HXbd
              Hpar1 Hpar2 Hdiagonals) as [HperA [HperB [HperC HperD]]].
  cbn. split; [exact Hp|].
  unfold Audit.RightAngle, Audit.quad_angle_a, Audit.quad_angle_b,
    Audit.quad_angle_c, Audit.quad_angle_d, Audit.ang_start, Audit.ang_vertex,
    Audit.ang_end; cbn.
  repeat split; assumption.
Qed.

Lemma rhombus_consec_sides_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (rhombus_consec_sides_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [rhombus_consec_sides_needs] in Hin; no_template Hin.
  template_cases Hin; open_slots Ht.
  destruct Hin as [<-|[]]. rename He into Hp.
  cbn in Hp. destruct Hp as [Hwfq [Hpar1 Hpar2]].
  pose proof Hwfq as Hwfcopy.
  destruct Hwfcopy as [HAB [HAC [HAD [HBC [HBD [HCD [Hncol Hex]]]]]]].
  destruct Hex as [X [HXac HXbd]].
  unfold Audit.Parallel, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end in Hpar1, Hpar2;
    cbn in Hpar1, Hpar2, Hncol, HXac, HXbd.
  assert (Hadj :
    Cong (point q.(quadrilateral_first)) (point q.(quadrilateral_second))
         (point q.(quadrilateral_second)) (point q.(quadrilateral_third)) \/
    Cong (point q.(quadrilateral_second)) (point q.(quadrilateral_third))
         (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth)) \/
    Cong (point q.(quadrilateral_third)) (point q.(quadrilateral_fourth))
         (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first)) \/
    Cong (point q.(quadrilateral_fourth)) (point q.(quadrilateral_first))
         (point q.(quadrilateral_first)) (point q.(quadrilateral_second))).
  { pick_statements; cbn in He0; tauto. }
  pose proof (ghost_rhombus_sides _ _ _ _ _ Hncol HXac HXbd Hpar1 Hpar2 Hadj)
    as [H1 [H2 H3]].
  cbn. split; [|split; [|split]].
  - split; [exact Hwfq|split; [exact Hpar1|exact Hpar2]].
  - exact H1.
  - exact H2.
  - exact H3.
Qed.

Lemma rhombus_diag_perp_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (rhombus_diag_perp_conv_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [rhombus_diag_perp_conv_needs] in Hin; no_template Hin.
  template_cases Hin; open_slots Ht.
  destruct Hin0 as [<-|[]]. rename He0 into Hp.
  destruct (pgram_figure q Hp) as [X [Hncol [HXac [HXbd [Hpar1 Hpar2]]]]].
  assert (Hdiag : Definitions.Perp (point q.(quadrilateral_first)) (point q.(quadrilateral_third))
                                   (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth))).
  { pick_statements; destruct He as [p Hperp]; cbn in Hperp;
      apply perp_in_perp in Hperp;
      unfold quad_diagonal_ac, quad_diagonal_bd in Hperp; cbn in Hperp;
      eauto 6 using perp_sym, perp_left_comm, perp_right_comm, perp_comm. }
  destruct (ghost_pgram_perp_diagonals_rhombus _ _ _ _ X Hncol HXac HXbd
              Hpar1 Hpar2 Hdiag) as [Hab [Hbc Hcd]].
  cbn. split; [exact Hp|].
  unfold Audit.SegmentCongruent, Audit.quad_ab, Audit.quad_bc, Audit.quad_cd,
    Audit.quad_da, Audit.seg_start, Audit.seg_end; cbn.
  repeat split; assumption.
Qed.

Lemma rhombus_opp_bisect_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (rhombus_opp_bisect_conv_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [rhombus_opp_bisect_conv_needs] in Hin; no_template Hin.
  apply in_map_iff in Hin. destruct Hin as [r [<- Hr]].
  open_slots Ht. destruct Hin1 as [<-|[]]. rename He1 into Hp.
  assert (Hstep : Interp (Parallelogram r) -> Interp (Rhombus r)).
  { intros Hpr. unfold corner_bisectors in Hin, Hin0. pick_statements;
      (eapply (pgram_bisector_rhombus_at r); [|exact He|exact Hpr];
       unfold bisector_at_corner; btrue). }

  destruct q as [qa qb qc qd].
  unfold quad_rotations in Hr. cbn in Hr.
  destruct Hr as [<-|[<-|[<-|[<-|[]]]]].
  - exact (Hstep Hp).
  - exact (rhomb_rotate _ (rhomb_rotate _ (rhomb_rotate _
             (Hstep (pgram_rotate _ Hp))))).
  - exact (rhomb_rotate _ (rhomb_rotate _
             (Hstep (pgram_rotate _ (pgram_rotate _ Hp))))).
  - exact (rhomb_rotate _
             (Hstep (pgram_rotate _ (pgram_rotate _ (pgram_rotate _ Hp))))).
Qed.

Lemma isos_trap_con_diags_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (isos_trap_con_diags_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [isos_trap_con_diags_needs] in Hin; no_template Hin.
  template_cases Hin; open_slots Ht; pick_statements.
  destruct He0 as [s1 [s2 Htrap]]. cbn in Htrap. destruct Htrap as [Htrap _].
  cbn in He |- *. split; [exact Htrap|].
  unfold Audit.SegmentCongruent, Audit.seg_start, Audit.seg_end; cbn.
  exact He.
Qed.

Lemma isos_trap_base_angs_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (isos_trap_base_angs_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [isos_trap_base_angs_needs] in Hin; no_template Hin.
  assert (Hcore : forall s s0 a a0,
    Interp (TrapezoidPremise q s s0) -> Interp (ConAng a a0) ->
    ((segment_pair_eqb s s0 (quad_side_ab q) (quad_side_cd q) &&
      (angle_pair_eqb a a0 (quad_corner_a q) (quad_corner_b q) ||
       angle_pair_eqb a a0 (quad_corner_c q) (quad_corner_d q))) ||
     (segment_pair_eqb s s0 (quad_side_bc q) (quad_side_da q) &&
      (angle_pair_eqb a a0 (quad_corner_b q) (quad_corner_c q) ||
       angle_pair_eqb a a0 (quad_corner_d q) (quad_corner_a q)))) = true ->
    Interp (IsosTrapezoid q)).
  { intros s s0 a a0 Htrap Hangles Hmatch.
    pose proof Htrap as Htrapcopy. cbn in Htrapcopy.
    destruct Htrapcopy as [Hshape Hpar].
    pose proof Hshape as Hwfq. destruct Hwfq as [Hwfq _].
    destruct Hwfq as [_ [_ [_ [_ [_ [_ [Hncol Hex]]]]]]].
    destruct Hex as [X [HXac HXbd]]. cbn in Hncol, HXac, HXbd.
    destruct (ghost_quad_no_three_collinear _ _ _ _ _ Hncol HXac HXbd)
      as [Hbcd [Hcda Hdab]].
    cbn. split; [exact Hshape|].
    unfold Audit.SegmentCongruent, Audit.seg_start, Audit.seg_end; cbn.
    apply orb_true_iff in Hmatch.
    destruct Hmatch as [Hm|Hm]; apply andb_true_iff in Hm;
      destruct Hm as [Hsides Hangs];
      pose proof (para_pair_sound _ _ _ _ Hsides Hpar) as Hparallel;
      cbn in Hparallel;
      apply orb_true_iff in Hangs; destruct Hangs as [Hm|Hm];
      pose proof (conga_pair_sound _ _ _ _ Hm Hangles) as Hbase; cbn in Hbase.
    - exact (ghost_isos_trap_con_diagonals _ _ _ _ X Hncol HXac HXbd
               Hparallel Hbase).
    - assert (Hrot : Cong (point q.(quadrilateral_third)) (point q.(quadrilateral_first))
                          (point q.(quadrilateral_fourth)) (point q.(quadrilateral_second))).
      { apply (ghost_isos_trap_con_diagonals _ _ _ _ X Hcda
                 (ghost_bets_sym _ _ _ HXac) (ghost_bets_sym _ _ _ HXbd));
          [now apply par_symmetry|exact Hbase]. }
      Cong.
    - assert (Hrot : Cong (point q.(quadrilateral_second)) (point q.(quadrilateral_fourth))
                          (point q.(quadrilateral_third)) (point q.(quadrilateral_first))).
      { apply (ghost_isos_trap_con_diagonals _ _ _ _ X Hbcd HXbd
                 (ghost_bets_sym _ _ _ HXac));
          [exact Hparallel|exact Hbase]. }
      Cong.
    - assert (Hrot : Cong (point q.(quadrilateral_fourth)) (point q.(quadrilateral_second))
                          (point q.(quadrilateral_first)) (point q.(quadrilateral_third))).
      { apply (ghost_isos_trap_con_diagonals _ _ _ _ X Hdab
                 (ghost_bets_sym _ _ _ HXbd) HXac);
          [now apply par_symmetry|exact Hbase]. }
      Cong. }
  template_cases Hin; open_slots Ht;
    unfold trapezoid_spellings, segment_spellings in Hin0;
    cbn [flat_map app] in Hin0; pick_statements;
    exact (Hcore _ _ _ _ He0 He ltac:(btrue)).
Qed.

Lemma altint_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (altint_needs premises conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [altint_needs] in Hin; no_template Hin.
  destruct (from_transversals_sound _ _ _ Hprem Hin)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hslots Hcfg]]]]]]]]].
  cbv beta in Hslots.
  destruct (altint_pair pa pb pi1 pc pd pi2 a b) eqn:Hpairs; [|destruct Hslots].
  transversal_slot Hslots Ht.
  destruct (parallel_spellings_match _ _ _ _ _ _ _ Hine) as [s1 [s2 [-> Hlines]]].
  cbn [SlotHolds] in He.
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _ _ _ Hlines Hcfg He) as HP.
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ghost_transversal_forward _ _ _ _ _ _ _ _ _ Hrel HT1 HT2 HP).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos HP' ET1 ET2 EA EB EC ED.
  destruct (ghost_transversal_master _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP') as [Hm1 Hm2].
  unfold altint_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm]; repeat rewrite andb_true_iff in Hm; destruct Hm as [[Hg1 Hg2] Hm];
    eapply conga_pair_conclude; try exact Hm; cbn.
  - rewrite (EA (Ha Hg1)), (ED (Hd Hg2)) in Hm1. exact Hm1.
  - rewrite (EB (Hb Hg1)), (EC (Hc Hg2)) in Hm2. exact Hm2.
Qed.

Lemma altext_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (altext_needs premises conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [altext_needs] in Hin; no_template Hin.
  destruct (from_transversals_sound _ _ _ Hprem Hin)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hslots Hcfg]]]]]]]]].
  cbv beta in Hslots.
  destruct (altext_pair pa pb pt1 pi1 pc pd pt2 pi2 a b) eqn:Hpairs; [|destruct Hslots].
  transversal_slot Hslots Ht.
  destruct (parallel_spellings_match _ _ _ _ _ _ _ Hine) as [s1 [s2 [-> Hlines]]].
  cbn [SlotHolds] in He.
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _ _ _ Hlines Hcfg He) as HP.
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ghost_transversal_forward _ _ _ _ _ _ _ _ _ Hrel HT1 HT2 HP).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos HP' ET1 ET2 EA EB EC ED.
  destruct (ghost_transversal_altext _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP') as [He1 He2].
  unfold altext_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm]; repeat rewrite andb_true_iff in Hm; destruct Hm as [[[[Hg1 Hg2] Hg3] Hg4] Hm];
    eapply conga_pair_conclude; try exact Hm; cbn;
    rewrite (ET1 (Ht1 Hg1)), (ET2 (Ht2 Hg2)) in *.
  - rewrite (EA (Ha Hg3)), (ED (Hd Hg4)) in He1. exact He1.
  - rewrite (EB (Hb Hg3)), (EC (Hc Hg4)) in He2. exact He2.
Qed.

Lemma corresp_ang_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (corresp_ang_needs premises conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [corresp_ang_needs] in Hin; no_template Hin.
  destruct (from_transversals_sound _ _ _ Hprem Hin)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hslots Hcfg]]]]]]]]].
  cbv beta in Hslots.
  destruct (corresp_pair pa pb pt1 pi1 pc pd pt2 pi2 a b) eqn:Hpairs; [|destruct Hslots].
  transversal_slot Hslots Ht.
  destruct (parallel_spellings_match _ _ _ _ _ _ _ Hine) as [s1 [s2 [-> Hlines]]].
  cbn [SlotHolds] in He.
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _ _ _ Hlines Hcfg He) as HP.
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ghost_transversal_forward _ _ _ _ _ _ _ _ _ Hrel HT1 HT2 HP).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos HP' ET1 ET2 EA EB EC ED.
  destruct (ghost_transversal_corresp _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP') as [Hc1 [Hc2 [Hc3 Hc4]]].
  unfold corresp_pair in Hpairs. repeat rewrite orb_true_iff in Hpairs.
  destruct Hpairs as [[[Hm|Hm]|Hm]|Hm]; repeat rewrite andb_true_iff in Hm; destruct Hm as [[[Hg1 Hg2] Hg3] Hm];
    eapply conga_pair_conclude; try exact Hm; cbn.
  - rewrite (ET2 (Ht2 Hg1)), (EB (Hb Hg2)), (ED (Hd Hg3)) in Hc1. exact Hc1.
  - rewrite (ET2 (Ht2 Hg1)), (EA (Ha Hg2)), (EC (Hc Hg3)) in Hc2. exact Hc2.
  - rewrite (ET1 (Ht1 Hg1)), (EA (Ha Hg2)), (EC (Hc Hg3)) in Hc3. exact Hc3.
  - rewrite (ET1 (Ht1 Hg1)), (EB (Hb Hg2)), (ED (Hd Hg3)) in Hc4. exact Hc4.
Qed.

Lemma sameside_ang_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (sameside_ang_needs premises conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [sameside_ang_needs] in Hin; no_template Hin.
  destruct (from_transversals_sound _ _ _ Hprem Hin)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hslots Hcfg]]]]]]]]].
  cbv beta in Hslots.
  destruct (sameside_pair pa pb pi1 pc pd pi2 a b) eqn:Hpairs; [|destruct Hslots].
  transversal_slot Hslots Ht.
  destruct (parallel_spellings_match _ _ _ _ _ _ _ Hine) as [s1 [s2 [-> Hlines]]].
  cbn [SlotHolds] in He.
  pose proof (transversal_para_sound _ _ _ _ _ _ _ _ _ _ Hlines Hcfg He) as HP.
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ghost_transversal_forward _ _ _ _ _ _ _ _ _ Hrel HT1 HT2 HP).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos HP' ET1 ET2 EA EB EC ED.
  destruct (ghost_transversal_sameside _ _ _ _ _ _ _ _
              Hbt1 Hbt2 Hbab Hbcd Hos HP') as [Hs1 Hs2].
  unfold sameside_pair in Hpairs. apply orb_true_iff in Hpairs.
  destruct Hpairs as [Hm|Hm]; repeat rewrite andb_true_iff in Hm; destruct Hm as [[Hg1 Hg2] Hm];
    eapply suppa_pair_conclude; try exact Hm; cbn.
  - rewrite (EB (Hb Hg1)), (ED (Hd Hg2)) in Hs1. exact Hs1.
  - rewrite (EA (Ha Hg1)), (EC (Hc Hg2)) in Hs2. exact Hs2.
Qed.

Lemma altint_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (altint_conv_needs premises conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [altint_conv_needs] in Hin; no_template Hin.
  destruct (from_transversals_sound _ _ _ Hprem Hin)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hslots Hcfg]]]]]]]]].
  cbv beta zeta in Hslots.
  destruct (transversal_lines_match a b pa pb pi1 pc pd pi2) eqn:Hlines;
    [|destruct Hslots].
  transversal_slot Hslots Ht.
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ _ _ Hlines Hcfg).
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ghost_transversal_converse _ _ _ _ _ _ _ _ Hrel HT1 HT2).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos ET1 ET2 EA EB EC ED.
  apply (ghost_transversal_master_conv (point pi1) (point pi2)); try assumption.
  assert (HI : point pi1 <> point pi2) by (destruct Hrel as [HI _]; exact HI).
  gated_cases Hine; cbn [SlotHolds] in He.
  - destruct Hg as [Hg1 Hg2]. left.
    assert (Hwf1 : angle_well_formed point (angle_name pa pi1 pi2))
      by (cbn; split; [exact (Ha Hg1)|auto]).
    assert (Hwf2 : angle_well_formed point (angle_name pd pi2 pi1))
      by (cbn; split; [exact (Hd Hg2)|exact HI]).
    pose proof (He Hwf1 Hwf2) as HC. cbn in HC.
    rewrite (EA (Ha Hg1)), (ED (Hd Hg2)). exact HC.
  - destruct Hg as [Hg1 Hg2]. right.
    assert (Hwf1 : angle_well_formed point (angle_name pb pi1 pi2))
      by (cbn; split; [exact (Hb Hg1)|auto]).
    assert (Hwf2 : angle_well_formed point (angle_name pc pi2 pi1))
      by (cbn; split; [exact (Hc Hg2)|exact HI]).
    pose proof (He Hwf1 Hwf2) as HC. cbn in HC.
    rewrite (EB (Hb Hg1)), (EC (Hc Hg2)). exact HC.
Qed.

Lemma altext_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (altext_conv_needs premises conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [altext_conv_needs] in Hin; no_template Hin.
  destruct (from_transversals_sound _ _ _ Hprem Hin)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hslots Hcfg]]]]]]]]].
  cbv beta zeta in Hslots.
  destruct (transversal_lines_match a b pa pb pi1 pc pd pi2) eqn:Hlines;
    [|destruct Hslots].
  transversal_slot Hslots Ht.
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ _ _ Hlines Hcfg).
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ghost_transversal_converse _ _ _ _ _ _ _ _ Hrel HT1 HT2).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos ET1 ET2 EA EB EC ED.
  apply (ghost_transversal_altext_conv T1' (point pi1) (point pi2) T2');
    try assumption.
  gated_cases Hine; cbn [SlotHolds] in He.
  - destruct Hg as [[[Hg1 Hg2] Hg3] Hg4]. cbn in He.
    rewrite (ET1 (Ht1 Hg1)), (ET2 (Ht2 Hg2)).
    left. rewrite (EA (Ha Hg3)), (ED (Hd Hg4)). exact He.
  - destruct Hg as [[[Hg1 Hg2] Hg3] Hg4]. cbn in He.
    rewrite (ET1 (Ht1 Hg1)), (ET2 (Ht2 Hg2)).
    right. rewrite (EB (Hb Hg3)), (EC (Hc Hg4)). exact He.
Qed.

Lemma corresp_ang_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (corresp_ang_conv_needs premises conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [corresp_ang_conv_needs] in Hin; no_template Hin.
  destruct (from_transversals_sound _ _ _ Hprem Hin)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hslots Hcfg]]]]]]]]].
  cbv beta zeta in Hslots.
  destruct (transversal_lines_match a b pa pb pi1 pc pd pi2) eqn:Hlines;
    [|destruct Hslots].
  transversal_slot Hslots Ht.
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ _ _ Hlines Hcfg).
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ghost_transversal_converse _ _ _ _ _ _ _ _ Hrel HT1 HT2).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos ET1 ET2 EA EB EC ED.
  apply (ghost_transversal_corresp_conv T1' (point pi1) (point pi2) T2');
    try assumption.
  gated_cases Hine; cbn [SlotHolds] in He.
  - destruct Hg as [[Hg1 Hg2] Hg3]. cbn in He. left.
    rewrite (ET2 (Ht2 Hg1)), (EB (Hb Hg2)), (ED (Hd Hg3)). exact He.
  - destruct Hg as [[Hg1 Hg2] Hg3]. cbn in He. right; left.
    rewrite (ET2 (Ht2 Hg1)), (EA (Ha Hg2)), (EC (Hc Hg3)). exact He.
  - destruct Hg as [[Hg1 Hg2] Hg3]. cbn in He. right; right; left.
    rewrite (ET1 (Ht1 Hg1)), (EA (Ha Hg2)), (EC (Hc Hg3)). exact He.
  - destruct Hg as [[Hg1 Hg2] Hg3]. cbn in He. right; right; right.
    rewrite (ET1 (Ht1 Hg1)), (EB (Hb Hg2)), (ED (Hd Hg3)). exact He.
Qed.

Lemma sameside_ang_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (sameside_ang_conv_needs premises conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [sameside_ang_conv_needs] in Hin; no_template Hin.
  destruct (from_transversals_sound _ _ _ Hprem Hin)
    as [pa [pb [pt1 [pi1 [pc [pd [pt2 [pi2 [Hslots Hcfg]]]]]]]]].
  cbv beta zeta in Hslots.
  destruct (transversal_lines_match a b pa pb pi1 pc pd pi2) eqn:Hlines;
    [|destruct Hslots].
  transversal_slot Hslots Ht.
  apply (transversal_para_conclude _ _ _ _ _ _ _ _ _ _ Hlines Hcfg).
  destruct (transversal_drawn _ _ _ _ _ _ _ _ Hcfg)
    as [Ha [Hb [Hc [Hd [Ht1 Ht2]]]]].
  destruct (transversal_relaxed _ _ _ _ _ _ _ _ Hcfg) as [Hrel [HT1 HT2]].
  apply (ghost_transversal_converse _ _ _ _ _ _ _ _ Hrel HT1 HT2).
  intros T1' A' B' C' D' T2' Hbt1 Hbt2 Hbab Hbcd Hos ET1 ET2 EA EB EC ED.
  apply (ghost_transversal_sameside_conv T1' (point pi1) (point pi2) T2');
    try assumption.
  gated_cases Hine; cbn [SlotHolds] in He.
  - destruct Hg as [Hg1 Hg2]. cbn in He. left.
    rewrite (EB (Hb Hg1)), (ED (Hd Hg2)). exact He.
  - destruct Hg as [Hg1 Hg2]. cbn in He. right.
    rewrite (EA (Ha Hg1)), (EC (Hc Hg2)). exact He.
Qed.

Lemma tangent_perp_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (tangent_perp_needs decls premises facts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [tangent_perp_needs] in Hin; no_template Hin.
  apply in_flat_map in Hin. destruct Hin as [c [_ Hin]].
  assert (Hcore : forall s1, Interp (Tangent c s1 p) ->
            Interp (Perp (segment_name c.(circle_center) p) s1 p)).
  { intros s1 Ht'.
    cbn in Ht'. destruct Ht' as [Hsegwf [Honp [Hcol HQ]]].
    destruct Honp as [Hcwf Hcongp]. cbn in Hcwf, Hcongp, Hsegwf, Hcol.
    assert (HOp : point (c.(circle_center)) <> point p).
    { intro Heq. apply Hcwf.
      rewrite <- Heq in Hcongp.
      apply (cong_identity _ _ (point c.(circle_center))). Cong. }
    destruct HQ as [Q [Hdisj [HQne HPer]]].
    destruct Hdisj as [HQ1|HQ2].
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
  assert (Hsw : forall s1, Interp (Tangent c s1 p) ->
            Interp (Perp s1 (segment_name c.(circle_center) p) p)).
  { intros s1 Ht'. pose proof (Hcore s1 Ht') as H. cbn in H |- *.
    apply perp_in_sym. exact H. }
  cbn [flat_map app fst snd] in Hin. unfold only_if in Hin.
  destruct (segment_u_eqb b (segment_name c.(circle_center) p)) eqn:Hg1;
  destruct (segment_u_eqb a (segment_name c.(circle_center) p)) eqn:Hg2;
  cbn [app] in Hin; template_cases Hin; open_slots Ht; pick_statements;
  match type of He with
  | Interp (Tangent _ ?x _) =>
      first
        [ exact (proj2 (perp_at_realign a b x _ p p ltac:(btrue) Hg1
                          (Ascii.eqb_refl p)) (Hsw x He))
        | exact (proj2 (perp_at_realign a b _ x p p Hg2 ltac:(btrue)
                          (Ascii.eqb_refl p)) (Hcore x He)) ]
  end.
Qed.

Lemma tangent_perp_conv_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (tangent_perp_conv_needs conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [tangent_perp_conv_needs] in Hin; no_template Hin.
  unfold only_if in Hin. destruct (endpoint_of p s) eqn:Hshape; [|destruct Hin].
  template_cases Hin; open_slots Ht.
  destruct Hin0 as [<-|[]]. rename He0 into Hradius.
  assert (Hfigure : Interp (Perp s (segment_name c.(circle_center) p) p)).
  { pick_statements; [exact He|]. cbn in He |- *. apply perp_in_sym. exact He. }
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

Lemma con_tangents_ext_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (con_tangents_ext_needs decls premises facts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [con_tangents_ext_needs] in Hin; no_template Hin.
  apply in_flat_map in Hin. destruct Hin as [c [_ Hin]].
  assert (Hcore : forall s1 s2 p p0 e,
      Interp (Tangent c s1 p) -> Interp (Tangent c s2 p0) ->
      segment_u_eqb s1 (segment_name p e) = true ->
      segment_u_eqb s2 (segment_name p0 e) = true ->
      segment_pair_eqb a b (segment_name p e) (segment_name p0 e) = true ->
      Interp (ConSeg a b)).
  { intros s1 s2 p p0 e Ht1 Ht2 Hshape Hshape' Hconc.
    pose proof Ht1 as Hon1. pose proof Ht2 as Hon2.
    cbn in Hon1, Hon2.
    destruct Hon1 as [_ [[_ Hr1] _]]. destruct Hon2 as [_ [[_ Hr2] _]].
    destruct (tangent_far_point _ _ _ _ Hshape Ht1) as [Hper1 _].
    destruct (tangent_far_point _ _ _ _ Hshape' Ht2) as [Hper2 _].
    apply (cong_pair_conclude _ _ (segment_name p e) (segment_name p0 e));
      [exact Hconc|cbn].
    apply (ghost_tangents_congruent (point c.(circle_center)));
      [now apply l8_2|now apply l8_2|].
    apply cong_transitivity with (point c.(circle_center)) (point c.(circle_radius_point));
      [Cong|Cong]. }
  apply in_flat_map in Hin. destruct Hin as [fg [Hfg Hin]].
  apply in_flat_map in Hin. destruct Hin as [pe [Hpe Hin]].
  apply in_flat_map in Hin. destruct Hin as [pe' [Hpe' Hin]].
  unfold only_if in Hin.
  destruct (ascii_eqb (snd pe) (snd pe')) eqn:Hgate; [|destruct Hin].
  apply Ascii.eqb_eq in Hgate.
  destruct Hin as [<-|[]]. open_slots Ht.
  destruct pe as [P E], pe' as [P' E']. cbn [fst snd] in *. subst E'.
  destruct a as [a1 a2], b as [b1 b2].
  cbn in Hfg; destruct Hfg as [<-|[<-|[]]]; cbn in Hpe, Hpe';
    destruct Hpe as [Hpe|[Hpe|[]]]; injection Hpe as -> ->;
    destruct Hpe' as [Hpe'|[Hpe'|[]]]; injection Hpe' as -> ->;
    pick_statements; apply (Hcore _ _ _ _ E He He0); btrue.
Qed.

Lemma radius_chord_bisect_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (radius_chord_bisect_needs decls premises facts conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [radius_chord_bisect_needs] in Hin; no_template Hin.
  apply in_flat_map in Hin. destruct Hin as [c [_ Hin]].
  unfold only_if in Hin.
  destruct (segment_u_eqb a (segment_name c.(circle_center) p)) eqn:Hbisector;
    [|destruct Hin].
  apply in_map_iff in Hin. destruct Hin as [rw [<- _]].
  open_slots Ht.
  destruct Hin as [<-|[]]. rename He into Hperp.
  assert (Hcore : forall s3, segment_u_eqb b s3 = true -> Interp (Chord c s3) ->
            Interp (SegBisect a b p)).
  { intros s3 Htarget Hch.
    assert (Hfigure : Interp (Perp (segment_name c.(circle_center) p) s3 p))
      by (exact (proj1 (perp_at_realign _ _ _ _ p p (segment_u_eqb_refl _)
                         Htarget (Ascii.eqb_refl p)) Hperp)).
    cbn in Hfigure.
    destruct Hfigure as [Hcentre [Hchordwf [_ [Hcol Hright]]]].
    cbn in Hch. destruct Hch as [_ [[_ Hone] [_ Htwo]]].
    assert (Hmid : Midpoint (point p) (point s3.(segment_first))
                            (point s3.(segment_second))).
    { apply (ghost_chord_foot_midpoint (point c.(circle_center)));
        [exact Hchordwf|Col| | |].
      - apply l8_2, Hright; [apply col_trivial_1|apply col_trivial_1].
      - apply l8_2, Hright; [apply col_trivial_1|apply col_trivial_3].
      - apply cong_transitivity with (point c.(circle_center)) (point c.(circle_radius_point));
          [exact Hone|Cong]. }
    apply (proj2 (seg_bisect_realign a b (segment_name c.(circle_center) p) s3 p p
                   Hbisector Htarget (Ascii.eqb_refl p))).
    cbn. split; [exact Hcentre|]. split; [apply col_trivial_2|exact Hmid]. }
  pick_statements; (eapply Hcore; [|exact He1]); btrue.
Qed.

Lemma inscribed_semi_needs_sound : forall decls premises facts conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (inscribed_semi_needs premises conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts conclusion t Hwf Hprem Hall Hin Ht.
  destruct conclusion; cbn [inscribed_semi_needs] in Hin; no_template Hin.
  rename a into a'.
  apply in_flat_map in Hin. destruct Hin as [pr [Hprin Hin]].
  pose proof ((proj1 (Forall_forall _ _)) Hprem pr Hprin) as Hpr.
  unfold interp_premise in Hpr.
  destruct pr.(premise_statement) eqn:Hst; try solve [destruct Hin].
  rename c into c1, points into ps. cbn in Hpr.
  destruct (circ_order_complete premises c1 ps) eqn:Hcomplete; [|destruct Hin].
  apply in_flat_map in Hin. destruct Hin as [a [Ha Hin]].
  destruct (inscribed_chord premises ps a) as [[A B]|] eqn:Hca; [|destruct Hin].
  destruct Hin as [<-|[]]. open_slots Ht. destruct Hin as [<-|[]].
  rename He into Hia.
  assert (Haeq : angle_u_eqb a' a = true)
    by (cbn in Ha; destruct Ha as [<-|[<-|[]]]; btrue).
  assert (Hcore : forall s, segment_u_eqb (segment_name A B) s = true ->
            Interp (Diameter c1 s) -> Interp (Right a')).
  { intros s Hends Hd.
    destruct (inscribed_chord_sound _ _ _ _ _ _ Hprem Hpr Hia Hca)
      as [HlP [HlA [HlB [HAB [HAP [HBP [HoA HoB]]]]]]].
    cbn in Hd. destruct Hd as [[Hswf [Hon1 Hon2]] Hbet].
    destruct Hon1 as [_ Hc1]. destruct Hon2 as [_ Hc2].
    cbn in Hc1, Hc2, Hbet.
    pose proof (listed_on_circle _ _ _ Hpr HlP) as CP.
    assert (Hmid : Midpoint (point c1.(circle_center))
                     (point s.(segment_first)) (point s.(segment_second))).
    { split; [exact Hbet|].
      apply cong_transitivity with (point c1.(circle_center))
          (point c1.(circle_radius_point)); unfold Audit.circ_center in *; Cong. }
    assert (HOV : Cong (point c1.(circle_center)) (point s.(segment_first))
                       (point c1.(circle_center)) (point a.(angle_vertex))).
    { apply cong_transitivity with (point c1.(circle_center))
          (point c1.(circle_radius_point)); unfold Audit.circ_center in *; Cong. }
    assert (Hper : Per (point s.(segment_first)) (point a.(angle_vertex))
                       (point s.(segment_second))).
    { apply (ghost_thales _ _ _ (point c1.(circle_center))); assumption. }
    assert (HperAB : Per (point A) (point a.(angle_vertex)) (point B)).
    { apply segment_u_eqb_cases in Hends. destruct Hends as [Hends|Hends].
      - rewrite <- Hends in Hper. exact Hper.
      - destruct s as [s1 s2]. unfold reverse_segment in Hends. cbn in Hends.
        injection Hends as -> ->. cbn in Hper. apply l8_2. exact Hper. }
    assert (Hrt : Per (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last))).
    { apply (l11_17 (point A) (point a.(angle_vertex)) (point B)); [exact HperAB|].
      apply conga_sym, out2__conga; assumption. }
    cbn in Hia. destruct Hia as [_ [Hawf _]].
    apply angle_u_eqb_cases in Haeq. cbn.
    destruct Haeq as [->| ->]; cbn.
    - split; [exact Hawf|]. exact Hrt.
    - unfold reverse_angle. cbn. destruct Hawf as [Hl Hr].
      split; [split; assumption|]. unfold Audit.RightAngle. cbn. apply l8_2. exact Hrt. }
  pick_statements; (eapply Hcore; [|exact He0]); btrue.
Qed.

Lemma inscribed_pair_needs_sound : forall decls premises facts (same : bool) conclusion t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  In t (inscribed_pair_needs premises same conclusion) -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts same conclusion t Hwf Hprem Hall Hin Ht.
  unfold inscribed_pair_needs in Hin.
  apply in_flat_map in Hin. destruct Hin as [pr [Hprin Hin]].
  pose proof ((proj1 (Forall_forall _ _)) Hprem pr Hprin) as Hpr.
  unfold interp_premise in Hpr.
  destruct pr.(premise_statement) eqn:Hst; try solve [destruct Hin].
  rename c into c1, points into ps. cbn in Hpr.
  apply in_flat_map in Hin. destruct Hin as [[a b] [_ Hin]]. cbn [fst snd] in Hin.
  destruct (fact_eqb conclusion (if same then ConAng a b else Supplementary a b) &&
            inscribed_pair_check premises c1 a b same pr) eqn:Hok; [|destruct Hin].
  apply andb_true_iff in Hok. destruct Hok as [Hconc Hcheck].
  destruct Hin as [<-|[]]. open_slots Ht. pick_statements.
  rename He into Hia, He0 into Hib.
  unfold inscribed_pair_check in Hcheck. rewrite Hst in Hcheck.
  apply andb_true_iff in Hcheck. destruct Hcheck as [_ Hpair].
  destruct (inscribed_chord premises ps a) as [[A B]|] eqn:Hca; [|discriminate].
  destruct (inscribed_chord premises ps b) as [[A' B']|] eqn:Hcb; [|discriminate].
  apply andb_true_iff in Hpair. destruct Hpair as [Hchord Hside].
  destruct (arc_side ps A B a.(angle_vertex)) as [sa|] eqn:Hsa; [|discriminate].
  destruct (arc_side ps A B b.(angle_vertex)) as [sb|] eqn:Hsb; [|discriminate].
  destruct (inscribed_chord_sound _ _ _ _ _ _ Hprem Hpr Hia Hca)
    as [HlP [HlA [HlB [HAB [HAP [HBP [HoA HoB]]]]]]].
  destruct (inscribed_chord_sound _ _ _ _ _ _ Hprem Hpr Hib Hcb)
    as [HlQ [HlA' [HlB' [HAB' [HAQ [HBQ [HoA' HoB']]]]]]].
  assert (Hsame : (A' = A /\ B' = B) \/ (A' = B /\ B' = A)).
  { unfold same_chord_points, ascii_eqb in Hchord.
    apply orb_true_iff in Hchord.
    destruct Hchord as [H|H]; apply andb_true_iff in H; destruct H as [H1 H2];
      apply Ascii.eqb_eq in H1, H2; subst; auto. }
  assert (HQA : b.(angle_vertex) <> A) by (destruct Hsame as [[-> ->]|[-> ->]]; auto).
  assert (HQB : b.(angle_vertex) <> B) by (destruct Hsame as [[-> ->]|[-> ->]]; auto).
  pose proof (arc_side_sides c1 ps A B a.(angle_vertex) b.(angle_vertex) sa sb Hpr
                HlA HlB HlP HlQ HAB (not_eq_sym HAP) (not_eq_sym HBP) HQA HQB Hsa Hsb)
    as Hsides.
  pose proof (listed_on_circle _ _ _ Hpr HlA) as CA.
  pose proof (listed_on_circle _ _ _ Hpr HlB) as CB.
  pose proof (listed_on_circle _ _ _ Hpr HlP) as CP.
  pose proof (listed_on_circle _ _ _ Hpr HlQ) as CQ.
  assert (Ha : CongA (point a.(angle_first)) (point a.(angle_vertex)) (point a.(angle_last))
                     (point A) (point a.(angle_vertex)) (point B))
    by (apply out2__conga; assumption).
  assert (Hb : CongA (point A) (point b.(angle_vertex)) (point B)
                     (point b.(angle_first)) (point b.(angle_vertex)) (point b.(angle_last))).
  { destruct Hsame as [[-> ->]|[-> ->]].
    - apply conga_sym, out2__conga; assumption.
    - apply conga_left_comm, conga_right_comm, conga_sym, conga_right_comm.
      apply out2__conga; assumption. }
  destruct same; cbn in Hside; apply (proj2 (fact_eqb_sound _ _ Hconc)); cbn.
  - destruct (Bool.eqb sa sb) eqn:Heq; [|discriminate].
    apply conga_trans with (point A) (point a.(angle_vertex)) (point B); [exact Ha|].
    apply conga_trans with (point A) (point b.(angle_vertex)) (point B); [|exact Hb].
    apply (Inscribed.GhostInscribed.cop_onc4_os__conga
             (point c1.(circle_center)) (point c1.(circle_radius_point))); try assumption.
    apply all_coplanar.
  - destruct (Bool.eqb sa sb) eqn:Heq; [discriminate|].
    apply (conga2_suppa__suppa (point A) (point a.(angle_vertex)) (point B)
             (point A) (point b.(angle_vertex)) (point B)).
    + apply conga_sym. exact Ha.
    + exact Hb.
    + apply (Inscribed.GhostInscribed.cop_onc4_ts__suppa
               (point c1.(circle_center)) (point c1.(circle_radius_point))); try assumption.
      apply all_coplanar.
Qed.


Lemma reason_needs_sound : forall decls premises facts r conclusion ts t,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  reason_needs decls premises facts r conclusion = Some ts ->
  In t ts -> TemplateHolds t -> Interp conclusion.
Proof.
  intros decls premises facts r conclusion ts t Hwf Hprem Hall Hneeds Hin Ht.
  destruct r; cbn [reason_needs] in Hneeds; try discriminate;
    injection Hneeds as <-;
    first
      [ (eapply sas_needs_sound; eassumption)
      | (eapply sss_needs_sound; eassumption)
      | (eapply asa_needs_sound; eassumption)
      | (eapply aas_needs_sound; eassumption)
      | (eapply rhl_needs_sound; eassumption)
      | (eapply def_con_tri_needs_sound; eassumption)
      | (eapply aa_sim_needs_sound; eassumption)
      | (eapply sas_sim_needs_sound; eassumption)
      | (eapply sss_sim_needs_sound; eassumption)
      | (eapply third_angle_needs_sound; eassumption)
      | (eapply def_equilateral_needs_sound; eassumption)
      | (eapply def_equiangular_needs_sound; eassumption)
      | (eapply equilat_equiang_needs_sound; eassumption)
      | (eapply equiang_equilat_needs_sound; eassumption)
      | (eapply def_con_right_needs_sound; eassumption)
      | (eapply def_parallelogram_needs_sound; eassumption)
      | (eapply rectangle_pgram_needs_sound; eassumption)
      | (eapply rhombus_pgram_needs_sound; eassumption)
      | (eapply pgram_opp_sides_conv_needs_sound; eassumption)
      | (eapply pgram_opp_angs_conv_needs_sound; eassumption)
      | (eapply pgram_consec_angs_conv_needs_sound; eassumption)
      | (eapply pgram_opp_side_para_needs_sound; eassumption)
      | (eapply pgram_diag_bisect_conv_needs_sound; eassumption)
      | (eapply rect_pgram_ang_needs_sound; eassumption)
      | (eapply rect_diag_con_conv_needs_sound; eassumption)
      | (eapply rhombus_consec_sides_needs_sound; eassumption)
      | (eapply rhombus_diag_perp_conv_needs_sound; eassumption)
      | (eapply rhombus_opp_bisect_conv_needs_sound; eassumption)
      | (eapply isos_trap_con_diags_needs_sound; eassumption)
      | (eapply isos_trap_base_angs_needs_sound; eassumption)
      | (eapply altint_needs_sound; eassumption)
      | (eapply altext_needs_sound; eassumption)
      | (eapply corresp_ang_needs_sound; eassumption)
      | (eapply sameside_ang_needs_sound; eassumption)
      | (eapply altint_conv_needs_sound; eassumption)
      | (eapply altext_conv_needs_sound; eassumption)
      | (eapply corresp_ang_conv_needs_sound; eassumption)
      | (eapply sameside_ang_conv_needs_sound; eassumption)
      | (eapply tangent_perp_needs_sound; eassumption)
      | (eapply tangent_perp_conv_needs_sound; eassumption)
      | (eapply con_tangents_ext_needs_sound; eassumption)
      | (eapply radius_chord_bisect_needs_sound; eassumption)
      | (eapply inscribed_semi_needs_sound; eassumption)
      | (eapply inscribed_pair_needs_sound; eassumption) ].
Qed.

Lemma bespoke_rule_valid_sound : forall decls premises facts reason conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  bespoke_rule_valid decls premises facts reason conclusion = true ->
  Interp conclusion.
Proof.
  intros decls premises facts reason conclusion Hwf Hprem Hfacts Hvalid.
  destruct reason; cbn in Hvalid; try discriminate.
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
  - eapply cpctc_rule_sound; eauto.
  - eapply con_seg_transitive_sound; eauto.
  - eapply con_ang_transitive_sound; eauto.
  - eapply con_tri_transitive_sound; eauto.
  - eapply perp_con_ang_sound; eauto.
  - eapply def_midpt_sound; eauto.
  - eapply vert_ang_sound; eauto.
  - eapply def_ang_bisect_sound; eauto.
  - eapply ang_bisect_conv_sound; eauto.
  - eapply midpt_conv_sound; eauto.
  - eapply def_isosceles_sound; eauto.
  - eapply base_angle_sound; eauto.
  - eapply base_angle_conv_sound; eauto.
  - eapply (congruent_partners_rule_sound _ _ supplementary_laws); eauto.
  - eapply (shared_partner_rule_sound _ _ supplementary_laws); eauto.
  - eapply (congruent_partners_rule_sound _ _ complementary_laws); eauto.
  - eapply (shared_partner_rule_sound _ _ complementary_laws); eauto.
  - eapply def_linear_pair_sound; eauto.
  - eapply def_perp_sound; eauto.
  - eapply pgram_opp_sides_sound; eauto.
  - eapply pgram_opp_angles_sound; eauto.
  - eapply pgram_consec_angs_sound; eauto.
  - eapply kite_opp_con_ang_sound; eauto.
  - eapply rhombus_def_sound; eauto.
  - eapply rhombus_opp_bisect_sound; eauto.
  - eapply rect_diag_con_sound; eauto.
  - eapply rectangle_def_sound; eauto.
  - eapply para_trans_sound; eauto.
  - eapply def_radius_sound; eauto.
  - eapply con_chords_arcs_sound; eauto.
  - eapply perp_bisector_sound; eauto.
  - eapply isos_trap_base_angs_conv_sound; eauto.
  - eapply castc_rule_sound; eauto.
  - eapply sim_tri_transitive_sound; eauto.
  - eapply (substitute_rule_sound _ _ supplementary_laws); eauto.
  - eapply (substitute_rule_sound _ _ complementary_laws); eauto.
  - eapply perp_transversal_sound; eauto.
  - eapply linear_pair_conv_sound; eauto.
  - eapply diagonal_rule_sound; eauto.
  - eapply diagonal_rule_sound; eauto.
  - eapply diagonal_rule_sound; eauto.
  - eapply chord_bisect_conv_sound; eauto.
  - eapply def_radius_conv_sound; eauto.
  - (* an incomplete step concludes only the always-true placeholder *)
    change (statement_eqb incomplete_fact conclusion = true) in Hvalid.
    apply statement_eqb_eq in Hvalid. subst conclusion.
    unfold incomplete_fact.
    rewrite (ref_seg_iff (segment_name incomplete_point incomplete_point)
               (segment_name incomplete_point incomplete_point)) by reflexivity.
    cbn. apply cong_reflexivity.
Qed.

Lemma rule_valid_as_written_sound : forall decls premises facts reason conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  rule_valid_as_written decls premises facts reason conclusion = true ->
  Interp conclusion.
Proof.
  intros decls premises facts reason conclusion Hwf Hprem Hfacts Hvalid.
  unfold rule_valid_as_written in Hvalid.
  destruct (reason_needs decls premises facts reason conclusion) as [ts|] eqn:Hneeds.
  - destruct (template_valid_sound _ _ _ _ _ Hwf Hprem Hfacts Hvalid) as [t [Hin Ht]].
    exact (reason_needs_sound _ _ _ _ _ _ _ Hwf Hprem Hfacts Hneeds Hin Ht).
  - exact (bespoke_rule_valid_sound _ _ _ _ _ Hwf Hprem Hfacts Hvalid).
Qed.

Lemma rule_valid_sound : forall decls premises facts reason conclusion,
  declarations_well_formed point decls ->
  Forall (interp_premise point) premises -> Forall Interp facts ->
  rule_valid decls premises facts reason conclusion = true ->
  Interp conclusion.
Proof.
  intros decls premises facts reason conclusion Hwf Hprem Hfacts Hvalid.
  unfold rule_valid in Hvalid. apply orb_true_iff in Hvalid.
  destruct Hvalid as [Hvalid|Hvalid].
  - apply existsb_exists in Hvalid. destruct Hvalid as [c [Hin Hc]].
    apply (proj2 (respelled_iff _ _
             (statement_spellings_respelled _ _ _ _ Hwf Hprem Hin))).
    exact (rule_valid_as_written_sound _ _ _ _ _ Hwf Hprem Hfacts Hc).
  - apply (proj2 (respelled_iff _ _ (canonical_respelled decls premises conclusion Hwf Hprem))).
    assert (Hcanon : Forall Interp (map (canonical_statement decls premises) facts)).
    { apply Forall_map. eapply Forall_impl; [|exact Hfacts].
      intros st Hst.
      exact (proj1 (respelled_iff _ _ (canonical_respelled decls premises st Hwf Hprem)) Hst). }
    exact (rule_valid_as_written_sound _ _ _ _ _ Hwf Hprem Hcanon Hvalid).
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
  apply andb_true_iff in Hcheck. destruct Hcheck as [_ Hcheck].
  pose proof (kernel_declarations_well_formed _ _ Hwf0 Hprem) as Hwf.
  destruct (check_steps (kernel_declarations (problem_declarations p) (problem_premises p))
            (problem_premises p) []
            (problem_steps p)) as [facts|] eqn:Hsteps; try discriminate.
  apply existsb_exists in Hcheck. destruct Hcheck as [goal [Hin Heq]].
  pose proof (check_steps_sound _ _ _ _ _ Hwf Hprem (Forall_nil _) Hsteps) as Hall.
  apply (goal_matches_sound _ _ _ _ Hwf Hprem Heq).
  eapply Forall_forall; eauto.
Qed.

End Soundness.
